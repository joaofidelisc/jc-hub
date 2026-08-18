import calendar
import json
import re
import threading
import unicodedata
import uuid
from datetime import date, datetime, timedelta
from typing import Callable, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.api.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.content_history import ContentHistory
from app.models.creator_plan import CreatorPlan
from app.models.user import User

router = APIRouter()

STRATEGIES = {
    "funnel": {
        "label": "Funil de vendas",
        "instruction": "Conduza a audiência por atração, consideração e conversão. Identifique cada post como Topo, Meio ou Fundo de funil.",
    },
    "authority": {
        "label": "Autoridade",
        "instruction": "Construa confiança com método, análise, bastidores, opinião fundamentada, prova e aplicação prática. Evite transformar toda publicação em venda.",
    },
    "content_pillars": {
        "label": "Pilares de conteúdo",
        "instruction": "Alterne de modo equilibrado pilares educativos, relacionais, institucionais e comerciais, criando consistência editorial.",
    },
    "storytelling": {
        "label": "Storytelling",
        "instruction": "Organize o período como uma narrativa progressiva com contexto, tensão, virada, aprendizado e convite à ação.",
    },
    "launch": {
        "label": "Lançamento",
        "instruction": "Estruture antecipação, consciência do problema, educação, prova, abertura de oferta, tratamento de objeções e urgência ética.",
    },
    "community": {
        "label": "Comunidade",
        "instruction": "Priorize conversa, pertencimento, perguntas, conteúdo colaborativo e participação da audiência sem perder o objetivo de negócio.",
    },
}

NETWORK_GUIDANCE = {
    "instagram": "Use um gancho visual e emocional, leitura escaneável, formato adequado a Reels/carrossel/post e CTA de interação. A legenda deve soar humana.",
    "linkedin": "Use um título analítico, contexto profissional, raciocínio mais profundo, exemplos de negócio e CTA de conversa qualificada. Evite copiar a linguagem do Instagram.",
    "facebook": "Use linguagem comunitária e conversacional, contexto suficiente e CTA simples para comentário, compartilhamento ou contato.",
    "tiktok": "Use título de curiosidade e roteiro curto com abertura imediata, progressão visual, falas e retenção até o final.",
    "twitter": "Use uma tese direta e memorável, texto conciso ou thread estruturada, sem reproduzir a legenda de outra rede.",
}

DAY_INDEX = {
    "segunda": 0,
    "segunda-feira": 0,
    "terca": 1,
    "terca-feira": 1,
    "quarta": 2,
    "quarta-feira": 2,
    "quinta": 3,
    "quinta-feira": 3,
    "sexta": 4,
    "sexta-feira": 4,
    "sabado": 5,
    "domingo": 6,
}

DAY_NAMES = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"]


GENERATION_STATES = {}
GENERATION_LOCK = threading.Lock()


def begin_generation(user_id: int, generation_id: Optional[str]) -> None:
    if not generation_id:
        return
    with GENERATION_LOCK:
        if GENERATION_STATES.get((user_id, generation_id)) is not True:
            GENERATION_STATES[(user_id, generation_id)] = False


def ensure_generation_active(user_id: int, generation_id: Optional[str]) -> None:
    if not generation_id:
        return
    with GENERATION_LOCK:
        cancelled = GENERATION_STATES.get((user_id, generation_id), False)
    if cancelled:
        raise HTTPException(status_code=409, detail="Geração cancelada pelo usuário.")


def finish_generation(user_id: int, generation_id: Optional[str]) -> None:
    if not generation_id:
        return
    with GENERATION_LOCK:
        GENERATION_STATES.pop((user_id, generation_id), None)


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    contextData: Optional[dict] = None
    planId: Optional[int] = None


class CreatorRequest(BaseModel):
    niche: str
    persona: str
    businessHours: str = ""
    networks: List[str]
    tone: str = "Profissional e próximo"
    days: List[str]
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    strategy: str = "funnel"
    strategyDetails: Optional[str] = None
    businessInfo: Optional[str] = None
    products: Optional[str] = None
    objective: Optional[str] = None
    brandKeywords: Optional[str] = None
    avoidTopics: Optional[str] = None
    prints: Optional[List[str]] = None
    logo: Optional[List[str]] = None
    week: Optional[str] = None
    generationId: Optional[str] = None


class PlanPostUpdate(BaseModel):
    post: dict


def extract_json(raw_text: str) -> dict:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", raw_text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(raw_text[start:end + 1])
        except json.JSONDecodeError:
            pass
    raise ValueError("A IA retornou um formato inválido. Tente gerar novamente.")


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", " ", normalized.lower()).strip()


def network_key(value: str) -> str:
    return normalize_text(value).replace(" ", "_")


def image_part(b64_img: str) -> dict:
    image_url = b64_img if b64_img.startswith("data:image") else f"data:image/jpeg;base64,{b64_img}"
    return {"type": "image_url", "image_url": {"url": image_url}}


