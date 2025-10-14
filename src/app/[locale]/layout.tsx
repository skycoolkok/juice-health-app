import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";

import Navbar from "@/components/Navbar";
import { locales, type Locale } from "../i18n/config";

export function generateStaticParams() {
  return locales.map((locale: Locale) => ({ locale }));
}

type Props = {
  children: ReactNode;
  params: { locale: Locale };
};

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-10 sm:px-8">
        {children}
      </main>
    </NextIntlClientProvider>
  );
}
