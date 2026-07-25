import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './UserDropdown.css';

const UserDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    toast.success('Logout realizado com sucesso!');
    navigate('/login', { replace: true });
  };

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button className="user-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="user-avatar">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="user-details">
          <span className="user-name">{user?.name || 'Usuário'}</span>
        </div>
        <svg className={`dropdown-arrow ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="dropdown-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="dropdown-info">
              <div className="dropdown-name">{user?.name || 'Usuário'}</div>
              <div className="dropdown-email">{user?.email || 'email@exemplo.com'}</div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <Link to="/profile" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Meu Perfil
          </Link>

          <Link to="/instagram/setup" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Configurações
          </Link>

          <div className="dropdown-divider"></div>

          <button className="dropdown-item danger" onClick={handleLogout}>
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sair
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
