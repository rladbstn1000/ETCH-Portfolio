import { ProjectWriteCategoryData } from "./project/projectCategroyData";

type category = "field" | "sort";

export interface ProjectSidebarInventory {
  type: category;
  list: string; // 화면에 표시될 한글 텍스트
  value: string; // 백엔드로 전송할 값
  checked: boolean;
}

// ProjectWriteCategoryData를 기반으로 자동 생성
export const ProjectSidebarType: ProjectSidebarInventory[] = [
  // field (개발 분야) - ProjectWriteCategoryData에서 자동 생성
  ...ProjectWriteCategoryData.map((categoryData) => ({
    type: "field" as const,
    list: categoryData.text, // "웹 개발", "모바일 앱" 등
    value: categoryData.category, // "WEB", "MOBILE" 등
    checked: false,
  })),

  // sort (정렬)
  {
    type: "sort",
    list: "최신순",
    value: "LATEST",
    checked: false,
  },
  {
    type: "sort",
    list: "조회순",
    value: "VIEWS",
    checked: false,
  },
  {
    type: "sort",
    list: "인기순",
    value: "POPULAR",
    checked: false,
  },
];
