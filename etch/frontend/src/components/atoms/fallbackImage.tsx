import { useEffect, useState } from "react";

export default function FallbackImage({ src, fallback, alt, className = "" }: { src?: string; fallback: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => { setFailed(false); setUnavailable(false); }, [src, fallback]);
  if (unavailable) return <div role="img" aria-label={`${alt} 없음`} className={`flex items-center justify-center bg-gray-100 text-sm text-gray-500 ${className}`}>이미지 없음</div>;
  const displayed = failed || !src ? fallback : src;
  return <img src={displayed} alt={alt} className={className} onError={() => { if (displayed === fallback) setUnavailable(true); else setFailed(true); }} />;
}
