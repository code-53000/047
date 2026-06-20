import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

export default function StudentPositionsPage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState(null);
  const [applyForm, setApplyForm] = useState({ motivation: '', relevantExperience: '' });
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [pos, apps] = await Promise.all([
        api.get('/positions?status=open'),
        api.get('/applications')
      ]);
      setPositions(pos);
      setAppliedIds(apps.map(a => a.position_id));
    } finally {
      setLoading(false);
    }
  }

  const filtered = positions.filter(p =>
    (keyword ? (p.title.includes(keyword) || p.department_name.includes(keyword) || (p.description||'').includes(keyword)) : true)
  );

  async function handleApply() {
    if (!selected) return;
    setApplying(true);
    try {
      await api.post('/applications', {
        positionId: selected.id,
        ...applyForm
      });
      alert('申请提交成功！');
      setSelected(null);
      setApplyForm({ motivation: '', relevantExperience: '' });
      await loadData();
    } catch (e) {
      alert(e.message);
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">📋 岗位大厅</h2>
        <div style={{display:'flex', gap:'12px'}}>
          <input className="form-input" placeholder="搜索岗位名称、部门或关键词..." value={keyword}
            onChange={e => setKeyword(e.target.value)} style={{width:'320px'}} />
          <button className="btn btn-default" onClick={loadData}>刷新</button>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">可申请岗位</div>
          <div className="stat-value">{filtered.filter(p => p.status === 'open' && !appliedIds.includes(p.id)).length}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">招聘总人数</div>
          <div className="stat-value">{filtered.reduce((s,p) => s + (p.max_workers - (p.current_workers||0)), 0)}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">已申请</div>
          <div className="stat-value">{appliedIds.length}</div>
        </div>
      </div>

      <div className="grid grid-3">
        {filtered.map(p => {
          const applied = appliedIds.includes(p.id);
          const full = (p.current_workers||0) >= p.max_workers;
          const progress = Math.round((p.current_workers||0) / p.max_workers * 100);
          return (
            <div key={p.id} className="position-card">
              <div className="position-header">
                <div>
                  <div className="position-title">{p.title}</div>
                  <div className="position-dept">🏢 {p.department_name}</div>
                </div>
                <span className={`badge badge-${full ? 'closed' : p.status === 'open' ? 'open' : p.status}`}>
                  {full ? '已满' : p.status === 'open' ? '招聘中' : p.status === 'closed' ? '已关闭' : p.status}
                </span>
              </div>
              <div className="position-meta">
                <div className="position-meta-item">💰 <strong>¥{Number(p.hourly_rate).toFixed(0)}</strong>/时</div>
                <div className="position-meta-item">⏱️ <strong>{p.weekly_hours}</strong>小时/周</div>
                <div className="position-meta-item">📍 <strong>{p.location||'校内'}</strong></div>
              </div>
              <div className="position-desc">{p.description}</div>
              <div className="position-footer">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width:`${progress}%`}} />
                </div>
                <div style={{fontSize:'13px', color:'#666', whiteSpace:'nowrap'}}>
                  {p.current_workers||0}/{p.max_workers}人
                </div>
              </div>
              <div style={{marginTop:'12px', display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                <button className="btn btn-sm btn-default" onClick={() => setSelected(p)}>查看详情</button>
                <button className={`btn btn-sm ${applied ? 'btn-default' : 'btn-primary'}`}
                  disabled={applied || full || p.status !== 'open'}
                  onClick={() => setSelected(p)}>
                  {applied ? '已申请' : full ? '已满员' : '立即申请'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="empty-state"><div className="empty-state-icon">🔍</div><div className="empty-state-text">暂无匹配的岗位</div></div>}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{maxWidth:'640px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{selected.title}</div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-row"><div className="info-label">所属部门</div><div className="info-value">{selected.department_name}</div></div>
              <div className="info-row"><div className="info-label">岗位地点</div><div className="info-value">{selected.location||'校内'}</div></div>
              <div className="info-row"><div className="info-label">薪资</div><div className="info-value">¥{Number(selected.hourly_rate).toFixed(2)}/小时，每周{selected.weekly_hours}小时</div></div>
              <div className="info-row"><div className="info-label">招聘人数</div><div className="info-value">{selected.current_workers||0}/{selected.max_workers}人（已招/共招）</div></div>
              <div className="info-row"><div className="info-label">学期</div><div className="info-value">{selected.semester}</div></div>
              <div className="info-row"><div className="info-label">发布时间</div><div className="info-value">{(selected.created_at||'').substring(0,16)}</div></div>
              <div style={{marginTop:'16px'}}>
                <div style={{fontWeight:600, marginBottom:'8px'}}>岗位职责：</div>
                <div style={{padding:'10px', background:'#f8f9fa', borderRadius:'6px', fontSize:'13px', color:'#555', whiteSpace:'pre-wrap'}}>{selected.description}</div>
              </div>
              <div style={{marginTop:'12px'}}>
                <div style={{fontWeight:600, marginBottom:'8px'}}>任职要求：</div>
                <div style={{padding:'10px', background:'#f8f9fa', borderRadius:'6px', fontSize:'13px', color:'#555', whiteSpace:'pre-wrap'}}>{selected.requirements}</div>
              </div>
              {!appliedIds.includes(selected.id) && (selected.current_workers||0) < selected.max_workers && selected.status === 'open' && (
                <div style={{marginTop:'20px', padding:'16px', background:'#e3f2fd', borderRadius:'8px'}}>
                  <div style={{fontWeight:600, marginBottom:'12px', color:'#1565c0'}}>📝 填写申请信息：</div>
                  <div className="form-group">
                    <label className="form-label">申请动机</label>
                    <textarea className="form-textarea" value={applyForm.motivation}
                      onChange={e => setApplyForm({...applyForm, motivation: e.target.value})}
                      placeholder="请描述您申请该岗位的原因和期望..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">相关经验</label>
                    <textarea className="form-textarea" value={applyForm.relevantExperience}
                      onChange={e => setApplyForm({...applyForm, relevantExperience: e.target.value})}
                      placeholder="如有相关的工作或实践经验请填写（可选）" />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setSelected(null)}>关闭</button>
              {!appliedIds.includes(selected.id) && (selected.current_workers||0) < selected.max_workers && selected.status === 'open' && (
                <button className="btn btn-primary" onClick={handleApply} disabled={applying}>
                  {applying ? '提交中...' : '提交申请'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
