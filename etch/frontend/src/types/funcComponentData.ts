import mainInfo from "../assets/mainInfo.png";
import mainReport from "../assets/mainReport.png";
import mainPortfolio from "../assets/mianPortfolio.png";
import mainTeam from "../assets/mainTeam.png";

export interface funcComponentData {
  title: string;
  content: string;
  img: string;
}

export const funcData: funcComponentData[] = [
  {
    title: "맞춤형 채용 정보",
    content: "관심 직무와 기업에 맞는 채용 정보를 채계적으로 제공합니다.",
    img: mainInfo,
  },
  {
    title: "기업 분석 리포트",
    content: "지원하고자 하는 기업의 채용 정보와 뉴스를 확인하세요.",
    img: mainReport,
  },
  {
    title: "포트폴리오 생성",
    content: "개인 정보와 프로젝트를 바탕으로 포트폴리오를 생성합니다.",
    img: mainPortfolio,
  },
  {
    title: "프로젝트로 만나는 동료",
    content: "다른 개발자들의 프로젝트를 둘러보고, 채팅으로 바로 소통하세요.",
    img: mainTeam,
  },
];
