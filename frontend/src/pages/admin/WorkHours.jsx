import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

const STATUS_MAP = {
  submitted: { text: '待审核', cls: 'submitted' },
  approved: { text: '已通过', cls: 'approved' },
  rejected: { text: '已拒绝', cls: 'rejected' }
};

export default function AdminWorkHours() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('records');
  const [month, setMonth] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');

  useEffect(() => { loadData(); }, [month, deptFilter, studentFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      if (deptFilter) params.set('departmentId', deptFilter);
      if (studentFilter) params.set('studentId', studentFilter);
      const [r, s, d] = await Promise.all([
        api.get(`/work-hours?${params}`),
        api.get(`/work-hours/summary?${params}`),
        api.get('/departments')
      ]);
      setRecords(r);
      setSummary(s);
      setDepartments(d);
    } finally { setLoading(false); }
  }

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  const totalApproved = records.filter(r=>r.status==='approved').reduce((s,x)=>s+Number(x.hours||0),0);
  const totalPending = records.filter(r=>r.status==='submitted').reduce((s,x)=>s+Number(x.hours||0),0);
  const totalSalary = records.filter(r=>r.status==='approved').reduce((s,x)=>s+Number(x.hours||0)*Number(x.hourly_rate||15),0);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">⏰ 工时查询 & 结算</h2>
      </div>

      <div className="filter-bar">
        <input type="month" className="form-input" value={month} onChange={e=>setMonth(e.target.value)} style={{width:'200px'}} placeholder="月份" />
        <div className="form-group"><select className="form-select" value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
          <option value="">全部部门</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select></div>
        <input className="form-input" placeholder="输入学生ID精确筛选" style={{width:'160px'}}
          value={studentFilter} onChange={e=>setStudentFilter(e.target.value.replace(/\D/g,''))} />
        <button className="btn btn-default" onClick={()=>{setMonth('');setDeptFilter('');setStudentFilter('');}}>重置</button>
        <button className="btn btn-default" onClick={loadData}>刷新</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card"><div className="stat-label">记录总数</div><div className="stat-value">{records.length}</div></div>
        <div className="stat-card success"><div className="stat-label">已通过工时</div><div className="stat-value">{totalApproved.toFixed(1)}h</div></div>
        <div className="stat-card warning"><div className="stat-label">待审核工时</div><div className="stat-value">{totalPending.toFixed(1)}h</div></div>
        <div className="stat-card danger"><div className="stat-label">工资合计（已通过）</div><div className="stat-value">¥{Number(totalSalary).toFixed(2)}</div></div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab==='records'?'active':''}`} onClick={()=>setTab('records')}>明细记录</div>
        <div className={`tab ${tab==='summary'?'active':''}`} onClick={()=>setTab('summary')}>月度汇总（按学生）</div>
      </div>

      {tab === 'records' && (
        <div className="card">
          {records.length===0 ? (
            <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">暂无工时记录</div></div>
          ) : (
            <table className="table">
              <thead><tr>
                <th>日期</th><th>学生</th><th>学号</th><th>岗位</th><th>部门</th>
                <th>工时</th><th>状态</th><th>审核人</th><th>审核意见</th><th>月份</th>
              </tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>{r.work_date}</td>
                    <td style={{fontWeight:500}}>{r.student_name}</td>
                    <td>{r.student_no}</td>
                    <td>{r.position_title}</td>
                    <td>{r.department_name}</td>
                    <td style={{fontWeight:600, color:'#4361ee'}}>{r.hours}h</td>
                    <td><span className={`badge badge-${STATUS_MAP[r.status].cls}`}>{STATUS_MAP[r.status].text}</span></td>
                    <td style={{fontSize:'13px'}}>{r.reviewer_name||'-'}</td>
                    <td style={{fontSize:'13px', color:'#666', maxWidth:'140px'}}>{r.review_comment||'-'}</td>
                    <td>{r.month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'summary' && (
        <div className="card">
          {summary.length===0 ? (
            <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">暂无汇总数据</div></div>
          ) : (
            <table className="table">
              <thead><tr>
                <th>月份</th><th>学生</th><th>学号</th><th>班级</th><th>部门</th>
                <th>记录数</th><th>通过工时</th><th>待审核</th><th>被驳回</th><th>应发工资</th>
              </tr></thead>
              <tbody>
                {summary.map((s,i) => (
                  <tr key={i}>
                    <td style={{fontWeight:500}}>{s.month}</td>
                    <td style={{fontWeight:500}}>{s.student_name}</td>
                    <td>{s.student_no}</td>
                    <td>{s.class||'-'}</td>
                    <td>{s.department_name||'多部门'}</td>
                    <td>{s.record_count}</td>
                    <td style={{color:'#2e7d32', fontWeight:500}}>{s.approved_hours||0}h</td>
                    <td style={{color:'#ef6c00'}}>{s.pending_hours||0}h</td>
                    <td style={{color:'#c62828'}}>{s.rejected_hours||0}h</td>
                    <td style={{fontWeight:600, color:'#4361ee'}}>¥{Number(s.approved_salary||0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
