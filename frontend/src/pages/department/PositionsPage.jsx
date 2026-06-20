import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const STATUS_MAP = { open: '招聘中', closed: '已关闭', archived: '已归档' };
const STATUS_CLS = { open: 'open', closed: 'closed', archived: 'archived' };

export default function DeptPositionsPage() {
  const { user } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', requirements: '', weeklyHours: 8, hourlyRate: 15, maxWorkers: 2, semester: '2025-2026学年第二学期', location: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await api.get('/positions');
      setPositions(data);
    } finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({ title: '', description: '', requirements: '', weeklyHours: 8, hourlyRate: 15, maxWorkers: 2, semester: '2025-2026学年第二学期', location: '' });
    setShowForm(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      title: p.title, description: p.description, requirements: p.requirements,
      weeklyHours: p.weekly_hours, hourlyRate: p.hourly_rate, maxWorkers: p.max_workers,
      semester: p.semester, location: p.location || ''
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.title || !form.description || !form.requirements || !form.weeklyHours || !form.maxWorkers || !form.semester) {
      alert('请填写必填项'); return;
    }
    try {
      if (editing) {
        await api.put(`/positions/${editing.id}`, form);
        alert('修改成功');
      } else {
        await api.post('/positions', form);
        alert('发布成功');
      }
      setShowForm(false);
      loadData();
    } catch (e) { alert(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除该岗位吗？（已有录用记录的岗位无法删除）')) return;
    try {
      await api.delete(`/positions/${id}`);
      loadData();
    } catch (e) { alert(e.message); }
  }

  async function handleStatus(id, status) {
    try {
      await api.patch(`/positions/${id}/status`, { status });
      loadData();
    } catch (e) { alert(e.message); }
  }

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">📋 岗位管理 <span style={{fontSize:'14px', color:'#888', fontWeight:'normal', marginLeft:'8px'}}>{user?.department_name || ''}</span></h2>
        <button className="btn btn-primary" onClick={openNew}>+ 发布新岗位</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">总岗位数</div>
          <div className="stat-value">{positions.length}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">招聘中</div>
          <div className="stat-value">{positions.filter(p=>p.status==='open').length}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">已录用人数</div>
          <div className="stat-value">{positions.reduce((s,p)=>s+(p.current_workers||0),0)}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">计划招聘</div>
          <div className="stat-value">{positions.reduce((s,p)=>s+p.max_workers,0)}</div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>岗位名称</th>
              <th>薪资/周工时</th>
              <th>招聘进度</th>
              <th>学期</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(p => {
              const full = (p.current_workers||0) >= p.max_workers;
              const progress = Math.round((p.current_workers||0)/p.max_workers*100);
              return (
                <tr key={p.id}>
                  <td style={{fontWeight:500}}>
                    <div>{p.title}</div>
                    <div style={{fontSize:'12px', color:'#888'}}>{p.location||'校内'}</div>
                  </td>
                  <td>
                    <div>¥{Number(p.hourly_rate).toFixed(0)}/小时</div>
                    <div style={{fontSize:'12px', color:'#888'}}>{p.weekly_hours}h/周</div>
                  </td>
                  <td style={{minWidth:'160px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <div className="progress-bar" style={{maxWidth:'120px'}}><div className="progress-fill" style={{width:`${progress}%`}} /></div>
                      <span style={{fontSize:'13px'}}>{p.current_workers||0}/{p.max_workers}</span>
                    </div>
                  </td>
                  <td style={{fontSize:'13px'}}>{p.semester}</td>
                  <td><span className={`badge badge-${full?'closed':STATUS_CLS[p.status]}`}>{full?'已满员':STATUS_MAP[p.status]}</span></td>
                  <td style={{fontSize:'13px', color:'#888'}}>{(p.created_at||'').substring(0,10)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-default" onClick={() => openEdit(p)}>编辑</button>
                      {p.status === 'open' && <button className="btn btn-sm btn-warning" onClick={()=>handleStatus(p.id,'closed')}>关闭</button>}
                      {p.status !== 'open' && !full && <button className="btn btn-sm btn-success" onClick={()=>handleStatus(p.id,'open')}>开启</button>}
                      <button className="btn btn-sm btn-danger" onClick={()=>handleDelete(p.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {positions.length === 0 && <tr><td colSpan="7" style={{textAlign:'center', padding:'40px', color:'#999'}}>暂无岗位，点击右上角发布</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{maxWidth:'680px'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{editing?'编辑岗位':'发布新岗位'}</div><button className="modal-close" onClick={()=>setShowForm(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">岗位名称 *</label>
                  <input className="form-input" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="如：图书整理员" />
                </div>
                <div className="form-group">
                  <label className="form-label">学期 *</label>
                  <input className="form-input" value={form.semester} onChange={e=>setForm({...form, semester:e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">周工时(小时) *</label>
                  <input type="number" className="form-input" value={form.weeklyHours} onChange={e=>setForm({...form, weeklyHours:Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">时薪(元)</label>
                  <input type="number" step="0.5" className="form-input" value={form.hourlyRate} onChange={e=>setForm({...form, hourlyRate:Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">招聘人数 *</label>
                  <input type="number" className="form-input" value={form.maxWorkers} onChange={e=>setForm({...form, maxWorkers:Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">工作地点</label>
                <input className="form-input" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} placeholder="如：图书馆三楼" />
              </div>
              <div className="form-group">
                <label className="form-label">岗位职责 *</label>
                <textarea className="form-textarea" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="详细描述岗位的工作内容" />
              </div>
              <div className="form-group">
                <label className="form-label">任职要求 *</label>
                <textarea className="form-textarea" value={form.requirements} onChange={e=>setForm({...form, requirements:e.target.value})} placeholder="填写对申请者的具体要求" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={()=>setShowForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editing?'保存修改':'发布岗位'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
