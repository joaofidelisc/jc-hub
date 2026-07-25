import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await axios.post('/api/register', { name, email, password });
      toast.success('Registration successful');
      navigate('/login');
    } catch (error) {
      const msg = error?.response?.data?.error || 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <div className="card p-4">
      <div className="card-body">
        <a href="#" className="brand-logo">JC Hub</a>
        <h5 className="card-title text-center mb-4">Create Your Account</h5>
        <form onSubmit={handleRegister} noValidate>
          <div className="form-floating mb-3">
            <input
              id="regName"
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              required
            />
            <label htmlFor="regName">Full Name</label>
          </div>

          <div className="form-floating mb-3">
            <input
              id="regEmail"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <label htmlFor="regEmail">Email address</label>
          </div>

          <div className="form-floating mb-3">
            <input
              id="regPassword"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <label htmlFor="regPassword">Password</label>
          </div>

          <div className="form-floating mb-3">
            <input
              id="regConfirm"
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
            />
            <label htmlFor="regConfirm">Confirm Password</label>
          </div>

          <div className="d-grid mb-3">
            <button type="submit" className="btn btn-success btn-lg">Register</button>
          </div>
          <p className="text-center small">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;