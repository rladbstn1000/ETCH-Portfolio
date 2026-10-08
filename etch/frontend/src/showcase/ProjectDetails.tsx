import { Link } from "react-router";
import type { ProjectCardProps } from "../components/atoms/card";
import LikeSVG from "../components/svg/likeSVG";
import placeholder from "../assets/public/placeholder.svg";
import FallbackImage from "../components/atoms/fallbackImage";

export default function ProjectDetails(project: ProjectCardProps) {
  return <article className="space-y-5 pb-6 pt-4">
    <FallbackImage src={project.thumbnailUrl} fallback={placeholder} alt="프로젝트 예시 이미지" className="h-44 w-full rounded-xl object-cover" />
    <div><p className="text-xs font-semibold text-blue-600">공개 가상 프로젝트 · {project.projectCategory || "분류 없음"}</p><h2 className="mt-2 text-2xl font-bold leading-snug">{project.title}</h2><p className="mt-3 text-sm text-gray-500">{project.nickname} · {project.createdAt?.slice(0, 10)}</p></div>
    <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{project.content || "등록된 설명이 없습니다. 빈 필드 표시 예시입니다."}</p>
    <div className="flex flex-wrap gap-2">{project.techCodes?.map(code => <span key={code} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{code}</span>)}</div>
    <button aria-label="예시 프로젝트 좋아요" aria-pressed={Boolean(project.likedByMe)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2" onClick={project.onLike}><LikeSVG /> {project.likeCount} · 메모리에서 좋아요</button>
    <p className="text-xs leading-relaxed text-gray-500">가상 자료에는 외부 저장소·동영상·첨부파일이 없습니다. 실제 팀 구현 및 개인 고도화 내용은 <Link to="/process" className="text-blue-700 underline">개발 과정</Link>에서 설명합니다.</p>
  </article>;
}
