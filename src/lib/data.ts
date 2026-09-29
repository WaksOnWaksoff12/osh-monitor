import { useEffect, useState } from 'react'
export type Answer = 'C' | 'N' | 'NA' | null
export interface Ctx { weather:string; material:string; equipment:string; crewChange:string; overtime:string; interruption:string; stoppage:string; location:string; remarks:string }
export interface Observation {
  id:string; date:string; project:string; area:string; activity:string; crew:string; period:string; observer:string; notes:string
  osh:Record<string,Answer>; output:number|null; laborHours:number|null; workers:number|null; workHours:number|null; accomplishment:string
  ctx:Ctx; demo?:boolean
}
export interface Settings { project:string; location:string; activity:string; crew:string; observer:string; target:number }
export const DEFAULT_SETTINGS:Settings = { project:'', location:'Pampanga', activity:'Masonry / CHB Laying', crew:'', observer:'', target:20 }
// NOTE: The thesis fixes 5 categories x 4 indicators but does NOT list the indicator wording
// ("formulated specifically for the study"). Wording below is an EDITABLE PLACEHOLDER: replace with your Appendix checklist.
export const CATEGORIES = [
  { id:'training', name:'Safety Training & Orientation', items:['Safety orientation / toolbox talk held before work','Crew members attended the orientation','Task-specific safety instructions given','Training / orientation records available'] },
  { id:'ppe', name:'PPE Compliance', items:['Hard hats worn by all crew','Safety footwear worn','Gloves / eye protection worn where needed','PPE in good condition'] },
  { id:'procedures', name:'Workplace Safety Procedures', items:['Safe CHB-laying procedure followed','Scaffolds / ladders set up properly','Materials stacked and stored safely','Work area kept clean and orderly'] },
  { id:'hazard', name:'Hazard Identification & Risk Control', items:['Hazards identified before work started','Barricades / signage / edge protection in place','Controls for falling objects or overhead work','Identified hazards reported and corrected'] },
  { id:'monitoring', name:'Safety Monitoring & Inspection', items:['Supervisor / safety personnel present','Inspection carried out during the shift','Non-compliance corrected promptly','Inspection recorded / documented'] },
].map(c => ({ ...c, items: c.items.map((label, i) => ({ id:`${c.id}-${i+1}`, label })) }))
export const ALL_ITEMS = CATEGORIES.flatMap(c => c.items)
export const TESTS = [
  ['Create new observation','A new observation with a unique Observation ID is created'],['Record observation information','Date, crew, activity, area, period and observer are stored'],
  ['Record OSH checklist','All 20 indicators can be marked Compliant / Non-Compliant / N/A'],['Compute OSH compliance score','Score = Compliant ÷ Applicable × 100'],
  ['Handle N/A items','N/A items are excluded from numerator and denominator'],['Record productivity data','Output (m²), labor-hours and workers are stored'],
  ['Compute masonry productivity','Productivity = Output ÷ Labor-Hours (m²/LH)'],['Record contextual factors','Contextual conditions are stored separately from primary variables'],
  ['Match observation data','OSH and productivity share the same Observation ID'],['Review and save observation','Summary is shown and the observation is saved'],
  ['Retrieve previous observation','Saved observation and its data are displayed correctly'],
]
export function emptyObs(s:Settings):Observation {
  const answers:Record<string,Answer> = {}; ALL_ITEMS.forEach(i => answers[i.id] = null)
  return { id:'', date:new Date().toISOString().slice(0,10), project:s.project, area:'', activity:s.activity, crew:s.crew, period:'08:00–17:00', observer:s.observer, notes:'',
    osh:answers, output:null, laborHours:null, workers:null, workHours:null, accomplishment:'',
    ctx:{ weather:'', material:'', equipment:'', crewChange:'', overtime:'', interruption:'', stoppage:'', location:'', remarks:'' } }
}
export function useLocal<T>(key:string, init:T):[T,(v:T)=>void] {
  const [v,setV] = useState<T>(() => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : init } catch { return init } })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* storage full/blocked */ } }, [key, v])
  return [v, setV]
}
// DEMO DATA — NOT ACTUAL RESEARCH RESULTS. Pseudo-random, generated only to preview the charts.
export function makeDemo():Observation[] {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  return Array.from({ length:12 }, (_, n) => {
    const o = emptyObs(DEFAULT_SETTINGS); o.demo = true; o.id = `DEMO-${String(n+1).padStart(3,'0')}`
    o.date = `2025-01-${String(n+6).padStart(2,'0')}`; o.crew = 'Demo Crew'; o.area = 'Demo Area'; o.project = 'DEMO PROJECT'; o.observer = 'Demo'
    ALL_ITEMS.forEach(i => { const r = rnd(); o.osh[i.id] = r < 0.08 ? 'NA' : r < 0.3 ? 'N' : 'C' })
    o.workers = 5; o.workHours = 8; o.laborHours = 40; o.output = +(40 * (0.5 + rnd() * 0.5)).toFixed(1); return o })
}
