import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import DeptPositionsPage from '../pages/department/PositionsPage.jsx';
import DeptApplicantsPage from '../pages/department/ApplicantsPage.jsx';
import DeptWorkHoursPage from '../pages/department/WorkHoursPage.jsx';
import DeptProfilePage from '../pages/department/ProfilePage.jsx';

export default function DepartmentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/department/positions', label: '岗位管理', icon: '📋' },
    { to: '/department/applicants', label: '申请查看', icon: '📝' },
    { to: '/department/work-hours', label: '工时审核', icon: '⏰' },
    { to: '/department/profile', label: '部门信息', icon: '🏢' }
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
            <span className="badge badge-department">部门</span>
            <span>{user?.real_name || user?.username}</span>
            <div className="avatar">{(user?.real_name || 'U').charAt(0)}</div>
          </div>
          <button className="btn btn-sm btn-warning" onClick={handleLogout}>退出</button>
        </div>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="positions" replace />} />
          <Route path="positions" element={<DeptPositionsPage />} />
          <Route path="applicants" element={<DeptApplicantsPage />} />
          <Route path="work-hours" element={<DeptWorkHoursPage />} />
          <Route path="profile" element={<DeptProfilePage />} />
        </Routes>
      </div>
    </div>
  );
}
