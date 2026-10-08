import placeholder from '../assets/public/placeholder.svg';
import profile from '../assets/public/profile.svg';
import type { Job } from '../types/job';
import type { News } from '../types/newsTypes';
import type { Company } from '../types/companyData';
import type { ProjectData } from '../types/project/projectDatas';
import type { CoverLetterDetailResponse } from '../types/coverLetter';
import type { AppliedJobListResponse } from '../types/appliedJob';

// 새 공개 화면 예시. 평가 코퍼스/회원/운영 덤프를 참조하거나 가져오지 않는다.
export const datasetVersion = 'showcase-v1';
export const referenceDate = '2026-09-01';
export const publicAssets = { placeholder, profile };
export const virtualMember = { id: 7001, nickname: '가상 사용자', email: '', profile };

export const initialCompanies: Company[] = [
  ['별빛소프트', '소프트웨어', '협업 도구'],
  ['구름연구소', '정보서비스', '교육 플랫폼'],
  ['초록데이터', '데이터 분석', '환경 데이터 도구'],
].map(([name, industry, mainProducts], index) => ({
  id: 8001 + index, name: `${name} (가상 기업)`, industry, mainProducts,
  ceoName: '예시', summary: '화면 구성을 설명하기 위해 만든 가상 기업입니다.',
  stock: '비상장 예시', address: '가상 지역', homepageUrl: '',
  foundedDate: '2020-01-01', totalEmployees: 30, maleEmployees: 15,
  femaleEmployees: 15, maleRatio: 50, femaleRatio: 50, salary: 0, serviceYear: 0,
}));

export const initialJobs: Job[] = [
  ['React 프런트엔드 개발자 · 접근성 있는 화면 만들기', '서울', '프론트엔드', 0],
  ['Java Spring 백엔드 개발자 · 검색 서비스', '경기', '백엔드', 1],
  ['데이터 엔지니어 · 데이터 흐름 관찰하기', '서울', '데이터엔지니어', 2],
  ['React와 TypeScript로 함께 만드는 교육 플랫폼 — 작은 화면부터 큰 화면까지 누구나 편하게 사용할 수 있는 서비스를 설계하는 프런트엔드 개발자 예시 공고', '부산', '프론트엔드', 1],
  ['클라우드 운영 엔지니어', '서울', 'DevOps/클라우드', 0],
  ['모바일 앱 개발자', '대전', '앱개발', 2],
  ['UI 디자이너 · "첫 화면" 경험 설계', '경기', '웹디자인', 0],
  ['신입 웹 개발자 · 기초부터 함께', '부산', '웹개발', 1],
].map(([title, region, category, companyIndex], index) => {
  const company = initialCompanies[Number(companyIndex)];
  return {
    id: 1001 + index, title: String(title), companyName: company.name, companyId: company.id,
    regions: [String(region)], industries: [company.industry], jobCategories: [String(category)],
    workType: '정규직', educationLevel: index === 7 ? '학력무관' : '대졸(4년)',
    openingDate: '2026-08-20T00:00:00', expirationDate: `2026-09-${String(10 + index * 2).padStart(2, '0')}T23:59:59`,
  };
});

export const initialNews: News[] = [
  ['React 화면의 키보드 접근성을 점검하는 방법', '가상 편집부가 만든 읽기 예시입니다. 버튼과 모달의 포커스를 살펴봅니다.'],
  ['팀의 작은 검색 도구를 함께 개선하기', '새로운 동료와 검색 결과를 비교하는 가상의 개발 이야기입니다.'],
  ['데이터 파이프라인을 그림으로 이해하기', '수집과 저장, 전달 과정을 설명하는 예시 기사입니다.'],
  ['"빈 화면"에도 설명이 필요해요', '조회 결과가 없을 때 사용할 안내 문구를 소개합니다.'],
  ['아주 긴 제목도 담을 수 있는 뉴스 카드와 작은 화면의 줄바꿈을 함께 점검하는 가상 디자인 소식', '긴 제목이 목록과 상세 화면에 표시되는 예시입니다.'],
  ['설명이 아직 없는 예시 소식', ''],
].map(([title, description], index) => ({
  id: 2001 + index, title, description, thumbnailUrl: index === 5 ? '' : placeholder,
  url: '', publishedAt: `2026-08-${String(31 - index).padStart(2, '0')}`,
  company: initialCompanies[index % initialCompanies.length],
}));

