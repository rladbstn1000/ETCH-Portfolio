#!/usr/bin/env python3
"""평가기의 실패 판정과 저장된 실제 통합 응답을 검사한다. HTTP/DB 호출 없음."""
import copy
import json
import tempfile
from pathlib import Path
import evaluate

ROOT=evaluate.prepare.ROOT
EVIDENCE=ROOT/'docs/portfolio/evidence/evaluation'


def main():
    policy=[]
    base={'queryErrors':[],'functionalPassed':0,'functionalTotal':0,'httpErrors':0}
    for phase in ('relevance','warmup','measured'):
        for status in (0,400,401,403,404,429,500,503):
            records=[{'phase':phase,'queryId':'job-01','status':status}]
            errors=evaluate.unexpected_search_http(records)
            assert evaluate.run_failed(dict(base,unexpectedSearchHttpResponses=errors))
            policy.append({'phase':phase,'status':status,'failsRun':True})
    assert not evaluate.run_failed(dict(base,unexpectedSearchHttpResponses=evaluate.unexpected_search_http([
        {'phase':'functional','queryId':'anonymous-private','status':401},
        {'phase':'functional','queryId':'other-private','status':403},
        {'phase':'measured','queryId':'job-01','status':200}])))
    assert evaluate.run_failed(dict(base,functionalPassed=0,functionalTotal=1))
    records=[json.loads(line) for line in (EVIDENCE/'baseline/requests.jsonl').read_text().splitlines()]
    unified=[]
    for keyword in ('Spring','React','검색','"'):
        record=next(r for r in records if r.get('queryId')=='unified-'+keyword)
        passed,expected=evaluate.unified_matches_individual(record,records,keyword)
        assert passed
        unified.append({'keyword':keyword,'expectedIdsByKind':expected,'actualSavedResponseMatches':True})
    bad=copy.deepcopy(next(r for r in records if r.get('queryId')=='unified-Spring'))
    for group in bad['response']['data'].values():group['content']=[]
    assert not evaluate.unified_matches_individual(bad,records,'Spring')[0]
    original_hashes={name:evaluate.prepare.sha(EVIDENCE/name/'requests.jsonl') for name in ('baseline','latency-steady')}
    for name in ('baseline','latency-steady'):
        saved=[json.loads(line) for line in (EVIDENCE/name/'requests.jsonl').read_text().splitlines()]
        assert not evaluate.unexpected_search_http(saved)
    # Failure persistence uses fake HTTP functions only; no service or database access.
    original_http=evaluate.http
    failure_cases=[]
    manifest=json.loads((evaluate.HERE/'manifest.json').read_text())
    try:
        with tempfile.TemporaryDirectory(prefix='etch-evaluator-policy-') as temp:
            def malformed(path,phase,query_id=None,identity=None):
                return {'phase':phase,'queryId':query_id,'request':{'method':'GET','path':path},
                        'status':200,'durationMs':1.0,'response':None}
            evaluate.http=malformed
            folder=Path(temp)/'malformed'
            summary=evaluate.capture_run(folder,manifest,{},{} )
            assert evaluate.run_failed(summary)
            assert all(value is None for value in summary['ndcgAt5MeanByKind'].values())
            assert len(summary['queryErrors'])==30 and len(summary['invalidSearchResponses'])==240
            assert summary['latency']['all']['errors']==150 and summary['latency']['all']['p50Ms'] is None
            assert summary['fatalErrors']==[{'stage':'functional','errorType':'TypeError','incomplete':True}]
            assert (folder/'requests.jsonl').exists() and len((folder/'requests.jsonl').read_text().splitlines())==241
            assert json.loads((folder/'summary.json').read_text())['completed'] is False
            failure_cases.append({'case':'all-200-bodies-invalid','queryErrors':30,'meanIsNull':True,
                                  'rawRequestsPreserved':241,'summaryPreserved':True,'failsRun':True})
            calls=[0]
            def interrupted(path,phase,query_id=None,identity=None):
                calls[0]+=1
                if calls[0]==2:raise RuntimeError('synthetic adapter failure')
                return {'phase':phase,'queryId':query_id,'request':{'method':'GET','path':path},
                        'status':200,'durationMs':1.0,'response':{'data':{'content':[]}}}
            evaluate.http=interrupted
            folder=Path(temp)/'interrupted'
            summary=evaluate.capture_run(folder,manifest,{},{} )
            assert evaluate.run_failed(summary) and summary['fatalErrors'][0]['stage']=='relevance'
            assert len((folder/'requests.jsonl').read_text().splitlines())==1
            assert (folder/'summary.json').exists() and summary['completed'] is False
            failure_cases.append({'case':'adapter-failure-after-first-request','rawRequestsPreserved':1,
                                  'summaryPreserved':True,'failsRun':True})
    finally:
        evaluate.http=original_http
    result={'httpPolicyCases':policy,'intentionalAuthorizationErrorsExcluded':True,'functionalFailureStillFails':True,
      'savedUnifiedComparisons':unified,'emptyUnifiedRegressionRejected':True,'originalSearchRecordsStillSuccessful':True,
      'originalRequestFileSha256':original_hashes,'failurePersistenceCases':failure_cases,'noNewApiCalls':True,
      'note':'기존 실제 원본은 수정하지 않음. 순수 가짜 상태 검사와 저장된 실제 응답 재검사.'}
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
