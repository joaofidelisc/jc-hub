import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import './WeeklyPlanner.css';

const week = [
  { key: 'seg', label: 'SEG', date: '19', full: 'Segunda-feira' },
  { key: 'ter', label: 'TER', date: '20', full: 'Terça-feira' },
  { key: 'qua', label: 'QUA', date: '21', full: 'Quarta-feira' },
  { key: 'qui', label: 'QUI', date: '22', full: 'Quinta-feira' },
  { key: 'sex', label: 'SEX', date: '23', full: 'Sexta-feira' },
];
const seedTasks = [];
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });

const processDayItems = (dayEvents, dayTasks) => {
  const items = [];
  
  dayEvents.forEach(event => {
    if (event.break_start && event.break_end) {
      items.push({ ...event, title: event.title, time: event.time, end_time: event.break_start, isPart: true, partType: 'work', originalId: event.id });
      items.push({ ...event, id: event.id + '_break', title: 'Almoço', time: event.break_start, end_time: event.break_end, isPart: true, partType: 'break', originalId: event.id });
      items.push({ ...event, id: event.id + '_afternoon', title: event.title, time: event.break_end, end_time: event.end_time || '18:00', isPart: true, partType: 'work', originalId: event.id });
    } else {
      items.push({ ...event, partType: 'event', originalId: event.id });
    }
  });

  dayTasks.forEach(task => {
    items.push({ ...task, type: 'task', partType: 'task', originalId: task.id });
  });

  // Sort by time
  items.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
  return items;
};