const projectExamples: { title: string; content: string; category: ProjectData['projectCategory']; tech: string[] }[] = [
  { title: 'React로 만든 작은 책장', content: '읽고 싶은 책을 분류하는 가상 프로젝트입니다. React와 TypeScript로 화면을 구성했습니다.', category: 'WEB', tech: ['React', 'TypeScript'] },
  { title: '동네 산책 지도', content: '산책 경로를 소개하는 가상 모바일 앱입니다. 화면 체험을 위한 공개 예시입니다.', category: 'MOBILE', tech: ['Kotlin'] },
  { title: '검색 기록 실험실', content: '검색 결과를 비교하는 가상 서버 프로젝트입니다. 실제 ETCH 평가 기록과는 별개입니다.', category: 'SERVER', tech: ['Java', 'Spring'] },
  { title: '하루의 데이터 노트', content: '작은 데이터셋을 정리하는 가상 데이터베이스 프로젝트입니다.', category: 'DATABASE', tech: ['MySQL'] },
  { title: '배포 연습장', content: '배포 흐름을 설명하는 가상 예시입니다. 실제 배포나 외부 서버 연결은 없습니다.', category: 'DEVOPS', tech: ['Docker'] },
  { title: '아주 긴 제목을 가진 프로젝트 — 누구나 편하게 읽고 키보드로 이동할 수 있는 작은 화면을 함께 만드는 접근성 연습', content: '', category: 'WEB', tech: ['React'] },
];
export const initialProjects: ProjectData[] = projectExamples.map((example, index) => ({
  id: 3001 + index, title: example.title, content: example.content,
  thumbnailUrl: index === 5 ? '' : placeholder, youtubeUrl: '', githubUrl: '',
  viewCount: 10 + index * 3, likeCount: index + 1, commentCount: index === 0 ? 1 : 0,
  popularityScore: index + 1, projectCategory: example.category,
  createdAt: `2026-08-${String(20 + index).padStart(2, '0')}T10:00:00`, updatedAt: '2026-09-01T10:00:00',
  isDeleted: false, isPublic: true, nickname: index < 3 ? virtualMember.nickname : '가상 동료',
  likedByMe: index === 2, memberId: index < 3 ? 7001 : 7002,
  member: { id: index < 3 ? 7001 : 7002, nickname: index < 3 ? virtualMember.nickname : '가상 동료' },
  profileUrl: profile, techCodes: example.tech, techCategories: [], projectTechs: [], fileUrls: [],
}));

export const initialCoverLetters: CoverLetterDetailResponse[] = [{
  id: 5001, name: '협업 경험을 정리한 예시 자기소개서',
  answer1: '가상의 지원자가 작성한 예시입니다. 문제를 작게 나누고 확인하는 습관을 소개합니다.',
  answer2: '교육 도구를 만드는 가상 팀에 관심을 갖게 된 배경을 정리합니다.',
  answer3: '작은 화면의 키보드 이동을 함께 확인했던 가상의 경험입니다.',
  answer4: '서로 다른 의견을 문서로 정리하고 하나씩 확인한 예시입니다.',
  answer5: 'React와 TypeScript로 만든 가상 프로젝트를 설명합니다.',
}];

export interface ShowcasePortfolio {
  portfolioId: number; name: string; introduce: string; techList: string[];
  phoneNumber: string; email: string; blogUrl: string; githubUrl: string;
  memberId: number; projectIds: number[]; createdAt: string; updatedAt: string;
}
export const initialPortfolios: ShowcasePortfolio[] = [{
  portfolioId: 6001, name: '가상 사용자의 프런트엔드 포트폴리오',
  introduce: '화면 체험을 위해 만든 가상 포트폴리오입니다. 개인 연락처를 입력하거나 제출하지 않습니다.',
  techList: ['React', 'TypeScript'], phoneNumber: '', email: '', blogUrl: '', githubUrl: '',
  memberId: 7001, projectIds: [3001, 3002], createdAt: '2026-08-25', updatedAt: referenceDate,
}];

export const initialApplications: AppliedJobListResponse[] = initialJobs.slice(0, 2).map((job, index) => ({
  appliedJobId: 9001 + index, jobId: job.id, companyId: job.companyId, title: job.title,
  companyName: job.companyName, openingDate: job.openingDate, closingDate: job.expirationDate,
  status: index === 0 ? 'DOCUMENT_DONE' : 'INTERVIEW_DONE',
}));
