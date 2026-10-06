import messages from "@messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { DemoLibraryBrowser } from "@/components/organisms/DemoLibraryBrowser/DemoLibraryBrowser";
import { createDemoLibrary } from "@/utils/demoLibrary";

describe("static demo library", () => {
  it("applies playtime filters to cards and restores the shelf when reset", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DemoLibraryBrowser
          games={createDemoLibrary().collection}
          wishlist={false}
        />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show filters" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Longest playtime in minutes" }),
      { target: { value: "45" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    expect(screen.getByRole("heading", { name: "Azul" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Gloomhaven" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    expect(
      screen.getByRole("heading", { name: "Gloomhaven" }),
    ).toBeInTheDocument();
  });

  it("browses and searches without showing account mutation controls", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DemoLibraryBrowser
          games={createDemoLibrary().collection}
          wishlist={false}
        />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Wingspan" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add a game" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark as played" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search games" }), {
      target: { value: "Wingspan" },
    });
    expect(
      screen.getByRole("heading", { name: "Wingspan" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Azul" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search games" }), {
      target: { value: "zzqxvnonexistenttitle" },
    });
    expect(screen.getByText(messages.collection.noMatches)).toBeInTheDocument();
  });
});
