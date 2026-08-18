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
1. Horário do Dia/Rotina (recurring_events): Se o usuário informar seu horário de início e fim do dia (ex: começo meu dia às 9h e termino às 18h com almoço 12h-13h), retorne UM objeto:
   {{ "type": "recurring_events", "title": "Trabalho", "category": "Rotina", "events": [ {{ "day": "seg", "time": "09:00", "end_time": "18:00", "duration": 540, "break_start": "12:00", "break_end": "13:00" }}, ... ] }}
   - Se os dias não forem especificados, assuma de segunda a sexta ("seg", "ter", "qua", "qui", "sex").

2. Regra de Horário do Dia: Para alocar tarefas automaticamente de forma inteligente, você precisa saber a janela de disponibilidade do usuário. Se você notar que a agenda atual NÃO possui uma rotina do dia (um recurring_events com category Rotina/Trabalho) definida, e o usuário pedir para alocar uma tarefa (ou se houver posts para agendar), NÃO aloque horários aleatoriamente. Ao invés disso, envie "suggestions": [] e na sua `reply` pergunte amigavelmente: "Qual o horário que você começa e termina o seu dia para que eu possa encontrar o melhor espaço?".

3. Tarefas (task): Se o usuário quiser agendar uma tarefa, analise a agenda atual para encontrar um horário livre. Retorne:
   {{ "type": "task", "title": "Nome da Tarefa", "duration": 60, "category": "Geral", "day": "qua", "time": "14:00" }}
   - Importante: O dia deve ser "seg", "ter", "qua", "qui" ou "sex".
   - O horário ("time") não pode sobrepor com Eventos ou Tarefas já existentes e deve estar DENTRO do horário de trabalho, porém FORA do almoço.

4. Posts Sugeridos: Avalie os Posts Sugeridos (pendentes) da semana. Sugira proativamente (ou quando solicitado) blocos de tempo para o usuário criar e agendar esses posts. Estime 20 minutos por post. Aloque esses blocos de 20 minutos em horários livres da agenda. Use "type": "task" e "category": "Conteúdo". O título da tarefa deve refletir a criação do post (ex: "Criar post: [Tema]").

5. Compromissos (event): Se for um compromisso específico com hora marcada, retorne:
   {{ "type": "event", "title": "Nome do Compromisso", "day": "qua", "time": "15:00", "duration": 60 }}

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

REGRA ANTI-DUPLICAÇÃO (CRÍTICA): Se o ESTADO ATUAL DA AGENDA já contém eventos de rotina/trabalho (recurring_events), você NÃO deve reenviar esses eventos. Quando o usuário pedir para encaixar algo novo (ex: academia, reunião, médico), retorne APENAS a nova sugestão como "type": "task" ou "type": "event". NUNCA recrie ou inclua novamente os eventos que já existem na agenda. Analise os horários livres com base no estado atual e sugira SOMENTE o novo item solicitado.

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

