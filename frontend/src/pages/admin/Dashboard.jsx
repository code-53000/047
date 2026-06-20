import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [positions, setPositions] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [s, p, a] = await Promise.all([
        api.get('/assignments/stats'),
        api.get('/positions'),
        api.get('/applications')
      ]);
      setStats(s);
      setPositions(p);
      setRecentApps(a.slice(0, 8));
    } finally { setLoading(false); }
  }

  const posStats = stats?.positions || [];
  const appStats = stats?.applications || [];
  const deptStats = stats?.departments || [];

  const getCount = (arr, key) => (arr.find(x => x.status === key)?.count || 0);

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">📊 统计总览</h2>
      </div>

      <div className="stat-cards">
        <div className="stat-card"><div className="stat-label">岗位总数</div><div className="stat-value">{positions.length}</div></div>
        <div className="stat-card success"><div className="stat-label">招聘中</div><div className="stat-value">{getCount(posStats, 'open')}</div></div>
        <div className="stat-card warning"><div className="stat-label">已关闭</div><div className="stat-value">{getCount(posStats, 'closed')}</div></div>
        <div className="stat-card danger"><div className="stat-label">待审核申请</div><div className="stat-value">{getCount(appStats, 'pending')}</div></div>
        <div className="stat-card success"><div className="stat-label">已分配（在岗）</div><div className="stat-value">{getCount(appStats, 'assigned')}</div></div>
        <div className="stat-card"><div className="stat-label">总已录用人数</div><div className="stat-value">{positions.reduce((s,p)=>s+(p.current_workers||0),0)}</div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">📋 岗位情况（按部门）</div>
          {deptStats.length === 0 ? <div style={{padding:'20px', color:'#999', textAlign:'center'}}>暂无数据</div> : (
            <table className="table">
              <thead>
                <tr><th>部门</th><th>岗位数</th><th>已录用人数</th></tr>
              </thead>
              <tbody>
                {deptStats.map(d => (
                  <tr key={d.id}>
                    <td style={{fontWeight:500}}>{d.name}</td>
                    <td>{d.position_count}</td>
                    <td style={{color:'#2e7d32', fontWeight:500}}>{d.assigned_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-title">📈 招聘进度（热门岗位 TOP）</div>
          {positions.length === 0 ? <div style={{padding:'20px', color:'#999', textAlign:'center'}}>暂无岗位</div> : (
            positions.slice(0, 6).map(p => {
              const progress = Math.round((p.current_workers||0)/p.max_workers*100);
              const full = (p.current_workers||0) >= p.max_workers;
              return (
                <div key={p.id} style={{marginBottom:'16px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px', fontSize:'14px'}}>
                    <span style={{fontWeight:500}}>{p.title} <span style={{color:'#888', fontWeight:'normal', fontSize:'12px'}}>({p.department_name})</span></span>
                    <span style={{color: full ? '#e63946' : '#4361ee'}}>{p.current_workers||0}/{p.max_workers}人</span>
                  </div>
                  <div className="progress-bar" style={{height:'8px'}}>
                    <div className="progress-fill" style={{width:`${progress}%`, background: full ? '#e63946' : undefined}} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
          <div className="card-title" style={{marginBottom:0}}>🕐 最近申请</div>
          <Link to="/admin/assignments" className="btn btn-sm btn-primary">前往审核 →</Link>
        </div>
        {recentApps.length === 0 ? <div style={{padding:'20px', color:'#999', textAlign:'center'}}>暂无申请记录</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>时间</th><th>学生</th><th>学号</th><th>岗位</th><th>部门</th><th>状态</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.map(a => (
                <tr key={a.id}>
                  <td style={{fontSize:'13px', color:'#888'}}>{(a.created_at||'').substring(0,16)}</td>
                  <td style={{fontWeight:500}}>{a.student_name}</td>
                  <td>{a.student_no}</td>
                  <td>{a.position_title}</td>
                  <td>{a.department_name}</td>
                  <td>
                    <span className={`badge badge-${a.status==='assigned'?'assigned':a.status==='approved'?'approved':a.status==='rejected'?'rejected':'pending'}`}>
                      {a.status==='pending'?'待审核':a.status==='approved'?'已通过':a.status==='rejected'?'已拒绝':'已分配'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
