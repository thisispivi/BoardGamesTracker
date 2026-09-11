import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/molecules/ConfirmDialog/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("submits before the dialog is removed from the document", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async (formData: FormData): Promise<void> => {
      void formData;
    });
    render(
      <ConfirmDialog
        action={action}
        cancelLabel="Cancel"
        confirmLabel="Delete user"
        description="This cannot be undone."
        fields={{ userId: "user-1" }}
        title="Delete this user?"
        trigger={<button type="button">Open deletion dialog</button>}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Open deletion dialog" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete user" }));

    expect(action).toHaveBeenCalledOnce();
    const [formData] = action.mock.calls[0] ?? [];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData?.get("userId")).toBe("user-1");
  });
});
