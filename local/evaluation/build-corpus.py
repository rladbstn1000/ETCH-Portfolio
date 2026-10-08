#!/usr/bin/env python3
"""수동으로 정의한 의도/관련도를 결정적 JSON으로 렌더링한다. 검색 API를 호출하지 않는다."""
import json
from pathlib import Path
HERE = Path(__file__).resolve().parent
VERSION = 'etch-synthetic-search-v1'
COMPANIES = ['가상 하늘연구소','가상 모래금융','가상 새벽데이터','가상 파도게임','가상 숲보안','가상 별모바일']
# title/topic, techs, job category, project category. Similar words with different intents are deliberate.
TOPICS = [
 ('Spring Java 백엔드 API', ['Java','Spring'], '백엔드', 'SERVER'),
 ('Spring 결제 서버', ['Java','Spring','MySQL'], '백엔드', 'SERVER'),
 ('React TypeScript 웹 화면', ['React','TypeScript'], '프론트엔드', 'WEB'),
 ('React 접근성 디자인 시스템', ['React','CSS'], '프론트엔드', 'WEB'),
 ('Python 데이터 파이프라인', ['Python','SQL'], '데이터엔지니어', 'DATABASE'),
 ('Python 데이터 분석', ['Python','SQL'], '데이터분석가', 'DATABASE'),
 ('Kubernetes 클라우드 배포', ['Kubernetes','Docker'], 'DevOps/클라우드', 'DEVOPS'),
 ('Kubernetes 장애 관측', ['Kubernetes','Redis'], 'DevOps/클라우드', 'DEVOPS'),
 ('핀테크 결제 보안', ['Java','Redis'], '보안', 'SECURITY'),
 ('검색 Elasticsearch 색인', ['Elasticsearch','Java'], '백엔드', 'SERVER'),
 ('Android Kotlin 모바일', ['Android','Kotlin'], '앱개발', 'MOBILE'),
 ('보안 인증 접근 제어', ['Java','Spring'], '보안', 'SECURITY'),
 ('Spring 사내 교육 운영', ['Java'], '교육운영', 'WEB'),
 ('React 마케팅 소개 화면', ['React'], '웹디자인', 'WEB'),
 ('Python 학습 노트', ['Python'], '교육운영', 'WEB'),
 ('Kubernetes 비용 보고서', ['SQL'], '기획', 'DATABASE'),
 ('핀테크 기업 홍보', ['HTML'], '마케팅', 'WEB'),
 ('게임 Unity 실시간 서버', ['Unity','Redis'], '게임개발', 'SERVER'),
 ('게임 채용 행사 안내', ['HTML'], '교육운영', 'WEB'),
 ('검색 사용자 설문 화면', ['React'], '프론트엔드', 'WEB'),
 ('Android 기기 구매 관리', ['SQL'], '기획', 'DATABASE'),
 ('보안 사내 교육 안내', ['HTML'], '교육운영', 'WEB'),
 ('하늘연구소 지역 봉사', ['HTML'], '총무', 'WEB'),
 ('Spring React 검색 삭제 검증', ['Spring','React'], '백엔드', 'SERVER'),
]
DESCRIPTIONS = [
 'REST API와 트랜잭션 구현을 다룬다.', '결제 중복 요청과 서버 처리 상태를 다룬다.',
 '컴포넌트 상태와 TypeScript 인터페이스를 다룬다.', '키보드 이동과 화면 읽기 순서를 다룬다.',
 '배치 입력의 검증과 데이터 변환을 다룬다.', '집계와 통계 보고서를 다룬다.',
 '컨테이너 롤링 배포와 환경 구성을 다룬다.', '실패 로그와 서비스 상태 관측을 다룬다.',
 '결제 접근 권한과 민감한 요청 보호를 다룬다.', '문서 색인과 한국어 검색 필터를 다룬다.',
 '모바일 앱 화면과 기기 상태를 다룬다.', '사용자 권한과 인증 경계를 다룬다.',
 '서버 개발 업무가 아닌 교육 일정 운영이다.', '제품 구현보다 홍보 화면 제작에 초점을 둔다.',
 '운영 파이프라인이 아닌 입문 학습 기록이다.', '클러스터 구축이 아닌 비용 집계 보고이다.',
 '결제 구현이 아닌 기업 이미지 홍보다.', '실시간 게임 상태 전달을 다룬다.',
 '게임 개발이 아닌 취업 행사 운영이다.', '색인 구현이 아닌 검색 만족도 설문이다.',
 '앱 개발이 아닌 기기 자산 구매 관리다.', '인증 구현이 아닌 교육 일정 안내다.',
 '기술 직무가 아닌 지역 사회활동이다.', '삭제 이후 검색에서 노출되지 않아야 하는 검증 전용 문서다.',
]