function WeeklyPlanner() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState(seedTasks);
  const [events, setEvents] = useState([]);
  const [suggestedPosts, setSuggestedPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Oi! Conte como está sua semana — compromissos, horários livres ou o que você precisa fazer. Eu organizo tudo para você.' }]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [eventForm, setEventForm] = useState({ title: '', day: 'seg', time: '10:00', duration: 60 });
  
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'today'
  const todayIndex = new Date().getDay();
  const daysMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const todayKey = daysMap[todayIndex];
  const defaultDay = week.find(d => d.key === todayKey) ? todayKey : 'seg';
  const [currentDay, setCurrentDay] = useState(defaultDay);

  useLayout('Minha semana', 'Organize seus compromissos e transforme tempo livre em progresso', user);

  useEffect(() => {
    Promise.all([axios.get('/api/me', auth()), axios.get('/api/planner/week', auth()).catch(() => ({ data: {} }))]).then(([me, planner]) => {
      setUser(me.data.user);
      if (planner.data.tasks?.length) setTasks(planner.data.tasks);
      if (planner.data.events?.length) setEvents(planner.data.events.filter(event => event.title !== 'Compromisso informado no chat'));
      if (planner.data.suggested_posts) setSuggestedPosts(planner.data.suggested_posts);
    }).catch(() => toast.error('Não foi possível carregar sua semana.'));
  }, []);

  const save = async (nextTasks = tasks, nextEvents = events) => {
    try { await axios.put('/api/planner/week', { tasks: nextTasks, events: nextEvents, availability: {} }, auth()); } catch { /* local mode while API is unavailable */ }
  };
  const toggleTask = (id) => { const next = tasks.map(task => task.id === id ? { ...task, done: !task.done } : task); setTasks(next); save(next); };
  const sendMessage = async (event) => {
    event.preventDefault();
    const text = message.trim(); if (!text || loading) return;
    const newMessages = [...messages, { role: 'user', text }];
    setMessage(''); setMessages(newMessages); setLoading(true);
    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.text }));
      const { data } = await axios.post('/api/planner/chat', { message: text, messages: apiMessages, state: { tasks, events, suggested_posts: suggestedPosts } }, auth());
      setMessages(current => [...current, { role: 'assistant', text: data.reply, suggestions: data.suggestions }]);
    } catch { setMessages(current => [...current, { role: 'assistant', text: 'Posso ajudar a organizar isso. Tente mencionar seus horários livres, compromissos ou tarefas da semana.' }]); }
    finally { setLoading(false); }
  };
  const acceptSuggestion = (suggestion) => {
    const action = suggestion.action || 'create';
    const matchByTitle = suggestion.match_by === 'title';
    const matchTitle = suggestion.match_title || suggestion.title;

    if (action === 'delete_all') {
      setEvents([]); setTasks([]); save([], []); toast.success('Agenda limpa com sucesso.');
      return;
    }

    if (action === 'delete') {
      if (suggestion.type === 'event' || suggestion.type === 'recurring_events') {
         let next;
         if (matchByTitle) {
           next = events.filter(e => e.title !== matchTitle);
         } else {
           next = events.filter(e => e.id !== suggestion.id && e.id !== String(suggestion.id));
           // Fallback: if ID match removed nothing, try matching by title
           if (next.length === events.length && matchTitle) {
             next = events.filter(e => e.title !== matchTitle);
           }
         }
         setEvents(next); save(tasks, next); toast.success('Removido da sua semana.');
      } else {
         let next;
         if (matchByTitle) {
           next = tasks.filter(t => t.title !== matchTitle);
         } else {
           next = tasks.filter(t => t.id !== suggestion.id && t.id !== String(suggestion.id));
           if (next.length === tasks.length && matchTitle) {
             next = tasks.filter(t => t.title !== matchTitle);
           }
         }
         setTasks(next); save(next, events); toast.success('Removido da sua semana.');
      }
      return;
    }

    if (action === 'update') {
      const updateFields = { ...suggestion };
      delete updateFields.action; delete updateFields.match_by; delete updateFields.match_title; delete updateFields.type;

      if (suggestion.type === 'event' || suggestion.type === 'recurring_events') {
         let next;
         if (matchByTitle) {
           next = events.map(e => e.title === matchTitle ? { ...e, ...updateFields } : e);
         } else {
           next = events.map(e => (e.id === suggestion.id || e.id === String(suggestion.id)) ? { ...e, ...updateFields } : e);
           // Fallback: if ID match updated nothing, try matching by title
           if (JSON.stringify(next) === JSON.stringify(events) && matchTitle) {
             next = events.map(e => e.title === matchTitle ? { ...e, ...updateFields } : e);
           }
         }
         setEvents(next); save(tasks, next); toast.success('Atualizado com sucesso.');
      } else {
         let next;
         if (matchByTitle) {
           next = tasks.map(t => t.title === matchTitle ? { ...t, ...updateFields } : t);
         } else {
           next = tasks.map(t => (t.id === suggestion.id || t.id === String(suggestion.id)) ? { ...t, ...updateFields } : t);
           if (JSON.stringify(next) === JSON.stringify(tasks) && matchTitle) {
             next = tasks.map(t => t.title === matchTitle ? { ...t, ...updateFields } : t);
           }
         }
         setTasks(next); save(next, events); toast.success('Atualizado com sucesso.');
      }
      return;
    }

    if (suggestion.type === 'recurring_events') {
      const additions = suggestion.events.map((item, index) => ({ id: Date.now() + index, title: suggestion.title, ...item }));
      // Remove existing events with the same title to prevent duplication
      const existingTitles = new Set(additions.map(a => a.title));
      const filtered = events.filter(e => !existingTitles.has(e.title));
      const next = [...filtered, ...additions];
      setEvents(next); save(tasks, next); toast.success('Rotina adicionada com sucesso.');
      return;
    }
    const day = suggestion.day || 'seg';
    const time = suggestion.time || '14:00';
    if (suggestion.type === 'event') {
      const next = [...events, { id: Date.now(), title: suggestion.title, day, time, duration: suggestion.duration || 60 }];
      setEvents(next); save(tasks, next); toast.success(`Compromisso adicionado à ${week.find(item => item.key === day)?.full || 'semana'} às ${time}.`);
      return;
    }
    const next = [...tasks, { id: Date.now(), title: suggestion.title, day, time, duration: suggestion.duration || 30, category: suggestion.category, done: false }];
    setTasks(next); save(next, events); toast.success('Sugestão adicionada à sua semana.');
  };
  const openAddEvent = () => { setEventForm({ title: '', day: 'seg', time: '10:00', duration: 60 }); setModal({ type: 'event' }); };
  const submitEvent = (evt) => {
    evt.preventDefault();
    if (!eventForm.title.trim()) return;
    const next = [...events, { id: Date.now(), title: eventForm.title.trim(), day: eventForm.day, time: eventForm.time, duration: eventForm.duration }];
    setEvents(next); save(tasks, next); setModal(null); toast.success('Compromisso adicionado.');
  };
  const openAddTask = () => setModal({ type: 'task', task: { title: '', day: 'seg', time: '14:00', duration: 30 } });
  const submitTask = (evt) => {
    evt.preventDefault();
    const form = modal?.task;
    if (!form?.title?.trim()) return;
    const next = [...tasks, { id: Date.now(), ...form, title: form.title.trim(), category: 'Geral', done: false }];
    setTasks(next); save(next, events); setModal(null); toast.success('Tarefa adicionada.');
  };
  const requestDelete = (kind, id, title, e) => {
    e.stopPropagation();
    setModal({ type: 'delete', kind, id, title });
  };
  const confirmDelete = () => {
    if (modal.kind === 'event') { const next = events.filter(item => item.id !== modal.id); setEvents(next); save(tasks, next); }
    else { const next = tasks.filter(item => item.id !== modal.id); setTasks(next); save(next, events); }
    setModal(null); toast.success('Registro removido.');
  };
  const completed = tasks.filter(task => task.done).length;
  const grouped = useMemo(() => week.map(day => ({ ...day, tasks: tasks.filter(task => task.day === day.key), events: events.filter(event => event.day === day.key) })), [tasks, events]);

  return <div className="weekly-page">
    <section className="weekly-hero"><div><span className="weekly-eyebrow">Planejamento inteligente</span><h2>Uma semana mais leve começa aqui.</h2><p>Fale com a Nova sobre sua rotina e encontre espaço para o que realmente importa.</p></div></section>
    <section className="weekly-stats"><article><span className="week-stat-icon blue">◷</span><div><strong>{tasks.length}</strong><small>Tarefas esta semana</small><p>{completed} concluídas</p></div></article><article><span className="week-stat-icon violet">✦</span><div><strong>{tasks.filter(task => !task.done).length}</strong><small>Próximas ações</small><p>organizadas pela Nova</p></div></article><article><span className="week-stat-icon green">✓</span><div><strong>{events.length}</strong><small>Compromissos</small><p>adicionados por você</p></div></article></section>
    <div className="weekly-layout">
      <section className="week-board">
        <header className="week-board-head">
          <div>
            <h3>Sua Agenda</h3>
            <p>Organize seu tempo em formato de linha do tempo clara.</p>
          </div>
          <div className="week-actions">
            <div className="view-toggle">
              <button className={`btn-toggle ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Semana</button>
              <button className={`btn-toggle ${viewMode === 'today' ? 'active' : ''}`} onClick={() => setViewMode('today')}>Hoje</button>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={openAddEvent}>＋ Adicionar compromisso</button>
            <button className="btn btn-secondary btn-sm" onClick={openAddTask}>＋ Adicionar tarefa</button>
          </div>
        </header>

        {viewMode === 'today' && (
          <div className="today-tabs">
            {week.map(d => (
              <button key={d.key} className={`today-tab ${currentDay === d.key ? 'active' : ''}`} onClick={() => setCurrentDay(d.key)}>
                {d.label}
              </button>
            ))}
          </div>
        )}

        <div className={`agenda-timeline-view mode-${viewMode}`}>
          {grouped.filter(d => viewMode === 'week' || d.key === currentDay).map(day => {
            const dayItems = processDayItems(day.events, day.tasks);
            
            return (
              <div className="timeline-column" key={day.key}>
                <div className="timeline-day-header">
                  <span>{day.label}</span>
                  <strong>{day.date}</strong>
                </div>
                <div className="timeline-items">
                  {dayItems.length === 0 ? (
                    <div className="timeline-empty">Sem atividades</div>
                  ) : (
                    dayItems.map(item => (
                      <div className={`timeline-card ${item.partType} ${item.done ? 'done' : ''}`} key={item.id} onClick={item.type === 'task' ? () => toggleTask(item.id) : undefined}>
                        <div className="timeline-time">
                          <strong>{item.time}</strong>
                          {item.end_time && <small>{item.end_time}</small>}
                        </div>
                        <div className="timeline-content">
                          {item.type === 'task' && <i className="task-check">{item.done ? '✓' : '○'}</i>}
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.duration && !item.end_time ? `${item.duration}m` : ''}</small>
                          </div>
                        </div>
                        <button className="remove-item" onClick={(e) => requestDelete(item.partType === 'task' ? 'task' : 'event', item.originalId || item.id, item.title, e)} title="Remover">×</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <aside className="planner-chat">
        <header><span className="nova-avatar">✦</span><div><h3>Converse com a Nova</h3><p>Sua assistente de rotina</p></div><span className="online-dot" /></header>
        <div className="chat-messages">
          {messages.map((item, index) => (
            <div className={`chat-message ${item.role}`} key={index}>
              {item.role === 'assistant' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{item.text}</ReactMarkdown>
                </div>
              ) : (
                <p>{item.text}</p>
              )}
              {item.suggestions?.map((suggestion, suggestionIndex) => {
                const action = suggestion.action || 'create';
                let btnText = 'Adicionar';
                let btnClass = 'btn-add';
                let actionLabel = 'Novo';
                if (action === 'delete') { btnText = 'Remover'; btnClass = 'btn-delete'; actionLabel = 'Excluir'; }
                if (action === 'delete_all') { btnText = 'Limpar tudo'; btnClass = 'btn-delete'; actionLabel = 'Limpar'; }
                if (action === 'update') { btnText = 'Atualizar'; btnClass = 'btn-update'; actionLabel = 'Alterar'; }

                return (
                  <div className={`chat-suggestion ${action}`} key={suggestionIndex}>
                    <div><small>{actionLabel} · {suggestion.category || suggestion.type}{suggestion.match_by === 'title' ? ' · Todos os dias' : ''}</small><strong>{suggestion.title}</strong></div>
                    <button className={btnClass} onClick={() => acceptSuggestion(suggestion)}>{btnText}</button>
                  </div>
                );
              })}
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant typing-indicator">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
          )}
        </div>
        <form className="chat-composer" onSubmit={sendMessage}>
          <textarea 
            value={message} 
            onChange={event => setMessage(event.target.value)} 
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage(event);
              }
            }}
            placeholder="Ex: terça tenho reunião às 10h e à tarde estou livre..." 
            rows="2" 
          />
          <button type="submit" disabled={!message.trim() || loading} aria-label="Enviar">↑</button>
        </form>
        <small className="chat-hint">A Nova pode sugerir horários, tarefas e blocos de foco.</small>
      </aside>
    </div>
    {modal?.type === 'event' && <div className="planner-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModal(null); }}><form className="planner-modal" onSubmit={submitEvent}><div className="planner-modal-icon">◆</div><h3>Adicionar compromisso</h3><p>Inclua um compromisso na sua semana.</p><label>Nome do compromisso<input autoFocus value={eventForm.title} onChange={event => setEventForm({ ...eventForm, title: event.target.value })} placeholder="Ex.: Reunião com cliente" /></label><div className="planner-modal-row"><label>Dia<select value={eventForm.day} onChange={event => setEventForm({ ...eventForm, day: event.target.value })}>{week.map(day => <option key={day.key} value={day.key}>{day.full}</option>)}</select></label><label>Horário<input type="time" value={eventForm.time} onChange={event => setEventForm({ ...eventForm, time: event.target.value })} /></label></div><div className="planner-modal-row"><label>Duração (minutos)<input type="number" min="15" step="15" value={eventForm.duration} onChange={event => setEventForm({ ...eventForm, duration: Number(event.target.value) })} /></label></div><div className="planner-modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" type="submit">Adicionar</button></div></form></div>}
    {modal?.type === 'task' && <div className="planner-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModal(null); }}><form className="planner-modal" onSubmit={submitTask}><div className="planner-modal-icon task">✓</div><h3>Adicionar tarefa</h3><p>Organize uma nova ação na sua semana.</p><label>Nome da tarefa<input autoFocus value={modal.task.title} onChange={event => setModal({ ...modal, task: { ...modal.task, title: event.target.value } })} placeholder="Ex.: Revisar roteiro do vídeo" /></label><div className="planner-modal-row"><label>Dia<select value={modal.task.day} onChange={event => setModal({ ...modal, task: { ...modal.task, day: event.target.value } })}>{week.map(day => <option key={day.key} value={day.key}>{day.full}</option>)}</select></label><label>Horário<input type="time" value={modal.task.time} onChange={event => setModal({ ...modal, task: { ...modal.task, time: event.target.value } })} /></label></div><div className="planner-modal-row"><label>Duração (minutos)<input type="number" min="15" step="15" value={modal.task.duration} onChange={event => setModal({ ...modal, task: { ...modal.task, duration: Number(event.target.value) } })} /></label></div><div className="planner-modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" type="submit">Adicionar</button></div></form></div>}
    {modal?.type === 'delete' && <div className="planner-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModal(null); }}><div className="planner-modal delete-modal"><div className="planner-modal-icon danger">×</div><h3>Remover registro?</h3><p>“{modal.title}” será removido da sua semana. Essa ação não pode ser desfeita.</p><div className="planner-modal-actions"><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-danger" onClick={confirmDelete}>Remover</button></div></div></div>}
  </div>;
}
export default WeeklyPlanner;
