import os
import logging
import time
from datetime import datetime
from typing import List, Dict

import requests
import pymysql

from rr_batch import get_batch, advance_index
from lock import acquire_lock, release_lock

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)  # ENV 파일 우선으로 읽음

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# NEWSAPI ENV 
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
NEWSAPI_ENDPOINT = "https://newsapi.org/v2/everything"
REQUEST_SLEEP_SEC = float(os.getenv("NEWSAPI_CALL_INTERVAL_SEC", "0.2"))
ARTICLES_PER_COMPANY = int(os.getenv("NEWSAPI_ARTICLES_PER_COMPANY", "100"))  # 최대 100
LANG = os.getenv("NEWSAPI_LANG", "en")  
SORT_BY = os.getenv("NEWSAPI_SORT_BY", "publishedAt") 

# MYSQL ENV
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DB = os.getenv("MYSQL_DB")
MYSQL_CHARSET = os.getenv("MYSQL_CHARSET", "utf8mb4")
MYSQL_SSL_CA = os.getenv("MYSQL_SSL_CA") 

# 언어 우선순위: NEWSAPI_LANG > NEWS_LANGUAGE, 둘 다 없거나 미지원이면 사용 안 함
_supported = {"ar","de","en","es","fr","he","it","nl","no","pt","ru","sv","ud","zh"}
_lang_env = os.getenv("NEWSAPI_LANG") or os.getenv("NEWS_LANGUAGE")
LANG = _lang_env if (_lang_env and _lang_env in _supported) else None

def _db():
    kw = dict(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        charset=MYSQL_CHARSET,
        autocommit=False,
        cursorclass=pymysql.cursors.DictCursor,
    )
    # 원격에서 실행할 때
    if MYSQL_HOST not in ("localhost", "127.0.0.1"):
        if MYSQL_SSL_CA and os.path.exists(MYSQL_SSL_CA):
            kw["ssl"] = {"ca": MYSQL_SSL_CA}
        else:
            raise RuntimeError(
                "MYSQL_SSL_CA 파일이 없어서 TLS 검증을 못합니다. "
                "Azure(MySQL require_secure_transport=ON)에는 CA 경로가 필수입니다."
            )
    return pymysql.connect(**kw)

def _fetch_from_newsapi(company_name: str) -> List[Dict]:
    headers = {"X-Api-Key": NEWSAPI_KEY} if NEWSAPI_KEY else {}
    params = {
        "q": f'"{company_name}"',
        "pageSize": min(ARTICLES_PER_COMPANY, 100),
        "sortBy": SORT_BY,
    }
    if LANG:  
        params["language"] = LANG
    resp = requests.get(NEWSAPI_ENDPOINT, headers=headers, params=params, timeout=15)
    if resp.status_code == 429:
        # 쿼터 제한 → 상위에서 중단 판단
        resp.raise_for_status()
    resp.raise_for_status()
    data = resp.json()
    return data.get("articles", []) or []

def _insert_articles(conn, company_id: int, company_name: str, articles: List[Dict]) -> int:
    """
    bulk insert + ON DUPLICATE KEY UPDATE 로 중복 방지
    """
    if not articles:
        return 0

    rows = []
    for a in articles:
        url = a.get("url")
        if not url:
            continue
        title = (a.get("title") or "")[:255]
        desc = a.get("description") or None
        thumbnail_url = a.get("urlToImage")  
        published_at = a.get("publishedAt")
        try:
            # ISO8601 → date (YYYY-MM-DD)
            dt = datetime.fromisoformat(published_at.replace("Z", "+00:00")).date() if published_at else None
        except Exception:
            dt = None

        rows.append((
            company_id, company_name, title, desc, thumbnail_url, url, dt
        ))

    if not rows:
        return 0

    sql = """
    INSERT INTO news (company_id, company_name, title, description, thumbnail_url, url, published_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
      company_name=VALUES(company_name),
      title=VALUES(title),
      description=VALUES(description),
      thumbnail_url=VALUES(thumbnail_url),
      published_at=VALUES(published_at)
    """

    assert len(rows[0]) == sql.count("%s"), f"placeholders({sql.count('%s')}) != rowlen({len(rows[0])})"
    
    with conn.cursor() as cur:
        cur.executemany(sql, rows)
        affected = cur.rowcount
    return cur.rowcount

def _get_company(conn, name: str) -> Dict:
    sql = "SELECT id, name FROM company WHERE name = %s"
    with conn.cursor() as cur:
        cur.execute(sql, (name,))
        row = cur.fetchone()
        if not row:
            raise ValueError(f"Company not found: {name}")
        return {"id": row["id"], "name": row["name"]}

def fetch_and_store(company_name: str) -> int:
    """
    단일 회사 처리: API 호출 → DB insert
    """
    conn = _db()
    try:
        company = _get_company(conn, company_name)
        cid = company["id"]
        cname = company["name"]
        articles = _fetch_from_newsapi(cname)
        cnt = _insert_articles(conn, cid, cname, articles)
        conn.commit()
        logger.info("Stored %s articles for %s", cnt, company_name)
        return cnt
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def run_batch(n_per_day: int) -> int:
    """
    오늘 처리할 회사 n개 라운드로빈 호출/저장.
    - Redis 분산락으로 중복 실행 방지
    - 429 등 HTTPError 발생하면 즉시 중단
    """
    token = acquire_lock()
    if not token:
        logger.info("Another worker holds the lock. Skip.")
        return 0

    processed = 0
    try:
        companies, start_idx, planned = get_batch(n_per_day)
        logger.info("Batch start idx=%s planned=%s", start_idx, planned)
        for name in companies:
            try:
                _ = fetch_and_store(name)
                processed += 1
                time.sleep(REQUEST_SLEEP_SEC)  # 과도한 RPS 방지
            except requests.HTTPError as he:
                status = getattr(he.response, "status_code", None)
                logger.exception("HTTPError %s on %s", status, name)
                if status == 429:
                    # 쿼터 제한 → 즉시 중단하고 지금까지 전진
                    break
            except Exception:
                logger.exception("Unexpected error on %s (skip)", name)
                # 개별 실패는 스킵하고 계속
                continue
        advance_index(processed)
        logger.info("Batch end processed=%s planned=%s", processed, planned)
        return processed
    finally:
        release_lock(token)

def run_batch_test() -> int:
    """
    테스트용: 5개만(환경변수 NEWSAPI_TEST_COUNT로 조절 가능)
    """
    n = int(os.getenv("NEWSAPI_TEST_COUNT", "5"))
    return run_batch(n)
