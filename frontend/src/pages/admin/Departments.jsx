import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMgr, setShowMgr] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', contactName:'', contactPhone:'', description:'' });
  const [mgrForm, setMgrForm] = useState({ username:'', password:'password123', realName:'', phone:'', email:'' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [deps, usrs] = await Promise.all([
        api.get('/departments'),
        api.get('/users?role=department')
      ]);
      setDepartments(deps);
      setManagers(usrs);
    } finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({ name:'', contactName:'', contactPhone:'', description:'' });
    setShowForm(true);
  }
  function openEdit(d) {
    setEditing(d);
    setForm({ name:d.name, contactName:d.contact_name, contactPhone:d.contact_phone||'', description:d.description||'' });
    setShowForm(true);
  }
  function openAddMgr(d) {
    setShowMgr(d);
    setMgrForm({ username:`${d.name.toLowerCase().slice(0,4)}_mgr`, password:'password123', realName:d.contact_name, phone:d.contact_phone||'', email:'' });
  }

  async function handleSubmit() {
    if (!form.name || !form.contactName) { alert('请填写必填项'); return; }
    try {
      if (editing) await api.put(`/departments/${editing.id}`, form);
      else await api.post('/departments', form);
      alert('成功'); setShowForm(false); loadData();
    } catch(e){ alert(e.message); }
  }
  async function handleDelete(id) {
    if (!confirm('确定删除该部门？如有岗位则无法删除')) return;
    try { await api.delete(`/departments/${id}`); loadData(); } catch(e){ alert(e.message); }
  }
  async function handleAddMgr() {
    if (!mgrForm.username || !mgrForm.realName) { alert('请填写必填项'); return; }
    try {
      await api.post('/users', {
        username: mgrForm.username, password: mgrForm.password,
        realName: mgrForm.realName, role: 'department',
        phone: mgrForm.phone, email: mgrForm.email,
        departmentId: showMgr.id
      });
      alert('部门管理员创建成功'); setShowMgr(null); loadData();
    } catch(e){ alert(e.message); }
  }

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">🏢 部门管理 <span style={{fontSize:'14px', color:'#888', fontWeight:'normal'}}>共 {departments.length} 个部门</span></h2>
        <button className="btn btn-primary" onClick={openNew}>+ 新增部门</button>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>ID</th><th>部门名称</th><th>负责人</th><th>联系电话</th><th>岗位数</th><th>管理员</th><th>简介</th><th>操作</th></tr></thead>
          <tbody>
            {departments.map(d => {
              const mgrs = managers.filter(m => m.department_id === d.id);
              return (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td style={{fontWeight:500}}>{d.name}</td>
                  <td>{d.contact_name}</td>
                  <td>{d.contact_phone||'-'}</td>
                  <td>{d.position_count||0}</td>
                  <td>
                    {mgrs.length===0 ? <span style={{color:'#e65100'}}>未设置</span> : mgrs.map(m => <span key={m.id} className="tag">{m.real_name}</span>)}
                  </td>
                  <td style={{fontSize:'13px', color:'#666', maxWidth:'200px'}}>{(d.description||'-').slice(0,40)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-default" onClick={()=>openEdit(d)}>编辑</button>
                      <button className="btn btn-sm btn-success" onClick={()=>openAddMgr(d)}>设置管理员</button>
                      <button className="btn btn-sm btn-danger" onClick={()=>handleDelete(d.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{editing?'编辑部门':'新增部门'}</div><button className="modal-close" onClick={()=>setShowForm(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">部门名称 *</label>
                  <input className="form-input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">负责人 *</label>
                  <input className="form-input" value={form.contactName} onChange={e=>setForm({...form, contactName:e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">联系电话</label>
                <input className="form-input" value={form.contactPhone} onChange={e=>setForm({...form, contactPhone:e.target.value})} /></div>
              <div className="form-group"><label className="form-label">部门简介</label>
                <textarea className="form-textarea" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={()=>setShowForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editing?'保存':'创建'}</button>
            </div>
          </div>
        </div>
      )}

      {showMgr && (
        <div className="modal-overlay" onClick={()=>setShowMgr(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">为「{showMgr.name}」设置部门管理员</div><button className="modal-close" onClick={()=>setShowMgr(null)}>×</button></div>
            <div className="modal-body">
              <div className="alert alert-info">创建后该管理员可登录系统发布岗位、审核工时。默认密码：password123</div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">用户名 *</label>
                  <input className="form-input" value={mgrForm.username} onChange={e=>setMgrForm({...mgrForm, username:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">密码 *</label>
                  <input className="form-input" value={mgrForm.password} onChange={e=>setMgrForm({...mgrForm, password:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">姓名 *</label>
                  <input className="form-input" value={mgrForm.realName} onChange={e=>setMgrForm({...mgrForm, realName:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">手机</label>
                  <input className="form-input" value={mgrForm.phone} onChange={e=>setMgrForm({...mgrForm, phone:e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">邮箱</label>
                <input className="form-input" value={mgrForm.email} onChange={e=>setMgrForm({...mgrForm, email:e.target.value})} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={()=>setShowMgr(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddMgr}>创建管理员</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
