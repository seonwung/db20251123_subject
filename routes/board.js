// routes/board.js
import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// 로그인 필수 미들웨어
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// 한 페이지당 글 개수
const PAGE_SIZE = 10;

// /board -> /board/list로 리다이렉트
router.get('/', requireLogin, (req, res) => {
  res.redirect('/board/list');
});

/**
 * 1. 게시글 목록 + 페이지네비 + 제목 검색
 *    GET /board/list?page=1&keyword=검색어
 */
router.get('/list', requireLogin, (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const keyword = req.query.keyword ? req.query.keyword.trim() : '';

  const offset = (page - 1) * PAGE_SIZE;

  let whereClause = '';
  const params = [];

  if (keyword) {
    // b라는 별칭 사용
    whereClause = 'WHERE b.title LIKE ?';
    params.push(`%${keyword}%`);
  }

  // 1) 전체 글 개수
  const countSql = `SELECT COUNT(*) AS cnt FROM board b ${whereClause}`;
  db.query(countSql, params, (err, countRows) => {
    if (err) {
      console.error(err);
      return res.send('DB 오류(카운트) 발생');
    }

    const totalPosts = countRows[0].cnt;
    const totalPages = Math.ceil(totalPosts / PAGE_SIZE);

    // 2) 실제 목록 조회 + 작성자 이름 JOIN
    const listSql = `
      SELECT
        b.post_id,
        b.user_id,
        b.title,
        b.view_count,
        b.post_type,
        b.created_at,
        u.user_name
      FROM board b
      JOIN users u ON b.user_id = u.user_id
      ${whereClause}
      ORDER BY (b.post_type = 'NOTICE') DESC, b.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const listParams = [...params, PAGE_SIZE, offset];// ...은 배열 펼치기

    db.query(listSql, listParams, (err2, rows) => {
      if (err2) {
        console.error(err2);
        return res.send('DB 오류(목록) 발생');
      }

      res.render('board_list', {
        posts: rows,
        currentPage: page,
        totalPages,
        keyword,
         session: req.session, 
      });
    });
  });
});

/**
 * 2. 상세보기 + 조회수 증가
 *    GET /board/view/:id
 */
router.get('/view/:id', requireLogin, (req, res) => {
  const { id } = req.params;

  // 1) 조회수 +1 (view_count 사용)
  const updateSql = 'UPDATE board SET view_count = view_count + 1 WHERE post_id = ?';
  db.query(updateSql, [id], (err) => {
    if (err) {
      console.error(err);
      return res.send('조회수 증가 중 오류 발생');
    }

    // 2) 글 내용 + 작성자 이름 JOIN
    const selectSql = `
      SELECT
        b.*,
        u.user_name
      FROM board b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.post_id = ?
    `;
    db.query(selectSql, [id], (err2, rows) => {
      if (err2) {
        console.error(err2);
        return res.send('글 조회 중 오류 발생');
      }

      if (rows.length === 0) {
        return res.send('존재하지 않는 글입니다.');
      }

      const post = rows[0];

      res.render('board_detail', {
        post,
        session: req.session, // EJS에서 session.user.user_id 비교용
      });
    });
  });
});

/**
 * 3. 글쓰기 화면
 *    GET /board/write
 */
router.get('/write', requireLogin, (req, res) => {
  res.render('board_form', {
    mode: 'create',
    post: {
      post_id: null,
      title: '',
      content: '',
      post_type: 'FREE', // 기본은 자유글
      is_notice: 0,
    },
       session: req.session,
  });
});

/**
 * 4. 글쓰기 처리
 *    POST /board/write
 */
router.post('/write', requireLogin, (req, res) => {
  const { title, content, is_notice } = req.body;
  const userId = req.session.user.user_id; // 로그인한 사용자 ID

  const postType = is_notice === '1' ? 'NOTICE' : 'FREE';

  const sql = `
    INSERT INTO board (user_id, title, content, post_type)
    VALUES (?, ?, ?, ?)
  `;
  const params = [userId, title, content, postType];

  db.query(sql, params, (err) => {
    if (err) {
      console.error(err);
      return res.send('글 저장 중 오류 발생');
    }
    res.redirect('/board/list');
  });
});

/**
 * 5. 글 수정 화면
 *    GET /board/edit/:id
 *    글쓴이만 수정 가능
 */
router.get('/edit/:id', requireLogin, (req, res) => {
  const { id } = req.params;//params에서 가져온건 링크에서 즉 post_id
  const loginUserId = req.session.user.user_id;

  const sql = 'SELECT * FROM board WHERE post_id = ?';
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.send('글 조회 중 오류 발생');
    }
    if (rows.length === 0) {
      return res.send('존재하지 않는 글입니다.');
    }

    const post = rows[0];

    if (post.user_id !== loginUserId) {
      return res.status(403).send('수정 권한이 없습니다.');
    } //링크로 바로들어가는거 방지

    res.render('board_form', {
      mode: 'edit',
      post,
        session: req.session,
    });
  });
});

/**
 * 6. 글 수정 처리
 *    POST /board/edit/:id
 *    → 글쓴이만 실제 수정되도록 user_id 조건도 같이 검사
 */
router.post('/edit/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  const { title, content, is_notice } = req.body;
  const loginUserId = req.session.user.user_id;

  const postType = is_notice === '1' ? 'NOTICE' : 'FREE';

  const sql = `
    UPDATE board
    SET title = ?, content = ?, post_type = ?
    WHERE post_id = ? AND user_id = ?
  `;
  const params = [title, content, postType, id, loginUserId];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.send('글 수정 중 오류 발생');
    }

    // 내가 쓴 글이 아니면 수정된 행이 0개일 수 있음
    if (result.affectedRows === 0) {
      return res.status(403).send('수정 권한이 없습니다.');
    }

    res.redirect(`/board/view/${id}`);
  });
});

/**
 * 7. 글 삭제
 *    POST /board/delete/:id
 *    → 글쓴이만 삭제 가능
 */
router.post('/delete/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  const loginUserId = req.session.user.user_id;

  // 1) 이 글의 작성자 확인
  const selectSql = 'SELECT user_id FROM board WHERE post_id = ?';
  db.query(selectSql, [id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.send('글 조회 중 오류 발생');
    }
    if (rows.length === 0) {
      return res.send('존재하지 않는 글입니다.');
    }

    const postUserId = rows[0].user_id;

    if (postUserId !== loginUserId) {
      return res.status(403).send('삭제 권한이 없습니다.');
    }

    // 2) 실제 삭제
    const deleteSql = 'DELETE FROM board WHERE post_id = ?';
    db.query(deleteSql, [id], (err2) => {
      if (err2) {
        console.error(err2);
        return res.send('글 삭제 중 오류 발생');
      }
      res.redirect('/board/list');
    });
  });
});

export default router;
