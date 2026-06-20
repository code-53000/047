import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

const STATUS_MAP = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  assigned: '已分配'
};

export default function AdminAssignments() {
  const [tab, setTab] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [allCounts, setAllCounts] = useState({ pending: 0, approved: 0, assigned: 0, rejected: 0 });
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState('');

  useEffect(() => { loadData(); }, [tab, deptFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const depsPromise = api.get('/departments');

      const deptParam = deptFilter ? `?departmentId=${deptFilter}` : '';
      const pendingPromise = api.get('/assignments/pending' + deptParam).catch(() => []);
      const allPromise = api.get('/applications' + deptParam).catch(() => []);

      const [deps, pendingData, allData] = await Promise.all([depsPromise, pendingPromise, allPromise]);
      setDepartments(deps);

      const counts = {
        pending: Array.isArray(pendingData) ? pendingData.length : 0,
        approved: allData.filter(a => a.status === 'approved').length,
        assigned: allData.filter(a => a.status === 'assigned').length,
        rejected: allData.filter(a => a.status === 'rejected').length
      };
      setAllCounts(counts);

      if (tab === 'pending') {
        setApplications(pendingData || []);
      } else {
        setApplications(allData.filter(a => a.status === tab));
      }
    } finally { setLoading(false); }
  }

  async function doApprove() {
    if (!detail) return;
    setActing('approve');
    try {
      await api.post(`/assignments/${detail.id}/approve`, { reviewComment: comment });
      alert('审核通过'); setDetail(null); setComment(''); loadData();
    } catch (e) { alert(e.message); }
    finally { setActing(''); }
  }

  async function doReject() {
    if (!detail) return;
    if (!comment.trim()) { alert('请填写拒绝原因'); return; }
    setActing('reject');
    try {
      await api.post(`/assignments/${detail.id}/reject`, { reviewComment: comment });
      alert('已拒绝'); setDetail(null); setComment(''); loadData();
    } catch (e) { alert(e.message); }
    finally { setActing(''); }
  }

  async function doAssign() {
    if (!detail) return;
    setActing('assign');
    try {
      await api.post(`/assignments/${detail.id}/assign`);
      alert('✅ 分配成功！该学生已正式入岗，岗位人数已更新。若岗位满员将自动关闭。');
      setDetail(null); setComment(''); loadData();
    } catch (e) { alert(e.message); }
    finally { setActing(''); }
  }

  async function doUnassign() {
    if (!detail) return;
    if (!confirm(`确定要取消 ${detail.student_name} 的岗位分配吗？`)) return;
    setActing('unassign');
    try {
      await api.post(`/assignments/${detail.id}/unassign`);
      alert('已取消分配，岗位名额已释放');
      setDetail(null); loadData();
    } catch (e) { alert(e.message); }
    finally { setActing(''); }
  }

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">✅ 审核分配</h2>
      </div>

      <div className="stat-cards">
        <div className="stat-card warning"><div className="stat-label">待审核</div><div className="stat-value">{allCounts.pending} <span style={{fontSize:'14px', fontWeight:'normal'}}>条</span></div></div>
        <div className="stat-card success"><div className="stat-label">已通过（待分配）</div><div className="stat-value">{allCounts.approved} <span style={{fontSize:'14px', fontWeight:'normal'}}>条</span></div></div>
        <div className="stat-card"><div className="stat-label">已分配（在岗）</div><div className="stat-value">{allCounts.assigned} <span style={{fontSize:'14px', fontWeight:'normal'}}>条</span></div></div>
        <div className="stat-card danger"><div className="stat-label">已拒绝</div><div className="stat-value">{allCounts.rejected} <span style={{fontSize:'14px', fontWeight:'normal'}}>条</span></div></div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab==='pending'?'active':''}`} onClick={()=>setTab('pending')}>🔸 待审核</div>
        <div className={`tab ${tab==='approved'?'active':''}`} onClick={()=>setTab('approved')}>✅ 已通过（待分配）</div>
        <div className={`tab ${tab==='assigned'?'active':''}`} onClick={()=>setTab('assigned')}>📌 已分配（在岗）</div>
        <div className={`tab ${tab==='rejected'?'active':''}`} onClick={()=>setTab('rejected')}>❌ 已拒绝</div>
      </div>

      <div className="filter-bar">
        <div className="form-group" style={{minWidth:'200px'}}>
          <select className="form-select" value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
            <option value="">全部部门</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button className="btn btn-default" onClick={loadData}>🔄 刷新</button>
      </div>

      <div className="card">
        {applications.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🎉</div><div className="empty-state-text">暂无数据</div></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>申请时间</th>
                <th>学生信息</th>
                <th>申请岗位</th>
                <th>岗位情况</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(a => {
                const progress = Math.round((a.current_workers||0) / (a.max_workers||1) * 100);
                const full = (a.current_workers||0) >= (a.max_workers||1);
                return (
                  <tr key={a.id}>
                    <td style={{fontSize:'13px', color:'#888'}}>{(a.created_at||'').substring(0,16)}</td>
                    <td>
                      <div style={{fontWeight:500}}>{a.student_name}</div>
                      <div style={{fontSize:'12px', color:'#888'}}>{a.student_no} · {a.class||'-'}</div>
                      <div style={{fontSize:'12px', color:'#888'}}>{a.phone||'无电话'}</div>
                    </td>
                    <td>
                      <div style={{fontWeight:500}}>{a.position_title}</div>
                      <div style={{fontSize:'12px', color:'#888'}}>{a.department_name}</div>
                    </td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <div className="progress-bar" style={{width:'100px'}}><div className="progress-fill" style={{width:`${progress}%`, background: full ? '#e63946' : undefined}} /></div>
                        <span style={{fontSize:'13px'}}>{a.current_workers||0}/{a.max_workers}</span>
                      </div>
                      {full && <div style={{fontSize:'12px', color:'#e63946', marginTop:'4px'}}>已满员</div>}
                    </td>
                    <td>
                      <span className={`badge badge-${a.status==='assigned'?'assigned':a.status==='approved'?'approved':a.status==='rejected'?'rejected':'pending'}`}>
                        {STATUS_MAP[a.status]}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-sm btn-default" onClick={()=>{setDetail(a); setComment('');}}>详情/操作</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <div className="modal-overlay" onClick={()=>setDetail(null)}>
          <div className="modal" style={{maxWidth:'700px'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">申请详情 & 操作</div>
              <button className="modal-close" onClick={()=>setDetail(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2">
                <div style={{padding:'14px', background:'#f8f9fa', borderRadius:'8px'}}>
                  <div style={{fontWeight:600, marginBottom:'8px'}}>👤 学生信息</div>
                  <div className="info-row"><div className="info-label">姓名</div><div className="info-value" style={{fontWeight:500}}>{detail.student_name}</div></div>
                  <div className="info-row"><div className="info-label">学号</div><div className="info-value">{detail.student_no}</div></div>
                  <div className="info-row"><div className="info-label">班级</div><div className="info-value">{detail.class||'-'}</div></div>
                  <div className="info-row"><div className="info-label">手机</div><div className="info-value">{detail.phone||'-'}</div></div>
                  <div className="info-row"><div className="info-label">邮箱</div><div className="info-value">{detail.email||'-'}</div></div>
                </div>
                <div style={{padding:'14px', background:'#e3f2fd', borderRadius:'8px'}}>
                  <div style={{fontWeight:600, marginBottom:'8px', color:'#1565c0'}}>📋 岗位信息</div>
                  <div className="info-row"><div className="info-label">岗位</div><div className="info-value" style={{fontWeight:500}}>{detail.position_title}</div></div>
                  <div className="info-row"><div className="info-label">部门</div><div className="info-value">{detail.department_name}</div></div>
                  <div className="info-row"><div className="info-label">时薪</div><div className="info-value">¥{Number(detail.hourly_rate||15).toFixed(2)}</div></div>
                  <div className="info-row"><div className="info-label">周工时</div><div className="info-value">{detail.weekly_hours}小时</div></div>
                  <div className="info-row"><div className="info-label">招聘</div><div className="info-value">{detail.current_workers||0}/{detail.max_workers}人 {(detail.current_workers||0)>=(detail.max_workers||1)?'（已满）':''}</div></div>
                </div>
              </div>

              {detail.motivation && (
                <div style={{marginTop:'16px'}}>
                  <div style={{fontWeight:600, marginBottom:'6px'}}>💡 申请动机：</div>
                  <div style={{padding:'10px', background:'#fff8e1', borderRadius:'6px', fontSize:'13px', whiteSpace:'pre-wrap'}}>{detail.motivation}</div>
                </div>
              )}
              {detail.relevant_experience && (
                <div style={{marginTop:'12px'}}>
                  <div style={{fontWeight:600, marginBottom:'6px'}}>📚 相关经验：</div>
                  <div style={{padding:'10px', background:'#e8f5e9', borderRadius:'6px', fontSize:'13px', whiteSpace:'pre-wrap'}}>{detail.relevant_experience}</div>
                </div>
              )}
              {detail.review_comment && (
                <div style={{marginTop:'12px'}}>
                  <div style={{fontWeight:600, marginBottom:'6px'}}>📝 审核意见：</div>
                  <div style={{padding:'10px', background:'#f3e5f5', borderRadius:'6px', fontSize:'13px'}}>{detail.review_comment}</div>
                </div>
              )}

              <div style={{marginTop:'16px', padding:'14px', background:'#fff3e0', borderRadius:'8px'}}>
                <div style={{fontWeight:600, marginBottom:'8px', color:'#e65100'}}>⚡ 操作面板 - 当前状态：{STATUS_MAP[detail.status]}</div>
                <div className="form-group">
                  <label className="form-label">审核/操作备注（拒绝时必填）</label>
                  <textarea className="form-textarea" value={comment} onChange={e=>setComment(e.target.value)}
                    placeholder={detail.status==='rejected'?'请填写拒绝原因...':'如：条件符合，同意录用；或：经验不足，暂不匹配...'} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={()=>setDetail(null)} disabled={acting}>关闭</button>
              {detail.status === 'pending' && (
                <>
                  <button className="btn btn-danger" onClick={doReject} disabled={acting}>{acting==='reject'?'处理中...':'❌ 拒绝'}</button>
                  <button className="btn btn-success" onClick={doApprove} disabled={acting}>{acting==='approve'?'处理中...':'✅ 审核通过'}</button>
                </>
              )}
              {detail.status === 'approved' && (
                <button className="btn btn-primary" onClick={doAssign} disabled={acting || (detail.current_workers||0) >= (detail.max_workers||1)}>
                  {acting==='assign'?'处理中...': (detail.current_workers||0) >= (detail.max_workers||1) ? '岗位已满，无法分配' : '📌 分配入岗'}
                </button>
              )}
              {detail.status === 'assigned' && (
                <button className="btn btn-warning" onClick={doUnassign} disabled={acting}>
                  {acting==='unassign'?'处理中...':'↩️ 取消分配'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
