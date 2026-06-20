import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

const STATUS_MAP = {
  submitted: { text: '待审核', cls: 'submitted' },
  approved: { text: '已通过', cls: 'approved' },
  rejected: { text: '已拒绝', cls: 'rejected' }
};

export default function StudentWorkHoursPage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('records');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ applicationId: '', workDate: new Date().toISOString().substring(0,10), hours: '', workContent: '' });

  useEffect(() => { loadData(); }, [month]);

  async function loadData() {
    try {
      setLoading(true);
      const [r, s, a] = await Promise.all([
        api.get('/work-hours'),
        api.get('/work-hours/summary'),
        api.get('/applications?status=assigned')
      ]);
      setRecords(r);
      setSummary(s);
      setApps(a);
    } finally { setLoading(false); }
  }

  async function handleSubmit() {
    if (!form.applicationId || !form.workDate || !form.hours) {
      alert('请填写必填项'); return;
    }
    try {
      await api.post('/work-hours', form);
      alert('提交成功，等待部门审核');
      setShowModal(false);
      setForm({ applicationId: '', workDate: new Date().toISOString().substring(0,10), hours: '', workContent: '' });
      loadData();
    } catch (e) { alert(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除这条记录吗？')) return;
    try {
      await api.delete(`/work-hours/${id}`);
      loadData();
    } catch (e) { alert(e.message); }
  }

  const currentMonthSummary = summary.filter(s => s.month === month)[0] || {};
  const monthRecords = records.filter(r => r.month === month);

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">⏰ 工时申报</h2>
        <div style={{display:'flex', gap:'12px'}}>
          <input type="month" className="form-input" value={month} onChange={e => setMonth(e.target.value)} style={{width:'200px'}} />
          <button className="btn btn-primary" onClick={() => apps.length ? setShowModal(true) : alert('您目前没有已分配的岗位，请先申请岗位')}>+ 申报工时</button>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card success">
          <div className="stat-label">本月已通过工时</div>
          <div className="stat-value">{currentMonthSummary.approved_hours || 0} <span style={{fontSize:'14px', fontWeight:'normal'}}>小时</span></div>
          <div className="stat-sub">本月工资：¥{Number(currentMonthSummary.approved_salary || 0).toFixed(2)}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">待审核工时</div>
          <div className="stat-value">{currentMonthSummary.pending_hours || 0} <span style={{fontSize:'14px', fontWeight:'normal'}}>小时</span></div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">被驳回工时</div>
          <div className="stat-value">{currentMonthSummary.rejected_hours || 0} <span style={{fontSize:'14px', fontWeight:'normal'}}>小时</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">累计通过工时</div>
          <div className="stat-value">{summary.reduce((s,x)=>s+(Number(x.approved_hours)||0),0)} <span style={{fontSize:'14px', fontWeight:'normal'}}>小时</span></div>
          <div className="stat-sub">累计工资：¥{Number(summary.reduce((s,x)=>s+(Number(x.approved_salary)||0),0)).toFixed(2)}</div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab==='records'?'active':''}`} onClick={() => setTab('records')}>本月明细</div>
        <div className={`tab ${tab==='summary'?'active':''}`} onClick={() => setTab('summary')}>月度汇总</div>
        <div className={`tab ${tab==='all'?'active':''}`} onClick={() => setTab('all')}>全部记录</div>
      </div>

      {tab === 'records' && (
        <div className="card">
          <div className="card-title">{month} 工时明细</div>
          {monthRecords.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">本月暂无工时记录</div></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>岗位</th>
                  <th>部门</th>
                  <th>工时</th>
                  <th>工作内容</th>
                  <th>状态</th>
                  <th>审核意见</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {monthRecords.map(r => (
                  <tr key={r.id}>
                    <td>{r.work_date}</td>
                    <td>{r.position_title}</td>
                    <td>{r.department_name}</td>
                    <td style={{fontWeight:600, color:'#4361ee'}}>{r.hours}h</td>
                    <td style={{maxWidth:'240px', fontSize:'13px', color:'#666'}}>{r.work_content || '-'}</td>
                    <td><span className={`badge badge-${STATUS_MAP[r.status].cls}`}>{STATUS_MAP[r.status].text}</span></td>
                    <td style={{color:'#666', fontSize:'13px', maxWidth:'160px'}}>{r.review_comment || '-'}</td>
                    <td>
                      {r.status === 'submitted' && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>删除</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'summary' && (
        <div className="card">
          <div className="card-title">月度汇总</div>
          {summary.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">暂无工时汇总数据</div></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>月份</th>
                  <th>记录数</th>
                  <th>通过工时</th>
                  <th>待审核</th>
                  <th>被驳回</th>
                  <th>应发工资</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s, i) => (
                  <tr key={i}>
                    <td style={{fontWeight:500}}>{s.month}</td>
                    <td>{s.record_count}</td>
                    <td style={{color:'#2e7d32', fontWeight:500}}>{s.approved_hours || 0}h</td>
                    <td style={{color:'#ef6c00'}}>{s.pending_hours || 0}h</td>
                    <td style={{color:'#c62828'}}>{s.rejected_hours || 0}h</td>
                    <td style={{fontWeight:600, color:'#4361ee'}}>¥{Number(s.approved_salary || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'all' && (
        <div className="card">
          <div className="card-title">全部历史记录</div>
          {records.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">暂无工时记录</div></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>岗位</th>
                  <th>部门</th>
                  <th>工时</th>
                  <th>工作内容</th>
                  <th>所属月份</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>{r.work_date}</td>
                    <td>{r.position_title}</td>
                    <td>{r.department_name}</td>
                    <td style={{fontWeight:600, color:'#4361ee'}}>{r.hours}h</td>
                    <td style={{maxWidth:'240px', fontSize:'13px', color:'#666'}}>{r.work_content || '-'}</td>
                    <td>{r.month}</td>
                    <td><span className={`badge badge-${STATUS_MAP[r.status].cls}`}>{STATUS_MAP[r.status].text}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">📝 申报工时</div><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">岗位 *</label>
                <select className="form-select" value={form.applicationId} onChange={e => setForm({...form, applicationId: e.target.value})}>
                  <option value="">请选择已分配的岗位</option>
                  {apps.map(a => <option key={a.id} value={a.id}>{a.position_title} - {a.department_name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">工作日期 *</label>
                  <input type="date" className="form-input" value={form.workDate} onChange={e => setForm({...form, workDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">工时(小时) *</label>
                  <input type="number" step="0.5" min="0.5" max="24" className="form-input" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} placeholder="如：4" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">工作内容</label>
                <textarea className="form-textarea" value={form.workContent} onChange={e => setForm({...form, workContent: e.target.value})} placeholder="请简要填写当天的工作内容" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
