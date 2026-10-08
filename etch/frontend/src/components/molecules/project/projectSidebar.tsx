import type { ProjectSidebarInventory } from "../../../types/projectSidebarType";

interface CheckboxProps {
  sidebarData: ProjectSidebarInventory[];
  onSortChange: (checked: boolean, value: string) => void;
  onChange: (checked: boolean, value: string) => void;
}

function ProjectSidebar({
  sidebarData,
  onSortChange,
  onChange,
}: CheckboxProps) {
  const fieldItems = sidebarData.filter((item) => item.type === "field");
  const sortItems = sidebarData.filter((item) => item.type === "sort");

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* 개발 분야 섹션 - 체크박스 (하나만 선택 가능) */}
      <section className="space-y-3">
        <h3 className="text-md font-semibold text-gray-800 pb-2 border-b border-gray-200">
          개발 분야
        </h3>
        <div className="space-y-2">
          {fieldItems.map((item) => (
            <label
              key={item.value}
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => {
                  onChange(e.target.checked, item.value);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{item.list}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 정렬 섹션 */}
      <section className="space-y-3">
        <h3 className="text-md font-semibold text-gray-800 pb-2 border-b border-gray-200">
          정렬
        </h3>
        <div className="space-y-2">
          {sortItems.map((item) => (
            <label
              key={item.value}
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <input
                type="radio"
                name="sort"
                value={item.value}
                checked={item.checked}
                onChange={() => {
                  onSortChange(true, item.value);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{item.list}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProjectSidebar;
