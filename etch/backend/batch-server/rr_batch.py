import os
import logging
from typing import List, Tuple
import redis
import pymysql

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True) 

logger = logging.getLogger(__name__)

# Redis key(라운드로빈 시작 인덱스)
REDIS_KEY_INDEX = os.getenv("NEWS_RR_INDEX_KEY", "news:rr:index")

def _redis():
    return redis.StrictRedis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        password=os.getenv("REDIS_PASSWORD", None),
        decode_responses=True,
    )

def _db():
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER = os.getenv("MYSQL_USER")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
    MYSQL_DB = os.getenv("MYSQL_DB")
    MYSQL_CHARSET = os.getenv("MYSQL_CHARSET", "utf8mb4")
    MYSQL_SSL_CA = os.getenv("MYSQL_SSL_CA") 

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

    # 원격에서 실행할 때
    if MYSQL_HOST not in ("localhost", "127.0.0.1"):
        if MYSQL_SSL_CA and os.path.exists(MYSQL_SSL_CA):
            kw["ssl"] = {"ca": MYSQL_SSL_CA}  # 검증 포함(TLS)
        else:
            raise RuntimeError(
                "MYSQL_SSL_CA 파일이 없어서 TLS 검증을 못합니다. "
                "Azure(MySQL require_secure_transport=ON)에는 CA 경로가 필수입니다. "
            )

    return pymysql.connect(**kw)

def _total_companies(conn) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) AS c FROM company")
        return int(cur.fetchone()["c"])

def _fetch_chunk(conn, limit: int, offset: int) -> List[str]:
    """
    total_employees DESC, name ASC 로 이름만 뽑음
    """
    sql = """
      SELECT name
      FROM company
      ORDER BY total_employees DESC, name ASC
      LIMIT %s OFFSET %s
    """
    with conn.cursor() as cur:
        cur.execute(sql, (limit, offset))
        rows = cur.fetchall()
        return [r["name"] for r in rows]

def get_batch(n: int) -> Tuple[List[str], int, int]:
    """
    오늘 호출할 회사 n개 라운드로빈으로 가져오기.
    반환: (회사명 리스트, 시작인덱스, 계획개수)
    """
    r = _redis()
    conn = _db()

    total = _total_companies(conn)
    if total == 0:
        return [], 0, 0

    idx_str = r.get(REDIS_KEY_INDEX)
    start = int(idx_str) if idx_str is not None else 0
    start %= total

    # 랩어라운드 분할
    first = min(n, total - start)
    picked: List[str] = []
    if first > 0:
        picked += _fetch_chunk(conn, first, start)
    remain = n - first
    if remain > 0:
        picked += _fetch_chunk(conn, remain, 0)

    return picked, start, len(picked)

def advance_index(consumed: int) -> int:
    """
    실제 처리한 개수만큼 인덱스 전진
    """
    r = _redis()
    conn = _db()
    total = _total_companies(conn)
    if total == 0:
        return 0
    idx_str = r.get(REDIS_KEY_INDEX)
    start = int(idx_str) if idx_str is not None else 0
    new_idx = (start + consumed) % total
    r.set(REDIS_KEY_INDEX, str(new_idx))
    logger.info("Round-robin index %s -> %s (consumed=%s)", start, new_idx, consumed)
    return new_idx
