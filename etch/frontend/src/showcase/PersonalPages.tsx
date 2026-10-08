import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getCoverLetters, getCoverLetterDetail, updateCoverLetter } from "../api/coverLetterApi";
import { getMyPortfolios, getPortfolioDetail, updatePortfolio } from "../api/portfolioApi";
import { getAllProjects, getProjectById } from "../api/projectApi";
import { getRecommendJobs, getRecommendNews } from "../api/memberApi";
import { COVER_LETTER_QUESTIONS_STATIC, getStandardQuestions } from "../types/coverLetter";
import type { CoverLetterDetailResponse, CoverLetterRequest } from "../types/coverLetter";
import type { ProjectData } from "../types/project/projectDatas";
import type { Job } from "../types/job";
import type { UIChatMessage, UIChatRoom } from "../types/chat";
import StatsCards from "../components/organisms/mypage/statsCards";
import QuestionList from "../components/organisms/mypage/questionList";
import CoverLetterInfoSection from "../components/molecules/mypage/coverLetterInfoSection";
import CoverLetterActions from "../components/organisms/mypage/coverLetterActions";
import PortfolioEducationTextCard from "../components/molecules/portfolio/portfolioEducationTextCart";
import PortfolioLanguageTextCard from "../components/molecules/portfolio/portfolioLanguageTextCard";
import MyProjectCard from "../components/molecules/mypage/project/myProjectCard";
import ProjectModal from "../components/common/projectModal";
import JobDetailModal from "../components/organisms/job/jobDetailModal";
import ChatMessageList from "../components/organisms/chat/chatMessageList";
import ChatRoomList from "../components/organisms/chat/chatRoomList";
import ProjectWriteInput from "../components/organisms/project/write/projectWriteInput";
import ProjectWriteText from "../components/organisms/project/write/projectWriteText";
import { getShowcaseVersion, subscribeShowcase } from "./state";
import { publicAssets, referenceDate, virtualMember } from "./data";

const card = "rounded-lg border border-gray-200 bg-white p-6 shadow-sm";
const link = "inline-flex rounded-md border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50";

function useExample<T>(load: () => Promise<T>) {
  const version = useSyncExternalStore(subscribeShowcase, getShowcaseVersion);
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setError(false);
    load().then(result => { if (active) setValue(result); }, () => { if (active) { setValue(null); setError(true); } });
    return () => { active = false; };
  }, [load, version]);
  return { value, error };
}

function PageIntro({ title, children }: { title: string; children: ReactNode }) {
  return <header className="mb-6"><p className="text-sm font-semibold text-blue-600">가상 사용자 · 화면 체험</p><h1 className="mt-2 text-2xl font-bold text-gray-900">{title}</h1><p className="mt-2 text-sm leading-relaxed text-gray-600">{children}</p></header>;
}

function MissingExample({ error }: { error: boolean }) {
  return <p role="status" className={card}>{error ? "해당 예시는 없습니다. 목록에서 다른 예시를 선택해 주세요." : "예시를 준비하는 중입니다."} <Link to="/mypage" className="text-blue-700 underline">마이페이지로</Link></p>;
}

