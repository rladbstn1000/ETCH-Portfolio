interface JobDetailTabsProps {
  activeTab: "details" | "company" | "news";
  onTabChange: (tab: "details" | "company" | "news") => void;
}

export default function JobDetailTabs({
  activeTab,
  onTabChange,
}: JobDetailTabsProps) {
  const tabs = [
    { id: "details", label: "공고상세" },
    { id: "company", label: "기업정보" },
    { id: "news", label: "기업뉴스" },
  ] as const;

  return (
    <div className="flex border-b border-gray-200 bg-gray-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-4 px-6 text-center font-medium transition-all ${
            activeTab === tab.id
              ? "text-blue-600 border-b-2 border-blue-600 bg-white"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
