import { useCallback, useEffect, useRef, useState } from "react";

export interface FullscreenStageMode {
  stageElementRef: React.RefObject<HTMLElement | null>;
  isSupported: boolean;
  isFullscreen: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
}

export function useFullscreenStageMode(): FullscreenStageMode {
  const stageElementRef = useRef<HTMLElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === stageElementRef.current);
    };

    handleFullscreenChange();
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = useCallback(async () => {
    const element = stageElementRef.current;

    if (!element?.requestFullscreen) {
      return;
    }

    await element.requestFullscreen();
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (!document.exitFullscreen) {
      return;
    }

    await document.exitFullscreen();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement === stageElementRef.current) {
      await exitFullscreen();
      return;
    }

    await enterFullscreen();
  }, [enterFullscreen, exitFullscreen]);

  return {
    stageElementRef,
    isSupported: Boolean(document.fullscreenEnabled),
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
