import { useMemo } from "react";
import type { ReactElement } from "react";

import type { StageLayer, StageSnapshot } from "../types/stage";
import "./stage-display.css";

export interface StageDisplayProps {
  snapshot: StageSnapshot;
}

const STATUS_COPY: Record<StageSnapshot["status"], string> = {
  live: "Live now",
  stale: "Signal delayed",
  disconnected: "Signal disconnected",
};

type InstrumentFamily =
  | "keys"
  | "bass"
  | "drums"
  | "guitar"
  | "strings"
  | "brass"
  | "vocal"
  | "pad"
  | "lead"
  | "fx"
  | "sampler"
  | "utility";

interface FamilyMatch {
  family: InstrumentFamily;
  label: string;
}

export function StageDisplay({ snapshot }: StageDisplayProps) {
  const familyMatch = useMemo(() => resolveFamilyMatch(snapshot), [snapshot]);
  const orderedLayers = useMemo(
    () =>
      snapshot.layers.map((layer) => ({
        ...layer,
        familyMatch: resolveFamilyMatch(layer),
      })),
    [snapshot.layers],
  );

  return (
    <section
      className="stage-display"
      data-family={familyMatch.family}
      data-status={snapshot.status}
    >
      <div className="stage-display__ambient" aria-hidden="true">
        <div
          key={`shock-${snapshot.sequence}`}
          className="stage-display__shockwave"
        />
        <div className="stage-display__beam stage-display__beam--primary" />
        <div className="stage-display__beam stage-display__beam--secondary" />
        <p className="stage-display__ghost">{familyMatch.label}</p>
      </div>
      <header className="stage-display__topbar">
        <p className="stage-display__status" aria-live="polite">
          <span className="stage-display__status-dot" aria-hidden="true" />
          <span className="stage-display__status-label">{snapshot.status}</span>
        </p>
        <p className="stage-display__family">
          <span className="stage-display__family-icon" aria-hidden="true">
            <StageIcon family={familyMatch.family} />
          </span>
          <span className="stage-display__family-label">{familyMatch.label}</span>
        </p>
      </header>
      <div className="stage-display__content">
        <div
          key={`icon-${snapshot.sequence}-${familyMatch.family}`}
          className="stage-display__icon-panel"
          aria-hidden="true"
        >
          <div className="stage-display__icon-frame">
            <StageIcon family={familyMatch.family} />
          </div>
        </div>
        <div className="stage-display__body">
          <p className="stage-display__eyebrow">Active instrument</p>
          <h1 className="stage-display__label">{snapshot.displayLabel}</h1>
          <p className="stage-display__message">
            {STATUS_COPY[snapshot.status]}
          </p>
        </div>
        <aside className="stage-display__stack" aria-label="Selector stack">
          <div className="stage-display__stack-header">
            <p className="stage-display__stack-eyebrow">Selector stack</p>
            <p className="stage-display__stack-count">
              {orderedLayers.length} layers
            </p>
          </div>
          <div className="stage-display__stack-list">
            {orderedLayers.map((layer, index) => (
              <StackLayerRow key={layer.layerKey} index={index} layer={layer} />
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function StackLayerRow({
  index,
  layer,
}: {
  index: number;
  layer: StageLayer & { familyMatch: FamilyMatch };
}): ReactElement {
  return (
    <article
      className="stage-display__stack-item"
      data-active={layer.isActive ? "true" : "false"}
    >
      <p className="stage-display__stack-index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </p>
      <div className="stage-display__stack-copy">
        <p className="stage-display__stack-name">{layer.displayLabel}</p>
        <p className="stage-display__stack-meta">
          <span className="stage-display__stack-family-icon" aria-hidden="true">
            <StageIcon family={layer.familyMatch.family} />
          </span>
          <span>{layer.familyMatch.label}</span>
          {layer.isActive ? (
            <span className="stage-display__stack-active-copy">Current</span>
          ) : null}
        </p>
      </div>
    </article>
  );
}

function resolveFamilyMatch(value: {
  displayLabel: string;
  rawName: string | null;
  selectorName?: string;
}): FamilyMatch {
  const haystack = [
    value.displayLabel,
    value.rawName ?? "",
    value.selectorName ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const families: Array<FamilyMatch & { keywords: string[] }> = [
    {
      family: "drums",
      label: "Drums",
      keywords: ["drum", "kit", "kick", "snare", "hat", "perc", "tom", "clap"],
    },
    {
      family: "bass",
      label: "Bass",
      keywords: ["bass", "sub"],
    },
    {
      family: "keys",
      label: "Keys",
      keywords: [
        "piano",
        "keys",
        "rhodes",
        "wurli",
        "clav",
        "organ",
        "ep",
        "e-piano",
      ],
    },
    {
      family: "guitar",
      label: "Guitar",
      keywords: ["guitar", "gtr", "riff"],
    },
    {
      family: "strings",
      label: "Strings",
      keywords: ["string", "violin", "viola", "cello", "harp"],
    },
    {
      family: "brass",
      label: "Brass",
      keywords: ["brass", "trumpet", "trombone", "horn", "sax"],
    },
    {
      family: "vocal",
      label: "Vocal",
      keywords: ["vocal", "vox", "voice", "choir"],
    },
    {
      family: "pad",
      label: "Pad",
      keywords: ["pad", "wash", "atmos", "texture", "ambient"],
    },
    {
      family: "lead",
      label: "Lead Synth",
      keywords: ["lead", "arp", "pluck", "mono", "synth"],
    },
    {
      family: "fx",
      label: "FX",
      keywords: ["fx", "impact", "riser", "sweep", "noise"],
    },
    {
      family: "sampler",
      label: "Sampler",
      keywords: ["sample", "loop", "chop", "trigger"],
    },
  ];

  const match = families.find(({ keywords }) =>
    keywords.some((keyword) => haystack.includes(keyword)),
  );

  if (match) {
    return match;
  }

  return {
    family: "utility",
    label: "Signal",
  };
}

function StageIcon({ family }: { family: InstrumentFamily }): ReactElement {
  switch (family) {
    case "keys":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <rect x="8" y="16" width="48" height="32" rx="4" />
          <line x1="20" y1="16" x2="20" y2="48" />
          <line x1="32" y1="16" x2="32" y2="48" />
          <line x1="44" y1="16" x2="44" y2="48" />
          <line x1="14" y1="30" x2="50" y2="30" />
        </svg>
      );
    case "bass":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <circle cx="20" cy="32" r="8" />
          <path d="M28 32H50" />
          <path d="M42 24L54 20" />
          <path d="M42 40L54 44" />
        </svg>
      );
    case "drums":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <ellipse cx="32" cy="34" rx="18" ry="10" />
          <path d="M14 34V46" />
          <path d="M50 34V46" />
          <path d="M18 20L28 28" />
          <path d="M46 20L36 28" />
        </svg>
      );
    case "guitar":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <path d="M18 40C18 32 24 26 32 26C40 26 46 32 46 40C46 46 41 50 35 50C26 50 18 48 18 40Z" />
          <path d="M32 26L50 10" />
          <path d="M46 14L54 22" />
        </svg>
      );
    case "strings":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <path d="M24 14C34 18 42 28 42 40C42 48 38 54 32 56" />
          <path d="M24 14C18 20 16 28 16 36C16 44 20 50 28 54" />
          <path d="M22 24H38" />
          <path d="M20 34H40" />
          <path d="M22 44H38" />
        </svg>
      );
    case "brass":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <path d="M12 36H34L46 24V48L34 36" />
          <path d="M46 28H54" />
          <path d="M46 36H56" />
          <path d="M46 44H54" />
        </svg>
      );
    case "vocal":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <rect x="24" y="12" width="16" height="26" rx="8" />
          <path d="M18 30C18 38 24 44 32 44C40 44 46 38 46 30" />
          <path d="M32 44V54" />
          <path d="M24 54H40" />
        </svg>
      );
    case "pad":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <path d="M16 42C16 28 24 18 36 18C44 18 50 24 50 32C50 42 42 48 30 48C22 48 16 46 16 42Z" />
          <path d="M28 20C24 14 26 10 30 8" />
          <path d="M38 18C36 12 38 8 44 6" />
        </svg>
      );
    case "lead":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <path d="M10 42L28 18L38 30L54 10" />
          <path d="M42 10H54V22" />
        </svg>
      );
    case "fx":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <path d="M32 10L38 24L54 24L42 34L46 50L32 40L18 50L22 34L10 24L26 24Z" />
        </svg>
      );
    case "sampler":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <rect x="12" y="12" width="40" height="40" rx="6" />
          <rect x="20" y="20" width="8" height="8" />
          <rect x="36" y="20" width="8" height="8" />
          <rect x="20" y="36" width="8" height="8" />
          <rect x="36" y="36" width="8" height="8" />
        </svg>
      );
    case "utility":
      return (
        <svg viewBox="0 0 64 64" role="presentation">
          <path d="M12 32H24L30 18L38 46L44 32H52" />
        </svg>
      );
  }
}
