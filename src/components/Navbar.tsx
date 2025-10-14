"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createSharedPathnamesNavigation } from "next-intl/navigation";

import LanguageSwitch from "@/components/LanguageSwitch";
import { locales, type Locale } from "../app/i18n/config";

const { Link } = createSharedPathnamesNavigation({ locales });

type NavLink = { href: `/${string}` | "/"; labelKey: string };

const NAV_LINKS: readonly NavLink[] = [
  { href: "/", labelKey: "home" },
  { href: "/recipes", labelKey: "recipes" },
  { href: "/my-kitchen", labelKey: "myKitchen" },
  { href: "/rdi-tracker", labelKey: "rdi" }
] as const;

function normalizePathname(pathname: string): string {
  const pattern = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`, "i");
  const withoutLocale = pathname.replace(pattern, "");
  return withoutLocale === "" ? "/" : withoutLocale;
}

export default function Navbar() {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");

  const currentPath = normalizePathname(pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-emerald-800 sm:px-8">
        <Link href="/" locale={locale} className="text-base font-semibold text-emerald-600">
          Juice
        </Link>

        <nav className="hidden gap-4 sm:flex">
          {NAV_LINKS.map(({ href, labelKey }) => {
            const isActive = currentPath === href || (href !== "/" && currentPath.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                locale={locale}
                className={`rounded px-2 py-1 ${
                  isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        <LanguageSwitch ariaLabel={t("language")} />
      </div>
    </header>
  );
}
