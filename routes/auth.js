// routes/auth.js
import express from 'express';
import db from '../config/db.js';

const router = express.Router();

/**
 * 회원가입 화면
 */
router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

/**
 * 회원가입 처리
 */
router.post('/signup', (req, res) => {
  const { email, user_name, password } = req.body;

  if (!email || !user_name || !password) {
    return res.render('signup', { error: '모든 필드를 입력해주세요.' });
  }

  // 이메일 중복 확인
  const checkSql = 'SELECT * FROM users WHERE email = ?';
  db.query(checkSql, [email], (err, rows) => {
    if (err) return res.render('signup', { error: 'DB 오류 발생' });

    if (rows.length > 0) {
      return res.render('signup', { error: '이미 존재하는 이메일입니다.' });
    }

    // 바로 저장 
    const insertSql = `
      INSERT INTO users (email, user_name, password)
      VALUES (?, ?, ?)
    `;
    db.query(insertSql, [email, user_name, password], (err2) => {
      if (err2) return res.render('signup', { error: '회원가입 오류' });
      res.redirect('/login');
    });
  });
});

/**
 * 로그인 화면
 */
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

/**
 * 로그인 처리
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: '이메일과 비밀번호를 입력하세요.' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, rows) => {
    if (err) return res.render('login', { error: 'DB 오류 발생' });

    if (rows.length === 0) {
      return res.render('login', { error: '이메일 또는 비밀번호가 틀렸습니다.' });
    }

    const user = rows[0];

    //비교
    if (user.password !== password) {
      return res.render('login', { error: '이메일 또는 비밀번호가 틀렸습니다.' });
    }

    // 로그인 성공 → 세션에 저장
    req.session.user = {
      user_id: user.user_id,
      email: user.email,
      user_name: user.user_name,
    };

    res.redirect('/board/list');
  });
});

/**
 * 로그아웃
 */
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

export default router;
