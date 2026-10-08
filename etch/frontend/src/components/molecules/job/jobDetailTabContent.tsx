import { DEMO_MODE } from "../../../config/demo";
import type { JobItemProps } from "../../atoms/listItem";
import type { Job } from "../../../types/job";
import type { Company } from "../../../types/companyData";
import type { News } from "../../../types/newsTypes";

interface JobDetailTabContentProps {
  activeTab: "details" | "company" | "news";
  job: JobItemProps;
  jobDetail: Job | null;
  companyInfo: Company | null;
  companyNews: News[];
  errors: {
    jobError: string | null;
    companyError: string | null;
    newsError: string | null;
  };
}

export default function JobDetailTabContent({
  activeTab,
  job,
  jobDetail,
  companyInfo,
  companyNews,
  errors,
}: JobDetailTabContentProps) {
  const renderBadge = (text: string, color = "blue") => {
    const colorMap: Record<string, string> = {
      blue: "text-blue-700 bg-blue-100",
      green: "text-green-700 bg-green-100",
      gray: "text-gray-700 bg-gray-100",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-md ${
          colorMap[color] || colorMap.blue
        } shadow-sm`}
      >
        {text}
      </span>
    );
  };

  const renderContent = () => {
    const currentJob = jobDetail || job;
    const anyJob = currentJob as any; // union 타입에서 안전하게 접근하기 위한 any 캐스트

    const safeRegions = Array.isArray(anyJob?.regions) ? anyJob.regions : [];
    const safeJobCategories = Array.isArray(anyJob?.jobCategories)
      ? anyJob.jobCategories
      : [];
    const safeIndustries = Array.isArray(anyJob?.industries)
      ? anyJob.industries
      : [];

    switch (activeTab) {
      case "details":
        if (errors.jobError) {
          return (
            <div className="p-6">
              <div className="text-red-600">{errors.jobError}</div>
            </div>
          );
        }

        return (
          <div className="p-6 space-y-6">
            <h3 className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              {/* Briefcase icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" />
              </svg>
              공고 상세
            </h3>

            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {anyJob.title && (
                <div className="md:col-span-2">
                  <dt className="text-sm text-gray-500">공고 제목</dt>
                  <dd className="font-semibold text-gray-900">
                    {anyJob.title}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm text-gray-500">회사명</dt>
                <dd className="text-gray-900">{anyJob.companyName}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">위치</dt>
                <dd className="text-gray-900">
                  {safeRegions.join(", ") || "위치 정보 없음"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">근무형태</dt>
                <dd className="text-gray-900">{anyJob.workType || "-"}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">시작일</dt>
                <dd className="text-gray-900">
                  {anyJob.openingDate
                    ? new Date(anyJob.openingDate).toLocaleDateString()
                    : "-"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">마감일</dt>
                <dd className="text-gray-900">
                  {anyJob.expirationDate
                    ? new Date(anyJob.expirationDate).toLocaleDateString()
                    : "-"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">학력요건</dt>
                <dd className="text-gray-900">
                  {anyJob.educationLevel || "-"}
                </dd>
              </div>
            </dl>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                {anyJob.employmentType &&
                  renderBadge(anyJob.employmentType, "gray")}
                {anyJob.salary && renderBadge(anyJob.salary, "gray")}
                {anyJob.experience && renderBadge(anyJob.experience, "gray")}
              </div>
              {anyJob.summary && (
                <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">
                  {anyJob.summary}
                </p>
              )}
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-gray-700">
                직무 분야
              </h4>
              <div className="flex flex-wrap gap-2">
                {safeJobCategories.length === 0 ? (
                  <span className="text-sm text-gray-500">정보 없음</span>
                ) : (
                  safeJobCategories.map((c: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs font-medium text-blue-700 rounded-md shadow-sm bg-blue-50"
                    >
                      {c}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-gray-700">
                산업 분야
              </h4>
              <div className="flex flex-wrap gap-2">
                {safeIndustries.length === 0 ? (
                  <span className="text-sm text-gray-500">정보 없음</span>
                ) : (
                  safeIndustries.map((c: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs font-medium text-green-700 rounded-md shadow-sm bg-green-50"
                    >
                      {c}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case "company":
        if (errors.companyError) {
          return (
            <div className="p-6">
              <div className="text-red-600">{errors.companyError}</div>
            </div>
          );
        }

        if (!companyInfo) {
          return (
            <div className="p-6">
              <div className="text-gray-600">
                기업 정보를 불러오는 중입니다...
              </div>
            </div>
          );
        }

        return (
          <div className="p-6 space-y-6">
            <h3 className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M3 7h18" />
                <rect x="4" y="7" width="16" height="13" rx="2" />
              </svg>
              기업 정보
            </h3>

            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">회사명</dt>
                <dd className="text-gray-900">{companyInfo.name}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">CEO</dt>
                <dd className="text-gray-900">{companyInfo.ceoName || "-"}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">설립일</dt>
                <dd className="text-gray-900">
                  {companyInfo.foundedDate
                    ? new Date(companyInfo.foundedDate).toLocaleDateString()
                    : "-"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">직원수</dt>
                <dd className="text-gray-900">
                  {companyInfo.totalEmployees
                    ? companyInfo.totalEmployees.toLocaleString() + "명"
                    : "-"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">평균 연봉</dt>
                <dd className="text-gray-900">
                  {companyInfo.salary
                    ? companyInfo.salary.toLocaleString() + "원"
                    : "-"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">근속연수</dt>
                <dd className="text-gray-900">
                  {companyInfo.serviceYear ?? "-"}
                </dd>
              </div>
            </dl>

            <div className="pt-2 space-y-3 border-t border-gray-100">
              <div>
                <dt className="text-sm text-gray-500">업종</dt>
                <dd className="text-gray-900">{companyInfo.industry || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">주요 제품/서비스</dt>
                <dd className="text-gray-900">
                  {companyInfo.mainProducts || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">회사 소개</dt>
                <dd className="text-gray-900 whitespace-pre-wrap">
                  {companyInfo.summary || "-"}
                </dd>
              </div>
              {!DEMO_MODE && companyInfo.homepageUrl && (
                <div>
                  <dt className="text-sm text-gray-500">홈페이지</dt>
                  <dd>
                    <a
                      href={
                        companyInfo.homepageUrl.startsWith("http")
                          ? companyInfo.homepageUrl
                          : `https://${companyInfo.homepageUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {companyInfo.homepageUrl}
                    </a>
                  </dd>
                </div>
              )}
            </div>
          </div>
        );

      case "news":
        if (errors.newsError) {
          return (
            <div className="p-6">
              <div className="text-red-600">{errors.newsError}</div>
            </div>
          );
        }

        return (
          <div className="p-6">
            <h3 className="flex items-center gap-3 mb-4 text-lg font-semibold text-gray-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M19 3H5a2 2 0 0 0-2 2v14l4-2 4 2 4-2 4 2V5a2 2 0 0 0-2-2z" />
              </svg>
              기업 뉴스
            </h3>

            {companyNews.length === 0 ? (
              <div className="min-h-[36vh] flex items-center justify-center text-gray-600">
                관련 뉴스가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {companyNews.map((news) => (
                  <article
                    key={news.id}
                    className="p-4 transition-shadow bg-white border border-gray-100 rounded-lg cursor-pointer hover:shadow-sm"
                    onClick={() =>
                      !DEMO_MODE && window.open(news.url, "_blank", "noopener,noreferrer")
                    }
                    role="article"
                    aria-label={news.title}
                  >
                    <div className="flex gap-4">
                      {news.thumbnailUrl ? (
                        <img
                          src={news.thumbnailUrl}
                          alt={news.title}
                          className="flex-shrink-0 object-cover w-20 h-20 rounded-md"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-20 h-20 text-xs text-gray-400 rounded-md bg-gray-50">
                          이미지 없음
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="mb-2 text-sm font-semibold text-gray-900 line-clamp-2">
                          {news.title}
                        </h4>
                        <p className={`mb-2 text-xs text-gray-600 ${DEMO_MODE ? "" : "line-clamp-2"}`}>
                          {news.description}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>{news.company?.name || "출처 없음"}</span>
                          <span>
                            {news.publishedAt
                              ? new Date(news.publishedAt).toLocaleDateString()
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      id={`tabpanel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`tab-${activeTab}`}
      className="min-h-full"
    >
      {renderContent()}
    </div>
  );
}
