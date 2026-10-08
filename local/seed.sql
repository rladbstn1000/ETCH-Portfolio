-- 개인 고도화 1차 합성 데이터. 실제 사용자·기업·외부 공고와 관련 없음.
-- etch_local 전용, 재실행 시 같은 PK/외부 ID를 갱신한다.
SET NAMES utf8mb4;
USE etch_local;
-- ES 가용성과 무관하게 데이터 변경과 프로젝트 revision/outbox가 함께 커밋된다.
START TRANSACTION;
INSERT INTO company (id, name, business_no, industry, summary, homepage_url)
VALUES (9001, '합성테크 서울', '0000009001', 'IT', '로컬 검색 검증용 가상 회사', 'https://example.invalid/company/9001'),
       (9002, '합성테크 부산', '0000009002', 'IT', '로컬 검색 검증용 가상 회사', 'https://example.invalid/company/9002')
ON DUPLICATE KEY UPDATE name=VALUES(name), summary=VALUES(summary);

INSERT INTO job (id, title, company_id, company_name, region, industry, job_category, work_type,
                 education_level, opening_date, expiration_date, created_at, updated_at, external_job_id)
VALUES (9001, '합성 "백엔드" 개발자 모집', 9001, '합성테크 서울', '서울,경기', 'IT,웹,통신', '백엔드,DevOps/클라우드', '정규직', '학력무관',
        '2026-09-01 09:00:00', '2099-10-31 23:59:59', '2026-09-01', '2026-09-29 09:00:00.100000', 'local-job-9001'),
       (9002, '합성 프론트엔드 개발자 모집', 9002, '합성테크 부산', '부산', 'IT,웹,통신', '프론트엔드', '정규직', '학력무관',
        '2026-09-02 09:00:00', '2099-11-30 23:59:59', '2026-09-02', '2026-09-29 09:00:00.200000', 'local-job-9002')
ON DUPLICATE KEY UPDATE title=VALUES(title), region=VALUES(region), job_category=VALUES(job_category),
 expiration_date=VALUES(expiration_date), updated_at=CURRENT_TIMESTAMP(6);

-- 기존 url SHA-256 unique 제약을 그대로 사용한다.
INSERT INTO news (id, company_id, company_name, title, description, url, published_at)
VALUES (9001,9001,'합성테크 서울','합성 "백엔드" 기술 뉴스','검색 검증용 가상 기사입니다.','https://example.invalid/news/9001','2026-09-28 09:00:00'),
       (9002,9002,'합성테크 부산','합성 프론트엔드 기술 뉴스','검색 검증용 가상 기사입니다.','https://example.invalid/news/9002','2026-09-29 09:00:00')
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description);

INSERT INTO member (id,nickname,email,phoneNumber,gender,birth,role,isDeleted,refreshToken)
VALUES (9001,'로컬작성자','owner@example.invalid','local-owner-9001','UNSPECIFIED','2000-01-01','USER',b'0',''),
       (9002,'로컬다른사용자','other@example.invalid','local-other-9002','UNSPECIFIED','2000-01-02','USER',b'0','')
ON DUPLICATE KEY UPDATE nickname=VALUES(nickname), role=VALUES(role);

INSERT INTO project_post (id,member_id,title,content,category,is_public,is_deleted,view_count,created_at,updated_at)
VALUES (9001,9001,'합성 검색 공개 프로젝트','공개 조회 검증용 프로젝트입니다.','WEB',b'1',b'0',0,'2026-09-28 09:00:00','2026-09-28 09:00:00'),
       (9002,9001,'합성 비공개 프로젝트','작성자만 조회할 수 있는 검증 데이터입니다.','SERVER',b'0',b'0',0,'2026-09-28 09:00:00','2026-09-28 09:00:00')
ON DUPLICATE KEY UPDATE title=VALUES(title),content=VALUES(content),is_public=VALUES(is_public),is_deleted=VALUES(is_deleted);

INSERT INTO portfolio (id,member_id,name,introduce,is_deleted,created_at,updated_at)
VALUES (9001,9001,'합성 작성자 포트폴리오','소유권 검증용 합성 포트폴리오',b'0','2026-09-28','2026-09-28')
ON DUPLICATE KEY UPDATE name=VALUES(name),introduce=VALUES(introduce);

-- member seed의 닉네임 변경도 해당 작성자의 모든 프로젝트 문서에 영향을 준다.
-- 회원 upsert가 회원 행을 먼저 잠그므로 앱의 생성/회원명 변경과 같은 잠금 순서를 따른다.
-- 기존 프로젝트 본문/카운터 등은 위 seed가 명시적으로 갱신한 필드 외에는 보존한다.
UPDATE project_post SET search_revision=search_revision+1
WHERE id IN (9001,9002) OR member_id IN (9001,9002);
INSERT INTO project_index_outbox(project_id,revision)
SELECT id,search_revision FROM project_post
WHERE id IN (9001,9002) OR member_id IN (9001,9002);
COMMIT;
