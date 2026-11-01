import Link from "next/link";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <rect width="28" height="28" rx="8" className="fill-accent" />
      <path d="M8 9v10M14 6v16M20 11v8" stroke="#0a0d12" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="6.5" y="11" width="3" height="5" rx="1" fill="#0a0d12" />
      <rect x="12.5" y="9" width="3" height="9" rx="1" fill="#0a0d12" />
      <rect x="18.5" y="13" width="3" height="4" rx="1" fill="#0a0d12" />
    </svg>
  );
}

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <LogoMark />
      <span className="text-[17px]">Candle</span>
    </Link>
  );
}
