import { StageDisplay } from "./ui/StageDisplay";
import type { StageSnapshot } from "./types/stage";

const MOCK_SNAPSHOTS: readonly StageSnapshot[] = [
  {
    selectorName: "Main Selector",
    layerKey: "main-selector:1",
    rawName: "Concert Grand",
    displayLabel: "Piano Intro",
    status: "live",
    sequence: 14,
    occurredAt: "2026-03-07T12:00:00.000Z",
    updatedAt: "2026-03-07T12:00:00.000Z",
  },
  {
    selectorName: "Main Selector",
    layerKey: "main-selector:2",
    rawName: "Noise Lead",
    displayLabel: "Noise Lead",
    status: "stale",
    sequence: 15,
    occurredAt: "2026-03-07T12:00:03.000Z",
    updatedAt: "2026-03-07T12:00:06.000Z",
  },
  {
    selectorName: "Main Selector",
    layerKey: "main-selector:3",
    rawName: "Tape Choir",
    displayLabel: "Choir Pad",
    status: "disconnected",
    sequence: 16,
    occurredAt: "2026-03-07T12:00:06.000Z",
    updatedAt: "2026-03-07T12:00:10.000Z",
  },
];

function App() {
  return (
    <StageDisplay snapshot={MOCK_SNAPSHOTS[0]} />
  );
}

export default App;
