const express = require('express');
const { pool } = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

async function updatePositionStatus(positionId) {
  const [pos] = await pool.query('SELECT * FROM positions WHERE id = ?', [positionId]);
  if (pos.length === 0) return;
  const position = pos[0];
  if (position.current_workers >= position.max_workers && position.status === 'open') {
    await pool.query("UPDATE positions SET status = 'closed' WHERE id = ?", [positionId]);
  } else if (position.current_workers < position.max_workers && position.status === 'closed') {
    await pool.query("UPDATE positions SET status = 'open' WHERE id = ?", [positionId]);
  }
}

router.get('/pending', authMiddleware, roleMiddleware('admin', 'department'), async (req, res, next) => {
  try {
    let sql = `
      SELECT a.*, p.title as position_title, p.max_workers, p.current_workers, p.status as position_status,
             d.name as department_name,
             u.real_name as student_name, u.student_no, u.class, u.phone, u.email
      FROM applications a
      LEFT JOIN positions p ON a.position_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users u ON a.student_id = u.id
      WHERE a.status = 'pending'
    `;
    const params = [];
    if (req.user.role === 'department') {
      sql += ' AND p.department_id = ?';
      params.push(req.user.departmentId);
    } else if (req.query.departmentId) {
      sql += ' AND p.department_id = ?';
      params.push(Number(req.query.departmentId));
    }
    sql += ' ORDER BY a.created_at ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { reviewComment } = req.body;

    const [existing] = await connection.query('SELECT * FROM applications WHERE id = ?', [id]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '申请不存在' });
    }
    if (existing[0].status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ error: '该申请已被处理' });
    }

    await connection.query(
      `UPDATE applications SET status = 'approved', review_comment = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [reviewComment || '', req.user.id, id]
    );

    await connection.commit();
    const [updated] = await pool.query(
      `SELECT a.*, p.title as position_title, u.real_name as student_name
       FROM applications a LEFT JOIN positions p ON a.position_id = p.id
       LEFT JOIN users u ON a.student_id = u.id WHERE a.id = ?`,
      [id]
    );
    res.json({ message: '审核通过', application: updated[0] });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.post('/:id/reject', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewComment } = req.body;

    const [existing] = await pool.query('SELECT * FROM applications WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '申请不存在' });
    }
    if (existing[0].status !== 'pending') {
      return res.status(400).json({ error: '该申请已被处理' });
    }

    await pool.query(
      `UPDATE applications SET status = 'rejected', review_comment = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [reviewComment || '条件不符', req.user.id, id]
    );

    res.json({ message: '已拒绝该申请' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/assign', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    const [existing] = await connection.query(
      `SELECT a.*, p.max_workers, p.current_workers, p.status as position_status
       FROM applications a LEFT JOIN positions p ON a.position_id = p.id WHERE a.id = ?`,
      [id]
    );
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '申请不存在' });
    }
    const app = existing[0];
    if (app.status === 'assigned') {
      await connection.rollback();
      return res.status(400).json({ error: '该申请已完成分配' });
    }
    if (app.status === 'rejected') {
      await connection.rollback();
      return res.status(400).json({ error: '该申请已被拒绝，无法分配' });
    }
    if (app.position_status !== 'open' && app.position_status !== 'closed') {
      await connection.rollback();
      return res.status(400).json({ error: '该岗位状态异常，无法分配' });
    }
    if (app.current_workers >= app.max_workers) {
      await connection.rollback();
      return res.status(400).json({ error: '该岗位已满员' });
    }

    const [assignedCount] = await connection.query(
      "SELECT COUNT(*) as cnt FROM applications WHERE student_id = ? AND status = 'assigned' AND id != ?",
      [app.student_id, id]
    );
    if (assignedCount[0].cnt >= 2) {
      await connection.rollback();
      return res.status(400).json({ error: '该学生已达到岗位数量上限（2个）' });
    }

    await connection.query(
      `UPDATE applications SET status = 'assigned', assigned_at = NOW(),
       review_comment = COALESCE(review_comment, '已分配'), reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );

    await connection.query(
      'UPDATE positions SET current_workers = current_workers + 1 WHERE id = ?',
      [app.position_id]
    );

    await connection.commit();
    await updatePositionStatus(app.position_id);

    const [updated] = await pool.query(
      `SELECT a.*, p.title as position_title, p.current_workers, p.max_workers, p.status as position_status,
              u.real_name as student_name, d.name as department_name
       FROM applications a LEFT JOIN positions p ON a.position_id = p.id
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN users u ON a.student_id = u.id WHERE a.id = ?`,
      [id]
    );
    res.json({ message: '分配成功', application: updated[0] });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.post('/:id/unassign', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    const [existing] = await connection.query('SELECT * FROM applications WHERE id = ?', [id]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '申请不存在' });
    }
    if (existing[0].status !== 'assigned') {
      await connection.rollback();
      return res.status(400).json({ error: '该申请未处于已分配状态' });
    }

    const [hours] = await connection.query(
      'SELECT COUNT(*) as cnt FROM work_hours WHERE application_id = ?',
      [id]
    );
    if (hours[0].cnt > 0) {
      await connection.rollback();
      return res.status(400).json({ error: '该岗位已有工时记录，无法取消分配。请先删除相关工时记录。' });
    }

    const positionId = existing[0].position_id;
    await connection.query(
      `UPDATE applications SET status = 'approved', assigned_at = NULL WHERE id = ?`,
      [id]
    );
    await connection.query(
      'UPDATE positions SET current_workers = GREATEST(current_workers - 1, 0) WHERE id = ?',
      [positionId]
    );

    await connection.commit();
    await updatePositionStatus(positionId);

    res.json({ message: '已取消分配' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.get('/stats', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const [posStats] = await pool.query(`
      SELECT status, COUNT(*) as count FROM positions GROUP BY status
    `);
    const [appStats] = await pool.query(`
      SELECT status, COUNT(*) as count FROM applications GROUP BY status
    `);
    const [deptStats] = await pool.query(`
      SELECT d.id, d.name, COUNT(DISTINCT p.id) as position_count,
             COUNT(DISTINCT CASE WHEN a.status = 'assigned' THEN a.id END) as assigned_count
      FROM departments d
      LEFT JOIN positions p ON d.id = p.department_id
      LEFT JOIN applications a ON p.id = a.position_id
      GROUP BY d.id, d.name
    `);

    res.json({
      positions: posStats,
      applications: appStats,
      departments: deptStats
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
