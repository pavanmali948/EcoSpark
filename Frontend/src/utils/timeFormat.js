/** India Standard Time — wall-clock used for slot display. */
export const IST = 'Asia/Kolkata';

const time12Opts = {
  timeZone: IST,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};

export function formatIsoInstantIST(isoLike) {
  if (isoLike == null || isoLike === '') return '—';
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', time12Opts).format(d);
}

export function formatTimeRangeIST(startIso, endIso) {
  const a = formatIsoInstantIST(startIso);
  const b = formatIsoInstantIST(endIso);
  if (a === '—' || b === '—') return '—';
  return `${a} – ${b}`;
}

/** "HH:mm:ss" or "HH:mm" stored as local wall time → 12-hour AM/PM (matches admin slot configuration). */
export function formatWallClockTo12h(hmsLike) {
  const s = String(hmsLike || '').trim();
  if (!s.includes(':')) return '—';
  const [hhRaw, mmRaw] = s.split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return '—';
  const p = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${p}`;
}

export function formatDateIST(isoLike) {
  if (isoLike == null || isoLike === '') return '—';
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
