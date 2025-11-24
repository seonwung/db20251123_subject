## 프로젝트 폴더로 이동해 필요한 패키지를 설치합니다.

npm install


## 프로젝트 루트 위치에 .env 파일을 생성하고 아래 내용을 입력합니다.  
  (DB 계정과 비밀번호는 본인의 MySQL 환경에 맞게 수정합니다.)

PORT=3000
DB_HOST=localhost
DB_USER=본인_DB_계정
DB_PASSWORD=본인_DB_비밀번호
DB_NAME=db_subject20251123


## 데이터베이스를 생성하고 사용합니다.--------------

CREATE DATABASE db_subject20251123;
USE db_subject20251123;

다음 테이블을 생성합니다.

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  user_name VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE board (
  post_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  view_count INT DEFAULT 0,
  post_type ENUM('FREE', 'NOTICE') DEFAULT 'FREE',
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);


## 주요 기능
- 회원가입 / 로그인 (세션 기반)
- 게시글 작성, 수정, 삭제
- 공지글 / 일반글 구분
- 조회수 증가
- 제목 검색 기능
- 페이지네이션
- 작성자만 수정 및 삭제 가능

- 
## 서버 실행

아래 명령어로 서버를 실행합니다.

npm start
