interface JobViewToggleProps {
  currentView: "list" | "calendar";
  onViewChange: (view: "list" | "calendar") => void;
}

export default function JobViewToggle({
  currentView,
  onViewChange,
}: JobViewToggleProps) {
  return (
    <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-1 shadow-inner border border-gray-200 h-10">
      <button
        onClick={() => onViewChange("calendar")}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${
          currentView === "calendar"
            ? "bg-white text-gray-800 shadow-md border border-blue-200"
            : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
        }`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        캘린더
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${
          currentView === "list"
            ? "bg-white text-gray-800 shadow-md border border-blue-200"
            : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
        }`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        리스트
      </button>
    </div>
  );
}
