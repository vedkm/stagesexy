import { StageDisplay } from "./ui/StageDisplay";
import { useFullscreenStageMode } from "./ui/useFullscreenStageMode";
import { useStageStream } from "./ui/useStageStream";

function App() {
  const { isFullscreen, isSupported, stageElementRef, toggleFullscreen } =
    useFullscreenStageMode();
  const { snapshot } = useStageStream();

  return (
    <div className="stage-shell" ref={stageElementRef}>
      <button
        className="stage-shell__fullscreen-toggle"
        type="button"
        onClick={() => void toggleFullscreen()}
        disabled={!isSupported}
      >
        {isFullscreen ? "Exit Stage Mode" : "Enter Stage Mode"}
      </button>
      <StageDisplay snapshot={snapshot} />
    </div>
  );
}

export default App;
