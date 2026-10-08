function StackSVG() {
  {
    return (
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {/* 중앙 코어 */}
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />

          {/* 기술 스택을 나타내는 연결 노드들 */}
          <circle
            cx="7"
            cy="7"
            r="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />

          <circle
            cx="17"
            cy="7"
            r="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />

          <circle
            cx="7"
            cy="17"
            r="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />

          <circle
            cx="17"
            cy="17"
            r="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />

          {/* 중앙에서 각 노드로 연결하는 선들 */}
          <line
            x1="12"
            y1="12"
            x2="7"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          <line
            x1="12"
            y1="12"
            x2="17"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          <line
            x1="12"
            y1="12"
            x2="7"
            y2="17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          <line
            x1="12"
            y1="12"
            x2="17"
            y2="17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        </svg>
      </div>
    );
  }
}

export default StackSVG;
