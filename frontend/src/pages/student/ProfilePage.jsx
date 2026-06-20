import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../utils/api.js';

export default function StudentProfilePage() {
  const { user, fetchCurrentUser, setUser } = useAuth();
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ old: '', new1: '', new2: '' });
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    if (user) setForm({ realName: user.real_name, phone: user.phone, email: user.email, className: user.class });
  }, [user]);

  const handleChange = (e, target) => {
    const t = target || setForm;
    t({ ...(target ? passwordForm : form), [e.target.name]: e.target.value });
  };

  async function handleSave() {
    try {
      setSaving(true);
      await api.put(`/users/${user.id}`, form);
      await fetchCurrentUser();
      alert('保存成功');
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleChangePwd() {
    if (!passwordForm.old || !passwordForm.new1) { alert('请填写完整'); return; }
    if (passwordForm.new1 !== passwordForm.new2) { alert('两次新密码不一致'); return; }
    if (passwordForm.new1.length < 6) { alert('新密码至少6位'); return; }
    try {
      setChangingPwd(true);
      await api.put(`/users/${user.id}`, { password: passwordForm.new1 });
      alert('密码修改成功');
      setPasswordForm({ old: '', new1: '', new2: '' });
    } catch (e) { alert(e.message); }
    finally { setChangingPwd(false); }
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-title">👤 基本信息</div>
        <div style={{display:'flex', alignItems:'center', marginBottom:'20px', padding:'16px', background:'#f8f9fa', borderRadius:'8px'}}>
          <div style={{width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(135deg, #4361ee, #7209b7)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', fontWeight:'600', marginRight:'16px'}}>
            {(user?.real_name||'U').charAt(0)}
          </div>
          <div>
            <div style={{fontSize:'18px', fontWeight:'600'}}>{user?.real_name}</div>
            <div style={{color:'#888', fontSize:'13px', marginTop:'4px'}}>学号：{user?.student_no}</div>
            <div style={{color:'#888', fontSize:'13px'}}>班级：{user?.class || '未设置'}</div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">真实姓名</label>
          <input className="form-input" name="realName" value={form.realName||''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">班级</label>
          <input className="form-input" name="className" value={form.className||''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">手机号</label>
          <input className="form-input" name="phone" value={form.phone||''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">邮箱</label>
          <input className="form-input" name="email" value={form.email||''} onChange={handleChange} />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'保存中...':'保存修改'}</button>
      </div>

      <div className="card">
        <div className="card-title">🔒 修改密码</div>
        <div className="form-group">
          <label className="form-label">原密码</label>
          <input type="password" className="form-input" name="old" value={passwordForm.old} onChange={e => handleChange(e, setPasswordForm)} />
        </div>
        <div className="form-group">
          <label className="form-label">新密码 (至少6位)</label>
          <input type="password" className="form-input" name="new1" value={passwordForm.new1} onChange={e => handleChange(e, setPasswordForm)} />
        </div>
        <div className="form-group">
          <label className="form-label">确认新密码</label>
          <input type="password" className="form-input" name="new2" value={passwordForm.new2} onChange={e => handleChange(e, setPasswordForm)} />
        </div>
        <button className="btn btn-warning" onClick={handleChangePwd} disabled={changingPwd}>{changingPwd?'修改中...':'修改密码'}</button>

        <div style={{marginTop:'32px', padding:'16px', background:'#e3f2fd', borderRadius:'8px'}}>
          <div style={{fontWeight:600, marginBottom:'8px', color:'#1565c0'}}>💡 使用提示</div>
          <ul style={{paddingLeft:'20px', fontSize:'13px', color:'#555', lineHeight:1.8}}>
            <li>每位学生最多可被分配 2 个勤工俭学岗位</li>
            <li>申请提交后，待学生处老师审核通过并分配至岗位</li>
            <li>岗位满员后将自动关闭报名通道</li>
            <li>每月请及时申报工时，部门审核通过后计入当月工资</li>
            <li>如有疑问，请联系学生处老师</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
