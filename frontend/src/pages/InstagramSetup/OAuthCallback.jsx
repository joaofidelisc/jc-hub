import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AppLayout from '../../components/AppLayout/AppLayout';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [errorMSG, setErrorMSG] = useState('');
  
  // Use ref to avoid double-processing in React StrictMode
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;

    const processOAuth = async () => {
      processed.current = true;
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state'); // should be user_id
        
        if (!code) {
          setErrorMSG('Nenhum código de autorização encontrado na URL.');
          setLoading(false);
          return;
        }

        // Get stored user token to auth backend request
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login', { replace: true });
          return;
        }

        // The exact redirect URI used in the initial request
        const redirectUri = `${window.location.protocol}//${window.location.host}/instagram/oauth/callback`;

        // Send code to backend
        await axios.post('/api/ig/oauth/callback', {
          code: code,
          user_id: state, // which we passed as state parameter
          redirect_uri: redirectUri
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success('Instagram conectado com sucesso!');
        // Redirect to step 3 (automation config) or dashboard
        navigate('/instagram/setup?step=3');

      } catch (err) {
        console.error("OAuth Error:", err);
        setErrorMSG(err?.response?.data?.message || 'Erro ao conectar com o Facebook.');
        toast.error('Ocorreu um erro na conexão.');
        setLoading(false);
      }
    };

    processOAuth();
  }, [location, navigate]);

  return (
    <AppLayout title="Conectando..." subtitle="Finalizando integração com o Meta" user={null}>
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        {loading ? (
          <>
            <div className="loading-spinner" style={{ width: '48px', height: '48px', margin: '0 auto 2rem' }}></div>
            <h2 style={{ color: '#0f172a' }}>Autenticando com o Meta...</h2>
            <p style={{ color: '#475569' }}>Por favor, aguarde enquanto validamos seus tokens e vinculamos seu Instagram.</p>
          </>
        ) : (
          <>
            <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 style={{ color: '#0f172a' }}>Falha na Conexão</h2>
            <p style={{ color: '#475569', maxWidth: '500px', margin: '0 auto 2rem' }}>{errorMSG}</p>
            <button className="btn btn-primary" onClick={() => navigate('/instagram/setup')}>
              Voltar e tentar novamente
            </button>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default OAuthCallback;