def analyze_visual_attachments(client: OpenAI, logo: Optional[List[str]] = None, prints: Optional[List[str]] = None) -> str:
    if not logo and not prints:
        return ""

    content = [{
        "type": "text",
        "text": (
            "Extraia um brief visual objetivo. Retorne JSON com logo, cores, estilo_visual, "
            "elementos_recorrentes, tom_da_marca, temas_dos_prints e diretrizes_para_imagens. "
            "Não identifique pessoas nem dados pessoais."
        ),
    }]
    if logo:
        content.append({"type": "text", "text": "Logotipo do negócio:"})
        content.extend(image_part(image) for image in logo)
    if prints:
        content.append({"type": "text", "text": "Referências de posts anteriores:"})
        content.extend(image_part(image) for image in prints)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Você é uma diretora de arte. Analise apenas marca, composição, cores e estilo. Responda somente JSON válido."},
            {"role": "user", "content": content},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    message = response.choices[0].message
    if getattr(message, "refusal", None):
        raise ValueError(message.refusal)
    return message.content or ""


def add_months(value: date, amount: int) -> date:
    month_index = value.month - 1 + amount
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def max_end_date(start_date: date) -> date:
    return add_months(start_date, 1) - timedelta(days=1)


def period_label(start_date: date, end_date: date) -> str:
    return f"de {start_date.strftime('%d/%m/%Y')} a {end_date.strftime('%d/%m/%Y')}"


def parse_br_date(value: str) -> Optional[date]:
    if not value:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value[:10], fmt).date()
        except ValueError:
            continue
    return None


def resolve_period(req: CreatorRequest) -> Tuple[date, date]:
    if req.startDate and req.endDate:
        start_date, end_date = req.startDate, req.endDate
    else:
        reference = date.today() + (timedelta(days=7) if req.week == "Próxima Semana" else timedelta())
        start_date = reference - timedelta(days=reference.weekday())
        end_date = start_date + timedelta(days=6)

    if end_date < start_date:
        raise HTTPException(status_code=422, detail="A data final deve ser posterior à data inicial.")
    if end_date > max_end_date(start_date):
        raise HTTPException(status_code=422, detail="O planejamento pode abranger no máximo um mês.")
    return start_date, end_date


def publication_dates(start_date: date, end_date: date, days: List[str]) -> List[date]:
    selected = {DAY_INDEX.get(normalize_text(day)) for day in days}
    selected.discard(None)
    if not selected:
        raise HTTPException(status_code=422, detail="Selecione pelo menos um dia válido para publicação.")

    result = []
    cursor = start_date
    while cursor <= end_date:
        if cursor.weekday() in selected:
            result.append(cursor)
        cursor += timedelta(days=1)
    if not result:
        raise HTTPException(status_code=422, detail="O período não contém nenhum dos dias de publicação selecionados.")
    return result


def find_existing_plan(db: Session, user_id: int, start_date: date, end_date: date) -> Optional[CreatorPlan]:
    label = period_label(start_date, end_date)
    plans = db.query(CreatorPlan).filter(CreatorPlan.user_id == user_id).all()
    for plan in plans:
        data = plan.plan_json or {}
        if data.get("period_start") == start_date.isoformat() and data.get("period_end") == end_date.isoformat():
            return plan
        if data.get("week_label") == label:
            return plan
    return None


def compact_post_context(post: dict, status: str) -> str:
    titles = []
    for network, content in (post.get("conteudo_por_rede") or {}).items():
        title = content.get("titulo") if isinstance(content, dict) else ""
        if title:
            titles.append(f"{network}: {title}")
    title_context = " | ".join(titles)
    return f"[{status}] {post.get('data_sugerida', '')} | {post.get('tema_central', '')}" + (f" | {title_context}" if title_context else "")


def collect_calendar_context(
    db: Session,
    user_id: int,
    exclude_plan_id: Optional[int] = None,
    exclude_post: Optional[Tuple[int, int]] = None,
    include_completed_from_excluded: bool = True,
) -> List[str]:
    context = []
    plans = db.query(CreatorPlan).filter(CreatorPlan.user_id == user_id).order_by(CreatorPlan.created_at.asc()).all()
    for plan in plans:
        for index, post in enumerate((plan.plan_json or {}).get("planejamento", [])):
            if exclude_post == (plan.id, index):
                continue
            if plan.id == exclude_plan_id and not (include_completed_from_excluded and post.get("feito")):
                continue
            status = "PUBLICADO" if post.get("feito") else "AGENDADO"
            context.append(compact_post_context(post, status))
    return context


def ensure_network_variation(post: dict, networks: List[str]) -> dict:
    theme = str(post.get("tema_central") or "Tema editorial").strip()
    post["tema_central"] = theme
    contents = post.get("conteudo_por_rede")
    if not isinstance(contents, dict):
        contents = {}

    normalized_contents = {}
    used_titles = set()
    suffixes = {
        "instagram": "em uma abordagem visual",
        "linkedin": "uma análise para negócios",
        "facebook": "uma conversa com a comunidade",
        "tiktok": "explicado de forma rápida",
        "twitter": "o ponto central",
    }

    for network in networks:
        key = network_key(network)
        content = contents.get(key) or contents.get(network) or {}
        if not isinstance(content, dict):
            content = {"roteiro_ou_legenda": str(content)}
        title = str(content.get("titulo") or theme).strip()
        normalized_title = normalize_text(title)
        if normalized_title in used_titles:
            title = f"{theme}: {suffixes.get(key, f'um olhar para {network}')}"
            normalized_title = normalize_text(title)
        used_titles.add(normalized_title)
        normalized_contents[key] = {
            "titulo": title,
            "formato": str(content.get("formato") or "Post"),
            "roteiro_ou_legenda": str(content.get("roteiro_ou_legenda") or content.get("legenda") or ""),
            "legenda_instagram": str(content.get("legenda_instagram") or ""),
            "descricao_visual": str(content.get("descricao_visual") or ""),
            "cta": str(content.get("cta") or ""),
        }
    post["conteudo_por_rede"] = normalized_contents
    return post


