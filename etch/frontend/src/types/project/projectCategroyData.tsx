import CodeSVG from "../../components/svg/codeSVG";
import DatabaseSVG from "../../components/svg/databaseSVG";
import ServerSVG from "../../components/svg/serverSVG";
import ProtectSVG from "../../components/svg/protectSVG";
import MobileSVG from "../../components/svg/mobileSVG";
import DevOpsSVG from "../../components/svg/devOpsSVG";

export type ProjectCategoryEnum =
  | "WEB"
  | "MOBILE"
  | "SECURITY"
  | "DEVOPS"
  | "SERVER"
  | "DATABASE";

export interface ProjectCategoryData {
  id: number; // DB의 tinyint와 매핑
  category: ProjectCategoryEnum;
  text: string;
  icon: React.ReactNode;
}

export const ProjectWriteCategoryData: ProjectCategoryData[] = [
  {
    id: 1,
    category: "WEB",
    text: "웹 개발",
    icon: <CodeSVG />,
  },
  {
    id: 2,
    category: "MOBILE",
    text: "모바일 앱",
    icon: <MobileSVG />,
  },
  {
    id: 3,
    category: "SECURITY",
    text: "보안",
    icon: <ProtectSVG />,
  },
  {
    id: 4,
    category: "DEVOPS",
    text: "DevOps",
    icon: <DevOpsSVG />,
  },
  {
    id: 5,
    category: "SERVER",
    text: "서버",
    icon: <ServerSVG />,
  },
  {
    id: 6,
    category: "DATABASE",
    text: "데이터베이스",
    icon: <DatabaseSVG />,
  },
];

// 숫자를 카테고리 enum으로 변환하는 헬퍼 함수
export const getCategoryFromNumber = (
  categoryNum: number
): ProjectCategoryEnum => {
  const found = ProjectWriteCategoryData.find((cat) => cat.id === categoryNum);
  return found ? found.category : "WEB";
};

// 카테고리 enum을 숫자로 변환하는 헬퍼 함수
export const getCategoryNumber = (category: ProjectCategoryEnum): number => {
  const found = ProjectWriteCategoryData.find(
    (cat) => cat.category === category
  );
  return found ? found.id : 1;
};
