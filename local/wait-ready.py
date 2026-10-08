#!/usr/bin/env python3
"""컨테이너 running과 실제 앱 준비 완료를 구분하는 로컬 준비 상태 검사."""
import argparse
import json
import time
import urllib.error
import urllib.request
import runtime


def ready():
    endpoints = [(runtime.API_URL + '/actuator/health', 'backend'),
                 (runtime.FRONTEND_URL, 'frontend'),
                 (runtime.LOGSTASH_URL + '/_node/stats/pipelines', 'logstash')]
    pending = []
    for endpoint, name in endpoints:
        try:
            with urllib.request.urlopen(endpoint, timeout=3) as response:
                body = response.read()
            if name == 'backend' and json.loads(body).get('status') != 'UP':
                pending.append(name)
            if name == 'logstash':
                pipelines = json.loads(body).get('pipelines', {})
                if not all(isinstance(pipelines.get(p, {}).get('events'), dict)
                           and isinstance(pipelines.get(p, {}).get('queue'), dict)
                           for p in ('jobs', 'news')):
                    pending.append(name)
        except (OSError, ValueError, urllib.error.URLError):
            pending.append(name)
    return pending


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--timeout', type=int, default=180)
    args = parser.parse_args()
    end = time.monotonic() + args.timeout
    while True:
        pending = ready()
        if not pending:
            print('READY backend health, React, Logstash jobs/news (indexing completion is separate)')
            break
        if time.monotonic() >= end:
            raise SystemExit('Not ready: ' + ', '.join(pending))
        time.sleep(2)
