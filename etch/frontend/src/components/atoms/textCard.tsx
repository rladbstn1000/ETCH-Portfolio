type CardType = "language" | "education" | "project";

export interface TextCard {
  title: string;
  type: CardType;
}
export interface ProjectTextCard extends TextCard {
  projectName: string;
  comment: string;
  content: string;
  stack: Array<{ value: string; label: string }>;
  startAt: string;
  endAt: string;
  githubURL: string;
}

export interface EducationTextCard extends TextCard {
  companyName: string;
  startAt: string;
  endAt: string;
  active: string;
}

export interface LanguageTextCard extends TextCard {
  licenseName: string;
  getAt: string;
  issuer: string;
}
