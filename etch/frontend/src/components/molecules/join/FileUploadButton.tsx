import { features } from "../../../config/features";
import type { fileUploadButtonProps } from "../../atoms/button";

function FileUploadButton({
  text,
  onFileSelect,
  accept = "image/*",
}: fileUploadButtonProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  if (!features.uploads) return <p className="text-sm text-gray-500">파일 업로드가 비활성화되어 있습니다.</p>;

  return (
    <div className="flex items-center">
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        {text}
      </label>
    </div>
  );
}

export default FileUploadButton;
