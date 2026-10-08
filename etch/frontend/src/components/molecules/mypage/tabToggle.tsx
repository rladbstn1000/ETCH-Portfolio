interface TabToggleProps {
  currentTab: "coverLetter" | "portfolio";
  onTabChange: (tab: "coverLetter" | "portfolio") => void;
}

const TabToggle = ({ currentTab, onTabChange }: TabToggleProps) => {
  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      <button 
        onClick={() => onTabChange("coverLetter")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer ${
          currentTab === "coverLetter"
            ? "bg-white text-black border border-gray-300"
            : "text-gray-600 hover:text-black"
        }`}
      >
        자기소개서
      </button>
      <button 
        onClick={() => onTabChange("portfolio")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer ${
          currentTab === "portfolio"
            ? "bg-white text-black border border-gray-300"
            : "text-gray-600 hover:text-black"
        }`}
      >
        포트폴리오
      </button>
    </div>
  );
};

export default TabToggle;