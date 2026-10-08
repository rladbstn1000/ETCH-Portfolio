import React, { useState } from "react";
import searchIcon from "../../../assets/search.png";
import { useNavigate } from "react-router";
import HeaderButton from "../../molecules/header/headerButton";
import HeaderInput from "../../molecules/header/headerInput";

function HeaderSearch() {
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  const handleChange = (value: string) => {
    setKeyword(value);
  };

  const handleSearch = () => {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword) {
      navigate(`/search?q=${encodeURIComponent(trimmedKeyword)}`);
      setKeyword(""); // 검색 후 입력창 초기화
    }
  };

  const handleSearchClick = () => {
    handleSearch();
  };

  const handleKeyEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch(); // Enter 키로 검색 실행
    }
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-white border border-blue-200 rounded-full hover:border-blue-300 focus-within:border-blue-400 transition-all duration-200">
      <HeaderInput
        value={keyword}
        type="text"
        placeholderText="검색어를 입력하세요"
        onChange={handleChange}
        onKeyEnter={handleKeyEnter}
      />
      <HeaderButton img={searchIcon} onClick={handleSearchClick} />
    </div>
  );
}

export default HeaderSearch;
