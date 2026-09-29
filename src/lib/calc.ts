// ALL research calculations live here (single source of truth). Deterministic and transparent.
import { ALL_ITEMS, CATEGORIES, Observation, Answer } from './data'
export interface OshStats { applicable:number; compliant:number; non:number; na:number; unanswered:number; score:number|null }
export function oshStats(osh:Record<string,Answer>, ids = ALL_ITEMS.map(i => i.id)):OshStats {
  let compliant = 0, non = 0, na = 0, unanswered = 0
  ids.forEach(id => { const a = osh[id]; if (a === 'C') compliant++; else if (a === 'N') non++; else if (a === 'NA') na++; else unanswered++ })
  const applicable = compliant + non // N/A is excluded from numerator AND denominator
  return { applicable, compliant, non, na, unanswered, score: applicable > 0 ? (compliant / applicable) * 100 : null }
}
export const categoryStats = (osh:Record<string,Answer>) => CATEGORIES.map(c => ({ ...c, stats: oshStats(osh, c.items.map(i => i.id)) }))
export const productivity = (out:number|null, lh:number|null) => out != null && lh != null && lh > 0 && out >= 0 ? out / lh : null
export const obsScore = (o:Observation) => oshStats(o.osh).score
export const obsProd = (o:Observation) => productivity(o.output, o.laborHours)
// Valid paired observation: identity fields present, all 20 items answered, >=1 applicable item, productivity computable.
export function isValid(o:Observation) {
  const s = oshStats(o.osh)
  return !!(o.date && o.crew && o.activity && o.period && s.unanswered === 0 && s.score !== null && obsProd(o) !== null)
}
export const fmt = (n:number|null, d = 2) => (n == null ? '—' : n.toFixed(d))
const mean = (a:number[]) => a.reduce((x, y) => x + y, 0) / a.length
export function pearson(x:number[], y:number[]):number|null {
  if (x.length < 3) return null
  const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0, syy = 0
  x.forEach((v, i) => { sxy += (v - mx) * (y[i] - my); sxx += (v - mx) ** 2; syy += (y[i] - my) ** 2 })
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy)
}
const ranks = (a:number[]) => a.map(v => { const lt = a.filter(w => w < v).length, eq = a.filter(w => w === v).length; return lt + (eq + 1) / 2 })
export const spearman = (x:number[], y:number[]) => pearson(ranks(x), ranks(y))
export function strength(r:number) { const a = Math.abs(r); return (a < 0.2 ? 'very weak' : a < 0.4 ? 'weak' : a < 0.6 ? 'moderate' : a < 0.8 ? 'strong' : 'very strong') + (r < 0 ? ' negative' : ' positive') }
