import { useState } from "react";
import ProjectInput from "../../../molecules/project/projectInput";

interface Props {
  onSearch: (searchTerm: string) => void;
}

function ProjectListSearch({ onSearch }: Props) {
  const [keyword, setKeyword] = useState("");

  const handleChange = (value: string) => {
    setKeyword(value);
    // 실시간 검색: 입력할 때마다 검색 실행
    onSearch(value);
  };

  const handleClearSearch = () => {
    setKeyword("");
    onSearch(""); // 검색 초기화
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="relative">
        <ProjectInput
          value={keyword}
          type="text"
          placeholderText="프로젝트, 기술 스택, 개발자 검색..."
          onChange={handleChange}
        />
        {/* 검색어 지우기 버튼 */}
        {keyword && (
          <button
            onClick={handleClearSearch}
            className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {/* 검색 결과 안내 */}
      {keyword && (
        <div className="mt-3 text-sm text-gray-600">'{keyword}' 검색 중...</div>
      )}
    </div>
  );
}

export default ProjectListSearch;
