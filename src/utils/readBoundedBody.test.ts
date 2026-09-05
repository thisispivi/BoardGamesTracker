import { describe, expect, it, vi } from "vitest";

import { BodyTooLargeError, readBoundedBody } from "@/utils/readBoundedBody";

describe("readBoundedBody", () => {
  it("joins chunks at the exact limit and releases the reader", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3]));
        controller.close();
      },
    });
    await expect(readBoundedBody(body, 3)).resolves.toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(body.locked).toBe(false);
  });

  it("cancels chunked data as soon as it exceeds the limit", async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(5));
      },
      cancel,
    });
    await expect(readBoundedBody(body, 4)).rejects.toBeInstanceOf(
      BodyTooLargeError,
    );
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });

  it("preserves a read failure and releases an errored stream", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("connection closed"));
      },
    });
    await expect(readBoundedBody(body, 10)).rejects.toThrow(
      "connection closed",
    );
    expect(body.locked).toBe(false);
  });

  it("accepts an absent body as empty", async () => {
    await expect(readBoundedBody(null, 10)).resolves.toEqual(new Uint8Array());
  });
});
