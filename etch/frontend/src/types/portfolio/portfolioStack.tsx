// Select 컴포넌트용 기본 인터페이스
export interface SelectProps {
  options: Array<{ value: string; label: string }>;
  selectedValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

// 기존 포트폴리오 스택 enum
export type PortfolioStackEnum =
  | "HTML"
  | "CSS"
  | "JavaScript"
  | "TypeScript"
  | "React"
  | "Vue.js"
  | "Angular"
  | "jQuery"
  | "Bootstrap"
  | "Redux"
  | "Java"
  | "SpringBoot"
  | "Spring"
  | "Node.js"
  | "Python"
  | "Django"
  | "Flask"
  | "AWS"
  | "Docker"
  | "Kubernetes"
  | "MySQL"
  | "PostgreSQL"
  | "OracleDB"
  | "MSSQL"
  | "MongoDB"
  | "Redis"
  | "MariaDB"
  | "SQLite"
  | "SQL"
  | "NoSQL";

// 기존 포트폴리오 스택 데이터 구조 (호환성 유지)
export interface PortfolioStackData {
  stack: PortfolioStackEnum;
  text: string;
}

// Select용 옵션 데이터 구조
export interface StackSelectOption {
  value: string;
  label: string;
}

// 기존 데이터
export const PortfolioWriteStackData: PortfolioStackData[] = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Vue.js",
  "Angular",
  "jQuery",
  "Bootstrap",
  "Redux",
  "Java",
  "SpringBoot",
  "Spring",
  "Node.js",
  "Python",
  "Django",
  "Flask",
  "AWS",
  "Docker",
  "Kubernetes",
  "MySQL",
  "PostgreSQL",
  "OracleDB",
  "MSSQL",
  "MongoDB",
  "Redis",
  "MariaDB",
  "SQLite",
  "SQL",
  "NoSQL",
].map((item) => ({
  stack: item as PortfolioStackEnum,
  text: item,
}));

// Select 컴포넌트용으로 변환된 데이터
export const PortfolioStackSelectOptions: StackSelectOption[] =
  PortfolioWriteStackData.map((item) => ({
    value: item.stack,
    label: item.text,
  }));

// 포트폴리오 스택 전용 Select Props
export interface PortfolioStackSelectProps extends SelectProps {
  selectedStacks: PortfolioStackEnum[];
  onStackAdd: (stack: PortfolioStackEnum) => void;
  onStackRemove: (stack: PortfolioStackEnum) => void;
}
