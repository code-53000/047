const express = require('express');
const { pool } = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware('student'), async (req, res, next) => {
  try {
    const { positionId, motivation, relevantExperience } = req.body;
    if (!positionId) {
      return res.status(400).json({ error: '请选择岗位' });
    }

    const [pos] = await pool.query('SELECT * FROM positions WHERE id = ?', [positionId]);
    if (pos.length === 0) {
      return res.status(404).json({ error: '岗位不存在' });
    }
    if (pos[0].status !== 'open') {
      return res.status(400).json({ error: '该岗位已关闭报名' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM applications WHERE position_id = ? AND student_id = ?',
      [positionId, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: '您已申请过该岗位，请勿重复申请' });
    }

    const [assigned] = await pool.query(
      "SELECT COUNT(*) as cnt FROM applications WHERE student_id = ? AND status = 'assigned'",
      [req.user.id]
    );
    if (assigned[0].cnt >= 2) {
      return res.status(400).json({ error: '每位学生最多只能被分配2个岗位' });
    }

    const [result] = await pool.query(
      `INSERT INTO applications (position_id, student_id, motivation, relevant_experience)
       VALUES (?, ?, ?, ?)`,
      [positionId, req.user.id, motivation || '', relevantExperience || '']
    );

    const [newApp] = await pool.query(
      `SELECT a.*, p.title as position_title, d.name as department_name
       FROM applications a
       LEFT JOIN positions p ON a.position_id = p.id
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE a.id = ?`,
      [result.insertId]
    );
    res.status(201).json(newApp[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, positionId } = req.query;
    let sql = `
      SELECT a.*, p.title as position_title, p.weekly_hours, p.hourly_rate, p.location,
             d.name as department_name, u.real_name as student_name, u.student_no, u.class, u.phone
      FROM applications a
      LEFT JOIN positions p ON a.position_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users u ON a.student_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'student') {
      sql += ' AND a.student_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'department') {
      sql += ' AND p.department_id = ?';
      params.push(req.user.departmentId);
    } else if (req.user.role === 'admin' && req.query.departmentId) {
      sql += ' AND p.department_id = ?';
      params.push(Number(req.query.departmentId));
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (positionId) {
      sql += ' AND a.position_id = ?';
      params.push(positionId);
    }

    sql += ' ORDER BY a.created_at DESC';
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
      `SELECT a.*, p.title as position_title, p.description as position_desc, p.requirements,
              p.weekly_hours, p.hourly_rate, p.location, p.semester,
              d.name as department_name, d.contact_name, d.contact_phone,
              u.real_name as student_name, u.student_no, u.class, u.phone, u.email
       FROM applications a
       LEFT JOIN positions p ON a.position_id = p.id
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN users u ON a.student_id = u.id
       WHERE a.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: '申请不存在' });
    }
    const app = rows[0];
    if (req.user.role === 'student' && app.student_id !== req.user.id) {
      return res.status(403).json({ error: '无权查看此申请' });
    }
    if (req.user.role === 'department' && app.department_id !== req.user.departmentId) {
      return res.status(403).json({ error: '无权查看此申请' });
    }
    res.json(app);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('student'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      'SELECT * FROM applications WHERE id = ? AND student_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: '申请不存在' });
    }
    if (existing[0].status !== 'pending') {
      return res.status(400).json({ error: '该申请已被审核，无法撤回' });
    }
    await pool.query('DELETE FROM applications WHERE id = ?', [id]);
    res.json({ message: '申请已撤回' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
