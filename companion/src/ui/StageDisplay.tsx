import type { StageSnapshot } from "../types/stage";
import "./stage-display.css";

export interface StageDisplayProps {
  snapshot: StageSnapshot;
}

const STATUS_COPY: Record<StageSnapshot["status"], string> = {
  live: "Live now",
  stale: "Signal delayed",
  disconnected: "Signal disconnected",
};

export function StageDisplay({ snapshot }: StageDisplayProps) {
  return (
    <section className="stage-display" data-status={snapshot.status}>
      <p className="stage-display__status" aria-live="polite">
        <span className="stage-display__status-dot" aria-hidden="true" />
        <span className="stage-display__status-label">{snapshot.status}</span>
      </p>
      <div className="stage-display__body">
        <p className="stage-display__eyebrow">Active instrument</p>
        <h1 className="stage-display__label">{snapshot.displayLabel}</h1>
        <p className="stage-display__message">{STATUS_COPY[snapshot.status]}</p>
      </div>
    </section>
  );
}
