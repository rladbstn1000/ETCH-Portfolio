#!/usr/bin/env python3
"""4차 고정 질의/라벨/계산기를 새 public-demo 실제 API에서 재사용한다."""
import argparse,hashlib,importlib.util,json,re,subprocess,sys,time,urllib.parse
from pathlib import Path
import runtime
from public_helpers import prepare, sync
import evaluation_decisions as decisions

sys.modules['prepare']=prepare
spec=importlib.util.spec_from_file_location('release_evaluator',runtime.ROOT/'local/evaluation/evaluate.py')
ev=importlib.util.module_from_spec(spec);spec.loader.exec_module(ev)
ev.runtime=runtime

PREVIOUS_COMMIT='3f86a442f553f412fffd847fbbab2af87a654632'
BACKEND_CODE_COMMIT='bdf40dc741274c1f6942750a803bad2b8c3b2a16'
PREVIOUS=Path('docs/portfolio/evidence/phase7')

def command(*args):
    return subprocess.check_output(args,text=True).strip()

def evidence(path, frozen=False):
    file=(runtime.ROOT/path).resolve()
    relative=file.relative_to(runtime.ROOT)
    if relative.parts[:3]!=('docs','portfolio','evidence'):
        raise ValueError('Only repository evidence files are allowed')
    raw=file.read_bytes()
    frozen=frozen or relative.parts[3] in ('phase6','phase7')
    if frozen and raw!=subprocess.check_output(['git','-C',str(runtime.ROOT),'show',PREVIOUS_COMMIT+':'+str(relative)]):
        raise ValueError('Historical evidence changed: '+str(relative))
    return json.loads(raw),{'file':str(relative),'sha256':hashlib.sha256(raw).hexdigest()}

def load_approved_baseline(require_active=False):
    raw=(runtime.ROOT/decisions.APPROVAL_PATH).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=decisions.APPROVAL_SHA256:
        raise PermissionError('Approval record is missing, damaged or differs from the recorded user decision')
    approval=json.loads(raw)
    # Check the decision before trusting any path or commit it supplies.
    if decisions.digest(approval)!=decisions.APPROVAL_DIGEST:
        raise PermissionError('Unrecognized user decision')
    for name,sha in approval['evidenceHashes'].items():
        file=(runtime.ROOT/name).resolve()
        if not file.is_relative_to(runtime.ROOT):raise ValueError('Approval reference outside repository')
        data=file.read_bytes()
        committed=subprocess.check_output(['git','-C',str(runtime.ROOT),'show',approval['reviewedCommit']+':'+name])
        if hashlib.sha256(data).hexdigest()!=sha or data!=committed:
            raise ValueError('Approved evidence changed: '+name)
    approved=json.loads((runtime.ROOT/approval['candidateSummary']).read_bytes())
    pointer=decisions.request_activation(approved['candidate'],approval)
    active=runtime.ROOT/decisions.ACTIVE_PATH
    if active.exists():
        if active.read_bytes()!=pointer_bytes(pointer):raise PermissionError('Active baseline record changed or belongs to another decision')
    elif require_active:raise PermissionError('Accepted candidate has not been activated')
    return approval,approved,pointer

def pointer_bytes(pointer):
    return (json.dumps(pointer,ensure_ascii=False,indent=2)+'\n').encode()

def activate_after_checks(pointer,result):
    if not result['functionalContracts']['passed'] or not result['currentBaselineRegression']['passed']:
        raise ValueError('Activation refused: current observations differ or functional contracts failed')
    active=runtime.ROOT/decisions.ACTIVE_PATH
    if active.exists():
        if active.read_bytes()!=pointer_bytes(pointer):raise PermissionError('Refusing to replace a different active baseline')
    else:
        # Exclusive creation: a concurrent or manually changed pointer is never overwritten.
        with active.open('xb') as output:output.write(pointer_bytes(pointer))