def normalize_generated_posts(raw_posts: List[dict], expected_dates: List[date], networks: List[str]) -> List[dict]:
    if len(raw_posts) != len(expected_dates):
        raise ValueError("A IA não retornou todas as publicações solicitadas.")

    normalized = []
    used_indexes = set()
    for position, expected_date in enumerate(expected_dates):
        match_index = next((index for index, post in enumerate(raw_posts) if index not in used_indexes and parse_br_date(str(post.get("data_sugerida", ""))) == expected_date), None)
        if match_index is None:
            match_index = next((index for index in range(len(raw_posts)) if index not in used_indexes), None)
        if match_index is None:
            raise ValueError("A IA retornou um calendário incompleto.")
        used_indexes.add(match_index)
        post = dict(raw_posts[match_index])
        post["dia"] = DAY_NAMES[expected_date.weekday()]
        post["data_sugerida"] = expected_date.strftime("%d/%m/%Y")
        post["feito"] = False
        normalized.append(ensure_network_variation(post, networks))
    return normalized


def request_generation_chunk(
    client: OpenAI,
    req: CreatorRequest,
    dates: List[date],
    context_lines: List[str],
    visual_context: str,
    session_themes: List[str],
) -> List[dict]:
    strategy = STRATEGIES.get(req.strategy, STRATEGIES["funnel"])
    network_instructions = "\n".join(f"- {network}: {NETWORK_GUIDANCE.get(network_key(network), 'Adapte linguagem, formato e CTA ao canal.')}" for network in req.networks)
    forbidden = "\n".join(f"- {line}" for line in context_lines)
    if session_themes:
        forbidden += "\n" + "\n".join(f"- [NESTE PLANO] {theme}" for theme in session_themes)
    requested_dates = "\n".join(f"- {item.strftime('%d/%m/%Y')} ({DAY_NAMES[item.weekday()]})" for item in dates)
    unique_id = str(uuid.uuid4())[:8]
    content_schema = {
        network_key(network): {
            "titulo": f"Título específico para {network}",
            "formato": f"Formato nativo de {network}",
            "roteiro_ou_legenda": f"Conteúdo completo e pronto para {network}",
            "legenda_instagram": "Legenda adicional somente quando a rede for Instagram",
            "descricao_visual": f"Direção visual adequada a {network}",
            "cta": f"CTA específico para {network}",
        }
        for network in req.networks
    }
    response_schema = {
        "planejamento": [{
            "dia": "Dia da semana",
            "data_sugerida": "DD/MM/YYYY",
            "horario_sugerido": "HH:MM — justificativa curta",
            "tema_central": "Conceito compartilhado entre os canais",
            "etapa_estrategia": "Papel deste post dentro da estratégia selecionada",
            "etapa_funil": "Topo / Meio / Fundo se for funil; caso contrário, papel estratégico",
            "noticia_tendencia_usada": "Referência atual somente se houver certeza; caso contrário, vazio",
            "conteudo_por_rede": content_schema,
        }]
    }

    system_prompt = f"""Você é Nova, estrategista sênior de conteúdo. Crie parte de um calendário editorial para o negócio abaixo.

NEGÓCIO: {req.niche}
SOBRE: {req.businessInfo or 'Não informado'}
PRODUTOS/SERVIÇOS: {req.products or 'Não informado'}
PÚBLICO: {req.persona}
TOM DE VOZ: {req.tone}
PALAVRAS DA MARCA: {req.brandKeywords or 'Não informado'}
EVITAR: {req.avoidTopics or 'Nada informado'}
OBJETIVO DO PERÍODO: {req.objective or 'Criar presença consistente'}
ESTRATÉGIA: {strategy['label']} — {strategy['instruction']}
ORIENTAÇÃO EXTRA: {req.strategyDetails or 'Nenhuma'}
HORÁRIO DE ATENDIMENTO: {req.businessHours or 'Não informado'}
BRIEF VISUAL: {visual_context or 'Não informado'}

DATAS EXATAS DESTA PARTE DO PLANO:
{requested_dates}

CONTEÚDOS QUE JÁ FORAM PUBLICADOS, ESTÃO AGENDADOS OU JÁ FORAM CRIADOS NESTE PLANO:
{forbidden or '- Nenhum conteúdo anterior.'}

REGRA CRÍTICA DE CONTINUIDADE E ORIGINALIDADE ({unique_id}):
Considere toda a lista acima como contexto editorial. Não repita tema, promessa, gancho, exemplo, formato narrativo ou ângulo. Cada nova publicação deve avançar a estratégia e se encaixar antes/depois do restante do calendário.

ADAPTAÇÃO POR REDE:
{network_instructions}

Para uma mesma data, mantenha um conceito central relacionado entre as redes, mas crie um `titulo` diferente e específico para cada canal. Instagram e LinkedIn nunca podem ter título ou texto idênticos. Mude gancho, vocabulário, profundidade, estrutura, formato e CTA conforme a audiência de cada rede.

Retorne APENAS JSON válido seguindo exatamente este formato dinâmico, que já contém somente as redes solicitadas:
{json.dumps(response_schema, ensure_ascii=False, indent=2)}
Inclua exatamente uma publicação por data solicitada e somente as redes pedidas. Não entregue textos rasos ou placeholders."""

    messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": "Gere esta parte do planejamento agora."}]
    last_error = None
    for attempt in range(2):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.75 if attempt == 0 else 0.4,
            response_format={"type": "json_object"},
        )
        message = response.choices[0].message
        if getattr(message, "refusal", None):
            raise ValueError(f"A IA recusou a geração: {message.refusal}")
        text = message.content or ""
        try:
            payload = extract_json(text)
            return normalize_generated_posts(payload.get("planejamento") or [], dates, req.networks)
        except ValueError as error:
            last_error = error
            messages.extend([
                {"role": "assistant", "content": text},
                {"role": "user", "content": f"A resposta ficou incompleta: {error}. Corrija e retorne exatamente {len(dates)} itens, um para cada data, no JSON solicitado."},
            ])
    raise last_error or ValueError("Não foi possível montar o calendário completo.")


