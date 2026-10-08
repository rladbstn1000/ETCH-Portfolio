export interface ProjectFileUploadProps {
  uploadedFiles: File[];
  onFileUpload: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  thumbnailFile: File | null; // 썸네일 파일 추가
  onThumbnailUpload: (file: File) => void; // 썸네일 업로드 핸들러 추가
  onThumbnailRemove: () => void; // 썸네일 제거 핸들러 추가
  maxFiles: number;
  maxFileSize: number; // bytes
  acceptedTypes: string[];
  disabled?: boolean;
}
export interface FileValidationResult {
  validFiles: File[];
  invalidFiles: File[];
  errors: string[];
}
