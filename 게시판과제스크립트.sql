CREATE DATABASE IF NOT EXISTS db_subject20251123 CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;
USE db_subject20251123;

CREATE TABLE users (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,     -- 유저 PK
    email       VARCHAR(100) NOT NULL UNIQUE,        -- 이메일(로그인 ID)
    user_name   VARCHAR(50) NOT NULL,                -- 닉네임/이름
    password    VARCHAR(255) NOT NULL,               -- 비밀번호(해시 예정)
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP    -- 가입일
);

CREATE TABLE board (
    post_id     INT AUTO_INCREMENT PRIMARY KEY,         -- 게시글 번호(PK)
    user_id     INT NOT NULL,                           -- 작성자 (FK)
    title       VARCHAR(200) NOT NULL,                  -- 제목
    content     TEXT NOT NULL,                          -- 본문
    view_count  INT NOT NULL DEFAULT 0,                 -- 조회수
    post_type   ENUM('FREE', 'NOTICE') DEFAULT 'FREE',  -- 자유/공지 구분
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,     -- 작성일
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_board_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE                               -- 유저 삭제 시 글도 삭제
);
