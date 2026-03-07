import { createElement } from "react";
import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFullscreenStageMode } from "./useFullscreenStageMode";

function FullscreenHarness() {
  const { isFullscreen, isSupported, stageElementRef, toggleFullscreen } =
    useFullscreenStageMode();

  return createElement(
    "div",
    undefined,
    createElement(
      "section",
      { ref: stageElementRef },
      createElement("h1", undefined, "Stage mode"),
    ),
    createElement(
      "button",
      { type: "button", onClick: () => void toggleFullscreen() },
      isFullscreen ? "Exit Fullscreen Stage Mode" : "Enter Fullscreen Stage Mode",
    ),
    createElement("p", undefined, isSupported ? "fullscreen supported" : "fullscreen unsupported"),
  );
}

describe("useFullscreenStageMode", () => {
  it("requests fullscreen on the stage element", async () => {
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true,
    });

    const requestFullscreen = vi.fn(async function requestFullscreen(
      this: HTMLElement,
    ) {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: this,
      });
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    const { result } = renderHook(() => useFullscreenStageMode());
    const element = document.createElement("section");
    element.requestFullscreen = requestFullscreen;
    result.current.stageElementRef.current = element;

    await act(async () => {
      await result.current.enterFullscreen();
    });

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(result.current.isFullscreen).toBe(true);
  });

  it("toggles the shell control between enter and exit", async () => {
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true,
    });

    const requestFullscreen = vi.fn(async function requestFullscreen(
      this: HTMLElement,
    ) {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: this,
      });
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    const exitFullscreen = vi.fn(async () => {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null,
      });
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: exitFullscreen,
    });

    render(createElement(FullscreenHarness));

    const stageMode = screen.getByRole("heading", { name: "Stage mode" }).closest(
      "section",
    );

    if (!stageMode) {
      throw new Error("Expected fullscreen stage section to exist.");
    }

    stageMode.requestFullscreen = requestFullscreen;

    await act(async () => {
      screen.getByRole("button", { name: "Enter Fullscreen Stage Mode" }).click();
    });

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: "Exit Fullscreen Stage Mode" }),
    ).toBeInTheDocument();

    await act(async () => {
      screen.getByRole("button", { name: "Exit Fullscreen Stage Mode" }).click();
    });

    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: "Enter Fullscreen Stage Mode" }),
    ).toBeInTheDocument();
  });
});
