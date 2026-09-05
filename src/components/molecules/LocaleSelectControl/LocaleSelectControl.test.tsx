import messages from "@messages/en.json";
import * as Dialog from "@radix-ui/react-dialog";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleSelectControl } from "@/components/molecules/LocaleSelectControl/LocaleSelectControl";

const refresh = vi.fn();
const setLocaleAction = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/server/actions/preferences", () => ({
  setLocaleAction: (formData: FormData) => setLocaleAction(formData),
}));

/**
 * Renders the control inside the English message provider used by every suite.
 *
 * @returns Nothing.
 */
function renderControl(): void {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LocaleSelectControl initialLocale="en" />
    </NextIntlClientProvider>,
  );
}

/**
 * Renders the control inside a modal drawer matching the mobile navigation.
 *
 * @returns Nothing.
 */
function renderDrawerControl(): void {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Content>
            <Dialog.Title>Menu</Dialog.Title>
            <LocaleSelectControl initialLocale="en" />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </NextIntlClientProvider>,
  );
}

describe("LocaleSelectControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the stored language on a dropdown trigger", () => {
    renderControl();
    expect(
      screen.getByRole("combobox", { name: messages.locale.language }),
    ).toHaveTextContent("English");
  });

  it("persists the language picked from the dropdown", async () => {
    const user = userEvent.setup();
    renderControl();

    await user.click(
      screen.getByRole("combobox", { name: messages.locale.language }),
    );
    await user.click(await screen.findByRole("option", { name: "Italiano" }));

    await waitFor(() => expect(setLocaleAction).toHaveBeenCalledTimes(1));
    expect(setLocaleAction.mock.calls[0]?.[0].get("locale")).toBe("it");
    expect(refresh).toHaveBeenCalled();
  });

  it("persists the language picked inside the mobile navigation drawer", async () => {
    const user = userEvent.setup();
    renderDrawerControl();

    await user.click(
      screen.getByRole("combobox", { name: messages.locale.language }),
    );
    await user.click(await screen.findByRole("option", { name: "Italiano" }));

    await waitFor(() => expect(setLocaleAction).toHaveBeenCalledTimes(1));
    expect(setLocaleAction.mock.calls[0]?.[0].get("locale")).toBe("it");
  });
});
