// KES 4500 -> "4,500" — plain string interpolation had no thousands
// separator, which reads badly for the larger per-kg prices some crops hit.
export const formatKes = (n) => {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('en-KE').format(n);
};
