import { useState, useEffect } from "react";
import type { ProjectSidebarInventory } from "../../../../types/projectSidebarType";
import ProjectSidebar from "../../../molecules/project/projectSidebar";

interface Props {
  ProjectSidebarType: ProjectSidebarInventory[];
  onCategoryFilter: (category: string) => void;
  onSortChange: (sortType: string) => void;
}

function ProjectListSidebar({
  ProjectSidebarType,
  onCategoryFilter,
  onSortChange,
}: Props) {
  const [sidebarData, setSidebarData] =
    useState<ProjectSidebarInventory[]>(ProjectSidebarType);

  // 상태 변경 후 필터링 적용
  useEffect(() => {
    // field 타입에서 선택된 카테고리 찾기
    const checkedFieldItems = sidebarData.filter(
      (item) => item.type === "field" && item.checked
    );

    if (checkedFieldItems.length > 0) {
      onCategoryFilter(checkedFieldItems[0].value);
    } else {
      // field 항목이 있는데 선택된 게 없을 때만 "ALL" 호출
      const hasFieldItems = sidebarData.some((item) => item.type === "field");
      if (hasFieldItems) {
        onCategoryFilter("ALL");
      }
    }
  }, [sidebarData, onCategoryFilter]);

  // 정렬 처리 - 간단하게 수정
  useEffect(() => {
    const checkedSortItems = sidebarData.filter(
      (item) => item.type === "sort" && item.checked
    );

    if (checkedSortItems.length > 0) {
      onSortChange(checkedSortItems[0].value);
    }
  }, [sidebarData, onSortChange]);

  // 체크박스 변경 핸들러
  const handleChange = (checked: boolean, value: string) => {
    setSidebarData((prevData) =>
      prevData.map((item) => {
        if (item.value === value) {
          return { ...item, checked: checked };
        }

        // field 타입의 경우 단일 선택 (다른 field들은 해제)
        if (item.type === "field" && checked) {
          const clickedItem = prevData.find((p) => p.value === value);
          if (clickedItem?.type === "field") {
            return { ...item, checked: false };
          }
        }

        return item;
      })
    );
  };

  // 정렬 변경 핸들러 - 비동기 처리로 수정
  const handleSortChange = (checked: boolean, value: string) => {
    if (checked) {
      // 즉시 UI 업데이트
      setSidebarData((prevData) =>
        prevData.map((item) =>
          item.type === "sort"
            ? { ...item, checked: item.value === value }
            : item
        )
      );

      // 다음 프레임에서 콜백 실행
      requestAnimationFrame(() => {
        onSortChange(value);
      });
    }
  };

  // 필터 초기화 함수
  const resetFilters = () => {
    setSidebarData((prevData) =>
      prevData.map((item) => ({ ...item, checked: false }))
    );
  };

  return (
    <div className="space-y-4">
      {/* 필터 초기화 버튼 */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">필터</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          초기화
        </button>
      </div>

      <ProjectSidebar
        sidebarData={sidebarData}
        onChange={handleChange}
        onSortChange={handleSortChange}
      />
    </div>
  );
}

export default ProjectListSidebar;
