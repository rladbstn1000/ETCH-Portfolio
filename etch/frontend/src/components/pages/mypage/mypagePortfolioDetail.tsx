import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  getPortfolioDetail,
  type BackendArrayData,
  type PortfolioDetailResponseDTO,
  type EduAndActDTO,
  type CertAndLangDTO,
} from "../../../api/portfolioApi";
import type { ProjectData } from "../../../types/project/projectDatas";
import ProjectListCard from "../../organisms/project/list/projectListCard";

// API에서 반환하는 타입
export interface ProjectInfo {
  id: number;
  title: string;
  thumbnailUrl: string;
  projectCategory: string;
  viewCount: number;
  likeCount: number;
  nickname: string;
  isPublic: boolean;
  popularityScore: number;
}

// 타입 가드 함수들
const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const isStringArray = (value: unknown): value is string[] => {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
};

const isStringArrayArray = (value: unknown): value is string[][] => {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        Array.isArray(item) &&
        item.every((subItem) => typeof subItem === "string")
    )
  );
};

// 백엔드에서 실제로 반환하는 데이터 타입들
type BackendEducationData = EduAndActDTO;
type BackendLanguageData = CertAndLangDTO;

// 현재 로그인한 사용자 ID를 가져오는 함수
const getCurrentUserId = (): number | null => {
  try {
    // 1. localStorage에서 user 정보 확인
    const userInfo = localStorage.getItem("user");
    if (userInfo) {
      const user = JSON.parse(userInfo);
      if (user && user.id) {
        return Number(user.id);
      }
    }

    // 2. localStorage에서 userId 직접 확인
    const userId = localStorage.getItem("userId");
    if (userId) {
      return Number(userId);
    }

    // 3. localStorage에서 memberId 확인
    const memberId = localStorage.getItem("memberId");
    if (memberId) {
      return Number(memberId);
    }

    // 4. 토큰에서 사용자 정보 파싱 (JWT라면)
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        // JWT 토큰의 payload 부분을 디코드
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.userId) {
          return Number(payload.userId);
        }
        if (payload.memberId) {
          return Number(payload.memberId);
        }
        if (payload.id) {
          return Number(payload.id);
        }
      } catch (tokenError) {}
    }

    return null;
  } catch (error) {
    console.error("getCurrentUserId 오류:", error);
    return null;
  }
};

// 백엔드 데이터를 2차원 배열로 파싱하는 함수
const parseBackendArrayData = (data: BackendArrayData): string[][] => {
  if (!data) return [];

  try {
    if (isStringArrayArray(data)) {
      return data;
    }

    if (isStringArray(data)) {
      return data
        .filter((item) => item.trim() !== "")
        .map((item) => item.split("^").map((subItem) => subItem.trim()));
    }

    if (isString(data)) {
      if (data.trim() === "") return [];

      return data
        .split("|")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => {
          return item.split("^").map((subItem) => subItem.trim());
        });
    }

    return [];
  } catch (error) {
    console.error("parseBackendArrayData 에러:", error, "데이터:", data);
    return [];
  }
};

// 교육 데이터를 표시용 문자열로 변환
const formatEducationData = (
  educationArray: BackendEducationData[]
): string[] => {
  return educationArray.map((edu) => {
    const companyName = edu.name || "";
    const active = edu.description || "";
    const startDate = edu.startDate;
    const endDate = edu.endDate;

    const formattedStartDate = startDate
      ? new Date(startDate).toLocaleDateString("ko-KR")
      : "";
    const formattedEndDate = endDate
      ? new Date(endDate).toLocaleDateString("ko-KR")
      : "";

    let result = "";

    if (companyName && active) {
      result = `${companyName} - ${active}`;
    } else if (companyName) {
      result = companyName;
    } else if (active) {
      result = active;
    }

    if (formattedStartDate && formattedEndDate) {
      result += ` (${formattedStartDate} ~ ${formattedEndDate})`;
    } else if (formattedStartDate) {
      result += ` (${formattedStartDate} ~)`;
    } else if (formattedEndDate) {
      result += ` (~ ${formattedEndDate})`;
    }

    return result || "정보 없음";
  });
};

