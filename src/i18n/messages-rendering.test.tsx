import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { describe, expect, it } from "vitest";

import english from "../../messages/en.json";
import italian from "../../messages/it.json";

function MessageProbe({ count, minutes }: { count: number; minutes: number }) {
  const t = useTranslations();
  return (
    <>
      <p>{t("collection.gameCount", { count })}</p>
      <p>
        {t("common.duration", {
          hours: Math.floor(minutes / 60),
          minutes: minutes % 60,
        })}
      </p>
    </>
  );
}

describe("next-intl message rendering", () => {
  it("renders English ICU plurals and durations", () => {
    render(
      <NextIntlClientProvider locale="en" messages={english}>
        <MessageProbe count={2} minutes={90} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("2 games")).toBeInTheDocument();
    expect(screen.getByText("1 h 30 min")).toBeInTheDocument();
  });

  it("renders Italian ICU plurals and durations", () => {
    render(
      <NextIntlClientProvider locale="it" messages={italian}>
        <MessageProbe count={1} minutes={45} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("1 gioco")).toBeInTheDocument();
    expect(screen.getByText("45 min")).toBeInTheDocument();
  });
});
