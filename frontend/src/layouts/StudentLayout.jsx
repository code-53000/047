import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import StudentPositionsPage from '../pages/student/PositionsPage.jsx';
import StudentApplicationsPage from '../pages/student/ApplicationsPage.jsx';
import StudentWorkHoursPage from '../pages/student/WorkHoursPage.jsx';
import StudentProfilePage from '../pages/student/ProfilePage.jsx';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/student/positions', label: '岗位大厅', icon: '📋' },
    { to: '/student/applications', label: '我的申请', icon: '📝' },
    { to: '/student/work-hours', label: '工时申报', icon: '⏰' },
    { to: '/student/profile', label: '个人中心', icon: '👤' }
  ];

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">🎓 勤工俭学系统</div>
        <div className="navbar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              {item.icon} {item.label}
            </NavLink>
          ))}
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <span className="badge badge-student">学生</span>
            <span>{user?.real_name || user?.username}</span>
            <div className="avatar">{(user?.real_name || 'U').charAt(0)}</div>
          </div>
          <button className="btn btn-sm btn-warning" onClick={handleLogout}>退出</button>
        </div>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="positions" replace />} />
          <Route path="positions" element={<StudentPositionsPage />} />
          <Route path="applications" element={<StudentApplicationsPage />} />
          <Route path="work-hours" element={<StudentWorkHoursPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
        </Routes>
      </div>
    </div>
  );
}
