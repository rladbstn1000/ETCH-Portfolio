import { features } from "../../../config/features";
import { useRef, useState } from "react";
import type { ImageProps } from "../../atoms/image";
import defaultProfile from "../../../assets/default-profile.png";
import { updateProfileImage } from "../../../api/memberApi";
import useUserStore from "../../../store/userStore";

const ProfileAvatar = ({
  src,
  alt,
  defaultSrc,
}: ImageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { setMemberInfo, memberInfo } = useUserStore();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const newProfileImageUrl = await updateProfileImage(file);
      
      // 사용자 정보 업데이트
      if (memberInfo) {
        setMemberInfo({
          ...memberInfo,
          profile: newProfileImageUrl
        });
      }
      
      alert('프로필 이미지가 성공적으로 변경되었습니다.');
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error);
      alert('프로필 이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center justify-center w-20 h-20 mx-auto text-lg font-semibold bg-gray-200 rounded-full">
        <img
          src={memberInfo?.profile || src || defaultSrc || defaultProfile}
          alt={alt}
          className="object-cover w-full h-full rounded-full"
        />
      </div>
      <button
        className="absolute w-8 h-8 p-0 bg-gray-100 border border-gray-200 rounded-full cursor-pointer -bottom-1 -right-1 disabled:opacity-50"
        onClick={handleCameraClick}
        disabled={isUploading || !features.uploads}
        title={features.uploads ? "프로필 사진 변경" : "파일 업로드가 비활성화되어 있습니다"}
      >
        {isUploading ? '⏳' : '📷'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ProfileAvatar;