def build_plan(
    client: OpenAI,
    req: CreatorRequest,
    db: Session,
    current_user: User,
    start_date: date,
    end_date: date,
    existing_plan: Optional[CreatorPlan] = None,
    specific_dates: Optional[List[date]] = None,
    excluded_post: Optional[Tuple[int, int]] = None,
    visual_context_override: str = "",
    cancel_check: Optional[Callable[[], None]] = None,
) -> dict:
    if req.strategy not in STRATEGIES:
        raise HTTPException(status_code=422, detail="Estratégia de conteúdo inválida.")
    if not req.networks:
        raise HTTPException(status_code=422, detail="Selecione pelo menos uma rede social.")

    check_cancel = cancel_check or (lambda: None)
    check_cancel()

    dates = specific_dates or publication_dates(start_date, end_date, req.days)
    preserved_posts = []
    if existing_plan and specific_dates is None:
        preserved_posts = [dict(post) for post in (existing_plan.plan_json or {}).get("planejamento", []) if post.get("feito")]
        preserved_dates = {parse_br_date(str(post.get("data_sugerida", ""))) for post in preserved_posts}
        dates = [item for item in dates if item not in preserved_dates]

    context_lines = collect_calendar_context(
        db,
        current_user.id,
        exclude_plan_id=existing_plan.id if existing_plan and excluded_post is None else None,
        exclude_post=excluded_post,
        include_completed_from_excluded=True,
    )

    check_cancel()
    visual_context = visual_context_override
    if not visual_context and (req.logo or req.prints):
        try:
            visual_context = analyze_visual_attachments(client, req.logo, req.prints)
        except Exception as error:
            raise HTTPException(status_code=400, detail="Não foi possível analisar o logo ou as referências visuais.") from error

    check_cancel()

    generated_posts = []
    session_themes = []
    for offset in range(0, len(dates), 6):
        check_cancel()
        chunk = dates[offset:offset + 6]
        chunk_posts = request_generation_chunk(client, req, chunk, context_lines, visual_context, session_themes)
        generated_posts.extend(chunk_posts)
        check_cancel()
        session_themes.extend(post.get("tema_central", "") for post in chunk_posts)

    check_cancel()
    posts = preserved_posts + generated_posts
    posts.sort(key=lambda post: parse_br_date(str(post.get("data_sugerida", ""))) or date.max)
    strategy = STRATEGIES[req.strategy]
    return {
        "planejamento": posts,
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "period_label": period_label(start_date, end_date),
        "week_label": period_label(start_date, end_date),
        "strategy": req.strategy,
        "strategy_label": strategy["label"],
        "strategy_details": req.strategyDetails or "",
        "objective": req.objective or "",
        "networks": req.networks,
        "days": req.days,
        "visual_context": visual_context,
        "used_visual_attachments": bool(visual_context),
        "generation_request": {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "strategy": req.strategy,
            "strategyDetails": req.strategyDetails or "",
            "objective": req.objective or "",
            "networks": req.networks,
            "days": req.days,
        },
        "updated_at": datetime.utcnow().isoformat(),
    }


def save_generated_plan(db: Session, current_user: User, plan_json: dict, existing_plan: Optional[CreatorPlan]) -> CreatorPlan:
    for post in plan_json.get("planejamento", []):
        if post.get("feito"):
            continue
        theme = str(post.get("tema_central") or "").strip()
        if theme:
            db.add(ContentHistory(user_id=current_user.id, theme=theme[:500]))

    if existing_plan:
        existing_plan.plan_json = plan_json
        flag_modified(existing_plan, "plan_json")
        plan = existing_plan
    else:
        plan = CreatorPlan(user_id=current_user.id, plan_json=plan_json)
        db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def serialize_plan(plan: CreatorPlan) -> dict:
    return {"id": plan.id, "created_at": plan.created_at.isoformat(), "plan_json": plan.plan_json}


