import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const navigate = useNavigate();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await axios.post('/api/login', { email, password });
      toast.success('Login successful');
      const { data } = await axios.post('/api/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      navigate('/');
    } catch (error) {
      const msg = error?.response?.data?.error || 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div className="card p-4">
      <div className="card-body">
        <a href="#" className="brand-logo">JC Hub</a>
        <h5 className="card-title text-center mb-4">Welcome Back!</h5>
        <form onSubmit={handleLogin} noValidate>
          <div className="form-floating mb-3">
            <input
              id="loginEmail"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <label htmlFor="loginEmail">Email address</label>
          </div>

          <div className="form-floating mb-3">
            <input
              id="loginPassword"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" // Placeholder is used by form-floating
              required
            />
            <label htmlFor="loginPassword">Password</label>
          </div>

          <div className="d-grid mb-3">
            <button type="submit" className="btn btn-primary btn-lg">Login</button>
          </div>
          <p className="text-center small">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
