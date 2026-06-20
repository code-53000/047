import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      const redirect = user.role === 'student' ? '/student' : user.role === 'department' ? '/department' : '/admin';
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const accounts = {
    student: [{ user: 'student001', pass: 'password123', name: '张三（学生）' }],
    department: [
      { user: 'lib_manager', pass: 'password123', name: '图书馆管理员' },
      { user: 'canteen_manager', pass: 'password123', name: '食堂管理员' }
    ],
    admin: [{ user: 'admin', pass: 'password123', name: '学生处管理员' }]
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">勤工俭学岗位管理系统</h1>
        <p className="login-subtitle">在线申请 · 智能分配 · 工时管理</p>

        <div className="login-tabs">
          {[
            { k: 'student', n: '学生登录' },
            { k: 'department', n: '部门登录' },
            { k: 'admin', n: '管理员登录' }
          ].map(t => (
            <div key={t.k} className={`login-tab ${role === t.k ? 'active' : ''}`} onClick={() => setRole(t.k)}>
              {t.n}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input className="form-input" name="username" value={form.username} onChange={handleChange} placeholder="请输入用户名" />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input type="password" className="form-input" name="password" value={form.password} onChange={handleChange} placeholder="请输入密码" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        {role === 'student' && (
          <div className="login-footer">
            还没有账号？<Link to="/register">立即注册</Link>
          </div>
        )}

        <div className="test-accounts">
          <div className="test-accounts-title">测试账号（初始密码均为 password123）：</div>
          {accounts[role].map((a, i) => (
            <div key={i} className="test-account-item" style={{cursor:'pointer', color:'#4361ee'}}
              onClick={() => setForm({ username: a.user, password: 'password123' })}>
              {a.name}：{a.user}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
