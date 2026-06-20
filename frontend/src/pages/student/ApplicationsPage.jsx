import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

const STATUS_MAP = {
  pending: { text: '待审核', cls: 'pending' },
  approved: { text: '已通过', cls: 'approved' },
  rejected: { text: '已拒绝', cls: 'rejected' },
  assigned: { text: '已分配', cls: 'assigned' }
};

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await api.get('/applications');
      setApplications(data);
    } finally { setLoading(false); }
  }

  async function handleCancel(id) {
    if (!confirm('确定要撤回这条申请吗？')) return;
    try {
      await api.delete(`/applications/${id}`);
      alert('撤回成功');
      loadData();
    } catch (e) { alert(e.message); }
  }

  const filtered = tab === 'all' ? applications : applications.filter(a => a.status === tab);

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">📝 我的申请</h2>
      </div>
      <div className="tabs">
        <div className={`tab ${tab==='all'?'active':''}`} onClick={() => setTab('all')}>全部 ({applications.length})</div>
        <div className={`tab ${tab==='pending'?'active':''}`} onClick={() => setTab('pending')}>待审核 ({applications.filter(a=>a.status==='pending').length})</div>
        <div className={`tab ${tab==='assigned'?'active':''}`} onClick={() => setTab('assigned')}>已分配 ({applications.filter(a=>a.status==='assigned').length})</div>
        <div className={`tab ${tab==='approved'?'active':''}`} onClick={() => setTab('approved')}>已通过 ({applications.filter(a=>a.status==='approved').length})</div>
        <div className={`tab ${tab==='rejected'?'active':''}`} onClick={() => setTab('rejected')}>已拒绝 ({applications.filter(a=>a.status==='rejected').length})</div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">暂无申请记录</div></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>岗位名称</th>
                <th>部门</th>
                <th>薪资</th>
                <th>申请时间</th>
                <th>状态</th>
                <th>审核意见</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{fontWeight:500}}>{a.position_title}</td>
                  <td>{a.department_name}</td>
                  <td>¥{Number(a.hourly_rate).toFixed(0)}/时</td>
                  <td>{(a.created_at||'').substring(0,16)}</td>
                  <td><span className={`badge badge-${STATUS_MAP[a.status].cls}`}>{STATUS_MAP[a.status].text}</span></td>
                  <td style={{color:'#666', fontSize:'13px', maxWidth:'200px'}}>{a.review_comment || '-'}</td>
                  <td>
                    <div className="actions">
                      {a.status === 'pending' && <button className="btn btn-sm btn-danger" onClick={() => handleCancel(a.id)}>撤回</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
