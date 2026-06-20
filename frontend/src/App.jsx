import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import StudentLayout from './layouts/StudentLayout.jsx';
import DepartmentLayout from './layouts/DepartmentLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>加载中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    const redirect = user.role === 'student' ? '/student' : user.role === 'department' ? '/department' : '/admin';
    return <Navigate to={redirect} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/student/*" element={<RequireAuth role="student"><StudentLayout /></RequireAuth>} />
      <Route path="/department/*" element={<RequireAuth role="department"><DepartmentLayout /></RequireAuth>} />
      <Route path="/admin/*" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>} />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}

function DefaultRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>加载中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  const redirect = user.role === 'student' ? '/student' : user.role === 'department' ? '/department' : '/admin';
  return <Navigate to={redirect} replace />;
}
