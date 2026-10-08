-- 데이터 보존 migration. 기존 backend를 중지하고 적용한 뒤 새 backend를 시작한다.
-- MySQL 초기 설치에서도 001-schema.sql 다음 자동 적용된다.
DELIMITER $$
DROP PROCEDURE IF EXISTS etch_add_search_revision$$
CREATE PROCEDURE etch_add_search_revision()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = DATABASE() AND table_name = 'project_post'
                     AND column_name = 'search_revision') THEN
        ALTER TABLE project_post ADD COLUMN search_revision BIGINT NOT NULL DEFAULT 0;
    END IF;
END$$
CALL etch_add_search_revision()$$
DROP PROCEDURE etch_add_search_revision$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS project_index_outbox (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    revision BIGINT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_error VARCHAR(128) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    attempted_at DATETIME(6) NULL,
    processed_at DATETIME(6) NULL,
    UNIQUE KEY uq_project_revision (project_id, revision),
    KEY ix_due (status, next_attempt_at, id)
) ENGINE=InnoDB;

START TRANSACTION;
UPDATE project_post SET search_revision = 1 WHERE search_revision = 0;
INSERT IGNORE INTO project_index_outbox(project_id, revision)
SELECT id, search_revision FROM project_post;
COMMIT;
