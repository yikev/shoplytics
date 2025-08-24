export function expSmooth(series: number[], alpha = 0.4, horizon = 30): number[] {
  if (!series.length) return Array(horizon).fill(0);
  let s = series[0];
  for (let i = 1; i < series.length; i++) s = alpha * series[i] + (1 - alpha) * s;
  return Array(horizon).fill(s);
}

export function quantile(arr: number[], p: number) {
  if (arr.length === 0) return 0;
  const i = Math.max(0, Math.min(arr.length - 1, Math.floor((arr.length - 1) * p)));
  return [...arr].sort((a, b) => a - b)[i];
}

export function bucketizeCustomers(rows: { recency: number; total: number; orders: number }[]) {
  const recArr = rows.map(r => r.recency);
  const totArr = rows.map(r => r.total);
  const ordArr = rows.map(r => r.orders);

  const cut = (v: number, arr: number[]) => {
    const q33 = quantile(arr, 0.33);
    const q66 = quantile(arr, 0.66);
    return v <= q33 ? 0 : v <= q66 ? 1 : 2; // 0=low,1=mid,2=high
  };

  return rows.map(r => ({
    ...r,
    seg_rec: cut(r.recency, recArr),
    seg_tot: cut(r.total, totArr),
    seg_ord: cut(r.orders, ordArr),
  }));
}