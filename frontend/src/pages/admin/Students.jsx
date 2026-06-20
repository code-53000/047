import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username:'', password:'', realName:'', studentNo:'', className:'', phone:'', email:'' });

  useEffect(() => { loadData(); }, [keyword]);

  async function loadData() {
    try {
      setLoading(true);
      const params = { role: 'student' };
      if (keyword) params.keyword = keyword;
      const qs = new URLSearchParams(params).toString();
      const data = await api.get(`/users?${qs}`);
      setStudents(data);
    } finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({ username:'', password:'password123', realName:'', studentNo:'', className:'', phone:'', email:'' });
    setShowForm(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({ username: u.username, password:'', realName: u.real_name, studentNo: u.student_no||'', className: u.class||'', phone: u.phone||'', email: u.email||'' });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.username || !form.realName) { alert('请填写必填项'); return; }
    if (!editing && !form.password) { alert('请设置密码'); return; }
    try {
      const data = { ...form, role: 'student' };
      if (editing) {
        if (!form.password) delete data.password;
        await api.put(`/users/${editing.id}`, data);
        alert('修改成功');
      } else {
        await api.post('/users', data);
        alert('创建成功');
      }
      setShowForm(false); loadData();
    } catch (e) { alert(e.message); }
  }

  async function toggleStatus(u) {
    const ns = u.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`确定要${ns==='active'?'启用':'禁用'}账号 ${u.real_name} 吗？`)) return;
    try { await api.put(`/users/${u.id}`, { status: ns }); loadData(); } catch(e){ alert(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除该学生账号？相关申请和工时记录也会被删除！')) return;
    try { await api.delete(`/users/${id}`); loadData(); } catch(e){ alert(e.message); }
  }

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">🎓 学生管理 <span style={{fontSize:'14px', color:'#888', fontWeight:'normal'}}>共 {students.length} 人</span></h2>
        <div style={{display:'flex', gap:'12px'}}>
          <input className="form-input" placeholder="搜索姓名/学号/用户名" value={keyword} onChange={e=>setKeyword(e.target.value)} style={{width:'260px'}} />
          <button className="btn btn-primary" onClick={openNew}>+ 新增学生</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>学号</th><th>姓名</th><th>用户名</th><th>班级</th><th>手机</th><th>邮箱</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {students.map(u => (
              <tr key={u.id}>
                <td style={{fontWeight:500}}>{u.student_no||'-'}</td>
                <td>{u.real_name}</td>
                <td style={{color:'#888'}}>{u.username}</td>
                <td>{u.class||'-'}</td>
                <td style={{fontSize:'13px'}}>{u.phone||'-'}</td>
                <td style={{fontSize:'13px'}}>{u.email||'-'}</td>
                <td><span className={`badge badge-${u.status}`}>{u.status==='active'?'正常':'禁用'}</span></td>
                <td>
                  <div className="actions">
                    <button className="btn btn-sm btn-default" onClick={()=>openEdit(u)}>编辑</button>
                    <button className={`btn btn-sm ${u.status==='active'?'btn-warning':'btn-success'}`} onClick={()=>toggleStatus(u)}>
                      {u.status==='active'?'禁用':'启用'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={()=>handleDelete(u.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length===0 && <tr><td colSpan="8" style={{textAlign:'center', padding:'40px', color:'#999'}}>暂无数据</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{editing?'编辑学生':'新增学生'}</div><button className="modal-close" onClick={()=>setShowForm(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">用户名 *</label>
                  <input className="form-input" value={form.username} disabled={!!editing} onChange={e=>setForm({...form, username:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">密码 {editing?'(留空则不修改)':'*'}</label>
                  <input className="form-input" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">真实姓名 *</label>
                  <input className="form-input" value={form.realName} onChange={e=>setForm({...form, realName:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">学号</label>
                  <input className="form-input" value={form.studentNo} onChange={e=>setForm({...form, studentNo:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">班级</label>
                  <input className="form-input" value={form.className} onChange={e=>setForm({...form, className:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">手机</label>
                  <input className="form-input" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">邮箱</label>
                <input className="form-input" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={()=>setShowForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editing?'保存':'创建'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
