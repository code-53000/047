import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', realName: '', studentNo: '', className: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username?.trim() || !form.password || !form.realName?.trim() || !form.studentNo?.trim()) {
      setError('请填写必填项');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    if (form.password.length < 6) {
      setError('密码至少6位');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/login', { replace: true, state: { message: '注册成功，请登录' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box" style={{ maxWidth: 480 }}>
        <h1 className="login-title">学生注册</h1>
        <p className="login-subtitle">勤工俭学岗位管理系统</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">用户名 *</label>
              <input className="form-input" name="username" value={form.username} onChange={handleChange} placeholder="登录用户名" />
            </div>
            <div className="form-group">
              <label className="form-label">真实姓名 *</label>
              <input className="form-input" name="realName" value={form.realName} onChange={handleChange} placeholder="您的姓名" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">学号 *</label>
              <input className="form-input" name="studentNo" value={form.studentNo} onChange={handleChange} placeholder="如：2024001" />
            </div>
            <div className="form-group">
              <label className="form-label">班级</label>
              <input className="form-input" name="className" value={form.className} onChange={handleChange} placeholder="如：计算机2401班" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">密码 *</label>
              <input type="password" className="form-input" name="password" value={form.password} onChange={handleChange} placeholder="至少6位" />
            </div>
            <div className="form-group">
              <label className="form-label">确认密码 *</label>
              <input type="password" className="form-input" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">手机号</label>
              <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="可选" />
            </div>
            <div className="form-group">
              <label className="form-label">邮箱</label>
              <input className="form-input" name="email" value={form.email} onChange={handleChange} placeholder="可选" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? '注册中...' : '注 册'}
          </button>
        </form>
        <div className="login-footer">已有账号？<Link to="/login">返回登录</Link></div>
      </div>
    </div>
  );
}
