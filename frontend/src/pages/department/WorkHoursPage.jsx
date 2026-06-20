import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

const STATUS_MAP = {
  submitted: { text: '待审核', cls: 'submitted' },
  approved: { text: '已通过', cls: 'approved' },
  rejected: { text: '已拒绝', cls: 'rejected' }
};

export default function DeptWorkHoursPage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadData(); }, [month]);

  async function loadData() {
    try {
      setLoading(true);
      const [r, s] = await Promise.all([
        api.get('/work-hours'),
        api.get('/work-hours/summary')
      ]);
      setRecords(r);
      setSummary(s);
    } finally { setLoading(false); }
  }

  async function handleApprove(id) {
    try {
      await api.post(`/work-hours/${id}/approve`);
      loadData();
    } catch (e) { alert(e.message); }
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) { alert('请填写驳回原因'); return; }
    try {
      await api.post(`/work-hours/${rejectModal}/reject`, { reviewComment: rejectReason });
      setRejectModal(null); setRejectReason('');
      loadData();
    } catch (e) { alert(e.message); }
  }

  const filtered = records.filter(r => {
    if (tab !== 'all' && r.status !== tab) return false;
    if (month && r.month !== month) return false;
    return true;
  });

  const monthSummary = summary.find(s => s.month === month);

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">⏰ 工时审核</h2>
        <input type="month" className="form-input" value={month} onChange={e=>setMonth(e.target.value)} style={{width:'200px'}} />
      </div>

      <div className="stat-cards">
        <div className="stat-card warning"><div className="stat-label">{month} 待审核</div><div className="stat-value">{records.filter(r=>r.month===month&&r.status==='submitted').length} 条</div><div className="stat-sub">共 {records.filter(r=>r.month===month&&r.status==='submitted').reduce((s,x)=>s+Number(x.hours||0),0)} 小时</div></div>
        <div className="stat-card success"><div className="stat-label">{month} 已通过</div><div className="stat-value">{records.filter(r=>r.month===month&&r.status==='approved').length} 条</div><div className="stat-sub">共 {records.filter(r=>r.month===month&&r.status==='approved').reduce((s,x)=>s+Number(x.hours||0),0)} 小时</div></div>
        <div className="stat-card danger"><div className="stat-label">{month} 已驳回</div><div className="stat-value">{records.filter(r=>r.month===month&&r.status==='rejected').length} 条</div></div>
        <div className="stat-card"><div className="stat-label">本月工资合计</div><div className="stat-value">¥{Number(monthSummary?.approved_salary || 0).toFixed(2)}</div></div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab==='submitted'?'active':''}`} onClick={()=>setTab('submitted')}>待审核 ({records.filter(r=>r.status==='submitted'&&r.month===month).length})</div>
        <div className={`tab ${tab==='approved'?'active':''}`} onClick={()=>setTab('approved')}>已通过</div>
        <div className={`tab ${tab==='rejected'?'active':''}`} onClick={()=>setTab('rejected')}>已驳回</div>
        <div className={`tab ${tab==='all'?'active':''}`} onClick={()=>setTab('all')}>全部</div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">暂无工时记录</div></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>日期</th>
                <th>学生</th>
                <th>岗位</th>
                <th>工时</th>
                <th>工作内容</th>
                <th>状态</th>
                <th>审核意见</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>{r.work_date}</td>
                  <td>
                    <div style={{fontWeight:500}}>{r.student_name}</div>
                    <div style={{fontSize:'12px', color:'#888'}}>{r.student_no}</div>
                  </td>
                  <td>{r.position_title}</td>
                  <td style={{fontWeight:600, color:'#4361ee'}}>{r.hours}h</td>
                  <td style={{fontSize:'13px', color:'#666', maxWidth:'200px'}}>{r.work_content || '-'}</td>
                  <td><span className={`badge badge-${STATUS_MAP[r.status].cls}`}>{STATUS_MAP[r.status].text}</span></td>
                  <td style={{fontSize:'13px', color:'#666', maxWidth:'160px'}}>{r.review_comment || '-'}</td>
                  <td>
                    <div className="actions">
                      {r.status === 'submitted' && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={()=>handleApprove(r.id)}>通过</button>
                          <button className="btn btn-sm btn-danger" onClick={()=>{setRejectModal(r.id); setRejectReason('');}}>驳回</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={()=>setRejectModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">驳回工时</div><button className="modal-close" onClick={()=>setRejectModal(null)}>×</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">请填写驳回原因 *</label>
                <textarea className="form-textarea" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="请说明驳回的具体原因" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={()=>setRejectModal(null)}>取消</button>
              <button className="btn btn-danger" onClick={handleReject}>确认驳回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
