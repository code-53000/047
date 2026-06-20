import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../utils/api.js';

export default function AdminProfile() {
  const { user, fetchCurrentUser } = useAuth();
  const [form, setForm] = useState({});
  const [pwd, setPwd] = useState({old:'', new1:'', new2:''});
  const [saving, setSaving] = useState(false);
  const [chgPwd, setChgPwd] = useState(false);

  useEffect(() => {
    if (user) setForm({ realName: user.real_name, phone: user.phone, email: user.email });
  }, [user]);

  async function handleSave() {
    try {
      setSaving(true);
      await api.put(`/users/${user.id}`, form);
      await fetchCurrentUser();
      alert('保存成功');
    } catch(e){ alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleChgPwd() {
    if (!pwd.old || !pwd.new1) { alert('请填写原密码和新密码'); return; }
    if (pwd.new1 !== pwd.new2) { alert('密码不一致'); return; }
    if (pwd.new1.length < 6) { alert('密码至少6位'); return; }
    try {
      setChgPwd(true);
      await api.put(`/users/${user.id}/password`, { oldPassword: pwd.old, newPassword: pwd.new1 });
      alert('修改成功'); setPwd({old:'',new1:'',new2:''});
    } catch(e){ alert(e.message); }
    finally { setChgPwd(false); }
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-title">👤 管理员账号</div>
        <div style={{display:'flex', alignItems:'center', marginBottom:'20px', padding:'16px', background:'#f3e5f5', borderRadius:'8px'}}>
          <div style={{width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(135deg, #6a1b9a, #880e4f)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', fontWeight:'600', marginRight:'16px'}}>
            {(user?.real_name||'A').charAt(0)}
          </div>
          <div>
            <div style={{fontSize:'18px', fontWeight:'600'}}>{user?.real_name}</div>
            <div style={{color:'#888', fontSize:'13px', marginTop:'4px'}}>账号：{user?.username}</div>
            <div style={{color:'#6a1b9a', fontSize:'13px'}}>角色：系统管理员（学生处）</div>
          </div>
        </div>
        <div className="form-group"><label className="form-label">姓名</label>
          <input className="form-input" value={form.realName||''} onChange={e=>setForm({...form, realName:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">联系电话</label>
          <input className="form-input" value={form.phone||''} onChange={e=>setForm({...form, phone:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">邮箱</label>
          <input className="form-input" value={form.email||''} onChange={e=>setForm({...form, email:e.target.value})} /></div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'保存中...':'保存修改'}</button>
      </div>

      <div className="card">
        <div className="card-title">🔒 修改密码</div>
        <div className="form-group"><label className="form-label">原密码</label>
          <input type="password" className="form-input" value={pwd.old} onChange={e=>setPwd({...pwd, old:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">新密码 (至少6位)</label>
          <input type="password" className="form-input" value={pwd.new1} onChange={e=>setPwd({...pwd, new1:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">确认新密码</label>
          <input type="password" className="form-input" value={pwd.new2} onChange={e=>setPwd({...pwd, new2:e.target.value})} /></div>
        <button className="btn btn-warning" onClick={handleChgPwd} disabled={chgPwd}>{chgPwd?'修改中...':'修改密码'}</button>

        <div style={{marginTop:'24px', padding:'16px', background:'#e8f5e9', borderRadius:'8px'}}>
          <div style={{fontWeight:600, marginBottom:'8px', color:'#2e7d32'}}>💡 管理员工作流程指引</div>
          <ol style={{paddingLeft:'20px', fontSize:'13px', color:'#555', lineHeight:2}}>
            <li>学生在【岗位大厅】浏览并申请岗位</li>
            <li>部门管理员在【岗位管理】发布岗位需求</li>
            <li>在【审核分配】先审核通过学生申请</li>
            <li>审核通过后点击「分配入岗」完成正式分配</li>
            <li><strong>岗位满员后系统会自动关闭报名通道</strong></li>
            <li>学生每月申报工时，部门审核后计入工资</li>
            <li>在【工时查询】可按月份/部门汇总结算</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
