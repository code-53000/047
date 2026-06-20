import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../utils/api.js';

export default function DeptProfilePage() {
  const { user, fetchCurrentUser } = useAuth();
  const [dept, setDept] = useState(null);
  const [form, setForm] = useState({});
  const [pwd, setPwd] = useState({ old:'', new1:'', new2:'' });
  const [saving, setSaving] = useState(false);
  const [chgPwd, setChgPwd] = useState(false);

  useEffect(() => {
    loadDept();
    if (user) setForm({ realName: user.real_name, phone: user.phone, email: user.email });
  }, [user]);

  async function loadDept() {
    if (!user?.department_id) return;
    const list = await api.get('/departments');
    setDept(list.find(d => d.id === user.department_id));
  }

  async function handleSave() {
    try {
      setSaving(true);
      await api.put(`/users/${user.id}`, form);
      await fetchCurrentUser();
      alert('保存成功');
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleChgPwd() {
    if (!pwd.new1 || pwd.new1 !== pwd.new2) { alert('密码不一致或未填写'); return; }
    if (pwd.new1.length < 6) { alert('密码至少6位'); return; }
    try {
      setChgPwd(true);
      await api.put(`/users/${user.id}`, { password: pwd.new1 });
      alert('修改成功'); setPwd({old:'',new1:'',new2:''});
    } catch(e){ alert(e.message); }
    finally { setChgPwd(false); }
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-title">🏢 部门信息</div>
        {dept ? (
          <>
            <div className="info-row"><div className="info-label">部门名称</div><div className="info-value">{dept.name}</div></div>
            <div className="info-row"><div className="info-label">负责人</div><div className="info-value">{dept.contact_name}</div></div>
            <div className="info-row"><div className="info-label">联系电话</div><div className="info-value">{dept.contact_phone||'-'}</div></div>
            <div className="info-row"><div className="info-label">岗位数量</div><div className="info-value">{dept.position_count||0}</div></div>
            <div className="info-row"><div className="info-label">部门简介</div><div className="info-value" style={{whiteSpace:'pre-wrap'}}>{dept.description||'-'}</div></div>
          </>
        ) : <div style={{color:'#999'}}>加载中...</div>}
      </div>
      <div className="card">
        <div className="card-title">👤 账号设置</div>
        <div style={{display:'flex', alignItems:'center', marginBottom:'20px', padding:'16px', background:'#f8f9fa', borderRadius:'8px'}}>
          <div style={{width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg, #1565c0, #00838f)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:'600', marginRight:'16px'}}>
            {(user?.real_name||'U').charAt(0)}
          </div>
          <div>
            <div style={{fontSize:'17px', fontWeight:'600'}}>{user?.real_name}</div>
            <div style={{color:'#888', fontSize:'13px', marginTop:'4px'}}>账号：{user?.username}（部门管理员）</div>
          </div>
        </div>
        <div className="form-group"><label className="form-label">姓名</label><input className="form-input" value={form.realName||''} onChange={e=>setForm({...form, realName:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">联系电话</label><input className="form-input" value={form.phone||''} onChange={e=>setForm({...form, phone:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">邮箱</label><input className="form-input" value={form.email||''} onChange={e=>setForm({...form, email:e.target.value})} /></div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'保存中...':'保存修改'}</button>

        <div style={{marginTop:'24px', paddingTop:'16px', borderTop:'1px solid #f0f0f0'}}>
          <div style={{fontWeight:600, marginBottom:'12px'}}>🔒 修改密码</div>
          <div className="form-group"><label className="form-label">原密码</label><input type="password" className="form-input" value={pwd.old} onChange={e=>setPwd({...pwd,old:e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">新密码</label><input type="password" className="form-input" value={pwd.new1} onChange={e=>setPwd({...pwd,new1:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">确认</label><input type="password" className="form-input" value={pwd.new2} onChange={e=>setPwd({...pwd,new2:e.target.value})} /></div>
          </div>
          <button className="btn btn-warning" onClick={handleChgPwd} disabled={chgPwd}>{chgPwd?'修改中...':'修改密码'}</button>
        </div>
      </div>
    </div>
  );
}
