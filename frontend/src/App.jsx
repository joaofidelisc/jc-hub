import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home/Home';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import InstagramSetup from './pages/InstagramSetup/InstagramSetup';
import OAuthCallback from './pages/InstagramSetup/OAuthCallback';
import InstagramInstructions from './pages/InstagramSetup/Instructions';
import InstagramInstructionsDetailed from './pages/InstagramSetup/InstructionsDetailed';
import Keywords from './pages/InstagramSetup/Keywords';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse/TermsOfUse';
import { LayoutProvider } from './components/AppLayout/LayoutContext';
import AuthenticatedLayout from './components/AppLayout/AuthenticatedLayout';

import MessengerSetup from './pages/MessengerSetup/MessengerSetup';
import MessengerInstructions from './pages/MessengerSetup/Instructions';
import MessengerInstructionsDetailed from './pages/MessengerSetup/InstructionsDetailed';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CreatorChat from './pages/Creator/CreatorChat';
import './App.css';

function App() {
  return (
    <LayoutProvider>
      <div>
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/criador-ia" element={<CreatorChat />} />
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Instagram Routes (Blocked) */}
            {/* <Route path="/instagram/setup" element={<InstagramSetup />} />
            <Route path="/instagram/oauth/callback" element={<OAuthCallback />} />
            <Route path="/instagram/instructions" element={<InstagramInstructions />} />
            <Route path="/instagram/instructions-detailed" element={<InstagramInstructionsDetailed />} />
            <Route path="/instagram/keywords" element={<Keywords />} /> */}

            {/* Messenger Routes (Blocked) */}
            {/* <Route path="/messenger/setup" element={<MessengerSetup />} />
            <Route path="/messenger/instructions" element={<MessengerInstructions />} />
            <Route path="/messenger/instructions-detailed" element={<MessengerInstructionsDetailed />} /> */}
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <ToastContainer />
      </div>
    </LayoutProvider>
  );
}

export default App;