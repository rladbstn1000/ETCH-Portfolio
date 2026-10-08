import type { ProjectData } from "../../../../types/project/projectDatas";
import ProjectModalCard from "../../../molecules/project/projectModalCard";

// 🎯 Props 인터페이스 통합 및 onLike 추가
interface Props {
  project: ProjectData;
  onLike?: () => void; // 좋아요 핸들러 추가
}

function ProjectDetailCard({ project, onLike }: Props) {
  // 🔥 ProjectData를 ProjectModalCard props로 변환
  const modalProps = {
    // 🔥 ProjectCardProps에서 필수인 type 속성 추가
    type: "project" as const,

    // 기본 프로젝트 정보
    id: project.id,
    title: project.title,
    content: project.content,
    thumbnailUrl: project.thumbnailUrl,
    youtubeUrl: project.youtubeUrl,
    viewCount: project.viewCount,
    projectCategory: project.projectCategory,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    isDeleted: project.isDeleted,
    githubUrl: project.githubUrl,
    isPublic: project.isPublic,
    likeCount: project.likeCount,
    likedByMe: project.likedByMe,
    nickname: project.nickname,

    // 🔥 작성자 정보 - API 응답 구조에 맞게 매핑
    memberId: project.memberId, // API에서 오는 실제 작성자 ID
    member: project.member || { id: project.memberId || 0 }, // 🔥 기본값 제공
    writerImg: project.profileUrl, // API의 profileUrl을 writerImg로 매핑
    profileUrl: project.profileUrl, // 새로운 prop으로도 전달

    // 🔥 새로운 API 필드들 추가
    techCodes: project.techCodes, // API에서 오는 문자열 배열
    techCategories: project.techCategories, // API에서 오는 카테고리들
    fileUrls: project.fileUrls, // API에서 오는 파일 URL들

    // 🔥 기술 스택 - API 응답 구조에 맞게 매핑
    projectTechs: project.projectTechs ?? [], // 🔥 기본값 빈 배열 제공

    // 🔥 파일 관련 - 확실히 빈 배열로 기본값 제공
    files: project.files ?? [], // 🔥 null/undefined 안전하게 처리

    // 기타 필드들
    commentCount: project.commentCount,
    popularityScore: project.popularityScore,

    // 핸들러
    onLike: onLike,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 🔥 모든 필수 props에 안전한 기본값 제공 */}
      <ProjectModalCard
        {...modalProps}
        files={project.files ?? []}
        projectTechs={project.projectTechs ?? []}
        techCodes={project.techCodes}
        techCategories={project.techCategories}
        fileUrls={project.fileUrls}
        memberId={project.memberId}
        profileUrl={project.profileUrl}
      />
    </div>
  );
}

export default ProjectDetailCard;
