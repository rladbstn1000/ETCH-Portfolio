import { projectDisplayText } from "../../../utils/projectDisplayText";
import { DEMO_MODE } from "../../../config/demo";
import type { ProjectCardProps } from "../../atoms/card";
import noImg from "../../../assets/noImg.png";
import { useState } from "react";
import LikeSVG from "../../svg/likeSVG";
import ViewSVG from "../../svg/viewSVG";
import { ProjectWriteTechData } from "../../../types/project/projectTechData";
import { ProjectWriteCategoryData } from "../../../types/project/projectCategroyData";
import {
  deleteProject,
  likeProject,
  unlikeProject,
} from "../../../api/projectApi";
import { useNavigate } from "react-router";

function ProjectModalCard({
  id,
  title,
  content,
  thumbnailUrl,
  youtubeUrl,
  viewCount,
  projectCategory,
  createdAt,
  updatedAt,
  isDeleted,
  githubUrl,
  isPublic,
  member,
  nickname,
  files,
  projectTechs,
  likeCount: initialLikeCount,
  likedByMe: initialLikedByMe,
  writerImg,
  onLike,
  onClose,
  ...restProps // 나머지 props 받기
}: ProjectCardProps & {
  // 🔥 새로 추가된 props
  techCodes?: string[]; // API에서 오는 기술 스택 (문자열 배열)
  techCategories?: string[]; // API에서 오는 기술 카테고리
  fileUrls?: string[]; // API에서 오는 파일 URL들
  profileUrl?: string; // API에서 오는 프로필 이미지 URL
  memberId?: number; // API에서 오는 작성자 ID
  onClose?: () => void;
  [key: string]: unknown;
}) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // 좋아요 상태 관리
  const [currentLikeCount, setCurrentLikeCount] = useState(
    initialLikeCount || 0
  );
  const [isLiking, setIsLiking] = useState(false);

  // 로그인 상태 확인 함수
  const isLoggedIn = (): boolean => {
    const token = localStorage.getItem("access_token");
    return !!token;
  };

  // JWT 토큰에서 사용자 정보 추출하는 함수
  const getUserFromToken = () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return null;

      const base64Payload = token.split(".")[1];
      const payload = JSON.parse(atob(base64Payload));
      return payload;
    } catch (error) {
      console.error("토큰 디코딩 실패:", error);
      return null;
    }
  };

  // 현재 사용자 정보 가져오기
  const currentUser = getUserFromToken();

  // 🔥 작성자 ID 추출 함수
  const getAuthorId = (): number | undefined => {
    // 1순위: 직접 props로 받은 memberId
    const directMemberId = restProps.memberId as number | undefined;
    if (directMemberId) return directMemberId;

    // 2순위: restProps에서 오는 authorId
    const authorId = restProps.authorId as number | undefined;
    if (authorId) return authorId;

    // 3순위: member 객체에서
    if (member && member.id) return member.id;

    return undefined;
  };

  // 🔥 수정된 작성자 체크
  const isAuthor = (() => {
    if (!currentUser) return false;

    const actualAuthorId = getAuthorId();
    if (actualAuthorId) {
      return currentUser.id === actualAuthorId;
    }

    // fallback: 닉네임으로 비교
    if (currentUser.nickname && nickname) {
      return currentUser.nickname === nickname;
    }

    return false;
  })();

  // isLiked 초기값을 백엔드 데이터로 설정
  const [isLiked, setIsLiked] = useState(initialLikedByMe || false);

  // 좋아요 토글 핸들러에서 onLike 우선 사용
  // 좋아요 토글 핸들러 수정
  const handleLikeToggle = async () => {
    if (isLiking) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      setIsLiking(true);

      // 먼저 UI 상태를 즉시 업데이트 (optimistic update)
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked
        ? currentLikeCount + 1
        : currentLikeCount - 1;

      setIsLiked(newIsLiked);
      setCurrentLikeCount(newLikeCount);

      // 부모에서 전달받은 onLike 핸들러가 있으면 사용
      if (onLike) {
        try {
          await onLike();
        } catch (error) {
          // 부모 핸들러 실패 시 상태 롤백
          setIsLiked(!newIsLiked);
          setCurrentLikeCount(currentLikeCount);
          throw error;
        }
      } else {
        // 기존 로직 (fallback)
        try {
          if (newIsLiked) {
            await likeProject(id);
          } else {
            await unlikeProject(id);
          }
        } catch (error) {
          // API 호출 실패 시 상태 롤백
          setIsLiked(!newIsLiked);
          setCurrentLikeCount(currentLikeCount);
          throw error;
        }
      }
    } catch (error: unknown) {
      console.error("좋아요 처리 실패:", error);

      if (error instanceof Error) {
        if (error.message?.includes("로그인")) {
          alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        } else {
          alert("좋아요 처리 중 오류가 발생했습니다.");
        }
      } else {
        alert("좋아요 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLiking(false);
    }
  };

  // 수정 버튼 클릭 핸들러 - React Router를 사용하도록 수정
  const handleEdit = () => {
    // 모달 닫기 (부모 컴포넌트에서 onClose를 제공한 경우)
    if (onClose) {
      onClose();
    }

    // React Router를 사용해서 수정 페이지로 이동
    navigate(`/projects/${id}/edit`);
  };

  // 삭제 버튼 클릭 핸들러
  const handleDelete = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    if (!confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProject(id);
      alert("프로젝트가 성공적으로 삭제되었습니다.");

      if (onClose) {
        onClose();
      }

      window.location.reload();
    } catch (error: unknown) {
      console.error("프로젝트 삭제 실패:", error);

      if (error instanceof Error) {
        if (error.message?.includes("로그인")) {
          alert(error.message);
        } else if (error.message?.includes("권한")) {
          alert("본인이 작성한 프로젝트만 삭제할 수 있습니다.");
        } else {
          alert(error.message || "프로젝트 삭제 중 오류가 발생했습니다.");
        }
      } else {
        alert("프로젝트 삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // 삭제된 프로젝트는 표시하지 않음
  if (isDeleted) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">🗑️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          삭제된 프로젝트입니다
        </h3>
        <p className="text-gray-600">
          이 프로젝트는 더 이상 사용할 수 없습니다.
        </p>
      </div>
    );
  }

  // 🎯 수정된 비공개 프로젝트 체크 - 작성자가 아닌 경우에만 차단
  if (!isPublic && !isAuthor) {
    return (
      <div className="text-center py-12">
        <div className="text-yellow-500 text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          비공개 프로젝트입니다
        </h3>
        <p className="text-gray-600">이 프로젝트는 공개되지 않았습니다.</p>
      </div>
    );
  }

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Seoul"
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // 🔥 수정된 기술 스택 처리 함수
  const getTechNames = (): string[] => {
    // 1순위: API에서 techCodes로 직접 문자열 배열이 오는 경우
    const directTechCodes = restProps.techCodes as string[] | undefined;
    if (
      directTechCodes &&
      Array.isArray(directTechCodes) &&
      directTechCodes.length > 0
    ) {
      return directTechCodes;
    }

    // 2순위: 기존 방식 - projectTechs가 숫자 배열인 경우 (하위 호환성)
    if (
      projectTechs &&
      Array.isArray(projectTechs) &&
      projectTechs.length > 0
    ) {
      return projectTechs
        .map((id) => ProjectWriteTechData.find((tech) => tech.id === id)?.text)
        .filter(Boolean) as string[];
    }

    return [];
  };

  // 🔥 수정된 이미지 목록 구성
  const getAllImages = () => {
    const images = [];

    // 썸네일 이미지 추가
    if (thumbnailUrl) {
      images.push(thumbnailUrl);
    }

    // 🔥 API에서 오는 파일 URL들 추가 (우선순위)
    const directFileUrls = restProps.fileUrls as string[] | undefined;
    if (directFileUrls && Array.isArray(directFileUrls)) {
      directFileUrls.forEach((url) => {
        if (url && typeof url === "string") {
          images.push(url);
        }
      });
    }

    // 기존 files 배열도 처리 (하위 호환성)
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file instanceof File && file.type.startsWith("image/")) {
          images.push(URL.createObjectURL(file));
        } else if (typeof file === "string") {
          images.push(file);
        }
      });
    }

    return images.length > 0 ? images : [noImg];
  };

  // 🔥 수정된 작성자 이미지 처리
  const getWriterImage = () => {
    // 1순위: API에서 오는 profileUrl
    const directProfileUrl = restProps.profileUrl as string | undefined;
    if (directProfileUrl) return directProfileUrl;

    // 2순위: 기존 writerImg
    if (writerImg) return writerImg;

    // 3순위: 기본 이미지
    return noImg;
  };

  // 카테고리 enum을 한글로 변환
  const getCategoryDisplayName = (categoryEnum: string) => {
    const categoryData = ProjectWriteCategoryData.find(
      (cat) => cat.category === categoryEnum
    );
    return categoryData ? categoryData.text : categoryEnum;
  };

  // 🔥 실제 사용할 데이터들
  const images = getAllImages();
  const hasMultipleImages = images.length > 1;
  const techNames = getTechNames(); // 🔥 수정된 함수 사용
  const displayWriterImg = getWriterImage(); // 🔥 수정된 함수 사용

  // 캐러셀 네비게이션
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // 🔥 수정된 프로필 페이지로 이동하는 핸들러
  const handleProfileClick = () => {
    const userId = getAuthorId();

    if (userId) {
      navigate(`/members/${userId}/projects`);
    } else {
      alert("사용자 정보를 찾을 수 없습니다.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 🎯 비공개 프로젝트 알림 (작성자가 볼 때만) */}
      {!isPublic && isAuthor && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="text-yellow-600">🔒</div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">
                비공개 프로젝트
              </h4>
              <p className="text-xs text-yellow-700">
                이 프로젝트는 현재 비공개 상태입니다. 다른 사용자들은 볼 수
                없습니다.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* 작성자 정보 */}
      <section className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img
            src={displayWriterImg}
            alt="작성자"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-50"
            onError={(e) => {
              e.currentTarget.src = noImg;
            }}
          />
          <div>
            <button
              onClick={handleProfileClick}
              disabled={DEMO_MODE}
              className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
              title={`${nickname}의 프로필 보기`}
            >
              {nickname}
            </button>
            {/* 수정되면 updatedAt 으로 변경 */}
            <p className="text-xs text-gray-500">
              {Math.abs(new Date(updatedAt).getTime() - new Date(createdAt).getTime()) > 1000
                ? `수정일: ${formatDate(updatedAt)}`
                : `작성일: ${formatDate(createdAt)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          {/* 좋아요 버튼 - 로그인 상태 확인 */}
          <button
            onClick={handleLikeToggle}
            disabled={DEMO_MODE || isLiking || !isLoggedIn()}
            aria-label={DEMO_MODE ? "좋아요 (데모에서 제공하지 않음)" : "프로젝트 좋아요"}
            className={`flex items-center gap-1.5 text-sm transition-colors duration-200 ${
              !isLoggedIn()
                ? "text-gray-400 cursor-not-allowed"
                : isLiked
                ? "text-red-500 hover:text-red-600"
                : "text-gray-600 hover:text-red-500"
            } ${isLiking ? "opacity-50 cursor-pointer" : "cursor-pointer"}`}
            title={!isLoggedIn() ? "로그인이 필요합니다" : ""}
          >
            <div
              className={`transition-transform duration-200 ${
                isLiked ? "scale-110" : "scale-100"
              }`}
            >
              <LikeSVG isLiked={isLiked} size={16} />
            </div>
            <span className="font-medium">{currentLikeCount}</span>
          </button>

          <ViewSVG size={16} />
          <span className="font-medium">{viewCount || 0}</span>
        </div>
      </section>
      {/* 프로젝트 이미지 캐러셀 */}
      {/* 프로젝트 이미지 캐러셀 */}
      <section>
        <div className="relative overflow-hidden rounded-lg bg-gray-100">
          <img
            src={images[currentImageIndex]}
            alt={`${title} - 이미지 ${currentImageIndex + 1}`}
            className="w-full h-52 sm:h-80 object-cover transition-all duration-300"
            onError={(e) => {
              e.currentTarget.src = noImg;
            }}
          />

          {/* 캐러셀 네비게이션 (이미지 여러 개일 때만) */}
          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                aria-label="이전 이미지"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                aria-label="다음 이미지"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* 이미지 인디케이터 */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? "bg-white"
                        : "bg-white bg-opacity-50 hover:bg-opacity-75"
                    }`}
                    aria-label={`이미지 ${index + 1}로 이동`}
                  />
                ))}
              </div>

              {/* 이미지 카운터 */}
              <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* 썸네일 목록 */}
        {hasMultipleImages && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentImageIndex
                    ? "border-blue-500 opacity-100"
                    : "border-gray-200 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`썸네일 ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = noImg;
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </section>
      {/* 프로젝트 제목과 내용 */}
      <section className="space-y-3">
        <h1 className="text-xl font-bold text-gray-900 leading-tight">
          {title || "제목 없음"}
        </h1>
        <div className="text-gray-700 leading-relaxed text-sm">
          {content ? (
            (DEMO_MODE ? projectDisplayText(content) : content).split("\n").map((line, index) => (
              <p key={index} className="mb-2 last:mb-0">
                {line}
              </p>
            ))
          ) : (
            <p className="text-gray-400 italic">내용이 없습니다.</p>
          )}
        </div>
      </section>
      {/* 카테고리 */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
          카테고리
        </h3>
        <div className="flex flex-wrap gap-2">
          {projectCategory ? (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
              {getCategoryDisplayName(projectCategory)}
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
              카테고리 없음
            </span>
          )}
        </div>
      </section>
      {/* 🔥 수정된 기술 스택 섹션 */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-4 bg-green-500 rounded-full"></span>
          기술 스택
        </h3>
        <div className="flex flex-wrap gap-2">
          {techNames && techNames.length > 0 ? (
            techNames.map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100"
              >
                {tech}
              </span>
            ))
          ) : (
            <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
              기술 스택 없음
            </span>
          )}
        </div>
      </section>
      {/* 링크들 */}
      {!DEMO_MODE && <section className="space-y-4">
        {/* GitHub 링크 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <span className="w-1 h-4 bg-gray-800 rounded-full"></span>
            GitHub
          </h3>
          {githubUrl ? (
            <a
              href={
                githubUrl.startsWith("http")
                  ? githubUrl
                  : `https://${githubUrl}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clipRule="evenodd"
                />
              </svg>
              코드 보러가기
            </a>
          ) : (
            <div className="px-4 py-2 bg-gray-100 text-gray-500 text-sm rounded-lg">
              GitHub 링크가 없습니다.
            </div>
          )}
        </div>

        {/* YouTube 링크 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <span className="w-1 h-4 bg-red-500 rounded-full"></span>
            YouTube
          </h3>
          {youtubeUrl ? (
            <a
              href={
                youtubeUrl.startsWith("http")
                  ? youtubeUrl
                  : `https://${youtubeUrl}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              동영상 보기
            </a>
          ) : (
            <div className="px-4 py-2 bg-gray-100 text-gray-500 text-sm rounded-lg">
              YouTube 링크가 없습니다.
            </div>
          )}
        </div>
      </section>}
      {DEMO_MODE && <p className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">가상의 공개 프로젝트입니다. 외부 저장소·영상, 개인 저장, 댓글과 수정은 데모에서 제공하지 않습니다.</p>}
      {/* 수정/삭제 버튼 (로그인한 작성자만 보이도록) */}
      {!DEMO_MODE && isLoggedIn() && isAuthor && (
        <section className="pt-4 border-t border-gray-100">
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              프로젝트 수정
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                isDeleting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              }`}
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {isDeleting ? "삭제 중..." : "프로젝트 삭제"}
            </button>
          </div>
        </section>
      )}
      {/* 로그인하지 않은 경우 안내 메시지 (선택사항) */}
      {!DEMO_MODE && !isLoggedIn() && (
        <section className="pt-4 border-t border-gray-100">
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-3">
              프로젝트를 관리하려면 로그인이 필요합니다
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              로그인하기
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default ProjectModalCard;
