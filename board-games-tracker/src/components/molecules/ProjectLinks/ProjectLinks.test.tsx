import messages from "@messages/en.json";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { ProjectLinks } from "@/components/molecules/ProjectLinks/ProjectLinks";

describe("ProjectLinks", () => {
  it("opens both destinations in a new context without a referrer", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProjectLinks />
      </NextIntlClientProvider>,
    );

    const repository = screen.getByRole("link", {
      name: "Source code on GitHub",
    });
    const maintainer = screen.getByRole("link", {
      name: "Website of the maintainer",
    });

    expect(repository).toHaveAttribute(
      "href",
      "https://github.com/thisispivi/BoardGamesTracker",
    );
    expect(maintainer).toHaveAttribute("href", "https://linktree.pivi.dev/");
    for (const link of [repository, maintainer]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
