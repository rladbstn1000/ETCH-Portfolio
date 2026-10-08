// CSV 데이터에 기반한 기술 카테고리

import type { ProjectCategoryEnum } from "./projectCategroyData";

// CSV 데이터의 code_name들을 기반으로 한 enum
export type ProjectTechEnum =
  | "HTML"
  | "CSS"
  | "JavaScript"
  | "React"
  | "Spring"
  | "Springboot"
  | "Kotlin"
  | "Flutter"
  | "React Native"
  | "Swift"
  | "SSL/TLS"
  | "OAuth"
  | "JWT"
  | "HTTPS"
  | "Firewall"
  | "Docker"
  | "Kubernetes"
  | "Jenkins"
  | "Git"
  | "AWS"
  | "Node.js"
  | "Apache"
  | "Nginx"
  | "Tomcat"
  | "IIS"
  | "MySQL"
  | "PostgreSQL"
  | "MongoDB"
  | "Redis"
  | "Oracle";

// 백엔드 데이터 구조와 매칭되는 인터페이스
export interface TechStackData {
  id: number;
  tech_category: ProjectCategoryEnum;
  code_name: ProjectTechEnum;
}

// 프로젝트에서 사용할 기술 데이터 인터페이스 (오타 수정: ProejctTechData -> ProjectTechData)
export interface ProjectTechData {
  id: number;
  stack: ProjectTechEnum;
  text: string;
  category: ProjectCategoryEnum;
}

// CSV 데이터를 직접 배열로 변환 (백엔드에서 가져올 때까지 임시 사용)
export const ProjectWriteTechData: ProjectTechData[] = [
  { id: 1, stack: "HTML", text: "HTML", category: "WEB" },
  { id: 2, stack: "CSS", text: "CSS", category: "WEB" },
  { id: 3, stack: "JavaScript", text: "JavaScript", category: "WEB" },
  { id: 4, stack: "React", text: "React", category: "WEB" },
  { id: 5, stack: "Spring", text: "Spring", category: "WEB" },
  { id: 6, stack: "Springboot", text: "Spring Boot", category: "WEB" },
  { id: 7, stack: "Kotlin", text: "Kotlin", category: "MOBILE" },
  { id: 8, stack: "Flutter", text: "Flutter", category: "MOBILE" },
  { id: 9, stack: "React Native", text: "React Native", category: "MOBILE" },
  { id: 10, stack: "Swift", text: "Swift", category: "MOBILE" },
  { id: 11, stack: "SSL/TLS", text: "SSL/TLS", category: "SECURITY" },
  { id: 12, stack: "OAuth", text: "OAuth", category: "SECURITY" },
  { id: 13, stack: "JWT", text: "JWT", category: "SECURITY" },
  { id: 14, stack: "HTTPS", text: "HTTPS", category: "SECURITY" },
  { id: 15, stack: "Firewall", text: "Firewall", category: "SECURITY" },
  { id: 16, stack: "Docker", text: "Docker", category: "DEVOPS" },
  { id: 17, stack: "Kubernetes", text: "Kubernetes", category: "DEVOPS" },
  { id: 18, stack: "Jenkins", text: "Jenkins", category: "DEVOPS" },
  { id: 19, stack: "Git", text: "Git", category: "DEVOPS" },
  { id: 20, stack: "AWS", text: "AWS", category: "DEVOPS" },
  { id: 21, stack: "Node.js", text: "Node.js", category: "SERVER" },
  { id: 22, stack: "Apache", text: "Apache", category: "SERVER" },
  { id: 23, stack: "Nginx", text: "Nginx", category: "SERVER" },
  { id: 24, stack: "Tomcat", text: "Tomcat", category: "SERVER" },
  { id: 25, stack: "IIS", text: "IIS", category: "SERVER" },
  { id: 26, stack: "MySQL", text: "MySQL", category: "DATABASE" },
  { id: 27, stack: "PostgreSQL", text: "PostgreSQL", category: "DATABASE" },
  { id: 28, stack: "MongoDB", text: "MongoDB", category: "DATABASE" },
  { id: 29, stack: "Redis", text: "Redis", category: "DATABASE" },
  { id: 30, stack: "Oracle", text: "Oracle", category: "DATABASE" },
];

// 백엔드에서 데이터를 가져오는 함수 (예시)
export async function fetchTechStackData(): Promise<ProjectTechData[]> {
  try {
    const response = await fetch("/api/tech-stack"); // 백엔드 API 엔드포인트
    const data: TechStackData[] = await response.json();

    // 백엔드 데이터를 프론트엔드 형식으로 변환
    return data.map((item) => ({
      id: item.id,
      stack: item.code_name,
      text: item.code_name,
      category: item.tech_category,
    }));
  } catch (error) {
    console.error("Failed to fetch tech stack data:", error);
    // 에러 시 기본 데이터 반환
    return ProjectWriteTechData;
  }
}

// 카테고리별로 기술 스택을 그룹화하는 유틸리티 함수
export function groupTechByCategory(
  techData: ProjectTechData[]
): Record<ProjectCategoryEnum, ProjectTechData[]> {
  return techData.reduce((acc, tech) => {
    if (!acc[tech.category]) {
      acc[tech.category] = [];
    }
    acc[tech.category].push(tech);
    return acc;
  }, {} as Record<ProjectCategoryEnum, ProjectTechData[]>);
}
