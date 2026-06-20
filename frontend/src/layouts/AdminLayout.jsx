import React from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import AdminAssignments from '../pages/admin/Assignments.jsx';
import AdminPositions from '../pages/admin/Positions.jsx';
import AdminStudents from '../pages/admin/Students.jsx';
import AdminDepartments from '../pages/admin/Departments.jsx';
import AdminWorkHours from '../pages/admin/WorkHours.jsx';
import AdminProfile from '../pages/admin/ProfilePage.jsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/admin/dashboard', label: '统计总览', icon: '📊' },
    { to: '/admin/assignments', label: '审核分配', icon: '✅' },
    { to: '/admin/positions', label: '岗位管理', icon: '📋' },
    { to: '/admin/students', label: '学生管理', icon: '🎓' },
    { to: '/admin/departments', label: '部门管理', icon: '🏢' },
    { to: '/admin/work-hours', label: '工时查询', icon: '⏰' },
    { to: '/admin/profile', label: '账号设置', icon: '👤' }
  ];

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">🎓 勤工俭学系统 · 管理端</div>
        <div className="navbar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              {item.icon} {item.label}
            </NavLink>
          ))}
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <span className="badge badge-admin">管理员</span>
            <span>{user?.real_name || user?.username}</span>
            <div className="avatar">{(user?.real_name || 'A').charAt(0)}</div>
          </div>
          <button className="btn btn-sm btn-warning" onClick={handleLogout}>退出</button>
        </div>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="positions" element={<AdminPositions />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="work-hours" element={<AdminWorkHours />} />
          <Route path="profile" element={<AdminProfile />} />
        </Routes>
      </div>
    </div>
  );
}
