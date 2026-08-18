from datetime import datetime, date, timedelta
import json
from typing import Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.creator_plan import CreatorPlan
from app.core.config import settings
from openai import OpenAI

router = APIRouter(prefix='/planner', tags=['Planejador semanal'])

class PlannerState(BaseModel):
    events: list[dict[str, Any]] = Field(default_factory=list)
    tasks: list[dict[str, Any]] = Field(default_factory=list)
    availability: dict[str, Any] = Field(default_factory=dict)
    suggested_posts: list[dict[str, Any]] = Field(default_factory=list)

class MessageInput(BaseModel):
    role: str
    content: str

class PlannerChatInput(BaseModel):
    message: str
    messages: list[MessageInput] = Field(default_factory=list)
    state: PlannerState = Field(default_factory=PlannerState)

def _state(user: User, db=None):
    base_state = (user.creator_settings or {}).get('weekly_planner', {'events': [], 'tasks': [], 'availability': {}})
    suggested_posts = []
    if db:
        plan = db.query(CreatorPlan).filter(CreatorPlan.user_id == user.id).order_by(CreatorPlan.created_at.desc()).first()
        if plan and plan.plan_json:
            posts = plan.plan_json.get("planejamento", [])
            for p in posts:
                if not p.get("feito"):
                    suggested_posts.append(p)
    
    # Ensure lists exist
    base_state.setdefault('events', [])
    base_state.setdefault('tasks', [])
    base_state.setdefault('availability', {})
    base_state['suggested_posts'] = suggested_posts
    return base_state

@router.get('/week', response_model=PlannerState)
def get_week(db=Depends(get_db), current_user: User = Depends(get_current_user)):
    return _state(current_user, db)

@router.put('/week', response_model=PlannerState)
def save_week(payload: PlannerState, db=Depends(get_db), current_user: User = Depends(get_current_user)):
    settings_dict = dict(current_user.creator_settings or {})
    planner_data = payload.model_dump()
    planner_data.pop("suggested_posts", None)
    settings_dict['weekly_planner'] = planner_data
    current_user.creator_settings = settings_dict
    db.commit()
    return payload

