-- 3차 채용·뉴스 검색 변경 추적. MySQL 8.4 / InnoDB.
-- 적용 중 수집기와 Logstash를 중지한다. 원본 업무 데이터/ID/unique는 보존한다.
-- DDL은 implicit commit이므로 설치 중 쓰기를 허용하지 않는다.
-- 새 볼륨에서는 001, 002 다음 자동 적용; 기존 DB에는 local-migrate-phase3.sh 사용.
DROP TRIGGER IF EXISTS job_search_bi;
DROP TRIGGER IF EXISTS job_search_bu;
DROP TRIGGER IF EXISTS job_search_ai;
DROP TRIGGER IF EXISTS job_search_au;
DROP TRIGGER IF EXISTS job_search_ad;
DROP TRIGGER IF EXISTS news_search_bi;
DROP TRIGGER IF EXISTS news_search_bu;
DROP TRIGGER IF EXISTS news_search_ai;
DROP TRIGGER IF EXISTS news_search_au;
DROP TRIGGER IF EXISTS news_search_ad;

DELIMITER $$
DROP PROCEDURE IF EXISTS etch_add_sync_columns$$
CREATE PROCEDURE etch_add_sync_columns()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema=DATABASE() AND table_name='news' AND column_name='updated_at') THEN
        ALTER TABLE news ADD COLUMN updated_at DATETIME(6) NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema=DATABASE() AND table_name='job' AND column_name='updated_at'
                 AND column_type <> 'datetime(6)') THEN
        ALTER TABLE job MODIFY COLUMN updated_at DATETIME(6) NULL;
    END IF;
END$$
CALL etch_add_sync_columns()$$
DROP PROCEDURE etch_add_sync_columns$$
DELIMITER ;

-- 추적용 시각만 보완. 기존 업무 날짜나 기존의 non-null 추적 시각은 변경하지 않는다.
UPDATE job SET updated_at=UTC_TIMESTAMP(6) WHERE updated_at IS NULL;
UPDATE news SET updated_at=UTC_TIMESTAMP(6) WHERE updated_at IS NULL;

CREATE TABLE IF NOT EXISTS search_sync_state (
    kind VARCHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    source_id BIGINT NOT NULL,
    revision BIGINT NOT NULL,
    changed_at DATETIME(6) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSON NOT NULL,
    PRIMARY KEY (kind, source_id),
    KEY ix_sync_poll (kind, changed_at, source_id),
    CONSTRAINT chk_sync_kind CHECK (kind IN ('job','news')),
    CONSTRAINT chk_sync_id CHECK (source_id > 0),
    CONSTRAINT chk_sync_revision CHECK (revision > 0)
) ENGINE=InnoDB;

-- company_name은 원문/수집 당시 snapshot. 회사 master 변경은 여기서 fanout하지 않는다.
-- 업무 날짜는 저장된 wall-clock을 ISO 초 형식으로 유지한다(UTC 추적 시각과 별개).
-- 배열 원본은 쉼표 문자열이며 전송/대조 시 동일한 규칙으로 trim/split한다.
CREATE OR REPLACE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW job_search_source AS
SELECT id AS source_id, JSON_OBJECT(
        'jobId', id,
        'title', title,
        'companyName', company_name,
        'industries', industry,
        'regions', region,
        'jobCategories', job_category,
        'workType', work_type,
        'educationLevel', education_level,
        'openingDate', DATE_FORMAT(opening_date, '%Y-%m-%dT%H:%i:%s'),
        'expirationDate', DATE_FORMAT(expiration_date, '%Y-%m-%dT%H:%i:%s')
    ) AS payload
FROM job;

CREATE OR REPLACE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW news_search_source AS
SELECT id AS source_id, JSON_OBJECT(
        'newsId', id,
        'title', title,
        'summary', description,
        'companyName', company_name,
        'link', url,
        'thumbnailUrl', thumbnail_url,
        'publishedAt', DATE_FORMAT(published_at, '%Y-%m-%dT%H:%i:%s')
    ) AS payload
FROM news;

