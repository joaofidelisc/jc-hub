import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Erro não tratado na interface:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fatal-error-page">
        <div className="fatal-error-card">
          <span>!</span>
          <h1>Esta tela encontrou um problema</h1>
          <p>Seu trabalho salvo continua seguro. Recarregue a página para tentar novamente.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Recarregar página</button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