export function ShowcaseDashboard() {
  const letters = useExample(getCoverLetters);
  const portfolios = useExample(getMyPortfolios);
  const jobs = useExample(getRecommendJobs);
  const news = useExample(getRecommendNews);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  return <div className="space-y-6">
    <PageIntro title="마이페이지">작성 문서와 관심 정보를 모아 보는 기존 화면의 예시입니다. 수치는 가상 데이터 개수이며 실제 활동 기록이 아닙니다.</PageIntro>
    <StatsCards stats={[
      { type: "stats", title: "예시 자기소개서", value: letters.value?.length ?? 0, icon: "📄", color: "text-blue-600" },
      { type: "stats", title: "예시 포트폴리오", value: portfolios.value?.length ?? 0, icon: "📁", color: "text-green-600" },
      { type: "stats", title: "추천 화면용 예시 공고", value: jobs.value?.length ?? 0, icon: "💼", color: "text-purple-600" },
    ]} />
    <section className={card}>
      <h2 className="text-lg font-semibold">내 문서 예시</h2>
      <div className="mt-4 flex flex-wrap gap-3"><Link className={link} to="/mypage/coverletters">자기소개서 둘러보기</Link><Link className={link} to="/mypage/portfolios">포트폴리오 둘러보기</Link><Link className={link} to="/mypage/projects">내 프로젝트</Link></div>
    </section>
    <section className={card}>
      <h2 className="text-lg font-semibold">추천 목록 예시</h2>
      <p className="mt-2 text-sm text-gray-600">미리 선정한 예시 목록입니다. 관심사 분석·개인화 모델은 실행하지 않습니다.</p>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div><h3 className="mb-3 font-medium">채용 공고</h3><ul className="space-y-3">{jobs.value?.map(job => <li key={job.id}><button type="button" className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-blue-50" onClick={() => setSelectedJob(job)}><span className="block font-medium">{job.title}</span><span className="text-sm text-gray-500">{job.companyName} · {job.regions.join(", ") || "지역 정보 없음"}</span></button></li>)}</ul></div>
        <div><h3 className="mb-3 font-medium">뉴스</h3><ul className="space-y-3">{news.value?.map(item => <li key={item.id} className="rounded-lg border border-gray-200 p-3"><h4 className="font-medium">{item.title}</h4><p className="mt-1 text-sm text-gray-600">{item.description || "요약이 없는 예시입니다."}</p></li>)}</ul><Link to="/news" className="mt-4 inline-block text-sm text-blue-700 underline">뉴스 예시 전체 보기</Link></div>
      </div>
    </section>
    {selectedJob && <JobDetailModal job={{ ...selectedJob, id: String(selectedJob.id) }} onClose={() => setSelectedJob(null)} />}
  </div>;
}

export function CoverLettersPage() {
  const { value, error } = useExample(getCoverLetters);
  return <div><PageIntro title="자기소개서 예시">기존 문항 구성과 편집 화면을 재사용합니다. 예시 문장만 바꿔 보세요. 변경은 현재 브라우저 메모리에만 남습니다.</PageIntro>
    {!value ? <MissingExample error={error} /> : <ul className="space-y-3">{value.map(letter => <li key={letter.id} className={`${card} flex flex-wrap items-center justify-between gap-4`}><div><h2 className="font-semibold">{letter.name || "제목 없는 예시"}</h2><p className="mt-1 text-sm text-gray-500">가상 문서 · 예시 기준일 {referenceDate}</p></div><div className="flex gap-2"><Link className={link} to={`/mypage/cover-letter-detail/${letter.id}`}>읽기</Link><Link className={link} to={`/mypage/cover-letter-edit/${letter.id}`}>예시 편집</Link></div></li>)}</ul>}
  </div>;
}

export function CoverLetterDetailPage() {
  const { id } = useParams();
  const load = useCallback(() => getCoverLetterDetail(Number(id)), [id]);
  const { value, error } = useExample(load);
  if (!value) return <MissingExample error={error} />;
  const answers = [value.answer1, value.answer2, value.answer3, value.answer4, value.answer5];
  return <div><PageIntro title={value.name}>가상 사용자의 예시 답변입니다. 실제 지원자 자료가 아닙니다.</PageIntro><div className="mb-4 flex flex-wrap gap-2"><Link className={link} to="/mypage/coverletters">문서 목록</Link><Link className={link} to={`/mypage/cover-letter-edit/${value.id}`}>예시 편집</Link></div><div className="space-y-4">{COVER_LETTER_QUESTIONS_STATIC.map((question, index) => <section key={question.questionNumber} className={card}><h2 className="font-semibold">{question.questionNumber}. {question.questionTitle}</h2><p className="mt-4 whitespace-pre-wrap text-gray-700">{answers[index] || "작성하지 않은 예시 문항입니다."}</p></section>)}</div></div>;
}

function CoverLetterEditor({ letter }: { letter: CoverLetterDetailResponse }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<CoverLetterRequest>(letter);
  const [message, setMessage] = useState("");
  useEffect(() => { setDraft(letter); }, [letter]);
  const answers = [draft.answer1, draft.answer2, draft.answer3, draft.answer4, draft.answer5];
  const onAnswerChange = (index: number, answer: string) => setDraft(current => ({ ...current, [`answer${index + 1}`]: answer }));
  const apply = async () => {
    await updateCoverLetter(letter.id, draft);
    setMessage("현재 브라우저의 예시에만 반영했습니다. 서버 저장·지원서 제출은 수행하지 않았습니다. 새로고침이나 초기화로 되돌아갑니다.");
  };
  return <div>
    <PageIntro title="자기소개서 예시 편집">개인정보를 입력하지 말고 가상 문장으로 체험해 주세요. 실제 제출 기능은 없습니다.</PageIntro>
    <CoverLetterInfoSection type="text" value={draft.name} placeholderText="예시 자기소개서 제목" onChange={name => setDraft(current => ({ ...current, name }))} />
    <QuestionList questions={getStandardQuestions(answers, onAnswerChange)} answers={answers} onAnswerChange={onAnswerChange} />
    <CoverLetterActions onCancel={() => navigate("/mypage/coverletters")} onSubmit={apply} submitButtonText="브라우저 예시에만 반영" />
    <p role="status" className="mt-4 text-sm text-blue-800">{message}</p>
  </div>;
}

export function CoverLetterEditPage() {
  const { id } = useParams();
  const load = useCallback(() => getCoverLetterDetail(Number(id)), [id]);
  const { value, error } = useExample(load);
  return value ? <CoverLetterEditor key={value.id} letter={value} /> : <MissingExample error={error} />;
}

type PortfolioExample = Awaited<ReturnType<typeof getPortfolioDetail>>;

function PortfolioPreview({ portfolio }: { portfolio: PortfolioExample }) {
  const [introduction, setIntroduction] = useState(portfolio.introduce);
  const [message, setMessage] = useState("");
  useEffect(() => { setIntroduction(portfolio.introduce); }, [portfolio]);
  const apply = async () => {
    await updatePortfolio(portfolio.portfolioId, {
      name: portfolio.name, introduce: introduction, phoneNumber: "", email: "",
      techList: portfolio.techList,
      education: portfolio.education.map(item => `${item.name}^${item.description}^${item.startDate}^${item.endDate}`).join("/"),
      language: portfolio.language.map(item => `${item.name}^${item.date}^${item.certificateIssuer}`).join("/"),
      projectIds: portfolio.projectList.map(item => item.id),
    });
    setMessage("소개 문장을 브라우저 예시에만 반영했습니다. 서버에 저장하지 않았습니다.");
  };
  return <div className="space-y-5">
    <section className={card}><h2 className="text-xl font-semibold">{portfolio.name}</h2><p className="mt-2 text-sm text-gray-500">연락처·외부 링크·파일 다운로드를 포함하지 않는 가상 포트폴리오입니다.</p><label htmlFor="showcase-portfolio-intro" className="mt-5 block font-medium">소개 문장 예시 편집</label><textarea id="showcase-portfolio-intro" value={introduction} onChange={event => setIntroduction(event.target.value)} rows={4} className="mt-2 w-full rounded-md border border-gray-300 p-3" /><button type="button" className={`${link} mt-3`} onClick={apply}>소개를 브라우저 예시에만 반영</button><p role="status" className="mt-3 text-sm text-blue-800">{message}</p><h3 className="mt-5 font-medium">기술 스택</h3><div className="mt-2 flex flex-wrap gap-2">{portfolio.techList.map(item => <span key={item} className="rounded bg-blue-50 px-3 py-1 text-sm text-blue-700">{item}</span>)}</div></section>
    <section className={card}><h2 className="mb-4 text-lg font-semibold">교육·활동 예시</h2><PortfolioEducationTextCard education={portfolio.education.map(item => ({ companyName: item.name, active: item.description, startAt: item.startDate, endAt: item.endDate }))} /></section>
    <section className={card}><h2 className="mb-4 text-lg font-semibold">자격·언어 예시</h2><PortfolioLanguageTextCard language={portfolio.language.map(item => ({ licenseName: item.name, getAt: item.date, issuer: item.certificateIssuer }))} /></section>
    <section className={card}><h2 className="mb-4 text-lg font-semibold">연결된 프로젝트 예시</h2><ul className="space-y-2">{portfolio.projectList.map(project => <li key={project.id}>{project.title || "프로젝트 예시"}</li>)}</ul><Link to="/mypage/projects" className={`${link} mt-4`}>프로젝트 화면 보기</Link></section>
  </div>;
}

export function PortfolioPage() {
  const params = useParams();
  const list = useExample(getMyPortfolios);
  const requested = params.id ?? params.userId;
  const selectedId = requested ? Number(requested) : list.value?.[0]?.id;
  const load = useCallback(() => requested !== undefined ? getPortfolioDetail(Number(requested)) : selectedId ? getPortfolioDetail(selectedId) : Promise.resolve(null), [requested, selectedId]);
  const detail = useExample(load);
  return <div><PageIntro title="포트폴리오 예시">기존 포트폴리오의 활동·자격 카드와 문서 구조를 재사용한 미리보기입니다. 소개 문장만 메모리에서 편집할 수 있습니다.</PageIntro>{list.value && list.value.length > 1 && <nav className="mb-4 flex flex-wrap gap-2" aria-label="포트폴리오 예시 목록">{list.value.map(item => <Link key={item.id} className={link} to={`/mypage/portfolios/${item.id}`}>{item.name || item.introduce}</Link>)}</nav>}{detail.value ? <PortfolioPreview key={detail.value.portfolioId} portfolio={detail.value} /> : <MissingExample error={detail.error || list.error} />}</div>;
}

export function MyProjectsPage() {
  const { value, error } = useExample<ProjectData[]>(getAllProjects);
  const [selected, setSelected] = useState<ProjectData | null>(null);
  const mine = value?.filter(project => project.member.id === virtualMember.id) ?? [];
  return <div><PageIntro title="내 프로젝트 예시">가상 사용자가 작성한 공개 프로젝트입니다. 조회 수와 좋아요 수는 예시 값입니다.</PageIntro><Link to="/projects/write" className={`${link} mb-5`}>작성 화면 체험</Link>{!value ? <MissingExample error={error} /> : <div className="grid gap-5 md:grid-cols-2">{mine.map(project => <div key={project.id}><MyProjectCard {...project} type="project" onCardClick={() => setSelected(project)} /><button type="button" className={`${link} mt-2 w-full justify-center`} onClick={() => setSelected(project)}>{project.title} 상세 보기</button></div>)}</div>}{selected && <ProjectModal project={selected} onClose={() => setSelected(null)} onProjectUpdate={setSelected} />}</div>;
}

const chatRooms: UIChatRoom[] = [{ id: "example-room", name: "가상 프로젝트 팀", lastMessage: "화면 흐름을 함께 살펴볼까요?", time: "예시 10:02", profileImage: publicAssets.profile }];
const chatMessages: UIChatMessage[] = [
  { id: "example-1", sender: "other", senderName: "가상 팀원", message: "안녕하세요. 이번 화면은 읽기 전용 예시 대화입니다.", time: "예시 10:00" },
  { id: "example-2", sender: "me", message: "프로젝트에서 맡은 역할과 사용한 기술을 정리했어요.", time: "예시 10:01" },
  { id: "example-3", sender: "other", senderName: "가상 팀원", message: "화면 흐름을 함께 살펴볼까요?", time: "예시 10:02" },
];

export function ChatPreviewPage() {
  const [open, setOpen] = useState(true);
  return <div><PageIntro title="채팅 화면 미리보기">미리 작성한 가상 대화입니다. 실시간 접속·읽음 확인·메시지 전송은 수행하지 않습니다.</PageIntro><div className="grid gap-4 md:grid-cols-3"><section className="overflow-hidden rounded-lg border border-gray-200 bg-white"><h2 className="border-b border-gray-200 p-4 font-semibold">예시 채팅방</h2><ChatRoomList chatRooms={chatRooms} onRoomClick={() => setOpen(true)} /><button type="button" className="w-full p-3 text-sm font-medium text-blue-700" onClick={() => setOpen(value => !value)}>{open ? "예시 대화 접기" : "예시 대화 열기"}</button></section><section className={`${card} md:col-span-2`} aria-label="읽기 전용 예시 대화">{open ? <><h2 className="mb-5 font-semibold">가상 프로젝트 팀</h2><ChatMessageList messages={chatMessages} /><p className="mt-6 rounded-md bg-blue-50 p-3 text-sm text-blue-900">읽기 전용 미리보기 · 실제 메시지를 입력하거나 전송하지 않습니다.</p></> : <p className="text-gray-500">왼쪽에서 예시 대화를 열어 보세요.</p>}</section></div></div>;
}

export function ConnectionsPreviewPage() {
  return <div><PageIntro title="연결 목록 미리보기">팔로워·팔로잉 수는 가상 사용자 화면을 보여주기 위한 예시입니다. 실제 계정이나 연결 요청은 없습니다.</PageIntro><section className={card}><div className="flex items-center gap-4"><img src={publicAssets.profile} alt="가상 팀원 그림" className="h-12 w-12 rounded-full" /><div><h2 className="font-semibold">가상 팀원</h2><p className="text-sm text-gray-500">예시 프로젝트를 함께 살펴보는 인물</p></div></div><Link to="/chat" className={`${link} mt-5`}>예시 대화 보기</Link></section></div>;
}

export function ProjectEditorPreviewPage() {
  const { id } = useParams();
  const load = useCallback(() => id === undefined ? Promise.resolve(null) : getProjectById(Number(id)), [id]);
  const project = useExample(load);
  const [title, setTitle] = useState("가상 프로젝트 제목");
  const [content, setContent] = useState("예시 프로젝트의 배경과 맡은 역할을 이곳에서 작성해 볼 수 있습니다.");
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    if (project.value) { setTitle(project.value.title); setContent(project.value.content); setPreview(false); }
  }, [project.value]);
  if (id !== undefined && (!project.value || project.value.id !== Number(id))) return <MissingExample error={project.error} />;
  return <div><PageIntro title="프로젝트 작성 화면 체험">기존 제목·내용 입력 컴포넌트를 재사용합니다. 현재 화면 안에서 미리보기만 제공하며, 프로젝트 등록·파일 업로드·외부 링크 입력은 지원하지 않습니다.</PageIntro><section className={`${card} space-y-5`}><label className="block"><ProjectWriteInput type="text" inputText="예시 프로젝트 제목" placeholderText="가상 프로젝트 제목" value={title} onChange={setTitle} /></label><label className="block"><ProjectWriteText inputText="예시 프로젝트 내용" value={content} onChange={setContent} /></label><button type="button" className={link} onClick={() => setPreview(true)}>입력한 예시 미리보기</button>{preview && <section className="rounded-lg bg-blue-50 p-5" aria-label="프로젝트 입력 예시 미리보기"><h2 className="break-words font-semibold">{title || "제목 없는 예시"}</h2><p className="mt-3 whitespace-pre-wrap break-words">{content || "내용이 없는 예시입니다."}</p><p className="mt-4 text-sm text-blue-800">현재 화면에만 표시했습니다. 프로젝트는 등록하지 않았습니다.</p></section>}</section></div>;
}