def request_from_plan(plan: CreatorPlan, current_user: User) -> CreatorRequest:
    data = plan.plan_json or {}
    stored = data.get("generation_request") or {}
    business = current_user.creator_settings or {}
    posts = data.get("planejamento") or []
    post_dates = [parse_br_date(str(post.get("data_sugerida", ""))) for post in posts]
    post_dates = [item for item in post_dates if item]
    start_value = stored.get("startDate") or data.get("period_start") or (min(post_dates).isoformat() if post_dates else date.today().isoformat())
    end_value = stored.get("endDate") or data.get("period_end") or (max(post_dates).isoformat() if post_dates else date.today().isoformat())
    return CreatorRequest(
        niche=business.get("niche") or "Negócio",
        persona=business.get("persona") or "Público do negócio",
        businessHours=business.get("businessHours") or "",
        networks=stored.get("networks") or data.get("networks") or business.get("networks") or ["Instagram"],
        tone=business.get("tone") or "Profissional e próximo",
        days=stored.get("days") or data.get("days") or business.get("days") or ["Segunda"],
        startDate=start_value,
        endDate=end_value,
        strategy=stored.get("strategy") or data.get("strategy") or business.get("defaultStrategy") or "funnel",
        strategyDetails=stored.get("strategyDetails") or data.get("strategy_details") or "",
        businessInfo=business.get("businessInfo") or "",
        products=business.get("products") or "",
        objective=stored.get("objective") or data.get("objective") or "",
        brandKeywords=business.get("brandKeywords") or "",
        avoidTopics=business.get("avoidTopics") or "",
        logo=business.get("logo") or [],
        prints=business.get("prints") or [],
    )


@router.post("/generation/{generation_id}/cancel")
def cancel_generation(generation_id: str, current_user: User = Depends(get_current_user)):
    if not generation_id or len(generation_id) > 128:
        raise HTTPException(status_code=422, detail="Identificador de geração inválido.")
    with GENERATION_LOCK:
        GENERATION_STATES[(current_user.id, generation_id)] = True
    return {"status": "cancelled", "generation_id": generation_id}


