export interface CoverLetterRequest {
  name: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  answer5: string;
}

export interface CoverLetterDetailResponse {
  id: number;
  name: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  answer5: string;
}

export interface CoverLetterListResponse {
  id: number;
  name: string;
}

import type { QuestionCardProps } from "../../components/atoms/card";

export const getStandardQuestions = (
  answers: string[],
  onAnswerChange: (index: number, answer: string) => void
): QuestionCardProps[] => [
  {
    type: "question" as const,
    questionNumber: 1,
    questionTitle: "본인의 성격의 장단점은 무엇인가요?",
    structure:
      "장점 소개 – 핵심 키워드 중심으로 제시\n장점 사례 – 실제 경험과 연결\n단점 소개 – 지나치게 부정적이지 않게\n단점 개선 노력 – 개선 과정과 현재 상태",
    tips: "IT 직무와 연관된 성격(예: 꼼꼼함, 문제 해결력, 책임감 등)을 중심으로 작성하세요.\n단점은 오히려 장점의 다른 면처럼 표현하고, 개선하려는 노력이 핵심입니다.",
    keywords:
      "장점: 논리적인 사고, 끈기, 협업 능력, 주도성\n단점: 완벽주의, 낯가림, 지나치게 꼼꼼함 등",
    answer: answers[0] || "",
    onAnswerChange: (answer: string) => onAnswerChange(0, answer),
  },
  {
    type: "question" as const,
    questionNumber: 2,
    questionTitle: "지원 동기와 입사 후 포부를 작성해주세요.",
    structure:
      "관심 배경 – 해당 직무/업계에 관심을 갖게 된 계기\n기업 분석 기반 동기 – 왜 이 회사인가?\n입사 후 포부 – 구체적인 성장 목표",
    tips: "회사의 비전·제품·기술 스택을 조사하여 구체적으로 연결하세요.\n포부는 너무 추상적이지 않게, 단기 + 장기 계획으로 작성하면 좋습니다.",
    keywords:
      '"귀사의 클라우드 기반 인프라 기술은 제가 집중해 온 분야와 잘 맞아…"\n"입사 초기에는 백엔드 개발자로 안정적인 코드 작성에 집중하고, 장기적으로는 아키텍처 설계에도 기여하고 싶습니다."',
    answer: answers[1] || "",
    onAnswerChange: (answer: string) => onAnswerChange(1, answer),
  },
  {
    type: "question" as const,
    questionNumber: 3,
    questionTitle: "본인의 가장 큰 성공 경험 또는 성취 경험을 기술해주세요.",
    structure:
      "S (상황) – 어떤 상황이었는가?\nT (과제) – 어떤 문제나 목표였는가?\nA (행동) – 본인이 한 구체적인 행동은?\nR (결과) – 어떤 결과를 얻었는가?",
    tips: "기술 프로젝트, 팀 프로젝트, 공모전, 인턴십 등의 구체적인 사례 활용\n기술 스택과 기여한 부분을 명확히 작성하세요",
    keywords:
      "캡스톤 프로젝트로 개발한 앱\n오픈소스 기여 경험\n기술 블로그 운영 및 조회 수 성과",
    answer: answers[2] || "",
    onAnswerChange: (answer: string) => onAnswerChange(2, answer),
  },
  {
    type: "question" as const,
    questionNumber: 4,
    questionTitle:
      "협업이나 갈등 상황에서의 경험과 그 해결 과정을 서술해주세요.",
    structure:
      "상황 설명 – 팀 프로젝트 중 생긴 협업/갈등 상황\n문제의 원인 파악 및 대응 – 감정적이기보다 객관적인 해결 노력 강조\n해결 과정 – 중재, 역할 조정, 소통 등\n결과 및 느낀 점 – 팀워크 향상 여부 + 배운 점",
    tips: '개발자 간 코드 스타일 충돌, 일정 미스매치, 소통 부족 등의 사례가 자주 활용됨\n문제를 "남 탓" 하지 않고, 책임감 있게 해결한 자세를 보여주세요',
    keywords:
      '"초기 설계 방향에 대한 의견 차이로 갈등이 있었지만…"\n"직접 중간 회의를 제안해 의견을 조율했고…"',
    answer: answers[3] || "",
    onAnswerChange: (answer: string) => onAnswerChange(3, answer),
  },
  {
    type: "question" as const,
    questionNumber: 5,
    questionTitle:
      "본인의 역량을 가장 잘 보여줄 수 있는 경험이나 활동을 기술해주세요.",
    structure:
      "핵심 역량 소개 – IT 직무와 연결된 역량 강조\n경험/활동 소개 – 구체적인 프로젝트, 인턴, 사이드 프로젝트 등\n기술적 기여 내용 – 어떤 기술을 어떻게 사용했는가?\n결과 및 성장 – 성과 + 느낀 점",
    tips: "구체적인 기술 스택 (ex. React, Node.js, AWS, Docker) 를 꼭 언급\n문제 해결 과정 중심으로 기술하면 실무형 인재로 보여짐",
    keywords:
      "사이드 프로젝트(서비스 배포 경험 포함)\n해커톤 수상\nGitHub 활동 또는 코드 리뷰 경험",
    answer: answers[4] || "",
    onAnswerChange: (answer: string) => onAnswerChange(4, answer),
  },
];

