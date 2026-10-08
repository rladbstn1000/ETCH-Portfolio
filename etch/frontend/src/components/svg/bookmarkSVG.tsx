interface BookmarkSVGProps {
  filled?: boolean;
  className?: string;
}

const BookmarkSVG = ({ filled = false, className = "w-5 h-5" }: BookmarkSVGProps) => {
  return (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={filled ? 0 : 2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
};

export default BookmarkSVG;
