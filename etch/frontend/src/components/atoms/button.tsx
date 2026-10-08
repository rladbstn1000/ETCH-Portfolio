// atoms/button/index.ts 에서 StackButtonProps 수정

import type { ProjectCategoryEnum } from "../../types/project/projectCategroyData";
import type { ProjectTechEnum } from "../../types/project/projectTechData";

export interface ButtonProps {
  text?: string; //  버튼 안의 text
  bgColor?: string; //  버튼의 색상
  img?: string; //  버튼의 이미지
  icon?: React.ReactNode; // 버튼의 아이콘
  value?: string; // 버튼의 값
  onClick?: () => void; //  버튼을 누르면 생기는 기능
  textColor?: string; //  버튼의 텍스트 색상
  checked?: boolean; // 현재 버튼의 체크 유뮤
  css?: string; // 버튼의 css 형식
  disabled?: boolean; // 버튼 비활성화 상태
}

// ID 기반으로 수정된 StackButtonProps
export interface StackButtonProps extends ButtonProps {
  id: number; // 기술 스택 ID 추가
  stack: ProjectTechEnum; // 표시용 (기존 유지)
  isSelected: boolean; // 선택 여부
  onSelect: (id: number) => void; // ID를 전달하도록 변경
}

export interface AdditionalButtonProps extends ButtonProps {
  textColor?: string; //  버튼의 텍스트 색상
}

export interface fileUploadButtonProps extends ButtonProps {
  onFileSelect: (file: File) => void; // 파일 선택 시 호출되는 함수
  accept?: string; // 허용되는 파일 형식
}

export interface NavButtonProps extends ButtonProps {
  to: string;
  isActive?: boolean;
}

export interface StatsButtonProps extends ButtonProps {
  count: number;
  label: string;
}

export interface CategoryButtonProps extends ButtonProps {
  category: ProjectCategoryEnum; // 어떤 카테고리인지
  isSelected: boolean; // 선택 여부
  onSelect: (category: ProjectCategoryEnum) => void; // 클릭 시 실행
}
