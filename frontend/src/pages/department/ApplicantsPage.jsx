import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

const STATUS_MAP = {
  pending: { text: '待审核', cls: 'pending' },
  approved: { text: '已通过', cls: 'approved' },
  rejected: { text: '已拒绝', cls: 'rejected' },
  assigned: { text: '已分配', cls: 'assigned' }
};

export default function DeptApplicantsPage() {
  const [applications, setApplications] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [posFilter, setPosFilter] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [apps, pos] = await Promise.all([
        api.get('/applications'),
        api.get('/positions')
      ]);
      setApplications(apps);
      setPositions(pos);
    } finally { setLoading(false); }
  }

  const filtered = applications.filter(a => {
    if (tab !== 'all' && a.status !== tab) return false;
    if (posFilter && String(a.position_id) !== String(posFilter)) return false;
    return true;
  });

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">📝 申请查看</h2>
      </div>

      <div className="stat-cards">
        <div className="stat-card"><div className="stat-label">总申请数</div><div className="stat-value">{applications.length}</div></div>
        <div className="stat-card warning"><div className="stat-label">待审核</div><div className="stat-value">{applications.filter(a=>a.status==='pending').length}</div></div>
        <div className="stat-card success"><div className="stat-label">已录用/分配</div><div className="stat-value">{applications.filter(a=>a.status==='approved'||a.status==='assigned').length}</div></div>
        <div className="stat-card danger"><div className="stat-label">已拒绝</div><div className="stat-value">{applications.filter(a=>a.status==='rejected').length}</div></div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab==='all'?'active':''}`} onClick={()=>setTab('all')}>全部</div>
        <div className={`tab ${tab==='pending'?'active':''}`} onClick={()=>setTab('pending')}>待审核</div>
        <div className={`tab ${tab==='assigned'?'active':''}`} onClick={()=>setTab('assigned')}>已分配（在岗）</div>
        <div className={`tab ${tab==='approved'?'active':''}`} onClick={()=>setTab('approved')}>已通过</div>
        <div className={`tab ${tab==='rejected'?'active':''}`} onClick={()=>setTab('rejected')}>已拒绝</div>
      </div>

      <div className="filter-bar">
        <div className="form-group">
          <select className="form-select" value={posFilter} onChange={e=>setPosFilter(e.target.value)}>
            <option value="">全部岗位</option>
            {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <button className="btn btn-default" onClick={loadData}>刷新</button>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">暂无数据</div></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>申请时间</th>
                <th>岗位</th>
                <th>学生信息</th>
                <th>申请动机</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{fontSize:'13px', color:'#888'}}>{(a.created_at||'').substring(0,16)}</td>
                  <td style={{fontWeight:500}}>{a.position_title}</td>
                  <td>
                    <div style={{fontWeight:500}}>{a.student_name}</div>
                    <div style={{fontSize:'12px', color:'#888'}}>{a.student_no} · {a.class||'未填班级'}</div>
                  </td>
                  <td style={{fontSize:'13px', color:'#666', maxWidth:'220px'}}>
                    <div style={{overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>
                      {a.motivation || '-'}
                    </div>
                  </td>
                  <td><span className={`badge badge-${STATUS_MAP[a.status].cls}`}>{STATUS_MAP[a.status].text}</span></td>
                  <td><button className="btn btn-sm btn-default" onClick={()=>setDetail(a)}>查看详情</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <div className="modal-overlay" onClick={()=>setDetail(null)}>
          <div className="modal" style={{maxWidth:'600px'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">申请详情</div><button className="modal-close" onClick={()=>setDetail(null)}>×</button></div>
            <div className="modal-body">
              <div style={{padding:'16px', background:'#f8f9fa', borderRadius:'8px', marginBottom:'16px'}}>
                <div style={{fontWeight:600, fontSize:'16px', marginBottom:'8px'}}>👤 学生信息</div>
                <div className="info-row"><div className="info-label">姓名</div><div className="info-value">{detail.student_name}</div></div>
                <div className="info-row"><div className="info-label">学号</div><div className="info-value">{detail.student_no}</div></div>
                <div className="info-row"><div className="info-label">班级</div><div className="info-value">{detail.class||'未填写'}</div></div>
                <div className="info-row"><div className="info-label">手机</div><div className="info-value">{detail.phone||'未填写'}</div></div>
                <div className="info-row"><div className="info-label">邮箱</div><div className="info-value">{detail.email||'未填写'}</div></div>
              </div>
              <div style={{padding:'16px', background:'#e3f2fd', borderRadius:'8px', marginBottom:'16px'}}>
                <div style={{fontWeight:600, fontSize:'16px', marginBottom:'8px', color:'#1565c0'}}>📋 申请岗位：{detail.position_title}</div>
                <div className="info-row"><div className="info-label">申请时间</div><div className="info-value">{(detail.created_at||'').substring(0,16)}</div></div>
                <div className="info-row"><div className="info-label">当前状态</div><div className="info-value"><span className={`badge badge-${STATUS_MAP[detail.status].cls}`}>{STATUS_MAP[detail.status].text}</span></div></div>
              </div>
              <div style={{marginTop:'8px'}}>
                <div style={{fontWeight:600, marginBottom:'6px'}}>申请动机：</div>
                <div style={{padding:'10px', background:'#fff8e1', borderRadius:'6px', fontSize:'13px', whiteSpace:'pre-wrap'}}>{detail.motivation || '未填写'}</div>
              </div>
              {detail.relevant_experience && (
                <div style={{marginTop:'12px'}}>
                  <div style={{fontWeight:600, marginBottom:'6px'}}>相关经验：</div>
                  <div style={{padding:'10px', background:'#e8f5e9', borderRadius:'6px', fontSize:'13px', whiteSpace:'pre-wrap'}}>{detail.relevant_experience}</div>
                </div>
              )}
              {detail.review_comment && (
                <div style={{marginTop:'12px'}}>
                  <div style={{fontWeight:600, marginBottom:'6px'}}>审核意见：</div>
                  <div style={{padding:'10px', background:'#f3e5f5', borderRadius:'6px', fontSize:'13px'}}>{detail.review_comment}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={()=>setDetail(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
