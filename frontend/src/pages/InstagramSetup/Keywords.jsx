import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../../components/AppLayout/AppLayout';
import './Keywords.css';

const Keywords = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Keywords state
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState([]);
  
  // Form state
  const [form, setForm] = useState({
    action: 'both',
    reply_message: '',
    dm_message: '',
    dm_has_buttons: false,
    dm_button1_text: '',
    dm_button1_url: '',
    dm_button2_text: '',
    dm_button2_url: '',
    active: true,
    post_id: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  
  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dialogRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  // Overwrite modal state
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [overwriteConflicts, setOverwriteConflicts] = useState([]);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Filtros
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterPost, setFilterPost] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Smart Agent IA state
  const [allowAI, setAllowAI] = useState(false);
  const [business, setBusiness] = useState({
    ramo: '',
    horario: '',
    contato: '',
    extras: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return navigate('/login', { replace: true });
        
        const { data } = await axios.get('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!data?.user) throw new Error('no user');
        
        const statusRes = await axios.get(`/api/ig/instagram/status?user_id=${data.user.id}`);
        if (!statusRes.data.configured) {
          toast.info('Configure o Instagram primeiro.');
          return navigate('/instagram/setup', { replace: true });
        }
        
        setUser(data.user);
        
        setLoadingItems(true);
        const res = await axios.get(`/api/ig/instagram/keywords?user_id=${data.user.id}`);
        setItems(res.data.items || []);
        setLoadingItems(false);
        
        setLoadingPosts(true);
        try {
          const pRes = await axios.get(`/api/ig/instagram/posts?user_id=${data.user.id}`);
          setPosts(pRes.data.items || []);
        } catch {
          setPosts([]);
        } finally {
          setLoadingPosts(false);
        }

        setAllowAI(!!statusRes.data.allow_ai_direct);
        const ctx = statusRes.data.ai_business_context || '';
        if (ctx) {
          const parts = ctx.split('\n');
          setBusiness({
            ramo: parts.find(l => l.startsWith('Ramo:'))?.replace('Ramo:', '').trim() || '',
            horario: parts.find(l => l.startsWith('Horário:'))?.replace('Horário:', '').trim() || '',
            contato: parts.find(l => l.startsWith('Contato:'))?.replace('Contato:', '').trim() || '',
            extras: parts.filter(l => l.startsWith('Extras:')).map(l => l.replace('Extras:', '').trim()).join('\n') || ''
          });
        }
      } catch {
        navigate('/login', { replace: true });
      }
    };
    load();
  }, [navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    toast.success('Logout realizado com sucesso!');
    navigate('/login', { replace: true });
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onKeywordInputChange = (e) => {
    setKeywordInput(e.target.value);
  };

  const onKeywordInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const addKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (!trimmed) return;
    
    if (keywords.includes(trimmed)) {
      toast.warn('Esta palavra-chave já foi adicionada.');
      return;
    }
    
    setKeywords([...keywords, trimmed]);
    setKeywordInput('');
  };

  const removeKeyword = (kw) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const reset = () => {
    setForm({
      action: 'both',
      reply_message: '',
      dm_message: '',
      dm_has_buttons: false,
      dm_button1_text: '',
      dm_button1_url: '',
      dm_button2_text: '',
      dm_button2_url: '',
      active: true,
      post_id: ''
    });
    setKeywords([]);
    setKeywordInput('');
    setEditing(null);
  };

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        rule_id: editing || undefined,
        keywords,
        action: form.action,
        reply_message: form.reply_message.trim(),
        dm_message: form.dm_message.trim(),
        dm_has_buttons: form.dm_has_buttons,
        dm_button1_text: form.dm_button1_text.trim(),
        dm_button1_url: form.dm_button1_url.trim(),
        dm_button2_text: form.dm_button2_text.trim(),
        dm_button2_url: form.dm_button2_url.trim(),
        active: form.active,
        post_id: form.post_id || null,
        overwrite_conflicts: overwriteConflicts.length > 0 ? overwriteConflicts : undefined
      };
      await axios.post('/api/ig/instagram/keywords', payload);
      toast.success(`Regra ${editing ? 'atualizada' : 'criada'}!`);
      const res = await axios.get(`/api/ig/instagram/keywords?user_id=${user.id}`);
      setItems(res.data.items || []);
      reset();
      setActiveTab('list');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Falha ao salvar regra.');
    } finally {
      setSubmitting(false);
      setShowOverwriteModal(false);
      setOverwriteConflicts([]);
      setPendingSubmit(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return toast.warn('Usuário inválido.');
    if (keywords.length === 0) return toast.warn('Adicione pelo menos uma palavra-chave.');
    
    // Validations
    if (form.action === 'reply' && !form.reply_message.trim()) {
      return toast.warn('Mensagem de resposta é obrigatória para ação "Comentário".');
    }
    
    if ((form.action === 'dm' || form.action === 'both') && !form.dm_message.trim()) {
      return toast.warn('Mensagem de DM é obrigatória para ação "DM".');
    }
    
    if (form.dm_has_buttons) {
      if (!form.dm_button1_text || !form.dm_button1_url) {
        return toast.warn('Preencha texto e URL do primeiro botão.');
      }
      if (!form.dm_button1_url.startsWith('http')) {
        return toast.warn('URL do botão 1 deve começar com http:// ou https://');
      }
      if (form.dm_button2_text && !form.dm_button2_url) {
        return toast.warn('Preencha a URL do segundo botão.');
      }
      if (form.dm_button2_url && !form.dm_button2_url.startsWith('http')) {
        return toast.warn('URL do botão 2 deve começar com http:// ou https://');
      }
    }

    // Conflitos somente ao criar nova regra
    if (!editing) {
      const scope = (form.post_id || '');
      const conflicts = keywords.filter(kw =>
        items.some(it =>
          (it.post_id || '') === scope &&
          it.keywords?.includes(kw)
        )
      );
      if (conflicts.length > 0) {
        setOverwriteConflicts(conflicts);
        setShowOverwriteModal(true);
        setPendingSubmit(true);
        return;
      }
    }

    // Sem conflitos ou em edição: prossegue
    doSubmit();
  };

  const confirmOverwrite = () => {
    if (!pendingSubmit) return;
    doSubmit();  // agora cria única regra multi-keywords
  };

  const cancelOverwrite = () => {
    setShowOverwriteModal(false);
    setOverwriteConflicts([]);
    setPendingSubmit(false);
  };

  const editItem = (item) => {
    setForm({
      action: item.action,
      reply_message: item.reply_message || '',
      dm_message: item.dm_message || '',
      dm_has_buttons: item.dm_has_buttons || false,
      dm_button1_text: item.dm_button1_text || '',
      dm_button1_url: item.dm_button1_url || '',
      dm_button2_text: item.dm_button2_text || '',
      dm_button2_url: item.dm_button2_url || '',
      active: item.active,
      post_id: item.post_id || ''
    });
    setKeywords(item.keywords && item.keywords.length ? item.keywords : (item.keyword ? [item.keyword] : []));
    setEditing(item.id);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDeleteModal = (id) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !user?.id) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/ig/instagram/keywords/${deleteTarget}?user_id=${user.id}`);
      toast.success('Regra excluída!');
      const res = await axios.get(`/api/ig/instagram/keywords?user_id=${user.id}`);
      setItems(res.data.items || []);
    } catch {
      toast.error('Falha ao excluir regra.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(it => {
      const kwFilter = filterKeyword.trim().toLowerCase();
      if (kwFilter) {
        const hits = (it.keywords && it.keywords.length ? it.keywords : [it.keyword]).some(k => k.includes(kwFilter));
        if (!hits) return false;
      }
      if (filterPost === 'global' && it.post_id) return false;
      if (filterPost !== 'all' && filterPost !== 'global' && it.post_id !== filterPost) return false;
      if (filterStatus === 'active' && !it.active) return false;
      if (filterStatus === 'inactive' && it.active) return false;
      return true;
    });
  }, [items, filterKeyword, filterPost, filterStatus]);

  // Reset filtros ao trocar para criação (opcional)
  useEffect(() => {
    if (activeTab === 'create') {
      setFilterKeyword('');
    }
  }, [activeTab]);

  useEffect(() => {
    if (showDeleteModal) {
      firstFocusableRef.current?.focus();
    }
  }, [showDeleteModal]);

  const handleDeleteModalKeyDown = (e) => {
    if (!showDeleteModal) return;
    if (e.key === 'Escape') {
      cancelDelete();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = dialogRef.current.querySelectorAll('button:not([disabled])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  };

  const onBizChange = (e) => {
    const { name, value } = e.target;
    setBusiness(b => ({ ...b, [name]: value }));
  };

  const toggleAllowAI = () => setAllowAI(v => !v);

  const saveAIContext = async (e) => {
    e.preventDefault();
    if (!user?.id) return toast.warn('Usuário inválido.');
    const ctx = `Ramo: ${business.ramo}\nHorário: ${business.horario}\nContato: ${business.contato}\nExtras: ${business.extras}`.trim();
    try {
      const { data } = await axios.post('/api/ig/instagram/ai', {
        user_id: user.id,
        allow_ai_direct: allowAI,
        ai_business_context: ctx
      });
      setAllowAI(!!data.allow_ai_direct);
      toast.success('Configuração de IA salva.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Falha ao salvar contexto de IA.');
    }
  };

  if (!user) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <AppLayout title="Automações" subtitle="Gerencie suas regras de automação" user={user}>

        <div className="page-description">
          <p>Crie e gerencie regras para responder automaticamente a comentários e mensagens diretas com base em palavras-chave.</p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            {editing ? 'Editar Regra' : 'Nova Regra'}
          </button>
          <button
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Minhas Regras
            {items.length > 0 && <span className="tab-badge">{items.length}</span>}
          </button>
          <button
            className={`tab ${activeTab === 'agent' ? 'active' : ''}`}
            onClick={() => setActiveTab('agent')}
          >
            Smart Agent IA
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'create' && (
            <div className="tab-panel" key="create">
              <form className="keywords-form" onSubmit={onSubmit}>
                {/* Keywords Input Section */}
                <div className="form-section">
                  <div className="section-header">
                    <h3 className="section-title">1. Palavras-chave</h3>
                    <p className="section-description">
                      Adicione uma ou mais palavras-chave. A regra será acionada se qualquer uma delas for encontrada no comentário.
                    </p>
                  </div>
                  
                  <div className="keyword-input-group">
                    <input
                      id="keywordInput"
                      type="text"
                      className="keyword-input"
                      placeholder="Digite e pressione Enter..."
                      value={keywordInput}
                      onChange={onKeywordInputChange}
                      onKeyDown={onKeywordInputKeyDown}
                      disabled={false}  /* liberado para edição */
                    />
                    <button
                      type="button"
                      className="keyword-add-btn"
                      onClick={addKeyword}
                      disabled={!keywordInput.trim()}
                    >
                      Adicionar
                    </button>
                  </div>
                  
                  {keywords.length > 0 ? (
                    <div className="keywords-list">
                      {keywords.map((kw) => (
                        <div key={kw} className="keyword-chip">
                          <span>{kw}</span>
                          <button
                            type="button"
                            className="chip-remove"
                            onClick={() => removeKeyword(kw)}
                            disabled={false}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-keywords">
                      <p>Adicione palavras-chave para começar.</p>
                    </div>
                  )}
                </div>

                {/* Action Configuration */}
                <div className="form-section">
                  <div className="section-header">
                    <h3 className="section-title">2. Configuração da Ação</h3>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="action" className="field-label">Tipo de ação</label>
                      <select
                        id="action"
                        name="action"
                        className="field-input"
                        value={form.action}
                        onChange={onChange}
                      >
                        <option value="reply">💬 Apenas responder comentário</option>
                        <option value="dm">📨 Apenas enviar DM</option>
                        <option value="both">🚀 Comentário + DM</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="post_id" className="field-label">
                        Post específico (opcional)
                      </label>
                      <select
                        id="post_id"
                        name="post_id"
                        className="field-input"
                        value={form.post_id}
                        onChange={onChange}
                        disabled={loadingPosts}
                      >
                        <option value="">🌐 Global (todos os posts)</option>
                        {posts.map(p => (
                          <option key={p.id} value={p.id}>
                            📷 {(p.caption || 'Sem legenda').slice(0, 50)}...
                          </option>
                        ))}
                      </select>
                      <span className="field-hint">
                        Deixe como "Global" para aplicar em todos os posts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Section */}
                <div className="form-section">
                  <div className="section-header">
                    <h3 className="section-title">3. Conteúdo das Mensagens</h3>
                    <p className="section-description">
                      Defina o texto para as respostas automáticas. Os campos aparecerão com base na ação selecionada.
                    </p>
                  </div>

                  <div className="form-grid">
                    {/* Reply Message */}
                    {(form.action === 'reply' || form.action === 'both') && (
                      <div className="form-field">
                        <label htmlFor="reply_message" className="field-label">💬 Resposta no Comentário</label>
                        <textarea
                          id="reply_message"
                          name="reply_message"
                          className="field-textarea"
                          rows="5"
                          placeholder="Ex: Obrigado pelo interesse! Enviamos mais detalhes no seu direct 😊"
                          value={form.reply_message}
                          onChange={onChange}
                        />
                        <span className="field-hint">Esta mensagem é pública.</span>
                      </div>
                    )}

                    {/* DM Message */}
                    {(form.action === 'dm' || form.action === 'both') && (
                      <div className="form-field">
                        <label htmlFor="dm_message" className="field-label">📨 Mensagem Direta (DM)</label>
                        <textarea
                          id="dm_message"
                          name="dm_message"
                          className="field-textarea"
                          rows="5"
                          placeholder="Ex: Olá! 👋 Vimos seu interesse e aqui está um cupom de 10% para você!"
                          value={form.dm_message}
                          onChange={onChange}
                          maxLength={form.dm_has_buttons ? 80 : 1000}
                        />
                        <span className="field-hint">
                          {form.dm_has_buttons
                            ? `Máximo 80 caracteres (${form.dm_message.length}/80)`
                            : `Máximo 1000 caracteres (${form.dm_message.length}/1000)`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* DM Buttons Configuration */}
                {(form.action === 'dm' || form.action === 'both') && (
                    <div className="form-section">
                      <div className="toggle-field">
                        <input
                          type="checkbox"
                          id="dm_has_buttons"
                          name="dm_has_buttons"
                          className="toggle-input"
                          checked={form.dm_has_buttons}
                          onChange={onChange}
                        />
                        <label htmlFor="dm_has_buttons" className="toggle-label">
                          <span className="toggle-switch"></span>
                          <span className="toggle-text">
                            <span className="toggle-title">Adicionar botões na Mensagem Direta</span>
                            <span className="toggle-description">Inclua até 2 botões com links externos.</span>
                          </span>
                        </label>
                      </div>
                      {form.dm_has_buttons && (
                        <div className="buttons-config">
                          {/* Button 1 */}
                          <div className="button-group">
                            <div className="button-group-header">
                              <span className="button-number">1</span>
                              <h4 className="button-label">Botão Principal</h4>
                              <small>Obrigatório</small>
                            </div>
                            <div className="form-grid">
                              <div className="form-field">
                                <label className="field-label">Texto do botão</label>
                                <input
                                  type="text"
                                  name="dm_button1_text"
                                  className="field-input"
                                  placeholder="Ex: Quero o desconto! 🔥"
                                  maxLength={20}
                                  value={form.dm_button1_text}
                                  onChange={onChange}
                                />
                                <span className="field-hint">Máximo 20 caracteres</span>
                              </div>
                              <div className="form-field">
                                <label className="field-label">URL de destino</label>
                                <input
                                  type="url"
                                  name="dm_button1_url"
                                  className="field-input"
                                  placeholder="https://exemplo.com/oferta"
                                  value={form.dm_button1_url}
                                  onChange={onChange}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Button 2 */}
                          <div className="button-group">
                            <div className="button-group-header">
                              <span className="button-number">2</span>
                              <h4 className="button-label">Botão Secundário</h4>
                              <small>Opcional</small>
                            </div>
                            <div className="form-grid">
                              <div className="form-field">
                                <label className="field-label">Texto do botão</label>
                                <input
                                  type="text"
                                  name="dm_button2_text"
                                  className="field-input"
                                  placeholder="Ex: Falar com atendente"
                                  maxLength={20}
                                  value={form.dm_button2_text}
                                  onChange={onChange}
                                />
                              </div>
                              <div className="form-field">
                                <label className="field-label">URL de destino</label>
                                <input
                                  type="url"
                                  name="dm_button2_url"
                                  className="field-input"
                                  placeholder="https://exemplo.com/contato"
                                  value={form.dm_button2_url}
                                  onChange={onChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                )}

                {/* Active Toggle */}
                <div className="form-section">
                  <div className="toggle-field">
                    <input
                      type="checkbox"
                      id="active"
                      name="active"
                      className="toggle-input"
                      checked={form.active}
                      onChange={onChange}
                    />
                    <label htmlFor="active" className="toggle-label">
                      <span className="toggle-switch"></span>
                      <span className="toggle-text">
                        <span className="toggle-title">Ativar esta regra</span>
                        <span className="toggle-description">Se desativada, a automação não será executada.</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                  {editing && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={reset}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || keywords.length === 0}
                  >
                    {submitting ? (
                      <>
                        <span className="btn-spinner"></span>
                        Salvando...
                      </>
                    ) : (
                      <>
                        {editing ? 'Atualizar regra' : 'Criar regra'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="tab-panel" key="list">
              {loadingItems ? (
                <div className="loading-skeleton">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-card"></div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="empty-state">
                  <h3 className="empty-title">Nenhuma regra configurada</h3>
                  <p className="empty-description">
                    Crie sua primeira regra para começar a automatizar suas respostas
                  </p>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setActiveTab('create')}
                  >
                    Criar primeira regra
                  </button>
                </div>
              ) : (
                <>
                  <div className="rules-filters">
                    <div className="rules-filters-group">
                      <label className="rules-filters-label" htmlFor="filterKeyword">Palavra-chave</label>
                      <input
                        id="filterKeyword"
                        type="text"
                        className="rules-filters-input"
                        placeholder="Buscar..."
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                      />
                    </div>
                    <div className="rules-filters-group">
                      <label className="rules-filters-label" htmlFor="filterPost">Post</label>
                      <select
                        id="filterPost"
                        className="rules-filters-select"
                        value={filterPost}
                        onChange={(e) => setFilterPost(e.target.value)}
                      >
                        <option value="all">Todos</option>
                        <option value="global">Global</option>
                        {posts.map(p => (
                          <option key={p.id} value={p.id}>
                            {(p.caption || 'Sem legenda').slice(0, 40)}...
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="rules-filters-group">
                      <label className="rules-filters-label" htmlFor="filterStatus">Status</label>
                      <select
                        id="filterStatus"
                        className="rules-filters-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">Todos</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                      </select>
                    </div>
                  </div>

                  <div className="rules-grid">
                    {filteredItems.length === 0 && (
                      <div className="no-results">
                        Nenhuma regra encontrada com os filtros atuais.
                      </div>
                    )}
                    {filteredItems.map((item) => (
                      <div key={item.id} className={`rule-card ${!item.active ? 'inactive' : ''}`}>
                        <div className="rule-header">
                          <div className="rule-keywords-wrap">
                            {(item.keywords && item.keywords.length ? item.keywords : [item.keyword]).map(k => (
                              <span key={k} className="rule-keyword">{k}</span>
                            ))}
                          </div>
                          <div className="rule-actions">
                            <button
                              className="rule-action-btn edit"
                              onClick={() => editItem(item)}
                              title="Editar"
                            >✏️</button>
                            <button
                              className="rule-action-btn delete"
                              onClick={() => openDeleteModal(item.id)}
                              title="Excluir"
                            >🗑️</button>
                          </div>
                        </div>

                        <div className="rule-body">
                          <div className="rule-meta">
                            <div className="rule-badge">
                              <span className="badge-label">Ação</span>
                              <span className="badge-value">
                                {item.action === 'both' ? 'Comentário + DM' : item.action === 'reply' ? 'Comentário' : 'DM'}
                              </span>
                            </div>
                            <div className="rule-badge">
                              <span className="badge-label">Botões na DM</span>
                              <span className="badge-value">{item.dm_has_buttons ? 'Sim' : 'Não'}</span>
                            </div>
                            <div className="rule-badge">
                              <span className="badge-label">Status</span>
                              <span className={`badge-value ${!item.active ? 'inactive' : ''}`}>
                                {item.active ? 'Ativa' : 'Inativa'}
                              </span>
                            </div>
                          </div>

                          {item.reply_message && (
                            <div className="rule-message">
                              <div className="message-label">💬 Resposta:</div>
                              <div className="message-content">{item.reply_message}</div>
                            </div>
                          )}

                          {item.dm_message && (
                            <div className="rule-message">
                              <div className="message-label">📨 DM:</div>
                              <div className="message-content">{item.dm_message}</div>
                            </div>
                          )}

                          {item.dm_has_buttons && (item.dm_button1_text || item.dm_button2_text) && (
                            <div className="rule-buttons">
                              <div className="buttons-label">🔘 Botões:</div>
                              {item.dm_button1_text && (
                                <div className="button-preview">
                                  <span className="button-text">{item.dm_button1_text}</span>
                                  <span className="button-url">{item.dm_button1_url}</span>
                                </div>
                              )}
                              {item.dm_button2_text && (
                                <div className="button-preview">
                                  <span className="button-text">{item.dm_button2_text}</span>
                                  <span className="button-url">{item.dm_button2_url}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="rule-scope">
                            <strong>Escopo:</strong>
                            <span>
                              {item.post_id
                                ? `Post Específico (${(posts.find(p => p.id === item.post_id)?.caption || 'ID: ' + item.post_id).slice(0, 40)}...)`
                                : 'Global (Todos os Posts)'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="tab-panel" key="agent">
              <form className="ai-agent-form" onSubmit={saveAIContext}>
                <div className="ai-header">
                  <h2 className="ai-title">🤖 Smart Agent IA (Direct)</h2>
                  <p className="ai-subtitle">
                    Forneça informações do seu negócio para melhorar respostas automáticas no Direct. Ative para responder novas conversas quando não houver DM pendente.
                  </p>
                </div>
                <div className="ai-toggle-row">
                  <input
                    id="allowAI"
                    type="checkbox"
                    checked={allowAI}
                    onChange={toggleAllowAI}
                  />
                  <label htmlFor="allowAI">Permitir agente IA no Direct</label>
                </div>
                <div className="ai-grid">
                  <div className="ai-field">
                    <label className="ai-label">Ramo de atuação</label>
                    <input
                      type="text"
                      name="ramo"
                      className="ai-input"
                      placeholder="Ex: Cosméticos naturais"
                      value={business.ramo}
                      onChange={onBizChange}
                    />
                  </div>
                  <div className="ai-field">
                    <label className="ai-label">Horário de funcionamento</label>
                    <input
                      type="text"
                      name="horario"
                      className="ai-input"
                      placeholder="Ex: Seg a Sex 09h-18h"
                      value={business.horario}
                      onChange={onBizChange}
                    />
                  </div>
                  <div className="ai-field">
                    <label className="ai-label">Contato principal</label>
                    <input
                      type="text"
                      name="contato"
                      className="ai-input"
                      placeholder="Ex: (11) 99999-0000 / contato@empresa.com"
                      value={business.contato}
                      onChange={onBizChange}
                    />
                  </div>
                  <div className="ai-field ai-full">
                    <label className="ai-label">Extras / Observações</label>
                    <textarea
                      name="extras"
                      className="ai-textarea"
                      rows={4}
                      placeholder="Política de trocas, canais adicionais, promoções atuais..."
                      value={business.extras}
                      onChange={onBizChange}
                    />
                  </div>
                </div>
                <div className="ai-actions">
                  <button type="submit" className="btn btn-primary">
                    Salvar Configuração IA
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      {/* Delete Confirmation Modal (NOVO REFEITO) */}
      {showDeleteModal && (
        <div
          className="delete-modal-overlay"
          role="presentation"
          onMouseDown={cancelDelete}
          onKeyDown={handleDeleteModalKeyDown}
        >
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteModalTitle"
            aria-describedby="deleteModalDesc"
            onMouseDown={(e) => e.stopPropagation()}
            ref={dialogRef}
          >
            <header className="delete-modal-header">
              <h3 id="deleteModalTitle" className="delete-modal-title">Excluir regra</h3>
              <button
                type="button"
                className="delete-modal-close"
                aria-label="Fechar"
                onClick={cancelDelete}
                disabled={deleting}
                ref={firstFocusableRef}
              >
                ×
              </button>
            </header>
            <div className="delete-modal-body">
              <p id="deleteModalDesc" className="delete-modal-text">
                Tem certeza que deseja remover esta regra de automação?
              </p>
              <p className="delete-modal-note">
                Esta ação é permanente e não pode ser desfeita.
              </p>
            </div>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn btn-secondary delete-modal-btn"
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger delete-modal-btn"
                onClick={confirmDelete}
                disabled={deleting}
                ref={lastFocusableRef}
              >
                {deleting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Excluindo...
                  </>
                ) : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverwriteModal && (
        <div className="overwrite-modal-overlay" role="presentation" onMouseDown={cancelOverwrite}>
          <div
            className="overwrite-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="overwriteModalTitle"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="overwrite-modal-header">
              <h3 id="overwriteModalTitle" className="overwrite-modal-title">Substituir regra existente?</h3>
              <button
                type="button"
                className="overwrite-modal-close"
                aria-label="Fechar"
                onClick={cancelOverwrite}
                disabled={submitting}
              >×</button>
            </header>
            <div className="overwrite-modal-body">
              <p>
                A(s) palavra(s)-chave abaixo já possui(em) regra para este mesmo escopo
                {form.post_id ? ' (post selecionado)' : ' (global)'} e será(ão) substituída(s):
              </p>
              <ul className="overwrite-conflicts-list">
                {overwriteConflicts.map(c => <li key={c}><code>{c}</code></li>)}
              </ul>
              <p className="overwrite-note">
                Prosseguir irá atualizar a ação, mensagens e botões associados. Deseja continuar?
              </p>
            </div>
            <div className="overwrite-modal-actions">
              <button
                type="button"
                className="btn btn-secondary overwrite-btn"
                onClick={cancelOverwrite}
                disabled={submitting}
              >Cancelar</button>
              <button
                type="button"
                className="btn btn-danger overwrite-btn"
                onClick={confirmOverwrite}
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Substituir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Keywords;
