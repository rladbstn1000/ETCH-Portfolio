import os
import pymysql
import redis
import json
import logging
import sys
from typing import Optional

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

def env_required(k: str) -> str:
    v = os.getenv(k)
    if not v:
        raise RuntimeError(f"환경 변수 {k}를 설정하세요.")
    return v

def env_int(k: str, default: Optional[int] = None) -> int:
    v = os.getenv(k)
    if v is None:
        if default is None:
            raise RuntimeError(f"환경 변수 {k}를 설정하세요.")
        return default
    return int(v)

MYSQL_HOST     = env_required("MYSQL_HOST")
MYSQL_PORT     = env_int("MYSQL_PORT")
MYSQL_USER     = env_required("MYSQL_USER")
MYSQL_PASSWORD = env_required("MYSQL_PASSWORD")
MYSQL_DB       = env_required("MYSQL_DB")
MYSQL_CHARSET  = env_required("MYSQL_CHARSET")
MYSQL_SSL_CA   = os.getenv("MYSQL_SSL_CA")   # ← 선택값(빈 값 허용)

REDIS_HOST     = env_required("REDIS_HOST")
REDIS_PORT     = env_int("REDIS_PORT")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("cache_top10")

def fetch_and_store_top10():
    # MySQL 연결 (TLS: 경로 있을 때만)
    kw = dict(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        charset=MYSQL_CHARSET,
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )
    if MYSQL_SSL_CA:
        kw["ssl"] = {"ca": MYSQL_SSL_CA}

    conn = pymysql.connect(**kw)

    # Redis 연결
    r = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.id   AS company_id,
                       c.name AS company_name,
                       COUNT(DISTINCT l.id) AS like_count,
                       COUNT(DISTINCT n.id) AS article_count
                  FROM company c
                  LEFT JOIN liked_content l
                         ON c.id = l.targetId AND l.type = 'COMPANY'
                  LEFT JOIN news n
                         ON c.id = n.company_id
                GROUP BY c.id, c.name
                ORDER BY like_count DESC
                LIMIT 10
            """)
            top10 = cur.fetchall()

        # 캐시 초기화 & 저장
        r.delete("top10_companies")
        for idx, comp in enumerate(top10, start=1):
            key = f"top10_companies:{idx}"
            r.hset(key, mapping={
                "company_id":   comp["company_id"],
                "company_name": comp["company_name"],
                "likes":        comp["like_count"],
                "article_count":comp["article_count"],
            })
            r.rpush("top10_companies", key)

        logger.info("Redis 저장 완료: %d개 회사", len(top10))
    finally:
        conn.close()

if __name__ == "__main__":
    fetch_and_store_top10()
