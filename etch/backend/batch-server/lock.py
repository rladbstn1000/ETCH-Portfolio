import os
import socket
import uuid
import redis

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True) 

LOCK_KEY = os.getenv("NEWS_LOCK_KEY", "news:lock")
LOCK_TTL = int(os.getenv("NEWS_LOCK_TTL", "900"))  # 15분

def _redis():
    return redis.StrictRedis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        password=os.getenv("REDIS_PASSWORD", None),
        decode_responses=True,
    )

def acquire_lock() -> str | None:
    """
    락을 얻으면 토큰 반환, 못 얻으면 None
    """
    r = _redis()
    token = f"{socket.gethostname()}:{os.getpid()}:{uuid.uuid4()}"
    ok = r.set(LOCK_KEY, token, nx=True, ex=LOCK_TTL)
    return token if ok else None

def release_lock(token: str) -> None:
    """
    토큰 소유자만 락 해제
    """
    r = _redis()
    pipe = r.pipeline(True)
    while True:
        try:
            pipe.watch(LOCK_KEY)
            val = pipe.get(LOCK_KEY)
            if val == token:
                pipe.multi()
                pipe.delete(LOCK_KEY)
                pipe.execute()
            pipe.reset()
            break
        except redis.WatchError:
            # 경쟁 상태면 포기(만료가 있어서 영구 잠금 아님)
            break
