const express = require('express');
const { pool } = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, 
              (SELECT COUNT(*) FROM positions p WHERE p.department_id = d.id) as position_count,
              (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.role = 'department') as manager_count
       FROM departments d ORDER BY d.name`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const { name, contactName, contactPhone, description } = req.body;
    if (!name || !contactName) {
      return res.status(400).json({ error: '请填写必填项' });
    }
    const [existing] = await pool.query('SELECT id FROM departments WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '部门名称已存在' });
    }
    const [result] = await pool.query(
      'INSERT INTO departments (name, contact_name, contact_phone, description) VALUES (?, ?, ?, ?)',
      [name, contactName, contactPhone || '', description || '']
    );
    const [newDept] = await pool.query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    res.status(201).json(newDept[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, contactName, contactPhone, description } = req.body;

    const [existing] = await pool.query('SELECT * FROM departments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '部门不存在' });
    }

    if (name && name !== existing[0].name) {
      const [dup] = await pool.query('SELECT id FROM departments WHERE name = ? AND id != ?', [name, id]);
      if (dup.length > 0) {
        return res.status(400).json({ error: '部门名称已存在' });
      }
    }

    await pool.query(
      'UPDATE departments SET name = ?, contact_name = ?, contact_phone = ?, description = ? WHERE id = ?',
      [name || existing[0].name, contactName || existing[0].contact_name,
       contactPhone !== undefined ? contactPhone : existing[0].contact_phone,
       description !== undefined ? description : existing[0].description, id]
    );
    const [updated] = await pool.query('SELECT * FROM departments WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM departments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '部门不存在' });
    }
    const [positions] = await pool.query('SELECT COUNT(*) as cnt FROM positions WHERE department_id = ?', [id]);
    if (positions[0].cnt > 0) {
      return res.status(400).json({ error: '该部门下存在岗位，无法删除' });
    }
    await pool.query('DELETE FROM departments WHERE id = ?', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
