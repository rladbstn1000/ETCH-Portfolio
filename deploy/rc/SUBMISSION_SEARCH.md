# 독립 사본의 검색 검증

이 폴더의 기존 `evaluate.py`와 승인 guard는 과거 실행 환경·Git 커밋을 확인하는 원본입니다. 그 환경을 새 사본으로 가장하지 않습니다. 제출 사본에서는 `submission_search.py`를 별도로 선택합니다. 이 어댑터에는 기준선 활성화·갱신 기능이 없습니다.

## 서비스 없는 검사

```sh
python3 deploy/rc/submission_search.py verify
python3 deploy/rc/submission_search.py offline-tests
python3 -m unittest discover -s deploy/rc -p test_submission_search.py -v
python3 local/evaluation/test-evaluator.py
python3 local/test-search-sync.py
```

- `verify`: 원본 승인 파일의 고정 hash, 참조 증거 12개, 코퍼스·질의·라벨, 검색 코드·매핑 32파일을 대조합니다. 이미 검토된 Jackson import 호환 변경만 승인 기록의 별도 hash로 허용합니다.
- 기존 결과 30질의의 nDCG를 고정 라벨로 다시 계산합니다. 이는 저장된 증거 검사이며 실제 HTTP 재실행이 아닙니다.
- `offline-tests`: 기존 guard 테스트 34개를 그대로 읽어 실행합니다. runtime·환경 파일·서비스 접근은 차단하고, 테스트 자체가 정한 임시 파일과 저장 응답 fixture만 사용합니다.
- 추가 12검사는 손상 승인, 다른 포인터, 변경 라벨·매핑·검색 코드, 외부 symlink, 새 결과의 무단 승인과 기준선 덮어쓰기를 거부하는지 확인합니다.

복사된 파일의 hash 일치와 원본 Git 커밋의 존재 증명은 구분합니다. 원본 커밋 ID는 외부 원본의 과거 provenance이며, 독립 Git에는 그 객체를 복사하지 않습니다. 과거 `job-02`·`news-02` 순위/nDCG 비교 FAIL은 그대로 남습니다.

## 새 사본의 실제 API 관측

사본 전용 Compose 프로젝트에 **고정 합성 코퍼스**를 준비하고 동기화가 완료된 뒤 실행합니다. 일반 seed와 고정 평가 코퍼스는 다릅니다. 원본 checkout·기존 DB·과거 release.env를 연결하지 않습니다. `--api-origin`에는 Nginx `/api/v1` 경로를 붙이지 않은 직접 backend 주소를 지정합니다.

```sh
python3 deploy/rc/submission_search.py observe \
  --api-origin http://127.0.0.1:18476 \
  --output .local/submission-validation/search-live.json
```

30개 검색과 통합검색 4개에 실제 GET 요청을 보냅니다. 외부 주소·인증 정보가 포함된 URL·redirect는 거부하고, 출력은 사본 `.local` 아래 새 파일에만 저장합니다. 기존 결과를 덮어쓰지 않습니다.

실행 결과는 기능 계약과 저장된 결과에 대한 순위/nDCG 진단 비교입니다. 새 JAR·이미지는 별도 아티팩트이므로, 응답이 같아도 원래 승인 엔진 회귀 PASS로 표시하지 않습니다. `currentApprovedEngineRegression`은 `NOT_EVALUATED_NEW_ARTIFACT`, `runningArtifactApproval`과 `activationAllowed`는 항상 false입니다. 관측이 다르면 차이를 보고하고 종료 코드 1을 반환합니다.

이 명령만으로 DB/ES 전체 내용 대조·권한·지연시간·배포 검증을 완료했다고 해석하지 않습니다. 해당 검사는 실제로 실행한 별도 기록을 확인합니다.
