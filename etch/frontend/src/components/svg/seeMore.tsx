function SeeMore() {
  return (
    <div className="inline-flex cursor-pointer items-center space-x-1 text-blue-600 font-medium text-sm sm:text-base transition-colors group">
      <span>더보기</span>
      <svg
        className="w-4 h-4 transition-transform "
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  );
}

export default SeeMore;
