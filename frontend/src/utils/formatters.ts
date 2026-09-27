export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds) || seconds <= 0) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const remSecs = (seconds % 60).toFixed(3);
  return `${mins}:${remSecs.padStart(6, '0')}`;
}

export function formatSectorTime(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds) || seconds <= 0) return '--.---';
  return seconds.toFixed(3);
}

export function formatSpeed(kmh: number | null | undefined): string {
  if (kmh == null || isNaN(kmh)) return '---.-';
  return `${kmh.toFixed(1)} km/h`;
}

export function formatG(g: number | null | undefined): string {
  if (g == null || isNaN(g)) return '-.--';
  const sign = g > 0 ? '+' : '';
  return `${sign}${g.toFixed(2)} g`;
}

export function formatPercent(pct: number | null | undefined): string {
  if (pct == null || isNaN(pct)) return '-.-%';
  return `${pct.toFixed(1)}%`;
}