def engine_identity(image_ids):
    lock,lock_ref=evidence(PREVIOUS/'candidate-image-inventory-final4.json',True)
    proof,proof_ref=evidence(PREVIOUS/'backend-image-artifacts-final4.json',True)
    inventory,inventory_ref=evidence(PREVIOUS/'backend-public-runtime.json',True)
    public=next(row for row in proof['artifacts'] if row['artifactFlavor']=='public')
    locked_images={key:next(v['Id'] for ref,v in lock['images'].items() if ref=='etch-supported-'+key+':phase7-v4')
                   for key in ('mysql','backend','elasticsearch','web')}
    if image_ids!=locked_images or not proof['passed'] or not public['passed'] or not all(public['checks'].values()):
        raise ValueError('Running images are not the reviewed artifact configuration')
    actual_inventory=json.loads(command(*runtime.compose('exec','-T','backend','cat','/app/runtime-inventory.json')))
    jar_sha=command(*runtime.compose('exec','-T','backend','sha256sum','/app/app.jar')).split()[0]
    if actual_inventory!=inventory or jar_sha!=public['jarSha256'] or image_ids['backend']!=public['imageId']:
        raise ValueError('Running backend artifact differs from reviewed JAR')
    server=runtime.request(runtime.ES_URL,'GET','/')
    nodes=runtime.request(runtime.ES_URL,'GET','/_nodes/plugins')['nodes']
    if not nodes or any(n['version']!='9.4.7' for n in nodes.values()):
        raise ValueError('Unknown or mixed Elasticsearch node versions')
    nori=[]
    for node in nodes.values():
        plugins=[p for p in node['plugins'] if p['name']=='analysis-nori']
        if len(plugins)!=1:raise ValueError('Missing or duplicate Nori plugin')
        nori.append(plugins[0]['version'])
    if set(nori)!={'9.4.7'}:raise ValueError('Unknown or mixed Nori versions')
    client=next(m['version'] for m in inventory['modules'] if m['group']=='co.elastic.clients' and m['name']=='elasticsearch-java')
    actual={'elasticsearchVersion':server['version']['number'],'noriVersion':nori[0],'clientVersion':client,
            'elasticsearchImageId':image_ids['elasticsearch'],'backendImageId':image_ids['backend'],
            'backendJarSha256':jar_sha,'imageLockSha256':lock_ref['sha256']}
    locked={**actual,'elasticsearchVersion':'9.4.7','noriVersion':'9.4.7','clientVersion':'9.4.5',
            'elasticsearchImageId':locked_images['elasticsearch'],'backendImageId':public['imageId'],
            'backendJarSha256':public['jarSha256']}
    source_prefix='etch/backend/business-server/'
    source_names=command('git','-C',str(runtime.ROOT),'ls-tree','-r','--name-only',BACKEND_CODE_COMMIT,'--',source_prefix).splitlines()
    current_names=command('git','-C',str(runtime.ROOT),'ls-files','--cached','--others','--exclude-standard','--',source_prefix).splitlines()
    if set(current_names)!=set(source_names):raise ValueError('Backend source file set differs from reviewed tree')
    for name in source_names:
        if (runtime.ROOT/name).read_bytes()!=subprocess.check_output(['git','-C',str(runtime.ROOT),'show',BACKEND_CODE_COMMIT+':'+name]):
            raise ValueError('Backend source differs from recorded committed tree')
    if command('git','-C',str(runtime.ROOT),'ls-files','--others','--exclude-standard','--',source_prefix):
        raise ValueError('Uncommitted extra backend source is not reviewed')
    provenance={'evaluationCodeCommit':command('git','-C',str(runtime.ROOT),'rev-parse','HEAD'),
        'evaluationCodeFiles':{str(p.relative_to(runtime.ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()
                               for p in (Path(__file__).resolve(),Path(decisions.__file__).resolve())},
        'runningBackend':{'imageId':public['imageId'],'jarSha256':jar_sha,'actualBuildCommit':None,
            'artifactInspectionReportedHead':proof['sourceHead'],'equivalentCommittedSourceTree':BACKEND_CODE_COMMIT,
            'basis':'Image has no revision label; exact inspected JAR and current backend source tree match recorded artifacts/committed tree. Inspection HEAD included uncommitted work and is not claimed as the build commit.'},
        'evidence':[lock_ref,proof_ref,inventory_ref]}
    return decisions.validate_identity(actual,locked),server,provenance

def candidate_sections(args,result,image_ids,records,baseline,baseline_ref):
    result['queryContracts']=decisions.query_contracts(records,ev.QUERIES,ev.CORPUS)
    identity,server,provenance=engine_identity(image_ids)
    current_raw,raw_ref=evidence(args.engine_evidence)
    reference,reference_ref=evidence(args.repeat_of, str(args.repeat_of).startswith(str(PREVIOUS)))
    reference_raw,reference_raw_ref=evidence(args.repeat_engine,str(args.repeat_engine).startswith(str(PREVIOUS)))
    historical_raw,historical_ref=evidence(PREVIOUS/'engine-phase6-before.json',True)
    cause,cause_ref=evidence(PREVIOUS/'score-cause-comparison.json',True)
    if current_raw.get('project')!=runtime.PROJECT or current_raw['server']!=server:
        raise ValueError('Raw observation belongs to a different current engine or project')
    if current_raw['queriesSha256']!=result['manifest']['dataHashes']['queries.json']:
        raise ValueError('Raw observation is not the frozen query corpus')
    sections=decisions.classify(result,reference,current_raw,historical_raw,reference_raw,identity,args.candidate_status,
                                baseline,ev.QUERIES,ev.ndcg)
    sections['historicalComparison']['apiEvidence']=baseline_ref
    reference_requests=(runtime.ROOT/args.repeat_of).resolve().parent/'requests.jsonl'
    reference_bytes=reference_requests.read_bytes()
    if reference_requests.relative_to(runtime.ROOT).parts[3] in ('phase6','phase7'):
        committed=subprocess.check_output(['git','-C',str(runtime.ROOT),'show',PREVIOUS_COMMIT+':'+str(reference_requests.relative_to(runtime.ROOT))])
        if reference_bytes!=committed:raise ValueError('Historical request records changed')
    same_responses=decisions.same_api_responses([json.loads(line) for line in reference_bytes.splitlines()],records)
    sections['sameEngineReproducibility']['sameApiResponsesExcludingTiming']=same_responses
    sections['sameEngineReproducibility']['passed'] &= same_responses
    if not same_responses:sections['candidate']['reviewStatus']='NEEDS_SEARCH_CHANGE'
    reused=[]
    for filename,scope in [('fresh-v4-public-policy.json','142 public authorization/read-only policies'),
                           ('fresh-v4-http-contract.json','142 exact HTTP JSON contracts'),
                           ('migration-jdbc-regression-v4.json','24 isolated full-profile JDBC/date/recovery contracts')]:
        record,link=evidence(PREVIOUS/filename,True)
        if record.get('passed') is not True:raise ValueError('Referenced prior contract failed')
        reused.append({**link,'scope':scope,'status':'REUSED_IDENTICAL_ARTIFACT','executedThisRun':False,
                       'identityProof':provenance['evidence']})
    sections['functionalContracts']['reusedEvidence']=reused
    sections['candidate'].update(provenance=provenance,
        frozenHashes={'data':result['manifest']['dataHashes'],'baselineFiles':result['manifest']['baselineFileHashes'],
                      'reviewedCompatibilityAdjustments':result['manifest']['compatibilityAdjustments']},
        evidence={'requests':'requests.jsonl','summary':'summary.json','rawEngine':raw_ref,
                  'historicalApi':baseline_ref,'historicalRaw':historical_ref,'sameEngineReference':reference_ref,
                  'sameEngineRawReference':reference_raw_ref,'knownCause':cause_ref,
                  'sameEngineRequests':{'file':str(reference_requests.relative_to(runtime.ROOT)),
                                        'sha256':hashlib.sha256(reference_bytes).hexdigest()}})
    return sections

def reconcile():
    reports={kind:sync.compare(kind,save=False) for kind in ('job','news')}
    if any(r['differenceCount'] for r in reports.values()):raise ValueError('job/news not synchronized')
    rows=runtime.mysql_json("SELECT JSON_OBJECT('id',id,'revision',search_revision,'visible',is_public AND NOT is_deleted,'views',view_count) FROM project_post ORDER BY id;")
    docs=runtime.request(runtime.ES_URL,'POST','/project-v2/_mget',{'ids':[str(r['id']) for r in rows]})['docs']
    for row,doc in zip(rows,docs):
        if not doc.get('found') or doc['_version']!=row['revision']:raise ValueError('project version mismatch')
        source=dict(doc['_source']);visible=bool(row['visible'])
        expected={'projectId':row['id'],'searchRevision':row['revision'],'visible':visible}
        if visible:
            p=next(p for p in ev.CORPUS['projects'] if p['id']==row['id'])
            expected.update(title=p['title'],memberName=next(m['nickname'] for m in ev.CORPUS['members'] if m['id']==p['memberId']),
              projectCategory=p['category'],projectTechs=sorted(p['techs']),likeCount=0,viewCount=row['views'],createdAt=p['createdAt'][:10],updatedAt=p['createdAt'][:10])
            source['projectTechs']=sorted(source['projectTechs'])
        if source!=expected:raise ValueError('project normalized content mismatch')
    pending=runtime.mysql_json("SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox WHERE status<>'SUCCEEDED';")[0]['n']
    if pending:raise ValueError('outbox unfinished')
    reports['project']={'checked':len(rows),'differences':0,'unfinishedOutbox':pending}
    return reports

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--label',default='evaluation')
    parser.add_argument('--evidence-phase',choices=('phase7','phase8'),default='phase7')
    parser.add_argument('--candidate-status',choices=('PROPOSED','NEEDS_SEARCH_CHANGE'))
    parser.add_argument('--engine-evidence',type=Path)
    parser.add_argument('--repeat-of',type=Path)
    parser.add_argument('--repeat-engine',type=Path)
    modes=parser.add_mutually_exclusive_group()
    modes.add_argument('--activate',action='store_true',help='Activate only the pinned user-accepted PHASE8 candidate after actual regression checks')
    modes.add_argument('--check-current',action='store_true',help='Check regression against the active accepted candidate; keep historical comparison separate')
    args=parser.parse_args()
    decision_mode=args.activate or args.check_current
    if decision_mode:
        if args.evidence_phase!='phase8' or not args.engine_evidence:parser.error('Accepted baseline checks require phase8 and current raw engine evidence')
        if args.candidate_status or args.repeat_of or args.repeat_engine:parser.error('Cannot substitute a different candidate or reference for the accepted baseline')
        approval,approved,pointer=load_approved_baseline(require_active=args.check_current)
        args.repeat_of=Path(approval['candidateSummary'])
        args.repeat_engine=Path(approved['candidate']['evidence']['rawEngine']['file'])
        args.candidate_status='PROPOSED' # Reuse strict comparisons; this run is never made the approved candidate.
    else:
        args.repeat_of=args.repeat_of or PREVIOUS/'fresh-v4-evaluation/summary.json'
        args.repeat_engine=args.repeat_engine or PREVIOUS/'engine-fresh-v4-after.json'
    if args.evidence_phase=='phase8' and (not args.candidate_status or not args.engine_evidence):
        parser.error('phase8 requires explicit candidate status and raw engine evidence')
    if args.candidate_status and args.evidence_phase!='phase8':parser.error('Candidates must be stored separately in phase8')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*',args.label):parser.error('안전한 새 증거 이름만 허용합니다.')
    out=runtime.ROOT/'docs/portfolio/evidence'/args.evidence_phase/args.label
    if out.exists():raise ValueError('기존 기준선 덮어쓰기 거부')
    manifest=prepare.verify_freeze()
    if decision_mode and manifest!=approved['manifest']:raise ValueError('Freeze manifest differs from the accepted candidate')
    source=prepare.check_corpus();sync_report=reconcile()
    baseline,baseline_ref=evidence(Path('docs/portfolio/evidence/phase6/evaluation-os-final/summary.json'),True)
    records=[];scores=[];checks=[]
    if args.evidence_phase=='phase8':out.mkdir(parents=True)
    def remember(record):
        records.append(record)
        if args.evidence_phase=='phase8':
            (out/'requests.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in records))
    for q in ev.QUERIES:
        r=ev.http(ev.path_for(q),'relevance',q['id']);remember(r)
        if r['status']!=200:raise ValueError('Unexpected HTTP in relevance: '+str(r['status']))
        ranked=ev.ids(r,q['kind']);labels={x['id']:x['grade'] for x in q['labels']}
        score=ev.ndcg(ranked,labels)
        old=next(x for x in baseline['queries'] if x['queryId']==q['id'])
        scores.append({'queryId':q['id'],'kind':q['kind'],'sort':q['sort'],'returnedIds':ranked,'ndcgAt5':score,
            'baselineReturnedIds':old['returnedIds'],'baselineNdcgAt5':old['ndcgAt5'],'sameIds':ranked==old['returnedIds'],'sameScore':score==old['ndcgAt5']})
        time.sleep(.07) # production rate policy stays enabled; this is not a latency benchmark.
    for keyword in ('Spring','React','검색','"'):
        r=ev.http('/search?'+urllib.parse.urlencode({'keyword':keyword,'size':100}),'functional','unified-'+keyword);remember(r)
        passed,expected=ev.unified_matches_individual(r,records,keyword)
        checks.append({'name':'unified-'+keyword,'passed':passed,'expectedIdsByKind':expected})
        time.sleep(.07)
    image_ids={}
    for service in ('mysql','backend','elasticsearch','web'):
        cid=subprocess.check_output(runtime.compose('ps','-q',service),text=True).strip()
        if not cid:raise ValueError('필수 서비스가 실행 중이지 않습니다: '+service)
        image_ids[service]=subprocess.check_output(['docker','inspect','--format','{{.Image}}',cid],text=True).strip()
    result={'baselineCommit':manifest['baselineCommit'],'startCommit':runtime.START_COMMIT,'target':runtime.TARGET,'project':runtime.PROJECT,'manifest':manifest,
      'runningImageIds':image_ids,
      'source':source,'sync':sync_report,'metricChecks':ev.metric_checks(),'queries':scores,'meanByKind':ev.score_means(scores),
      'unifiedChecks':checks,'allSameIdsAndScores':all(x['sameIds'] and x['sameScore'] for x in scores),'allChecksPassed':all(c['passed'] for c in checks),
      'note':'4차와 동일 데이터·라벨·검색 경로·정렬·계산. 공개 정책 HTTP/권한 검사는 check-public.py로 별도. 70ms pacing 포함, 새로운 응답시간 벤치마크가 아니다.'}
    if args.evidence_phase!='phase8':out.mkdir(parents=True)
    (out/'requests.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in records))
    if args.candidate_status:
        try:
            result.update(candidate_sections(args,result,image_ids,records,baseline,baseline_ref))
            if decision_mode:
                result['currentBaselineRegression']=decisions.current_baseline_regression(result,approved,approval)
                # A decision/reference changed while requests were running must fail closed too.
                _,_,verified_pointer=load_approved_baseline(require_active=args.check_current)
                if pointer!=verified_pointer:raise PermissionError('Decision changed during evaluation')
                result['evaluationProvenance']=result['candidate']['provenance']
                result.pop('candidate')
                result.pop('sameEngineReproducibility')
                result['acceptedBaseline']={'pointer':pointer,'approvalStatus':'APPROVED_BY_USER_FOR_SEARCH_BASELINE_ONLY',
                    'activationRequested':args.activate,'active':(runtime.ROOT/decisions.ACTIVE_PATH).exists(),
                    'publicReleaseApproved':False,'originalCandidateEvidenceUnchanged':True}
        except Exception as error:
            result['candidatePreparationFailure']={'errorType':type(error).__name__,'message':str(error)[:300]}
            (out/'summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
            raise
    if decision_mode:
        states={k:result[k]['passed'] for k in ('functionalContracts','currentBaselineRegression','historicalComparison')}
        passed=states['functionalContracts'] and states['currentBaselineRegression']
        if args.activate and passed:
            activate_after_checks(pointer,result)
            result['acceptedBaseline']['active']=True
        result['exitPolicy']='Current mode exits on functional contracts and approved-baseline regression only; historical FAIL remains diagnostic and unchanged.'
        (out/'summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'classifications':states,'active':result['acceptedBaseline']['active'],
                          'baselineCandidateId':approval['candidateId'],'exitPolicy':result['exitPolicy']},ensure_ascii=False))
        return 0 if passed else 1
    (out/'summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    if args.candidate_status:
        states={k:result[k]['passed'] for k in ('functionalContracts','historicalComparison','sameEngineReproducibility')}
        print(json.dumps({'meanByKind':result['meanByKind'],'classifications':states,
                          'candidate':{k:result['candidate'][k] for k in ('reviewStatus','approvalStatus','active')},
                          'exitPolicy':'Any failed category retains exit 1; historical differences do not imply every functional contract failed.'},ensure_ascii=False))
        if not all(states.values()):raise SystemExit(1)
    else:
        print(json.dumps({k:result[k] for k in ('meanByKind','allSameIdsAndScores','allChecksPassed')},ensure_ascii=False))
    if not (result['allChecksPassed'] and result['allSameIdsAndScores']):raise SystemExit(1)

if __name__=='__main__':raise SystemExit(main())