export const COVER_LETTER_QUESTIONS_STATIC = [
  {
    questionNumber: 1,
    questionTitle: "본인의 성격의 장단점은 무엇인가요?",
    structure:
      "장점 소개 – 핵심 키워드 중심으로 제시\n장점 사례 – 실제 경험과 연결\n단점 소개 – 지나치게 부정적이지 않게\n단점 개선 노력 – 개선 과정과 현재 상태",
    tips: "IT 직무와 연관된 성격(예: 꼼꼼함, 문제 해결력, 책임감 등)을 중심으로 작성하세요.\n단점은 오히려 장점의 다른 면처럼 표현하고, 개선하려는 노력이 핵심입니다.",
    keywords:
      "장점: 논리적인 사고, 끈기, 협업 능력, 주도성\n단점: 완벽주의, 낯가림, 지나치게 꼼꼼함 등",
  },
  {
    questionNumber: 2,
    questionTitle: "지원 동기와 입사 후 포부를 작성해주세요.",
    structure:
      "관심 배경 – 해당 직무/업계에 관심을 갖게 된 계기\n기업 분석 기반 동기 – 왜 이 회사인가?\n입사 후 포부 – 구체적인 성장 목표",
    tips: "회사의 비전·제품·기술 스택을 조사하여 구체적으로 연결하세요.\n포부는 너무 추상적이지 않게, 단기 + 장기 계획으로 작성하면 좋습니다.",
    keywords:
      '"귀사의 클라우드 기반 인프라 기술은 제가 집중해 온 분야와 잘 맞아…"\n"입사 초기에는 백엔드 개발자로 안정적인 코드 작성에 집중하고, 장기적으로는 아키텍처 설계에도 기여하고 싶습니다."',
  },
  {
    questionNumber: 3,
    questionTitle: "본인의 가장 큰 성공 경험 또는 성취 경험을 기술해주세요.",
    structure:
      "S (상황) – 어떤 상황이었는가?\nT (과제) – 어떤 문제나 목표였는가?\nA (행동) – 본인이 한 구체적인 행동은?\nR (결과) – 어떤 결과를 얻었는가?",
    tips: "기술 프로젝트, 팀 프로젝트, 공모전, 인턴십 등의 구체적인 사례 활용\n기술 스택과 기여한 부분을 명확히 작성하세요",
    keywords:
      "캡스톤 프로젝트로 개발한 앱\n오픈소스 기여 경험\n기술 블로그 운영 및 조회 수 성과",
  },
  {
    questionNumber: 4,
    questionTitle:
      "협업이나 갈등 상황에서의 경험과 그 해결 과정을 서술해주세요.",
    structure:
      "상황 설명 – 팀 프로젝트 중 생긴 협업/갈등 상황\n문제의 원인 파악 및 대응 – 감정적이기보다 객관적인 해결 노력 강조\n해결 과정 – 중재, 역할 조정, 소통 등\n결과 및 느낀 점 – 팀워크 향상 여부 + 배운 점",
    tips: '개발자 간 코드 스타일 충돌, 일정 미스매치, 소통 부족 등의 사례가 자주 활용됨\n문제를 "남 탓" 하지 않고, 책임감 있게 해결한 자세를 보여주세요',
    keywords:
      '"초기 설계 방향에 대한 의견 차이로 갈등이 있었지만…"\n"직접 중간 회의를 제안해 의견을 조율했고…"',
  },
  {
    questionNumber: 5,
    questionTitle:
      "본인의 역량을 가장 잘 보여줄 수 있는 경험이나 활동을 기술해주세요.",
    structure:
      "핵심 역량 소개 – IT 직무와 연결된 역량 강조\n경험/활동 소개 – 구체적인 프로젝트, 인턴, 사이드 프로젝트 등\n기술적 기여 내용 – 어떤 기술을 어떻게 사용했는가?\n결과 및 성장 – 성과 + 느낀 점",
    tips: "구체적인 기술 스택 (ex. React, Node.js, AWS, Docker) 를 꼭 언급\n문제 해결 과정 중심으로 기술하면 실무형 인재로 보여짐",
    keywords:
      "사이드 프로젝트(서비스 배포 경험 포함)\n해커톤 수상\nGitHub 활동 또는 코드 리뷰 경험",
  },
];