@router.post("/generate")
def generate_content(req: CreatorRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API Key não configurada.")

    begin_generation(current_user.id, req.generationId)
    try:
        ensure_generation_active(current_user.id, req.generationId)
        start_date, end_date = resolve_period(req)
        existing_plan = find_existing_plan(db, current_user.id, start_date, end_date)
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        current_visual = (existing_plan.plan_json or {}).get("visual_context", "") if existing_plan else ""
        plan_json = build_plan(
            client,
            req,
            db,
            current_user,
            start_date,
            end_date,
            existing_plan=existing_plan,
            visual_context_override=current_visual,
            cancel_check=lambda: ensure_generation_active(current_user.id, req.generationId),
        )
        ensure_generation_active(current_user.id, req.generationId)
        return serialize_plan(save_generated_plan(db, current_user, plan_json, existing_plan))
    except HTTPException:
        raise
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        print(f"Exception in generate_content: {error}")
        raise HTTPException(status_code=500, detail="Erro interno ao gerar o planejamento.") from error
    finally:
        finish_generation(current_user.id, req.generationId)


def merge_chat_post(current_post: dict, changes: dict) -> dict:
    """Merge a partial AI edit without allowing publication state to be changed."""
    allowed_fields = {
        "dia", "data_sugerida", "horario_sugerido", "tema_central",
        "etapa_estrategia", "etapa_funil", "noticia_tendencia_usada",
        "conteudo_por_rede",
    }
    merged = dict(current_post)
    for key, value in changes.items():
        if key not in allowed_fields:
            continue
        if key == "conteudo_por_rede" and isinstance(value, dict):
            current_contents = dict(merged.get(key) or {})
            for raw_network, network_changes in value.items():
                normalized_network = network_key(str(raw_network))
                current_content = dict(current_contents.get(normalized_network) or {})
                if isinstance(network_changes, dict):
                    current_content.update(network_changes)
                else:
                    current_content["roteiro_ou_legenda"] = str(network_changes)
                current_contents[normalized_network] = current_content
            merged[key] = current_contents
        else:
            merged[key] = value
    merged["feito"] = bool(current_post.get("feito", False))
    return merged


def editorial_identity(post: dict) -> Tuple[str, ...]:
    values = [str(post.get("tema_central") or "")]
    for content in (post.get("conteudo_por_rede") or {}).values():
        if isinstance(content, dict):
            values.append(str(content.get("titulo") or ""))
    return tuple(sorted(normalize_text(value) for value in values if normalize_text(value)))


@router.post("/chat")
def chat_nova(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API Key não configurada.")

    plan = None
    plan_json = dict(req.contextData or {})
    if req.planId is not None:
        plan = db.query(CreatorPlan).filter(
            CreatorPlan.id == req.planId,
            CreatorPlan.user_id == current_user.id,
        ).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Planejamento não encontrado.")
        plan_json = dict(plan.plan_json or {})

    indexed_posts = [
        {"post_index": index, **post}
        for index, post in enumerate(plan_json.get("planejamento") or [])
    ]
    calendar_context = collect_calendar_context(db, current_user.id)[-200:]
    strategy_key = plan_json.get("strategy") or "funnel"
    strategy = STRATEGIES.get(strategy_key, STRATEGIES["funnel"])

    system_prompt = f"""Você é Nova, estrategista sênior de conteúdo e editora do calendário do usuário.
Você pode responder dúvidas e, quando o usuário pedir uma mudança, deve EDITAR de fato o planejamento aberto — nunca diga apenas como ele poderia fazer.

PLANEJAMENTO ABERTO (cada publicação contém seu post_index imutável durante esta conversa):
{json.dumps({**plan_json, "planejamento": indexed_posts}, ensure_ascii=False)}

ESTRATÉGIA ATUAL:
{strategy['label']} — {strategy['instruction']}
OBJETIVO: {plan_json.get('objective') or 'Não informado'}
REDES: {', '.join(plan_json.get('networks') or []) or 'Não informadas'}

TODO O CALENDÁRIO DO USUÁRIO, incluindo publicados e agendados:
{chr(10).join(calendar_context) or '- Nenhum outro conteúdo.'}

Regras:
- Preserve a coerência com a estratégia, o objetivo e a sequência dos outros planejamentos.
- Não repita tema, promessa, gancho, exemplo ou título já usado no calendário.
- Para LinkedIn, use abordagem profissional e analítica; para Instagram, visual, humana e escaneável. Títulos relacionados devem ser diferentes entre redes.
- Só mude data se o usuário pedir e mantenha-a dentro do período do planejamento.
- Nunca altere o campo feito/publicado.
- Se o pedido for ambíguo, faça uma pergunta e deixe edits vazio.
- Para editar, use o post_index exibido acima e envie em post apenas os campos que precisam mudar.
- As chaves de conteudo_por_rede devem ser minúsculas e normalizadas, por exemplo instagram e linkedin.

Responda SOMENTE JSON válido neste formato:
{{
  "response": "mensagem curta explicando o que foi feito ou respondendo à dúvida",
  "edits": [
    {{
      "post_index": 0,
      "post": {{
        "tema_central": "novo tema, se necessário",
        "conteudo_por_rede": {{
          "linkedin": {{"titulo": "novo título", "roteiro_ou_legenda": "novo texto", "cta": "novo CTA"}}
        }}
      }}
    }}
  ]
}}
Quando não houver edição, retorne edits como lista vazia."""

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(
        {"role": "user" if message.role == "user" else "assistant", "content": message.text}
        for message in req.messages
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.35,
            response_format={"type": "json_object"},
        )
        message = response.choices[0].message
        if getattr(message, "refusal", None):
            raise ValueError(message.refusal)
        result = extract_json(message.content or "")
        reply = str(result.get("response") or "Analisei o planejamento.")
        edits = result.get("edits") if isinstance(result.get("edits"), list) else []

        if not plan or not edits:
            return {"response": reply, "edited": False, "plan_json": None}

        posts = [dict(post) for post in plan_json.get("planejamento") or []]
        start_date = parse_br_date(str(plan_json.get("period_start") or ""))
        end_date = parse_br_date(str(plan_json.get("period_end") or ""))
        networks = plan_json.get("networks") or []
        edited_indexes = set()
        edited_themes = []

        for edit in edits:
            if not isinstance(edit, dict):
                continue
            post_index = edit.get("post_index")
            changes = edit.get("post")
            if not isinstance(post_index, int) or not isinstance(changes, dict):
                continue
            if post_index < 0 or post_index >= len(posts):
                continue

            current_post = posts[post_index]
            candidate = merge_chat_post(current_post, changes)
            if not str(candidate.get("tema_central") or "").strip():
                raise HTTPException(status_code=422, detail="A Nova tentou salvar uma publicação sem tema central.")

            post_date = parse_br_date(str(candidate.get("data_sugerida") or current_post.get("data_sugerida") or ""))
            if not post_date:
                raise HTTPException(status_code=422, detail="A publicação editada precisa ter uma data válida.")
            if start_date and end_date and not start_date <= post_date <= end_date:
                raise HTTPException(status_code=422, detail="A edição solicitada moveria a publicação para fora do período deste planejamento.")

            candidate["dia"] = DAY_NAMES[post_date.weekday()]
            candidate["data_sugerida"] = post_date.strftime("%d/%m/%Y")
            candidate = ensure_network_variation(
                candidate,
                networks or list((candidate.get("conteudo_por_rede") or {}).keys()),
            )

            if editorial_identity(candidate) != editorial_identity(current_post):
                duplicate = find_duplicate(db, current_user.id, candidate, (plan.id, post_index))
                if duplicate:
                    raise HTTPException(
                        status_code=409,
                        detail=f"A alteração ficou parecida com outro conteúdo do calendário: {duplicate}. Peça à Nova outro ângulo.",
                    )

            posts[post_index] = candidate
            edited_indexes.add(post_index)
            edited_themes.append(str(candidate.get("tema_central") or "").strip())

        if not edited_indexes:
            return {"response": reply, "edited": False, "plan_json": None}

        posts.sort(key=lambda post: parse_br_date(str(post.get("data_sugerida") or "")) or date.max)
        plan_json["planejamento"] = posts
        plan_json["updated_at"] = datetime.utcnow().isoformat()
        plan.plan_json = plan_json
        flag_modified(plan, "plan_json")
        for theme in edited_themes:
            if theme:
                db.add(ContentHistory(user_id=current_user.id, theme=theme[:500]))
        db.commit()
        db.refresh(plan)
        return {"response": reply, "edited": True, "plan_json": plan.plan_json}
    except HTTPException:
        raise
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        print(f"Exception in chat_nova: {error}")
        raise HTTPException(status_code=500, detail="Erro de comunicação com a Nova.") from error


@router.get("/check-plan")
def check_creator_plan(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    week: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not start_date or not end_date:
        reference = date.today() + (timedelta(days=7) if week == "Próxima Semana" else timedelta())
        start_date = reference - timedelta(days=reference.weekday())
        end_date = start_date + timedelta(days=6)
    plan = find_existing_plan(db, current_user.id, start_date, end_date)
    return {"exists": bool(plan), "id": plan.id if plan else None, "label": period_label(start_date, end_date)}


@router.get("/history")
def get_creator_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        plans = db.query(CreatorPlan).filter(CreatorPlan.user_id == current_user.id).order_by(CreatorPlan.created_at.desc()).all()
        return [serialize_plan(plan) for plan in plans]
    except Exception as error:
        print(f"Exception in get_creator_history: {error}")
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico.") from error


@router.delete("/plan/{plan_id}")
def delete_creator_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(CreatorPlan).filter(
        CreatorPlan.id == plan_id,
        CreatorPlan.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Planejamento não encontrado.")
    db.delete(plan)
    db.commit()
    return {"status": "deleted", "id": plan_id}


@router.post("/plan/{plan_id}/toggle/{post_index}")
def toggle_post_status(plan_id: int, post_index: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(CreatorPlan).filter(CreatorPlan.id == plan_id, CreatorPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Planejamento não encontrado.")
    plan_json = dict(plan.plan_json or {})
    posts = [dict(post) for post in plan_json.get("planejamento", [])]
    if post_index < 0 or post_index >= len(posts):
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    posts[post_index]["feito"] = not posts[post_index].get("feito", False)
    plan_json["planejamento"] = posts
    plan_json["updated_at"] = datetime.utcnow().isoformat()
    plan.plan_json = plan_json
    flag_modified(plan, "plan_json")
    db.commit()
    return {"status": "success", "feito": posts[post_index]["feito"], "plan_json": plan_json}


SIMILARITY_STOP_WORDS = {
    "a", "as", "o", "os", "de", "da", "das", "do", "dos", "e", "em", "para", "por", "com",
    "um", "uma", "no", "na", "nos", "nas", "seu", "sua", "seus", "suas", "como", "que",
}


def editorial_tokens(value: str) -> set:
    return {token for token in normalize_text(value).split() if len(token) > 2 and token not in SIMILARITY_STOP_WORDS}


def is_similar_editorial_angle(first: str, second: str) -> bool:
    first_tokens = editorial_tokens(first)
    second_tokens = editorial_tokens(second)
    if not first_tokens or not second_tokens:
        return False
    intersection = first_tokens.intersection(second_tokens)
    union = first_tokens.union(second_tokens)
    coverage = len(intersection) / min(len(first_tokens), len(second_tokens))
    jaccard = len(intersection) / len(union)
    return (len(intersection) >= 2 and coverage >= 0.75) or jaccard >= 0.6


def find_duplicate(db: Session, user_id: int, candidate: dict, excluded_post: Tuple[int, int]) -> Optional[str]:
    candidate_values = {str(candidate.get("tema_central") or "").strip()}
    for content in (candidate.get("conteudo_por_rede") or {}).values():
        if isinstance(content, dict) and content.get("titulo"):
            candidate_values.add(str(content["titulo"]).strip())
    candidate_values.discard("")

    plans = db.query(CreatorPlan).filter(CreatorPlan.user_id == user_id).all()
    for plan in plans:
        for index, post in enumerate((plan.plan_json or {}).get("planejamento", [])):
            if (plan.id, index) == excluded_post:
                continue
            values = {str(post.get("tema_central") or "").strip()}
            for content in (post.get("conteudo_por_rede") or {}).values():
                if isinstance(content, dict) and content.get("titulo"):
                    values.add(str(content["titulo"]).strip())
            if any(
                normalize_text(candidate_value) == normalize_text(value)
                or is_similar_editorial_angle(candidate_value, value)
                for candidate_value in candidate_values
                for value in values
                if value
            ):
                return post.get("tema_central") or next(iter(values), "conteúdo semelhante")
    return None


@router.put("/plan/{plan_id}/post/{post_index}")
def update_plan_post(plan_id: int, post_index: int, payload: PlanPostUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(CreatorPlan).filter(CreatorPlan.id == plan_id, CreatorPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Planejamento não encontrado.")
    plan_json = dict(plan.plan_json or {})
    posts = [dict(post) for post in plan_json.get("planejamento", [])]
    if post_index < 0 or post_index >= len(posts):
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    candidate = dict(payload.post)
    if not str(candidate.get("tema_central") or "").strip():
        raise HTTPException(status_code=422, detail="O tema central é obrigatório.")
    post_date = parse_br_date(str(candidate.get("data_sugerida") or ""))
    start_date = parse_br_date(plan_json.get("period_start", ""))
    end_date = parse_br_date(plan_json.get("period_end", ""))
    if not post_date:
        raise HTTPException(status_code=422, detail="Informe uma data válida para a publicação.")
    if start_date and end_date and not start_date <= post_date <= end_date:
        raise HTTPException(status_code=422, detail="A publicação deve permanecer dentro do período do planejamento.")
    duplicate = find_duplicate(db, current_user.id, candidate, (plan.id, post_index))
    if duplicate:
        raise HTTPException(status_code=409, detail=f"Este tema ou título já aparece em outro conteúdo: {duplicate}")

    candidate["feito"] = posts[post_index].get("feito", False)
    candidate["dia"] = DAY_NAMES[post_date.weekday()]
    candidate["data_sugerida"] = post_date.strftime("%d/%m/%Y")
    networks = plan_json.get("networks") or list((candidate.get("conteudo_por_rede") or {}).keys())
    candidate = ensure_network_variation(candidate, networks)
    posts[post_index] = candidate
    posts.sort(key=lambda post: parse_br_date(str(post.get("data_sugerida", ""))) or date.max)
    plan_json["planejamento"] = posts
    plan_json["updated_at"] = datetime.utcnow().isoformat()
    plan.plan_json = plan_json
    flag_modified(plan, "plan_json")
    db.add(ContentHistory(user_id=current_user.id, theme=candidate["tema_central"][:500]))
    db.commit()
    return {"status": "success", "plan_json": plan_json}


@router.post("/plan/{plan_id}/regenerate")
def regenerate_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API Key não configurada.")
    plan = db.query(CreatorPlan).filter(CreatorPlan.id == plan_id, CreatorPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Planejamento não encontrado.")
    req = request_from_plan(plan, current_user)
    start_date, end_date = resolve_period(req)
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        visual_context = (plan.plan_json or {}).get("visual_context", "")
        plan_json = build_plan(client, req, db, current_user, start_date, end_date, existing_plan=plan, visual_context_override=visual_context)
        return serialize_plan(save_generated_plan(db, current_user, plan_json, plan))
    except HTTPException:
        raise
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        print(f"Exception in regenerate_plan: {error}")
        raise HTTPException(status_code=500, detail="Erro interno ao regenerar o planejamento.") from error


@router.post("/plan/{plan_id}/post/{post_index}/regenerate")
def regenerate_plan_post(plan_id: int, post_index: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API Key não configurada.")
    plan = db.query(CreatorPlan).filter(CreatorPlan.id == plan_id, CreatorPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Planejamento não encontrado.")
    plan_json = dict(plan.plan_json or {})
    posts = [dict(post) for post in plan_json.get("planejamento", [])]
    if post_index < 0 or post_index >= len(posts):
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    target_date = parse_br_date(str(posts[post_index].get("data_sugerida") or ""))
    if not target_date:
        raise HTTPException(status_code=422, detail="A publicação não possui uma data válida.")

    req = request_from_plan(plan, current_user)
    start_date, end_date = resolve_period(req)
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        generated = build_plan(
            client, req, db, current_user, start_date, end_date,
            specific_dates=[target_date], excluded_post=(plan.id, post_index),
            visual_context_override=plan_json.get("visual_context", ""),
        )["planejamento"][0]
        generated["feito"] = posts[post_index].get("feito", False)
        posts[post_index] = generated
        posts.sort(key=lambda post: parse_br_date(str(post.get("data_sugerida", ""))) or date.max)
        plan_json["planejamento"] = posts
        plan_json["updated_at"] = datetime.utcnow().isoformat()
        plan.plan_json = plan_json
        flag_modified(plan, "plan_json")
        db.add(ContentHistory(user_id=current_user.id, theme=generated["tema_central"][:500]))
        db.commit()
        db.refresh(plan)
        return serialize_plan(plan)
    except HTTPException:
        raise
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        print(f"Exception in regenerate_plan_post: {error}")
        raise HTTPException(status_code=500, detail="Erro interno ao regenerar a publicação.") from error


@router.post("/plan/{plan_id}/generate-image/{post_index}")
def generate_post_image(plan_id: int, post_index: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(CreatorPlan).filter(CreatorPlan.id == plan_id, CreatorPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Planejamento não encontrado.")
    plan_json = dict(plan.plan_json or {})
    posts = plan_json.get("planejamento") or []
    if post_index < 0 or post_index >= len(posts):
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API Key não configurada.")

    try:
        post = posts[post_index]
        theme = post.get("tema_central") or "Conteúdo para redes sociais"
        network_content = next(iter((post.get("conteudo_por_rede") or {}).values()), {})
        visual_description = network_content.get("descricao_visual", "") if isinstance(network_content, dict) else ""
        visual_context = plan_json.get("visual_context", "")
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        if not visual_context:
            business = current_user.creator_settings or {}
            if business.get("logo") or business.get("prints"):
                try:
                    visual_context = analyze_visual_attachments(client, business.get("logo"), business.get("prints"))
                    if visual_context:
                        plan_json["visual_context"] = visual_context
                        plan.plan_json = plan_json
                        flag_modified(plan, "plan_json")
                        db.commit()
                except Exception as error:
                    print(f"Visual analysis skipped while generating image: {error}")

        prompt = (
            "Crie uma imagem profissional para uma publicação de rede social. "
            f"Tema: {theme}. Direção do post: {visual_description}. "
            f"Identidade visual: {visual_context or 'visual contemporâneo, limpo e coerente'}. "
            "Não inclua textos legíveis. Reserve respiro no canto inferior direito para aplicação do logotipo."
        )
        response = client.images.generate(model=settings.OPENAI_IMAGE_MODEL, prompt=prompt, size="1024x1024", n=1)
        image_data = response.data[0]
        image_url = getattr(image_data, "url", None)
        if not image_url:
            b64_image = getattr(image_data, "b64_json", None)
            if not b64_image:
                raise ValueError("A geração não retornou uma imagem.")
            image_url = f"data:image/png;base64,{b64_image}"
        return {"image_url": image_url}
    except HTTPException:
        raise
    except Exception as error:
        print(f"Exception in generate_post_image: {error}")
        raise HTTPException(status_code=500, detail="Erro interno ao gerar a imagem.") from error
