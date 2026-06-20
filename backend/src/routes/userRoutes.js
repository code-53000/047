const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const { role, keyword, departmentId } = req.query;
    let sql = `
      SELECT u.id, u.username, u.real_name, u.role, u.student_no, u.class,
             u.phone, u.email, u.department_id, u.status,
             d.name as department_name
      FROM users u LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (role) {
      sql += ' AND u.role = ?';
      params.push(role);
    }
    if (departmentId) {
      sql += ' AND u.department_id = ?';
      params.push(departmentId);
    }
    if (keyword) {
      sql += ' AND (u.real_name LIKE ? OR u.username LIKE ? OR u.student_no LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    sql += ' ORDER BY u.role, u.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const { username, password, realName, role, studentNo, className, phone, email, departmentId } = req.body;
    if (!username || !password || !realName || !role) {
      return res.status(400).json({ error: '请填写必填项' });
    }
    if (!['student', 'department', 'admin'].includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    if (role === 'student' && studentNo) {
      const [s] = await pool.query('SELECT id FROM users WHERE student_no = ?', [studentNo]);
      if (s.length > 0) return res.status(400).json({ error: '学号已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (username, password, real_name, role, student_no, class, phone, email, department_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, realName, role,
       studentNo || null, className || null, phone || null, email || null,
       (role === 'department' && departmentId) ? departmentId : null]
    );
    res.status(201).json({ id: result.insertId, message: '创建成功' });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && String(req.user.id) !== String(id)) {
      return res.status(403).json({ error: '无权限修改' });
    }

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const { realName, phone, email, className, status, departmentId, password } = req.body;
    let hashedPassword = existing[0].password;
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
    }

    let sql, params;
    if (req.user.role === 'admin') {
      sql = `UPDATE users SET real_name = ?, phone = ?, email = ?, class = ?, 
                    status = ?, department_id = ?, password = ? WHERE id = ?`;
      params = [
        realName || existing[0].real_name,
        phone !== undefined ? phone : existing[0].phone,
        email !== undefined ? email : existing[0].email,
        className !== undefined ? className : existing[0].class,
        status || existing[0].status,
        departmentId !== undefined ? departmentId : existing[0].department_id,
        hashedPassword,
        id
      ];
    } else {
      sql = `UPDATE users SET real_name = ?, phone = ?, email = ?, password = ? WHERE id = ?`;
      params = [
        realName || existing[0].real_name,
        phone !== undefined ? phone : existing[0].phone,
        email !== undefined ? email : existing[0].email,
        hashedPassword,
        id
      ];
    }

    await pool.query(sql, params);
    res.json({ message: '更新成功' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ error: '不能删除自己' });
    }
    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
