interface LikeSVGProps {
  isLiked?: boolean;
  size?: number;
  className?: string;
}

function LikeSVG({ isLiked = false, size = 22, className = "" }: LikeSVGProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M41.6802 9.21975C40.6587 8.19775 39.4459 7.38704 38.1109 6.83391C36.776 6.28079 35.3452 5.99609 33.9002 5.99609C32.4553 5.99609 31.0244 6.28079 29.6895 6.83391C28.3546 7.38704 27.1418 8.19775 26.1202 9.21975L24.0002 11.3397L21.8802 9.21975C19.8169 7.15636 17.0183 5.99716 14.1002 5.99716C11.1822 5.99716 8.38362 7.15636 6.32024 9.21975C4.25685 11.2831 3.09766 14.0817 3.09766 16.9997C3.09766 19.9178 4.25685 22.7164 6.32024 24.7797L24.0002 42.4597L41.6802 24.7797C42.7022 23.7582 43.5129 22.5454 44.0661 21.2105C44.6192 19.8755 44.9039 18.4447 44.9039 16.9997C44.9039 15.5548 44.6192 14.124 44.0661 12.789C43.5129 11.4541 42.7022 10.2413 41.6802 9.21975Z"
        fill={isLiked ? "#EF4444" : "none"}
        stroke={isLiked ? "#EF4444" : "#9CA3AF"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default LikeSVG;