def dump(name, value):
    (HERE/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

corpus = {'version':VERSION,'authorship':'Codex 작성 합성 데이터; 실사용자·전문가 정답 또는 실제 채용 표본이 아님',
          'demoDate':'2026-09-01','generation':'고정 배열 순서 + 종류별 ID 41001/42001/43001 시작; 검색 결과를 사용하지 않음',
          'companies':[{'id':46001+i,'name':name} for i,name in enumerate(COMPANIES)],
          'members':[{'id':47001,'nickname':'가상 개발자 하늘'},{'id':47002,'nickname':'가상 개발자 모래'}],
          'jobs':[], 'news':[], 'projects':[]}
for n, ((topic, techs, job_category, category), description) in enumerate(zip(TOPICS, DESCRIPTIONS),1):
    company = corpus['companies'][(n-1)%6]
    created = f'2026-08-{n:02d}T09:00:00'
    region = ['서울','서울,경기','부산','서울','대전','부산'][((n-1)%6)]
    common = {'id':41000+n,'title':f'[합성] {topic} 담당자 모집','companyId':company['id'],
       'companyName':company['name'],'regions':region.split(','),'industries':['IT'],
       'jobCategories':[job_category],'workType':'정규직' if n%4 else '계약직',
       'educationLevel':'학력무관','openingDate':created,
       'expirationDate':('2026-08-31T23:59:59' if n in (13,19) else f'2026-09-{min(n+5,28):02d}T23:59:59'),
       'externalJobId':f'eval-v1-job-{n:02d}','deleted':n==24}
    corpus['jobs'].append(common)
    corpus['news'].append({'id':42000+n,'title':f'[합성 기사] {topic} 이야기',
       'summary':f'{description} 실제 기사나 기업 발표가 아닌 고정 데모 자료입니다.',
       'companyId':company['id'],'companyName':company['name'],'publishedAt':created,
       'link':f'https://example.invalid/evaluation/news/{42000+n}','thumbnailUrl':None,'deleted':n==24})
    corpus['projects'].append({'id':43000+n,'title':f'[합성 프로젝트] {topic}',
       'content':f'<h2>{topic}</h2><p>{description}</p><p>2026-09-01 기준 합성 데모입니다. 실제 사용자 작업이나 운영 성과가 아닙니다.</p>',
       'memberId':47001 if n%2 else 47002,'category':category,'techs':techs,
       'createdAt':created,'isPublic':n not in (22,23),'deleted':n==24,'viewCount':n*3})
dump('corpus.json',corpus)
# Exactly 10 authored intents for each type; no API scores or results inform the grades.
INTENTS = [
 ('Spring', 'Spring 기반 서버/API 구현을 찾는다.', [1,2], [12,13]),
 ('React', 'React 웹 화면 또는 접근성 구현을 찾는다.', [3,4], [14,20]),
 ('Python 데이터', 'Python으로 데이터를 처리하거나 분석하는 작업을 찾는다.', [5,6], [15]),
 ('Kubernetes', 'Kubernetes 배포와 서비스 운영을 찾는다.', [7,8], [16]),
 ('핀테크', '핀테크 결제 기술과 보안을 찾는다.', [2,9], [17]),
 ('하늘연구소', '가상 하늘연구소의 기술 관련 자료를 찾는다.', [1,7,13], [19,23]),
 ('Android', 'Android 모바일 앱 개발을 찾는다.', [11], [21]),
 ('보안', '인증·접근 권한·결제 보안 구현을 찾는다.', [9,12], [22]),
 ('게임', '실시간 게임 구현을 찾는다.', [18], [19]),
 ('검색', '검색 엔진 색인과 검색 구현을 찾는다.', [10], [20]),
]
queries=[]
for kind, key, prefix in [('job','jobs',41000),('news','news',42000),('project','projects',43000)]:
    for i,(keyword,intent,direct,partial) in enumerate(INTENTS,1):
        labels=[]
        for n,document in enumerate(corpus[key],1):
            hidden=document['deleted'] or (kind=='project' and not document['isPublic'])
            grade=0 if hidden else 2 if n in direct else 1 if n in partial else 0
            # For projects, companyName is intentionally not indexed: company query intent is still
            # judged on semantic topic, but authors are fictional individual users. No fake guarantee.
            if kind=='project' and i==6:
                grade=0 if hidden else 2 if n==1 else 1 if n==7 else 0
            reason=('공개 검색 대상에서 제외되는 검증 문서' if hidden else
                    ('검색 의도의 핵심 구현/대상과 직접 관련: '+document['title'] if grade==2 else
                     '같은 기술명/주제를 포함하지만 의도가 일부 다름: '+document['title'] if grade==1 else
                     '이 질의의 핵심 기술·업무 대상과 무관'))
            labels.append({'id':document['id'],'grade':grade,'reason':reason})
        if kind=='project' and i==6:
            keyword='하늘'; intent='가상 개발자 하늘이 공개한 서버·인프라 구현을 찾는다. 작성자의 다른 주제는 무관 또는 부분 관련이다.'
        queries.append({'id':f'{kind}-{i:02d}','kind':kind,'keyword':keyword,'filters':{},
            'sort':'LATEST' if kind=='project' else 'ES relevance (_score descending; no explicit tie-breaker)',
            'intent':intent,'labels':labels,'forbiddenIds':[d['id'] for d in corpus[key] if d['deleted'] or (kind=='project' and not d['isPublic'])],
            'forbiddenConditions':['deleted=true']+(['isPublic=false','현재 DB가 공개를 허용하지 않는 문서'] if kind=='project' else [])})
dump('queries.json', {'version':VERSION,'gradeDefinition':{'0':'무관 또는 공개 대상 아님','1':'부분 관련','2':'직접 관련'},
    'judging':'Codex가 합성 문서와 의도만 보고 실행 전에 각 질의의 전체24문서에 등급·이유를 부여함',
    'metric':'nDCG@5, gain=2^grade-1; current service ordering, not a new relevance sort', 'queries':queries})
print('Rendered fixed corpus: 24 documents × 3 kinds; 30 queries × 24 complete judgments. No search request made.')
