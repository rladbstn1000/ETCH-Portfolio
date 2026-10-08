-- 기존 팀 스키마에서 DDL만 추출. 운영 데이터/계정은 사용하지 않음.
SET FOREIGN_KEY_CHECKS=0;
CREATE TABLE `applied_job` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` enum('DOCUMENT_DONE','DOCUMENT_FAILED','FINAL_PASSED','INTERVIEW_DONE','INTERVIEW_FAILED','SCHEDULED') COLLATE utf8mb4_bin DEFAULT NULL,
  `job_id` bigint DEFAULT NULL,
  `member_id` bigint DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `updated_At` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK3cvhoipag28w55pl89sbtg5n3` (`job_id`),
  KEY `FK503s6machp9qcx5simfya25dh` (`member_id`),
  CONSTRAINT `FK3cvhoipag28w55pl89sbtg5n3` FOREIGN KEY (`job_id`) REFERENCES `job` (`id`),
  CONSTRAINT `FK503s6machp9qcx5simfya25dh` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `chat_message` (
  `message_id` bigint NOT NULL AUTO_INCREMENT,
  `message` text COLLATE utf8mb4_bin NOT NULL,
  `room_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `sender_id` bigint NOT NULL,
  `sender_nickname` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `sent_at` datetime(6) NOT NULL,
  `unread_count` int NOT NULL,
  PRIMARY KEY (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `chat_participant` (
  `participant_id` bigint NOT NULL AUTO_INCREMENT,
  `joined_at` datetime(6) NOT NULL,
  `member_id` bigint NOT NULL,
  `room_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`participant_id`),
  UNIQUE KEY `uk_chat_participant_room_member` (`room_id`,`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `chat_read_status` (
  `read_status_id` bigint NOT NULL AUTO_INCREMENT,
  `last_read_message_id` bigint NOT NULL,
  `member_id` bigint NOT NULL,
  `room_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`read_status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `company` (
  `female_ratio` double DEFAULT NULL,
  `founded_date` date DEFAULT NULL,
  `male_ratio` double DEFAULT NULL,
  `female_employees` bigint DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `male_employees` bigint DEFAULT NULL,
  `salary` bigint DEFAULT NULL,
  `service_year` bigint DEFAULT NULL,
  `total_employees` bigint DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `business_no` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `ceo_name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `homepage_url` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `industry` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `main_products` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `stock` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `summary` text COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKniu8sfil2gxywcru9ah3r4ec5` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `cover_letter` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `member_id` bigint NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `answer1` longtext COLLATE utf8mb4_bin,
  `answer2` longtext COLLATE utf8mb4_bin,
  `answer3` longtext COLLATE utf8mb4_bin,
  `answer4` longtext COLLATE utf8mb4_bin,
  `answer5` longtext COLLATE utf8mb4_bin,
  `is_deleted` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8yfy0getm1yvn28qyk4qygpq1` (`member_id`),
  CONSTRAINT `FK8yfy0getm1yvn28qyk4qygpq1` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `follow` (
  `follower_id` bigint NOT NULL,
  `following_id` bigint NOT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  KEY `FKtps7gpodlrhxlji90u6r3mlng` (`follower_id`),
  KEY `FKkcoemc64xrm83cdmhyaphcuiu` (`following_id`),
  CONSTRAINT `FKkcoemc64xrm83cdmhyaphcuiu` FOREIGN KEY (`following_id`) REFERENCES `member` (`id`),
  CONSTRAINT `FKtps7gpodlrhxlji90u6r3mlng` FOREIGN KEY (`follower_id`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `job` (
  `created_at` date DEFAULT NULL,
  `expiration_date` datetime(6) DEFAULT NULL,
  `opening_date` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `company_id` bigint NOT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `education_level` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `industry` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `job_category` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `region` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `work_type` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `external_job_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKi4agrynui4xwole46xph75vru` (`external_job_id`),
  KEY `FK5q04favsasq8y70bsei7wv8fc` (`company_id`),
  CONSTRAINT `FK5q04favsasq8y70bsei7wv8fc` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `liked_content` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `member_id` bigint NOT NULL,
  `targetId` bigint NOT NULL,
  `type` enum('COMPANY','JOB','NEWS','PROJECT') COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKp52daec775qwmwjm148qedumv` (`member_id`),
  CONSTRAINT `FKp52daec775qwmwjm148qedumv` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `member` (
  `birth` date NOT NULL,
  `isDeleted` bit(1) NOT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `refreshToken` varchar(1000) COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `gender` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `nickname` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `phoneNumber` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `profile` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `role` enum('ADMIN','GUEST','USER') COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKmbmcqelty0fbrvxp1q58dn57t` (`email`),
  UNIQUE KEY `UKhh9kg6jti4n1eoiertn2k6qsc` (`nickname`),
  UNIQUE KEY `UK1sg4e4evyc47i0jv269l5v1e9` (`phoneNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `news` (
  `published_at` datetime(6) DEFAULT NULL,
  `company_id` bigint NOT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description` text COLLATE utf8mb4_bin,
  `thumbnail_url` varchar(1024) COLLATE utf8mb4_bin DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `url` varchar(1024) COLLATE utf8mb4_bin NOT NULL,
  `url_sha` binary(32) GENERATED ALWAYS AS (unhex(sha2(`url`,256))) STORED,
  `company_name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `url_sha256` binary(32) GENERATED ALWAYS AS (unhex(sha2(`url`,256))) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_news_url_sha` (`url_sha`),
  UNIQUE KEY `uq_news_url_sha256` (`url_sha256`),
  KEY `FKqj83qt93qlwj8p3tq9hnss1p7` (`company_id`),
  CONSTRAINT `FKqj83qt93qlwj8p3tq9hnss1p7` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `portfolio` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blog_url` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `education` varchar(2000) COLLATE utf8mb4_bin DEFAULT NULL,
  `github_url` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `introduce` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  `language` varchar(2000) COLLATE utf8mb4_bin DEFAULT NULL,
  `linkedIn_url` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `tech_list` varchar(1000) COLLATE utf8mb4_bin DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `member_id` bigint NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `phone_number` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKhkjiiwx38ctlby4yt4y82tua7` (`member_id`),
  CONSTRAINT `FKhkjiiwx38ctlby4yt4y82tua7` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `portfolio_project` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `portfolio_id` bigint NOT NULL,
  `project_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKo2oal6wqogq5dg6t85rdg08i2` (`portfolio_id`,`project_id`),
  KEY `FKenfe1rn39j0tgu4cwcdxp7i71` (`project_id`),
  CONSTRAINT `FK6lmy2sssbr9cw0gk81bvl2yjr` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolio` (`id`),
  CONSTRAINT `FKenfe1rn39j0tgu4cwcdxp7i71` FOREIGN KEY (`project_id`) REFERENCES `project_post` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `project_comment` (
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `member_id` bigint DEFAULT NULL,
  `project_post` bigint DEFAULT NULL,
  `content` text COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  KEY `FKkqlobm6g7e67499j54yrc4goq` (`member_id`),
  KEY `FK84ljbddgbrlngd23jvbj10q7h` (`project_post`),
  CONSTRAINT `FK84ljbddgbrlngd23jvbj10q7h` FOREIGN KEY (`project_post`) REFERENCES `project_post` (`id`),
  CONSTRAINT `FKkqlobm6g7e67499j54yrc4goq` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `project_file` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `project_post_id` bigint DEFAULT NULL,
  `file_url` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `is_pdf` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK76f3i5ccxhp3jufte3yyl48qp` (`project_post_id`),
  CONSTRAINT `FK76f3i5ccxhp3jufte3yyl48qp` FOREIGN KEY (`project_post_id`) REFERENCES `project_post` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `project_post` (
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `member_id` bigint NOT NULL,
  `view_count` bigint DEFAULT NULL,
  `content` text COLLATE utf8mb4_bin NOT NULL,
  `thumbnail_url` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `github_url` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `is_public` bit(1) DEFAULT NULL,
  `youtube_url` varchar(500) COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9cpog1ssobcvh0u2q1onsqfit` (`member_id`),
  CONSTRAINT `FK9cpog1ssobcvh0u2q1onsqfit` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `project_tech` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_post_id` bigint DEFAULT NULL,
  `tech_code_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKtr9tu269ey0xphlo8aokx89uo` (`project_post_id`),
  KEY `FKcbw7272aghht3uf3t8x7h3hmu` (`tech_code_id`),
  CONSTRAINT `FKcbw7272aghht3uf3t8x7h3hmu` FOREIGN KEY (`tech_code_id`) REFERENCES `tech_code` (`id`),
  CONSTRAINT `FKtr9tu269ey0xphlo8aokx89uo` FOREIGN KEY (`project_post_id`) REFERENCES `project_post` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `project_tech_stack` (
  `my_row_id` bigint unsigned NOT NULL AUTO_INCREMENT /*!80023 INVISIBLE */,
  `project_id` bigint NOT NULL,
  `tech_stack` enum('ANGULAR','AWS','BOOTSTRAP','CSS','DJANGO','DOCKER','FLASK','HTML','JAVA','JAVASCRIPT','JQUERY','KUBERNETES','MARIA_DB','MONGODB','MSSQL','MYSQL','NODE_JS','NOSQL','ORACLE_DB','POSTGRESQL','PYTHON','REACT','REDIS','REDUX','SPRING','SPRINGBOOT','SQL','SQLITE','TYPESCRIPT','VUE_JS') COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`my_row_id`),
  KEY `FKfxib4c9sqp45x75sl4lgsxqee` (`project_id`),
  CONSTRAINT `FKfxib4c9sqp45x75sl4lgsxqee` FOREIGN KEY (`project_id`) REFERENCES `project_post` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE `tech_code` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code_name` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `tech_category` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKto6lixxr2nycx16kaqq5c5bdb` (`code_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

SET FOREIGN_KEY_CHECKS=1;