// 어학 데이터를 표시용 문자열로 변환
const formatLanguageData = (languageArray: BackendLanguageData[]): string[] => {
  return languageArray.map((lang) => {
    const licenseName = lang.name || "";
    const issuer = lang.certificateIssuer || "";
    const getAt = lang.date;

    const formattedDate = getAt
      ? new Date(getAt).toLocaleDateString("ko-KR")
      : "";

    let result = "";

    if (licenseName && issuer) {
      result = `${licenseName} (${issuer})`;
    } else if (licenseName) {
      result = licenseName;
    } else if (issuer) {
      result = issuer;
    }

    if (formattedDate) {
      result += ` - ${formattedDate}`;
    }

    return result || "정보 없음";
  });
};

const formatArrayDataForDisplay = (arrayData: string[][]): string[] => {
  return arrayData.map((item) => item.join(", "));
};

// ProjectInfo를 ProjectData로 변환하는 헬퍼 함수
const convertProjectInfoToProjectData = (project: ProjectInfo): ProjectData => {
  return {
    id: project.id,
    title: project.title,
    thumbnailUrl: project.thumbnailUrl || null,
    viewCount: project.viewCount,
    likeCount: project.likeCount,
    nickname: project.nickname,
    likedByMe: false, // 기본값
    content: "", // 기본값
    projectCategory: project.projectCategory || "",
    isPublic: project.isPublic,
    popularityScore: project.popularityScore,
  } as ProjectData;
};

function MypagePortfolioDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState<PortfolioDetailResponseDTO | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchPortfolioDetail = async () => {
      if (!userId) {
        setError("사용자 ID가 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 1. 현재 로그인한 사용자 ID 확인
        const currentUserId = getCurrentUserId();

        // 2. 포트폴리오 조회
        const portfolioData = await getPortfolioDetail(Number(userId));

        setPortfolio(portfolioData);

        // 3. 소유자 여부 확인
        const ownerCheck =
          currentUserId &&
          portfolioData.memberId &&
          Number(currentUserId) === Number(portfolioData.memberId);
        setIsOwner(ownerCheck || false);
      } catch (err) {
        console.error("포트폴리오 상세 조회 실패:", err);
        setError("포트폴리오를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioDetail();
  }, [userId]);

  // 프로젝트 업데이트 핸들러
  const handleProjectUpdate = () => {
    // 필요시 프로젝트 리스트 업데이트 로직 추가
  };

  // 뒤로 가기 핸들러
  const handleGoBack = () => {
    navigate(-1);
  };

  // 수정 페이지로 이동 핸들러
  const handleEdit = () => {
    if (!portfolio) {
      console.error("포트폴리오 데이터가 없습니다.");
      return;
    }

    // 포트폴리오 ID를 찾는 로직
    let portfolioId: number | null = null;

    if (portfolio.portfolioId) {
      portfolioId = portfolio.portfolioId;
    } else if ((portfolio as any).id) {
      portfolioId = (portfolio as any).id;
    } else if (userId) {
      portfolioId = Number(userId);
    }

    if (portfolioId) {
      navigate(`/mypage/portfolios/edit/${portfolioId}`);
    } else {
      console.error("포트폴리오 ID를 찾을 수 없습니다.");
      alert("포트폴리오 ID를 찾을 수 없습니다. 다시 시도해주세요.");
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64 bg-white">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3"></div>
        포트폴리오 로딩 중...
      </div>
    );
  if (error)
    return <div className="text-red-600 text-center bg-white p-6">{error}</div>;
  if (!portfolio)
    return (
      <div className="text-center bg-white p-6">
        포트폴리오를 찾을 수 없습니다.
      </div>
    );

  // 타입 안전한 파싱
  const educationList: string[] = Array.isArray(portfolio.education)
    ? formatEducationData(portfolio.education as BackendEducationData[])
    : [];

  const languageList: string[] = Array.isArray(portfolio.language)
    ? formatLanguageData(portfolio.language as BackendLanguageData[])
    : [];

  const certificateList: string[] = portfolio.certificate
    ? Array.isArray(portfolio.certificate)
      ? formatArrayDataForDisplay(parseBackendArrayData(portfolio.certificate))
      : []
    : [];

  const activityList: string[] = portfolio.activity
    ? Array.isArray(portfolio.activity)
      ? formatArrayDataForDisplay(parseBackendArrayData(portfolio.activity))
      : []
    : [];

  // 🔥 수정: 항상 포트폴리오에 포함된 프로젝트만 표시
  const displayProjects: ProjectData[] = (() => {
    if (portfolio.projectList && portfolio.projectList.length > 0) {
      return portfolio.projectList.map(convertProjectInfoToProjectData);
    } else {
      return [];
    }
  })();

  const handleDownloadMarkdown = async () => {
    // 타입 단언을 사용해서 id 속성에 접근
    const portfolioWithId = portfolio as any;
    const portfolioId = portfolioWithId?.portfolioId || portfolioWithId?.id;

    if (!portfolioId) {
      console.error("포트폴리오 ID가 없습니다:", portfolio);
      alert("포트폴리오 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      const apiUrl = `/api/v1/portfolios/${portfolioId}/markdown`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("에러 응답 내용:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      // 마크다운 내용을 가져와서 파일로 다운로드
      const markdownContent = await response.text();

      // Blob 생성 및 다운로드
      const blob = new Blob([markdownContent], { type: "text/markdown" });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const filename = `${portfolio.name || "portfolio"}_portfolio.md`;
      link.download = filename;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("=== 마크다운 다운로드 실패 ===");
      console.error("에러 객체:", error);

      // 에러 타입 체크
      if (error instanceof Error) {
        console.error("에러 메시지:", error.message);
        console.error("에러 스택:", error.stack);
        alert(`마크다운 파일 다운로드에 실패했습니다: ${error.message}`);
      } else {
        console.error("알 수 없는 에러:", String(error));
        alert("마크다운 파일 다운로드에 실패했습니다.");
      }
    }
  };
  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* 기본 정보 */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">기본 정보</h2>
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            MD 다운로드
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="font-semibold text-gray-600 w-24 flex-shrink-0">
                이름
              </span>
              <span className="text-gray-900 font-medium">
                {portfolio.name || "-"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-gray-600 w-24 flex-shrink-0">
                이메일
              </span>
              <span className="text-gray-900">{portfolio.email || "-"}</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-gray-600 w-24 flex-shrink-0">
                전화번호
              </span>
              <span className="text-gray-900">
                {portfolio.phoneNumber || "-"}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="font-semibold text-gray-600 w-24 flex-shrink-0">
                GitHub
              </span>
              {portfolio.githubUrl ? (
                <a
                  href={portfolio.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 break-all"
                >
                  {portfolio.githubUrl}
                </a>
              ) : (
                <span className="text-gray-900">-</span>
              )}
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-gray-600 w-24 flex-shrink-0">
                블로그
              </span>
              {portfolio.blogUrl ? (
                <a
                  href={portfolio.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 break-all"
                >
                  {portfolio.blogUrl}
                </a>
              ) : (
                <span className="text-gray-900">-</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="mb-3">
            <span className="font-semibold text-gray-600">자기소개</span>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <p className="text-gray-800 whitespace-pre-line leading-relaxed text-base">
              {portfolio.introduce || "자기소개가 등록되지 않았습니다."}
            </p>
          </div>
        </div>
      </div>

      {/* 기술 스택 */}
      {portfolio.techList && portfolio.techList.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-100">
            기술 스택
          </h2>
          <div className="flex flex-wrap gap-3">
            {portfolio.techList.map((tech, idx) => (
              <span
                key={idx}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 rounded-full text-sm font-semibold hover:from-blue-100 hover:to-blue-200 transition-all duration-200 transform hover:scale-105"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 프로젝트 */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">프로젝트</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 font-medium">
              총 {displayProjects.length}개
            </span>
          </div>
        </div>

        <ProjectListCard
          projects={displayProjects}
          onProjectUpdate={handleProjectUpdate}
        />
      </div>

      {/* 데이터가 없는 경우 안내 메시지 */}
      {educationList.length === 0 &&
        languageList.length === 0 &&
        certificateList.length === 0 &&
        activityList.length === 0 &&
        displayProjects.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500 mb-8 shadow-sm">
            <div className="text-6xl mb-4 opacity-60">📝</div>
            <p className="text-xl font-semibold mb-3 text-gray-600">
              추가 정보가 등록되지 않았습니다
            </p>
            <p className="text-base text-gray-500">
              학력, 어학, 자격증, 활동, 프로젝트 정보를 등록해보세요.
            </p>
          </div>
        )}

      {/* 교육/활동 섹션 */}
      {(educationList.length > 0 || activityList.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
            교육 / 활동
          </h2>

          <div className="space-y-3">
            {/* 교육 목록 */}
            {educationList.map((edu, idx) => {
              // 날짜 부분 추출 (마지막 괄호 안의 내용)
              const dateMatch = edu.match(/\(([^)]+)\)$/);
              const dateText = dateMatch ? dateMatch[1] : "";
              const mainContent = edu.replace(/\s*\([^)]+\)$/, "");

              return (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-md p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 text-sm text-gray-700">
                      {mainContent}
                    </div>
                    {dateText && (
                      <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                        {dateText}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 기타 활동 목록 */}
            {activityList.map((activity, idx) => {
              const dateMatch = activity.match(/\(([^)]+)\)$/);
              const dateText = dateMatch ? dateMatch[1] : "";
              const mainContent = activity.replace(/\s*\([^)]+\)$/, "");

              return (
                <div
                  key={`activity-${idx}`}
                  className="bg-gray-50 border border-gray-200 rounded-md p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 text-sm text-gray-700">
                      {mainContent}
                    </div>
                    {dateText && (
                      <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                        {dateText}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 자격증 섹션 */}
      {(languageList.length > 0 || certificateList.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
            자격증 / 어학
          </h2>

          <div className="space-y-3">
            {/* 자격증/어학 목록 */}
            {languageList.map((lang, idx) => {
              // 날짜와 발급기관 추출
              const dateMatch = lang.match(/-\s*(.+)$/);
              const dateAndIssuer = dateMatch ? dateMatch[1] : "";
              const mainContent = lang.replace(/\s*-\s*.+$/, "");

              return (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-md p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 text-sm text-gray-700">
                      {mainContent}
                    </div>
                    {dateAndIssuer && (
                      <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                        {dateAndIssuer}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 기타 자격증 목록 */}
            {certificateList.map((cert, idx) => {
              const dateMatch = cert.match(/-\s*(.+)$/);
              const dateAndIssuer = dateMatch ? dateMatch[1] : "";
              const mainContent = cert.replace(/\s*-\s*.+$/, "");

              return (
                <div
                  key={`cert-${idx}`}
                  className="bg-gray-50 border border-gray-200 rounded-md p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 text-sm text-gray-700">
                      {mainContent}
                    </div>
                    {dateAndIssuer && (
                      <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                        {dateAndIssuer}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* 버튼 섹션 */}
      <div className="flex justify-between items-center pt-8 pb-4">
        <button
          onClick={handleGoBack}
          className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          뒤로 가기
        </button>

        {isOwner && (
          <button
            onClick={handleEdit}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            수정하기
          </button>
        )}
      </div>
    </div>
  );
}

export default MypagePortfolioDetail;