DELIMITER $$
DROP PROCEDURE IF EXISTS sync_search_state$$
CREATE PROCEDURE sync_search_state(
    IN p_kind VARCHAR(8), IN p_source_id BIGINT, IN p_payload JSON,
    IN p_deleted BOOLEAN, IN p_force BOOLEAN
)
BEGIN
    IF p_kind IS NULL OR p_kind NOT IN ('job','news') OR p_source_id IS NULL OR p_source_id <= 0
       OR p_payload IS NULL OR p_deleted IS NULL OR p_force IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='SEARCH_SYNC_INVALID_ARGUMENT';
    END IF;
    -- 이 routine은 내부 setter. trigger 또는 원본을 잠근 repair만 호출한다.
    -- assignment 순서: payload/deleted 변경 전에 실제 변경 여부를 비교한다.
    INSERT INTO search_sync_state(kind,source_id,revision,changed_at,deleted,payload)
    VALUES(p_kind,p_source_id,1,UTC_TIMESTAMP(6),p_deleted,p_payload)
    ON DUPLICATE KEY UPDATE
        revision=IF(p_force OR NOT(deleted <=> p_deleted) OR NOT(payload <=> p_payload), revision+1, revision),
        changed_at=IF(p_force OR NOT(deleted <=> p_deleted) OR NOT(payload <=> p_payload), UTC_TIMESTAMP(6), changed_at),
        payload=p_payload,
        deleted=p_deleted;
END$$

DROP PROCEDURE IF EXISTS repair_search_state$$
CREATE PROCEDURE repair_search_state(IN p_kind VARCHAR(8), IN p_source_id BIGINT, IN p_min_revision BIGINT)
BEGIN
    DECLARE v_payload JSON DEFAULT NULL;
    DECLARE v_found BOOLEAN DEFAULT FALSE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_found=FALSE;
    IF p_kind IS NULL OR p_kind NOT IN ('job','news') OR p_source_id IS NULL OR p_source_id <= 0
       OR p_min_revision IS NULL OR p_min_revision < 0 OR p_min_revision >= 9223372036854775807 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='SEARCH_SYNC_INVALID_REPAIR_ARGUMENT';
    END IF;
    -- caller: START TRANSACTION (기본 REPEATABLE READ) -> CALL -> COMMIT.
    -- ES 버전 조회는 그 전에 한다. 원본 PK current read/없는 행 gap lock을
    -- ledger 쓰기까지 보유해 수집/삭제와 repair의 오래된 snapshot 경쟁을 막는다.
    IF p_kind='job' THEN
        SELECT payload, TRUE INTO v_payload,v_found FROM job_search_source
        WHERE source_id=p_source_id FOR UPDATE;
    ELSE
        SELECT payload, TRUE INTO v_payload,v_found FROM news_search_source
        WHERE source_id=p_source_id FOR UPDATE;
    END IF;
    IF NOT v_found THEN
        SET v_payload=IF(p_kind='job',JSON_OBJECT('jobId',p_source_id),JSON_OBJECT('newsId',p_source_id));
    END IF;
    CALL sync_search_state(p_kind,p_source_id,v_payload,NOT v_found,TRUE);
    UPDATE search_sync_state SET revision=GREATEST(revision,p_min_revision+1)
    WHERE kind=p_kind AND source_id=p_source_id;
END$$

CREATE TRIGGER job_search_bi BEFORE INSERT ON job FOR EACH ROW
BEGIN
    SET NEW.updated_at=UTC_TIMESTAMP(6);
END$$

CREATE TRIGGER job_search_bu BEFORE UPDATE ON job FOR EACH ROW
BEGIN
    IF NOT (JSON_OBJECT(
        'jobId', OLD.id,
        'title', OLD.title,
        'companyName', OLD.company_name,
        'industries', OLD.industry,
        'regions', OLD.region,
        'jobCategories', OLD.job_category,
        'workType', OLD.work_type,
        'educationLevel', OLD.education_level,
        'openingDate', DATE_FORMAT(OLD.opening_date, '%Y-%m-%dT%H:%i:%s'),
        'expirationDate', DATE_FORMAT(OLD.expiration_date, '%Y-%m-%dT%H:%i:%s')
    ) <=> JSON_OBJECT(
        'jobId', NEW.id,
        'title', NEW.title,
        'companyName', NEW.company_name,
        'industries', NEW.industry,
        'regions', NEW.region,
        'jobCategories', NEW.job_category,
        'workType', NEW.work_type,
        'educationLevel', NEW.education_level,
        'openingDate', DATE_FORMAT(NEW.opening_date, '%Y-%m-%dT%H:%i:%s'),
        'expirationDate', DATE_FORMAT(NEW.expiration_date, '%Y-%m-%dT%H:%i:%s')
    )) THEN
        SET NEW.updated_at=UTC_TIMESTAMP(6);
    ELSE
        -- 반복 수집이나 supplied 미래 시각만으로 변경 위치를 전진시키지 않는다.
        SET NEW.updated_at=OLD.updated_at;
    END IF;
END$$

