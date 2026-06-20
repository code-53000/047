const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, password, real_name, role, student_no, class, phone, email, department_id, status FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return res.status(401).json({ error: '账号已被禁用' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = generateToken(user);
    const { password: _, ...userInfo } = user;

    res.json({
      token,
      user: userInfo
    });
  } catch (err) {
    next(err);
  }
});

router.post('/register/student', async (req, res, next) => {
  try {
    const { username, password, realName, studentNo, className, phone, email } = req.body;
    if (!username || !username.trim() || !password || !realName || !realName.trim() || !studentNo || !studentNo.trim()) {
      return res.status(400).json({ error: '请填写必填项' });
    }

    const trimmedStudentNo = studentNo.trim();
    const trimmedUsername = username.trim();

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? OR student_no = ?', [trimmedUsername, trimmedStudentNo]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '用户名或学号已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, real_name, role, student_no, class, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [trimmedUsername, hashedPassword, realName.trim(), 'student', trimmedStudentNo, className, phone, email]
    );

    res.status(201).json({
      id: result.insertId,
      message: '注册成功'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.real_name, u.role, u.student_no, u.class, u.phone, u.email, 
              u.department_id, u.status, d.name as department_name 
       FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
