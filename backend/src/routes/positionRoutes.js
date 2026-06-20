const express = require('express');
const { pool } = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, departmentId, keyword } = req.query;
    let sql = `
      SELECT p.*, d.name as department_name, u.real_name as creator_name,
             (SELECT COUNT(*) FROM applications a WHERE a.position_id = p.id AND a.status IN ('approved','assigned')) as application_count
      FROM positions p 
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    if (departmentId) {
      sql += ' AND p.department_id = ?';
      params.push(departmentId);
    }
    if (keyword) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (req.user.role === 'department') {
      sql += ' AND p.department_id = ?';
      params.push(req.user.departmentId);
    }

    sql += ' ORDER BY p.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, d.name as department_name, u.real_name as creator_name,
              (SELECT COUNT(*) FROM applications a WHERE a.position_id = p.id AND a.status IN ('approved','assigned')) as application_count
       FROM positions p 
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: '岗位不存在' });
    }

    const position = rows[0];
    const [applicants] = await pool.query(
      `SELECT a.*, u.real_name, u.student_no, u.class, u.phone, u.email
       FROM applications a
       LEFT JOIN users u ON a.student_id = u.id
       WHERE a.position_id = ?
       ORDER BY a.created_at DESC`,
      [id]
    );
    position.applicants = applicants;
    res.json(position);
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, roleMiddleware('department', 'admin'), async (req, res, next) => {
  try {
    const { title, description, requirements, weeklyHours, hourlyRate, maxWorkers, semester, location } = req.body;
    if (!title || !description || !requirements || !weeklyHours || !maxWorkers || !semester) {
      return res.status(400).json({ error: '请填写必填项' });
    }

    let departmentId = req.body.departmentId;
    if (req.user.role === 'department') {
      departmentId = req.user.departmentId;
    }
    if (!departmentId) {
      return res.status(400).json({ error: '请选择所属部门' });
    }

    const [result] = await pool.query(
      `INSERT INTO positions (title, department_id, description, requirements, weekly_hours, hourly_rate, max_workers, semester, location, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, departmentId, description, requirements, weeklyHours, hourlyRate || 15.00, maxWorkers, semester, location || '', req.user.id]
    );

    const [newPos] = await pool.query('SELECT * FROM positions WHERE id = ?', [result.insertId]);
    res.status(201).json(newPos[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authMiddleware, roleMiddleware('department', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, requirements, weeklyHours, hourlyRate, maxWorkers, semester, location, status } = req.body;

    const [existing] = await pool.query('SELECT * FROM positions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '岗位不存在' });
    }
    const position = existing[0];

    if (req.user.role === 'department' && position.department_id !== req.user.departmentId) {
      return res.status(403).json({ error: '只能修改本部门岗位' });
    }

    if (maxWorkers !== undefined && maxWorkers < position.current_workers) {
      return res.status(400).json({ error: '最大人数不能小于当前已分配人数' });
    }

    await pool.query(
      `UPDATE positions SET title = ?, description = ?, requirements = ?, weekly_hours = ?, hourly_rate = ?, max_workers = ?, semester = ?, location = ?, status = ?
       WHERE id = ?`,
      [
        title || position.title,
        description || position.description,
        requirements || position.requirements,
        weeklyHours !== undefined ? weeklyHours : position.weekly_hours,
        hourlyRate !== undefined ? hourlyRate : position.hourly_rate,
        maxWorkers !== undefined ? maxWorkers : position.max_workers,
        semester || position.semester,
        location !== undefined ? location : position.location,
        status || position.status,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM positions WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('department', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM positions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '岗位不存在' });
    }

    if (req.user.role === 'department' && existing[0].department_id !== req.user.departmentId) {
      return res.status(403).json({ error: '只能删除本部门岗位' });
    }

    const [apps] = await pool.query("SELECT COUNT(*) as cnt FROM applications WHERE position_id = ? AND status IN ('approved', 'assigned')", [id]);
    if (apps[0].cnt > 0) {
      return res.status(400).json({ error: '该岗位已有录用或已分配的申请，无法删除' });
    }

    await pool.query('DELETE FROM positions WHERE id = ?', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authMiddleware, roleMiddleware('department', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['open', 'closed', 'archived'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    const [existing] = await pool.query('SELECT * FROM positions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '岗位不存在' });
    }
    if (req.user.role === 'department' && existing[0].department_id !== req.user.departmentId) {
      return res.status(403).json({ error: '只能操作本部门岗位' });
    }

    await pool.query('UPDATE positions SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: '状态更新成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
