#!/usr/bin/env python3
"""합성 계정 + 로컬 키로 정상 JWT를 서명하여 실제 HTTP 권한 경로를 검증한다.
인증 우회 엔드포인트는 만들지 않는다. 토큰/키는 출력하지 않는다.
"""
import base64
import hashlib
import hmac
import json
from pathlib import Path
import time
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
env = dict(line.split('=', 1) for line in (ROOT / '.env').read_text().splitlines()
           if line and not line.startswith('#') and '=' in line)
BASE = 'http://127.0.0.1:' + env.get('BACKEND_PORT', '18476')
CHECKS = 0


def token(member, role='USER'):
    def b64(value):
        return base64.urlsafe_b64encode(value).decode().rstrip('=')
    header = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())
    claims = b64(json.dumps({'category': 'access', 'email': 'owner@example.invalid' if member == 9001 else 'other@example.invalid',
                            'id': member, 'role': role, 'iat': int(time.time()), 'exp': int(time.time()) + 300}).encode())
    message = header + '.' + claims
    signature = hmac.new(env['SPRING_JWT_SECRET'].encode(), message.encode(), hashlib.sha256).digest()
    return message + '.' + b64(signature)


def request(path, expected, identity=None, method='GET', body=None, label=None, raw_body=None, content_type='application/json'):
    global CHECKS
    headers = {'Content-Type': content_type}
    if identity:
        headers['Authorization'] = 'Bearer ' + identity
    req = urllib.request.Request(BASE + path, headers=headers, method=method,
                                 data=raw_body if raw_body is not None else json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status, raw = response.status, response.read()
    except urllib.error.HTTPError as response:
        status, raw = response.code, response.read()
    assert status == expected, f'{label or path}: expected {expected}, actual {status}'
    CHECKS += 1
    print(f'PASS {label or path}: HTTP {status}')
    return json.loads(raw) if raw else None


def main():
    owner, other, guest = token(9001), token(9002), token(9002, 'GUEST')
    request('/projects/9001', 200, label='anonymous public project')
    request('/projects', 200, label='anonymous public project list')
    request('/projects/my', 200, owner, label='owner project list')
    profile = request('/members/me', 200, owner, label='owner profile with recommendations disabled')
    assert 'refreshToken' not in profile.get('data', {}), 'refresh token leaked in profile response'
    request('/projects/9002', 401, label='anonymous private project')
    request('/projects/9002', 200, owner, label='owner private project')
    request('/projects/9002', 403, other, label='other private project')
    request('/projects/9002/comments', 401, label='anonymous private comments')
    request('/projects/9002/comments', 403, other, label='other private comments')
    request('/portfolios/list', 401, label='anonymous personal list')
    request('/portfolios/9001', 200, owner, label='owner portfolio')
    request('/portfolios/9001', 403, other, label='other portfolio')
    request('/portfolios/9001/markdown', 403, other, label='other portfolio export')
    body = {'name': '합성 작성자 포트폴리오', 'introduce': '소유권 검증용 합성 포트폴리오',
            'techList': ['Java'], 'projectIds': []}
    request('/portfolios/9001', 401, method='PUT', body=body, label='anonymous portfolio write')
    request('/portfolios/9001', 403, other, method='PUT', body=body, label='other portfolio write')
    request('/portfolios/9001', 200, owner, method='PUT', body=body, label='owner portfolio write')
    request('/portfolios/list', 403, guest, label='GUEST personal list')
    request('/portfolios/list', 401, 'invalid', label='invalid bearer')
    request('/auth/reissue', 401, method='POST', label='missing refresh cookie')
    boundary = 'etch-synthetic-upload-boundary'
    data = json.dumps({'title': 'storage-disabled synthetic verification', 'content': 'synthetic',
                       'projectCategory': 'WEB', 'isPublic': True, 'techCodeIds': []}).encode()
    png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZfoAAAAASUVORK5CYII=')
    multipart = (f'--{boundary}\r\nContent-Disposition: form-data; name="data"; filename="data.json"\r\n'
                 'Content-Type: application/json\r\n\r\n').encode() + data
    multipart += (f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="thumbnail"; filename="synthetic.png"\r\n'
                  'Content-Type: image/png\r\n\r\n').encode() + png
    multipart += f'\r\n--{boundary}--\r\n'.encode()
    request('/projects', 503, owner, method='POST', raw_body=multipart,
            content_type=f'multipart/form-data; boundary={boundary}', label='storage disabled returns 503')
    print(f'권한 HTTP 검증 {CHECKS}개 통과 (실제 JWT/filter/service/MySQL, 외부 OAuth 미사용)')

if __name__ == '__main__':
    main()