@router.post('/chat')
def planner_chat(payload: PlannerChatInput):
    fallback_reply = 'Entendi. Separei isso em uma sugestão para sua semana. Você pode aceitar, editar ou deixar para depois.'
    
    if not settings.OPENAI_API_KEY:
        return {"reply": fallback_reply, "suggestions": [], "received_at": datetime.utcnow().isoformat()}

    system_prompt = f"""Você é a Nova, assistente de planejamento semanal para profissionais autônomos.
Responda em português brasileiro com clareza e brevidade (máximo de 350 caracteres).

ESTADO ATUAL DA AGENDA:
Eventos e Rotina: {json.dumps(payload.state.events, ensure_ascii=False)}
Tarefas Adicionadas: {json.dumps(payload.state.tasks, ensure_ascii=False)}
Posts Sugeridos (pendentes): {json.dumps(payload.state.suggested_posts, ensure_ascii=False)}

Sua tarefa é interpretar a mensagem do usuário e gerar uma resposta em formato JSON.
O JSON DEVE ter a seguinte estrutura:
{{
  "reply": "Sua resposta amigável e breve.",
  "suggestions": [
     // Array de sugestões para adicionar à agenda
  ]
}}

Regras para `suggestions`:
1. Atividades Recorrentes (recurring_events): Para QUALQUER atividade que se repete em múltiplos dias da semana (rotina de trabalho, academia, meditação, estudo, etc.), retorne SEMPRE UM ÚNICO objeto `recurring_events`. NUNCA retorne múltiplos eventos individuais para a mesma atividade em dias diferentes.
   Exemplo para rotina de trabalho:
   {{ "type": "recurring_events", "title": "Trabalho", "category": "Rotina", "events": [ {{ "day": "seg", "time": "09:00", "end_time": "18:00", "duration": 540, "break_start": "12:00", "break_end": "13:00" }}, ... ] }}
   Exemplo para academia:
   {{ "type": "recurring_events", "title": "Academia", "category": "Pessoal", "events": [ {{ "day": "seg", "time": "07:30", "duration": 60 }}, {{ "day": "ter", "time": "07:30", "duration": 60 }}, ... ] }}
   - Se os dias não forem especificados, assuma de segunda a sexta ("seg", "ter", "qua", "qui", "sex").
   - Para trabalho, inclua `break_start` e `break_end` se houver almoço.
   - Para outras atividades recorrentes (academia, estudo, etc.), NÃO inclua break_start/break_end.

2. Janela do Dia vs. Horário de Trabalho: Existem dois conceitos diferentes:
   - **Janela do dia**: O período em que o usuário está acordado e disponível (ex: acorda 7h, dorme 22h). Atividades pessoais (academia, estudo, lazer) podem ser alocadas em qualquer horário dentro dessa janela.
   - **Horário de trabalho**: O período em que o usuário trabalha (ex: 9h às 18h). Tarefas profissionais devem ficar dentro desse período.
   
   REGRA IMPORTANTE: Quando o usuário pedir para alocar uma atividade pessoal (academia, meditação, etc.) e você NÃO souber a janela do dia dele, pergunte: "Que horas você costuma acordar e que horas vai dormir? Assim consigo encontrar o melhor horário para encaixar isso."
   Se você já sabe o horário de trabalho mas NÃO sabe a janela do dia, pergunte apenas sobre acordar/dormir.
   Se o usuário já informou ambos (ou se é possível inferir do contexto), aloque direto sem perguntar.

3. Tarefas profissionais (task): Devem ficar DENTRO do horário de trabalho e FORA do almoço. Retorne:
   {{ "type": "task", "title": "Nome da Tarefa", "duration": 60, "category": "Geral", "day": "qua", "time": "14:00" }}
   - Importante: O dia deve ser "seg", "ter", "qua", "qui" ou "sex".

4. Posts Sugeridos: Avalie os Posts Sugeridos (pendentes) da semana. Sugira proativamente (ou quando solicitado) blocos de tempo para o usuário criar e agendar esses posts. Estime 20 minutos por post. Aloque esses blocos de 20 minutos em horários livres da agenda. Use "type": "task" e "category": "Conteúdo". O título da tarefa deve refletir a criação do post (ex: "Criar post: [Tema]").

5. Compromissos (event): APENAS para compromissos ÚNICOS em um dia específico (reunião, consulta médica, etc.). Retorne:
   {{ "type": "event", "title": "Nome do Compromisso", "day": "qua", "time": "15:00", "duration": 60 }}
   NUNCA use múltiplos `event` para a mesma atividade em dias diferentes. Use `recurring_events` nesse caso.

6. Ações de Alteração e Exclusão: 
   - O JSON aceita um campo `"action": "create" | "update" | "delete" | "delete_all"` (o padrão é "create").
   - Para operações em um ÚNICO item específico, use o `id` exato encontrado no ESTADO ATUAL DA AGENDA:
     {{ "action": "update", "type": "task", "id": 12345, "title": "Novo Título", "day": "qui", "time": "16:00" }}
     {{ "action": "delete", "type": "event", "id": 12345, "title": "Nome do Evento" }}
   - Para operações em VÁRIOS itens de uma vez (ex: "remova academia todos os dias", "mude o nome academia para treino"), use `"match_by": "title"` com o título atual do item no campo `"match_title"`:
     {{ "action": "delete", "type": "event", "match_by": "title", "match_title": "Academia", "title": "Academia" }}
     {{ "action": "update", "type": "event", "match_by": "title", "match_title": "Academia", "title": "Treino" }}
   - Para LIMPAR TUDO (ex: "remova tudo", "limpa a agenda", "apaga tudo"), retorne UMA ÚNICA suggestion:
     {{ "action": "delete_all", "type": "all", "title": "Limpar toda a agenda" }}
   - SEMPRE retorne a suggestion dentro do array `suggestions`, mesmo para delete/update. Nunca retorne suggestions vazio quando o usuário pedir para alterar ou remover algo que existe na agenda.
   - Se não encontrar o item na agenda, informe na `reply` que não encontrou.

REGRA DE OURO DA CONFIRMAÇÃO: Você NUNCA deve afirmar que "já adicionou", "já excluiu" ou "já alterou". Você não tem permissão para alterar diretamente a agenda. Você sempre vai preparar o "card" através de `suggestions` e na sua resposta (`reply`) deve falar: "Entendi! Preparei a alteração, clique no botão abaixo para confirmar." ou algo parecido, instruindo o usuário a usar o botão da interface.

REGRA ANTI-DUPLICAÇÃO (CRÍTICA): Se o ESTADO ATUAL DA AGENDA já contém eventos de rotina/trabalho (recurring_events), você NÃO deve reenviar esses eventos. Quando o usuário pedir para encaixar algo novo (ex: academia, reunião, médico), retorne APENAS a nova sugestão. NUNCA recrie ou inclua novamente os eventos que já existem na agenda.

Se não houver sugestões a fazer agora, envie "suggestions": [].
Retorne APENAS JSON válido, sem uso de markdown de blocos de código (```json).
"""

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        api_messages = [{'role': 'system', 'content': system_prompt}]
        if payload.messages:
            for m in payload.messages:
                api_messages.append({'role': m.role if m.role in ['user', 'assistant'] else 'user', 'content': m.content})
        else:
            api_messages.append({'role': 'user', 'content': payload.message})

        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=api_messages,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            data = {"reply": fallback_reply, "suggestions": []}
            
        reply = data.get("reply", fallback_reply)
        suggestions = data.get("suggestions", [])
        
        return {"reply": reply, "suggestions": suggestions, "received_at": datetime.utcnow().isoformat()}
    except Exception as e:
        print(f"Error in planner_chat: {e}")
        return {"reply": fallback_reply, "suggestions": [], "received_at": datetime.utcnow().isoformat()}

