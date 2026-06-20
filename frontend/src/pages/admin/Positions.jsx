import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

const STATUS_MAP = { open: '招聘中', closed: '已关闭', archived: '已归档' };
const STATUS_CLS = { open: 'open', closed: 'closed', archived: 'archived' };

export default function AdminPositions() {
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title:'', departmentId:'', description:'', requirements:'', weeklyHours:8, hourlyRate:15, maxWorkers:2, semester:'2025-2026学年第二学期', location:'' });

  useEffect(() => { loadData(); }, [statusFilter, deptFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const [pos, deps] = await Promise.all([
        api.get('/positions'),
        api.get('/departments')
      ]);
      let filtered = pos;
      if (statusFilter) filtered = filtered.filter(p => p.status === statusFilter);
      if (deptFilter) filtered = filtered.filter(p => String(p.department_id) === String(deptFilter));
      setPositions(filtered);
      setDepartments(deps);
    } finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({ title:'', departmentId:'', description:'', requirements:'', weeklyHours:8, hourlyRate:15, maxWorkers:2, semester:'2025-2026学年第二学期', location:'' });
    setShowForm(true);
  }
  function openEdit(p) {
    setEditing(p);
    setForm({
      title: p.title, departmentId: p.department_id, description: p.description,
      requirements: p.requirements, weeklyHours: p.weekly_hours, hourlyRate: p.hourly_rate,
      maxWorkers: p.max_workers, semester: p.semester, location: p.location || ''
    });
    setShowForm(true);
  }
  async function handleSubmit() {
    if (!form.title || !form.departmentId || !form.description || !form.requirements) { alert('请填写必填项'); return; }
    try {
      if (editing) await api.put(`/positions/${editing.id}`, form);
      else await api.post('/positions', form);
      alert('成功'); setShowForm(false); loadData();
    } catch (e) { alert(e.message); }
  }
  async function handleDelete(id) {
    if (!confirm('确定删除？已有录用记录无法删除')) return;
    try { await api.delete(`/positions/${id}`); loadData(); } catch (e) { alert(e.message); }
  }
  async function handleStatus(id, status) {
    try { await api.patch(`/positions/${id}/status`, { status }); loadData(); } catch(e){ alert(e.message); }
  }

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">📋 岗位管理</h2>
        <button className="btn btn-primary" onClick={openNew}>+ 新建岗位</button>
      </div>
      <div className="filter-bar">
        <div className="form-group"><select className="form-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="open">招聘中</option>
          <option value="closed">已关闭</option>
          <option value="archived">已归档</option>
        </select></div>
        <div className="form-group"><select className="form-select" value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
          <option value="">全部部门</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select></div>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>ID</th><th>岗位</th><th>部门</th><th>薪资/周时</th><th>人数</th><th>学期</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
          <tbody>
            {positions.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td><div style={{fontWeight:500}}>{p.title}</div><div style={{fontSize:'12px', color:'#888'}}>{p.location||'-'}</div></td>
                <td>{p.department_name}</td>
                <td>¥{Number(p.hourly_rate).toFixed(0)} · {p.weekly_hours}h</td>
                <td>{p.current_workers||0}/{p.max_workers}</td>
                <td style={{fontSize:'13px'}}>{p.semester}</td>
                <td><span className={`badge badge-${STATUS_CLS[p.status]}`}>{STATUS_MAP[p.status]}</span></td>
                <td style={{fontSize:'13px', color:'#888'}}>{(p.created_at||'').substring(0,10)}</td>
                <td>
                  <div className="actions">
                    <button className="btn btn-sm btn-default" onClick={()=>openEdit(p)}>编辑</button>
                    {p.status === 'open' && <button className="btn btn-sm btn-warning" onClick={()=>handleStatus(p.id,'closed')}>关闭</button>}
                    {p.status !== 'open' && <button className="btn btn-sm btn-success" onClick={()=>handleStatus(p.id,'open')}>开启</button>}
                    <button className="btn btn-sm btn-danger" onClick={()=>handleDelete(p.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {positions.length===0 && <tr><td colSpan="9" style={{textAlign:'center', padding:'40px', color:'#999'}}>暂无数据</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" style={{maxWidth:'700px'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{editing?'编辑岗位':'新建岗位'}</div><button className="modal-close" onClick={()=>setShowForm(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">岗位名称 *</label>
                  <input className="form-input" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">部门 *</label>
                  <select className="form-select" value={form.departmentId} onChange={e=>setForm({...form, departmentId:Number(e.target.value)||e.target.value})}>
                    <option value="">请选择</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">周工时 *</label>
                  <input type="number" className="form-input" value={form.weeklyHours} onChange={e=>setForm({...form, weeklyHours:Number(e.target.value)})} /></div>
                <div className="form-group"><label className="form-label">时薪(元)</label>
                  <input type="number" step="0.5" className="form-input" value={form.hourlyRate} onChange={e=>setForm({...form, hourlyRate:Number(e.target.value)})} /></div>
                <div className="form-group"><label className="form-label">招聘人数 *</label>
                  <input type="number" className="form-input" value={form.maxWorkers} onChange={e=>setForm({...form, maxWorkers:Number(e.target.value)})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">学期 *</label>
                  <input className="form-input" value={form.semester} onChange={e=>setForm({...form, semester:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">地点</label>
                  <input className="form-input" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">岗位职责 *</label>
                <textarea className="form-textarea" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} /></div>
              <div className="form-group"><label className="form-label">任职要求 *</label>
                <textarea className="form-textarea" value={form.requirements} onChange={e=>setForm({...form, requirements:e.target.value})} /></div>
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
