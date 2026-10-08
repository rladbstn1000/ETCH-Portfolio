import os
import logging
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from pytz import timezone

from fetch_news import run_batch, run_batch_test
from cache_for_redis import fetch_and_store_top10

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True) 

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

SEOUL = timezone("Asia/Seoul")

def job_news():
    try:
        n = int(os.getenv("NEWSAPI_DAILY_COUNT", "100"))
        cnt = run_batch(n)
        logger.info("[11:00] News Batch done: %d companies", cnt)
    except Exception:
        logger.exception("job_news failed")

def job_news_retry():
    try:
        n = int(os.getenv("NEWSAPI_DAILY_COUNT", "100"))
        cnt = run_batch(n)
        logger.info("[11:40] News Retry Batch done: %d companies", cnt)
    except Exception:
        logger.exception("job_news_retry failed")

def job_top10():
    try:
        fetch_and_store_top10()
        logger.info("Top10 cached")
    except Exception:
        logger.exception("job_top10 failed")

def job_news_test():
    try:
        cnt = run_batch_test()
        logger.info("[TEST] News Batch done: %d companies", cnt)
    except Exception:
        logger.exception("job_news_test failed")

if __name__ == "__main__":
    sched = BlockingScheduler(timezone=SEOUL)

    # 매일 11:00 본 실행
    sched.add_job(job_news, CronTrigger(hour=11, minute=0, timezone=SEOUL), id="news_batch")

    # 매일 11:40 재시도 (429 등일 때)
    sched.add_job(job_news_retry, CronTrigger(hour=11, minute=40, timezone=SEOUL), id="news_batch_retry")

    # 매일 11:15 Top10 캐시
    sched.add_job(job_top10, CronTrigger(hour=11, minute=10, timezone=SEOUL), id="top10_batch")

    # 테스트 잡
    # sched.add_job(job_news_test, CronTrigger(hour=12, minute=17, timezone=SEOUL), id="news_batch_test")

    logger.info("Scheduler start")
    try:
        sched.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped")
