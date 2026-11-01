import Link from "next/link";
import Logo from "./Logo";
import SettingsButton from "./SettingsButton";

const NAV = [
  { href: "/#features", label: "功能" },
  { href: "/#how", label: "運作方式" },
  { href: "/#principles", label: "分析原則" },
  { href: "/#faq", label: "常見問題" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <SettingsButton />
          <Link
            href="/analyst"
            className="group inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink transition hover:bg-white"
          >
            開始分析
            <span className="transition group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
