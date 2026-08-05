/* Hand-drawn SVG charts. No charting library, on purpose. */

import type { ShotSample, TimelinePoint } from './engine';

interface ScatterProps {
  shots: ShotSample[];
  hitLabel: string;
  missLabel: string;
  radiiLabel: string;
}

export function Scatter({ shots, hitLabel, missLabel, radiiLabel }: ScatterProps) {
  const size = 260;
  const mid = size / 2;
  // Scale to the 90th percentile, not the worst shot: one wild miss should not
  // squash the cluster that actually tells you something. Outliers get pinned
  // to the edge at low opacity so they are still visible.
  const radii = shots.map((shot) => Math.hypot(shot.dx, shot.dy)).sort((a, b) => a - b);
  const p90 = radii.length ? radii[Math.min(radii.length - 1, Math.floor(radii.length * 0.9))]! : 1;
  const span = Math.min(8, Math.max(1.6, p90 * 1.25));
  const scale = (mid - 14) / span;

  return (
    <div className="ar-chart ar-chart-square">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${hitLabel} / ${missLabel}`}>
        <rect x="0" y="0" width={size} height={size} fill="rgba(255,255,255,0.015)" />
        {[1, 2, 3, 4].map((ring) =>
          ring * scale < mid - 6 ? (
            <circle
              key={ring}
              cx={mid}
              cy={mid}
              r={ring * scale}
              fill="none"
              stroke={ring === 1 ? 'rgba(255,70,85,0.75)' : 'rgba(140,165,185,0.16)'}
              strokeDasharray={ring === 1 ? undefined : '3 4'}
              strokeWidth={ring === 1 ? 1.5 : 1}
            />
          ) : null,
        )}
        <line x1={mid} y1="8" x2={mid} y2={size - 8} stroke="rgba(140,165,185,0.2)" strokeWidth="1" />
        <line x1="8" y1={mid} x2={size - 8} y2={mid} stroke="rgba(140,165,185,0.2)" strokeWidth="1" />
        {shots.map((shot, i) => {
          const distance = Math.hypot(shot.dx, shot.dy);
          const outside = distance > span;
          const squeeze = outside ? span / distance : 1;
          return (
            <circle
              key={i}
              cx={mid + shot.dx * squeeze * scale}
              cy={mid - shot.dy * squeeze * scale}
              r={outside ? 2 : 2.6}
              fillOpacity={outside ? 0.35 : 1}
              fill={shot.hit ? 'rgba(0,255,156,0.85)' : 'rgba(255,120,130,0.75)'}
            />
          );
        })}
      </svg>
      <p className="ar-chart-foot">
        <span className="ar-key ar-key-hit" /> {hitLabel}
        <span className="ar-key ar-key-miss" /> {missLabel}
        <span className="ar-chart-scale">±{span.toFixed(1)} {radiiLabel}</span>
      </p>
    </div>
  );
}

export function Histogram({ values, unit }: { values: number[]; unit: string }) {
  const width = 300;
  const height = 150;
  if (values.length < 2) return <p className="ar-empty">—</p>;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const bins = Math.min(14, Math.max(5, Math.round(Math.sqrt(values.length))));
  const spread = Math.max(1, max - min);
  const counts = new Array<number>(bins).fill(0);
  for (const value of values) {
    const index = Math.min(bins - 1, Math.floor(((value - min) / spread) * bins));
    counts[index] = (counts[index] ?? 0) + 1;
  }
  const peak = Math.max(...counts);
  const barWidth = (width - 24) / bins;

  return (
    <div className="ar-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="distribution">
        <line x1="12" y1={height - 22} x2={width - 12} y2={height - 22} stroke="rgba(140,165,185,0.28)" />
        {counts.map((count, i) => {
          const barHeight = peak ? ((height - 42) * count) / peak : 0;
          return (
            <rect
              key={i}
              x={12 + i * barWidth + 1}
              y={height - 22 - barHeight}
              width={Math.max(1, barWidth - 2)}
              height={barHeight}
              fill="rgba(255,70,85,0.62)"
            />
          );
        })}
        <text x="12" y={height - 7} className="ar-axis">
          {Math.round(min)}{unit}
        </text>
        <text x={width - 12} y={height - 7} textAnchor="end" className="ar-axis">
          {Math.round(max)}{unit}
        </text>
      </svg>
    </div>
  );
}

export function Timeline({ points, scoreLabel, accLabel }: { points: TimelinePoint[]; scoreLabel: string; accLabel: string }) {
  const width = 300;
  const height = 150;
  if (points.length < 2) return <p className="ar-empty">—</p>;

  const last = points[points.length - 1]!;
  const maxT = Math.max(1, last.t);
  const maxScore = Math.max(1, ...points.map((p) => p.score));
  const x = (t: number) => 12 + ((width - 24) * t) / maxT;
  const yScore = (v: number) => height - 22 - ((height - 42) * v) / maxScore;
  const yAcc = (v: number) => height - 22 - (height - 42) * Math.min(1, v);

  const path = (fn: (p: TimelinePoint) => number) =>
    points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${fn(p).toFixed(1)}`).join(' ');

  return (
    <div className="ar-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="timeline">
        <line x1="12" y1={height - 22} x2={width - 12} y2={height - 22} stroke="rgba(140,165,185,0.28)" />
        <path d={path((p) => yAcc(p.accuracy))} fill="none" stroke="rgba(0,255,156,0.55)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={path((p) => yScore(p.score))} fill="none" stroke="rgba(255,70,85,0.95)" strokeWidth="2" />
        <text x="12" y={height - 7} className="ar-axis">0s</text>
        <text x={width - 12} y={height - 7} textAnchor="end" className="ar-axis">
          {Math.round(maxT / 1000)}s
        </text>
      </svg>
      <p className="ar-chart-foot">
        <span className="ar-key ar-key-score" /> {scoreLabel}
        <span className="ar-key ar-key-acc" /> {accLabel}
      </p>
    </div>
  );
}

export interface CompareRow {
  label: string;
  value: number;
  accent?: boolean;
}

export function Compare({ rows }: { rows: CompareRow[] }) {
  const peak = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="ar-compare">
      {rows.map((row) => (
        <div className="ar-compare-row" key={row.label}>
          <span className="ar-compare-label">{row.label}</span>
          <span className="ar-compare-track">
            <span
              className={row.accent ? 'ar-compare-fill ar-compare-fill-hot' : 'ar-compare-fill'}
              style={{ width: `${(row.value / peak) * 100}%` }}
            />
          </span>
          <span className="ar-compare-value">{Math.round(row.value).toLocaleString('en-US')}</span>
        </div>
      ))}
    </div>
  );
}
