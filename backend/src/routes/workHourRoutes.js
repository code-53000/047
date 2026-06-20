const express = require('express');
const { pool } = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware('student'), async (req, res, next) => {
  try {
    const { applicationId, workDate, hours, workContent } = req.body;
    if (!applicationId || !workDate || !hours) {
      return res.status(400).json({ error: '请填写必填项' });
    }
    if (hours <= 0 || hours > 24) {
      return res.status(400).json({ error: '工时必须在0-24之间' });
    }

    const [apps] = await pool.query(
      'SELECT * FROM applications WHERE id = ? AND student_id = ? AND status = ?',
      [applicationId, req.user.id, 'assigned']
    );
    if (apps.length === 0) {
      return res.status(400).json({ error: '该申请不存在或未分配，无法申报工时' });
    }

    const month = workDate.substring(0, 7);
    const [result] = await pool.query(
      `INSERT INTO work_hours (application_id, position_id, student_id, work_date, hours, work_content, month)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [applicationId, apps[0].position_id, req.user.id, workDate, hours, workContent || '', month]
    );

    const [record] = await pool.query(
      `SELECT w.*, p.title as position_title, d.name as department_name
       FROM work_hours w LEFT JOIN positions p ON w.position_id = p.id
       LEFT JOIN departments d ON p.department_id = d.id WHERE w.id = ?`,
      [result.insertId]
    );
    res.status(201).json(record[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, month, studentId, positionId, departmentId } = req.query;
    let sql = `
      SELECT w.*, p.title as position_title, d.name as department_name,
             u.real_name as student_name, u.student_no, u.class,
             ru.real_name as reviewer_name
      FROM work_hours w
      LEFT JOIN positions p ON w.position_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users u ON w.student_id = u.id
      LEFT JOIN users ru ON w.reviewed_by = ru.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'student') {
      sql += ' AND w.student_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'department') {
      sql += ' AND p.department_id = ?';
      params.push(req.user.departmentId);
    }
    if (studentId) {
      sql += ' AND w.student_id = ?';
      params.push(studentId);
    }
    if (positionId) {
      sql += ' AND w.position_id = ?';
      params.push(positionId);
    }
    if (departmentId) {
      sql += ' AND p.department_id = ?';
      params.push(departmentId);
    }
    if (status) {
      sql += ' AND w.status = ?';
      params.push(status);
    }
    if (month) {
      sql += ' AND w.month = ?';
      params.push(month);
    }

    sql += ' ORDER BY w.work_date DESC, w.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/summary', authMiddleware, async (req, res, next) => {
  try {
    const { studentId, month, departmentId } = req.query;
    let sql = `
      SELECT w.student_id, u.real_name as student_name, u.student_no, u.class,
             w.month, p.department_id, d.name as department_name,
             COUNT(w.id) as record_count,
             SUM(CASE WHEN w.status = 'approved' THEN w.hours ELSE 0 END) as approved_hours,
             SUM(CASE WHEN w.status = 'submitted' THEN w.hours ELSE 0 END) as pending_hours,
             SUM(CASE WHEN w.status = 'rejected' THEN w.hours ELSE 0 END) as rejected_hours,
             SUM(CASE WHEN w.status = 'approved' THEN w.hours * p.hourly_rate ELSE 0 END) as approved_salary
      FROM work_hours w
      LEFT JOIN positions p ON w.position_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users u ON w.student_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'student') {
      sql += ' AND w.student_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'department') {
      sql += ' AND p.department_id = ?';
      params.push(req.user.departmentId);
    }
    if (studentId) {
      sql += ' AND w.student_id = ?';
      params.push(studentId);
    }
    if (month) {
      sql += ' AND w.month = ?';
      params.push(month);
    }
    if (departmentId) {
      sql += ' AND p.department_id = ?';
      params.push(departmentId);
    }

    sql += ' GROUP BY w.student_id, w.month, p.department_id ORDER BY w.month DESC, approved_hours DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', authMiddleware, roleMiddleware('department', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewComment } = req.body;

    const [existing] = await pool.query(
      `SELECT w.*, p.department_id FROM work_hours w LEFT JOIN positions p ON w.position_id = p.id WHERE w.id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: '工时记录不存在' });
    }
    if (existing[0].status !== 'submitted') {
      return res.status(400).json({ error: '该记录已被审核' });
    }
    if (req.user.role === 'department' && existing[0].department_id !== req.user.departmentId) {
      return res.status(403).json({ error: '只能审核本部门的工时记录' });
    }

    await pool.query(
      `UPDATE work_hours SET status = 'approved', reviewed_by = ?, review_comment = ?, reviewed_at = NOW() WHERE id = ?`,
      [req.user.id, reviewComment || '', id]
    );
    res.json({ message: '审核通过' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reject', authMiddleware, roleMiddleware('department', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewComment } = req.body;

    const [existing] = await pool.query(
      `SELECT w.*, p.department_id FROM work_hours w LEFT JOIN positions p ON w.position_id = p.id WHERE w.id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: '工时记录不存在' });
    }
    if (existing[0].status !== 'submitted') {
      return res.status(400).json({ error: '该记录已被审核' });
    }
    if (req.user.role === 'department' && existing[0].department_id !== req.user.departmentId) {
      return res.status(403).json({ error: '只能审核本部门的工时记录' });
    }

    await pool.query(
      `UPDATE work_hours SET status = 'rejected', reviewed_by = ?, review_comment = ?, reviewed_at = NOW() WHERE id = ?`,
      [req.user.id, reviewComment || '不符合要求', req.user.id, id]
    );
    res.json({ message: '已拒绝该工时' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('student'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      'SELECT * FROM work_hours WHERE id = ? AND student_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    if (existing[0].status !== 'submitted') {
      return res.status(400).json({ error: '已审核的记录无法删除' });
    }
    await pool.query('DELETE FROM work_hours WHERE id = ?', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
