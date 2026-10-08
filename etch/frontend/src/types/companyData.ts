// company.ts - 백엔드 CompanyInfoDTO 기준
export interface Company {
  id: number;
  name: string;
  industry: string;
  mainProducts: string;
  ceoName: string;
  summary: string;
  stock: string;
  address: string;
  homepageUrl: string;
  foundedDate: string; // LocalDate → ISO string
  totalEmployees: number;
  maleEmployees: number;
  femaleEmployees: number;
  maleRatio: number;
  femaleRatio: number;
  salary: number;
  serviceYear: number;
}
