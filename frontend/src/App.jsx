import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home/Home';
import Profile from './pages/Profile/Profile';
import Business from './pages/Business/Business';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse/TermsOfUse';
import { LayoutProvider } from './components/AppLayout/LayoutContext';
import AuthenticatedLayout from './components/AppLayout/AuthenticatedLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CreatorChat from './pages/Creator/CreatorChat';
import Planejamentos from './pages/Creator/Planejamentos';
import WeeklyPlanner from './pages/Planner/WeeklyPlanner';
import WhatsAppSmart from './pages/WhatsAppSmart/WhatsAppSmart';
import InstagramSmart from './pages/InstagramSmart/InstagramSmart';
import './App.css';

function App() {
  return (
    <LayoutProvider>
      <Routes>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/meu-negocio" element={<Business />} />
          <Route path="/criador-ia" element={<CreatorChat />} />
          <Route path="/planejamentos" element={<Planejamentos />} />
          <Route path="/minha-semana" element={<WeeklyPlanner />} />
          <Route path="/whatsapp-inteligente" element={<WhatsAppSmart />} />
          <Route path="/instagram-inteligente" element={<InstagramSmart />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer position="bottom-right" autoClose={3500} hideProgressBar theme="light" newestOnTop closeOnClick pauseOnHover />
    </LayoutProvider>
  );
}

export default App;
