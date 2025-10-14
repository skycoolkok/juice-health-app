"use client";

import { NextIntlClientProvider } from "next-intl";

type Props = {
  children: React.ReactNode;
  locale: string;
  // 如果你之後要載入 i18n 訊息，可加上 messages?: Record<string, any>
};

export default function ClientProviders({ children, locale }: Props) {
  return (
    <NextIntlClientProvider locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