CREATE TRIGGER job_search_ai AFTER INSERT ON job FOR EACH ROW
BEGIN
    DECLARE v_payload JSON;
    SELECT payload INTO v_payload FROM job_search_source WHERE source_id=NEW.id;
    CALL sync_search_state('job',NEW.id,v_payload,FALSE,FALSE);
END$$

CREATE TRIGGER job_search_au AFTER UPDATE ON job FOR EACH ROW
BEGIN
    DECLARE v_payload JSON;
    IF NOT(OLD.id <=> NEW.id) THEN
        CALL sync_search_state('job',OLD.id,JSON_OBJECT('jobId',OLD.id),TRUE,FALSE);
    END IF;
    SELECT payload INTO v_payload FROM job_search_source WHERE source_id=NEW.id;
    CALL sync_search_state('job',NEW.id,v_payload,FALSE,FALSE);
END$$

CREATE TRIGGER job_search_ad AFTER DELETE ON job FOR EACH ROW
BEGIN
    -- 물리 삭제 후에도 같은 ID의 revision을 남겨 오래된 문서 재생성을 막는다.
    CALL sync_search_state('job',OLD.id,JSON_OBJECT('jobId',OLD.id),TRUE,FALSE);
END$$

CREATE TRIGGER news_search_bi BEFORE INSERT ON news FOR EACH ROW
BEGIN
    SET NEW.updated_at=UTC_TIMESTAMP(6);
END$$

CREATE TRIGGER news_search_bu BEFORE UPDATE ON news FOR EACH ROW
BEGIN
    IF NOT (JSON_OBJECT(
        'newsId', OLD.id,
        'title', OLD.title,
        'summary', OLD.description,
        'companyName', OLD.company_name,
        'link', OLD.url,
        'thumbnailUrl', OLD.thumbnail_url,
        'publishedAt', DATE_FORMAT(OLD.published_at, '%Y-%m-%dT%H:%i:%s')
    ) <=> JSON_OBJECT(
        'newsId', NEW.id,
        'title', NEW.title,
        'summary', NEW.description,
        'companyName', NEW.company_name,
        'link', NEW.url,
        'thumbnailUrl', NEW.thumbnail_url,
        'publishedAt', DATE_FORMAT(NEW.published_at, '%Y-%m-%dT%H:%i:%s')
    )) THEN
        SET NEW.updated_at=UTC_TIMESTAMP(6);
    ELSE
        -- 반복 수집이나 supplied 미래 시각만으로 변경 위치를 전진시키지 않는다.
        SET NEW.updated_at=OLD.updated_at;
    END IF;
END$$

CREATE TRIGGER news_search_ai AFTER INSERT ON news FOR EACH ROW
BEGIN
    DECLARE v_payload JSON;
    SELECT payload INTO v_payload FROM news_search_source WHERE source_id=NEW.id;
    CALL sync_search_state('news',NEW.id,v_payload,FALSE,FALSE);
END$$

CREATE TRIGGER news_search_au AFTER UPDATE ON news FOR EACH ROW
BEGIN
    DECLARE v_payload JSON;
    IF NOT(OLD.id <=> NEW.id) THEN
        CALL sync_search_state('news',OLD.id,JSON_OBJECT('newsId',OLD.id),TRUE,FALSE);
    END IF;
    SELECT payload INTO v_payload FROM news_search_source WHERE source_id=NEW.id;
    CALL sync_search_state('news',NEW.id,v_payload,FALSE,FALSE);
END$$

CREATE TRIGGER news_search_ad AFTER DELETE ON news FOR EACH ROW
BEGIN
    -- 물리 삭제 후에도 같은 ID의 revision을 남겨 오래된 문서 재생성을 막는다.
    CALL sync_search_state('news',OLD.id,JSON_OBJECT('newsId',OLD.id),TRUE,FALSE);
END$$
DELIMITER ;

-- 최초 적재: 원본 내용은 읽기만 한다. 재실행은 기존 ledger/revision/시각을 보존한다.
-- 이후 INSERT/UPDATE/DELETE는 원본과 같은 트랜잭션의 trigger가 기록한다.
START TRANSACTION;
INSERT IGNORE INTO search_sync_state(kind,source_id,revision,changed_at,deleted,payload)
SELECT 'job',source_id,1,UTC_TIMESTAMP(6),FALSE,payload FROM job_search_source;
INSERT IGNORE INTO search_sync_state(kind,source_id,revision,changed_at,deleted,payload)
SELECT 'news',source_id,1,UTC_TIMESTAMP(6),FALSE,payload FROM news_search_source;
COMMIT;
