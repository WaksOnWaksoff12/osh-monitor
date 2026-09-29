import { useEffect, useMemo, useState, ReactNode } from 'react'
import { LayoutDashboard, ClipboardCheck, ShieldCheck, Gauge, BarChart3, FlaskConical, Settings as Cog, Plus, Search, Bell, HardHat, Pencil, Trash2, Copy, Eye, CheckCircle, TriangleAlert, Menu, ChevronLeft, ChevronRight, Users, Target, Activity, Info } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Observation, Settings, DEFAULT_SETTINGS, CATEGORIES, ALL_ITEMS, TESTS, emptyObs, useLocal, makeDemo, Answer } from './lib/data'
import { oshStats, categoryStats, productivity, obsScore, obsProd, isValid, fmt, pearson, spearman, strength } from './lib/calc'

type Page = 'dash'|'records'|'new'|'checklist'|'prod'|'analytics'|'test'|'settings'
const NAV:{id:Page;label:string;icon:any}[] = [
  {id:'dash',label:'Dashboard',icon:LayoutDashboard},{id:'records',label:'All Observations',icon:ClipboardCheck},{id:'new',label:'New Observation',icon:Plus},
  {id:'checklist',label:'OSH Checklist',icon:ShieldCheck},{id:'prod',label:'Productivity',icon:Gauge},{id:'analytics',label:'Analytics',icon:BarChart3},
  {id:'test',label:'Functional Testing',icon:FlaskConical},{id:'settings',label:'Settings',icon:Cog}]
const Badge = ({t,c}:{t:string;c:'g'|'r'|'b'|'y'|'n'}) => <span className={`badge b-${c}`}>{t}</span>
const Stat = ({icon:I,label,value}:{icon:any;label:string;value:string}) => <div className="card stat"><div className="ic"><I size={22}/></div><div><b>{value}</b><small>{label}</small></div></div>
const Empty = ({text,children}:{text:string;children?:ReactNode}) => <div className="empty"><Info size={32}/><p>{text}</p>{children}</div>
const DemoBanner = () => <div className="banner"><TriangleAlert size={16}/><b>DEMO DATA — NOT ACTUAL RESEARCH RESULTS.</b> Remove it in Settings before entering real data.</div>

export default function App() {
  const [obs, setObs] = useLocal<Observation[]>('osh.obs', [])
  const [settings, setSettings] = useLocal<Settings>('osh.settings', DEFAULT_SETTINGS)
  const [tests, setTests] = useLocal<Record<number,{actual:string;status:string}>>('osh.tests', {})
  const [page, setPage] = useState<Page>('dash'); const [editing, setEditing] = useState<Observation|null>(null); const [viewing, setViewing] = useState<Observation|null>(null)
  const [col, setCol] = useState(false); const [open, setOpen] = useState(false); const [toast, setToast] = useState(''); const [q, setQ] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t) }, [])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2800); return () => clearTimeout(t) } }, [toast])
  const go = (p:Page) => { if (p !== 'new') setEditing(null); setPage(p); setOpen(false) }
  const save = (o:Observation) => { setObs(obs.some(x => x.id === o.id) ? obs.map(x => x.id === o.id ? o : x) : [...obs, o]); setToast(`Observation ${o.id} saved`); setEditing(null); setPage('records') }
  const del = (o:Observation) => { if (window.confirm(`Delete ${o.id}? This cannot be undone.`)) { setObs(obs.filter(x => x.id !== o.id)); setToast('Observation deleted') } }
  const dup = (o:Observation) => { const id = newId(o.date, obs); setObs([...obs, { ...o, id }]); setToast(`Duplicated as ${id}`) }
  const hasDemo = obs.some(o => o.demo)
  const title = NAV.find(n => n.id === page)!.label
  return <div className="app">
    <aside className={`side ${col ? 'c' : ''} ${open ? 'open' : ''}`}>
      <div className="logo"><span className="mk"><HardHat size={22}/></span><span className="lbl">OSH Monitor<br/><small style={{fontWeight:400,color:'#94a3b8'}}>Masonry Productivity</small></span></div>
      <nav className="nav">{NAV.map(n => <button key={n.id} title={n.label} className={page === n.id ? 'on' : ''} onClick={() => go(n.id)}><n.icon size={20}/><span className="lbl">{n.label}</span></button>)}</nav>
      <div className="status lbl"><span className="dot"/>Monitoring Active<br/><small>{settings.project || 'No project set'}</small></div>
      <button className="icon-btn" style={{color:'#94a3b8'}} onClick={() => setCol(!col)} aria-label="Collapse sidebar">{col ? <ChevronRight/> : <ChevronLeft/>}</button>
    </aside>
    <div className="main">
      <header className="head"><button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Menu"><Menu/></button><h1>{title}</h1>
        <div style={{position:'relative'}}><input placeholder="Search observations…" value={q} onChange={e => { setQ(e.target.value); setPage('records') }}/></div>
        <button className="icon-btn" title="Notifications"><Bell size={20}/></button>
        <Badge t={settings.project || 'No project'} c="b"/><Badge t={settings.observer || 'Observer'} c="n"/></header>
      <div className="page">
        {hasDemo && page !== 'settings' && <DemoBanner/>}
        {loading ? <div className="grid g4"><div className="sk"/><div className="sk"/><div className="sk"/><div className="sk"/></div> : <>
          {page === 'dash' && <Dashboard obs={obs} s={settings} go={go}/>}
          {page === 'records' && <Records obs={obs} q={q} view={setViewing} del={del} dup={dup} edit={o => { setEditing(o); setPage('new') }} go={go}/>}
          {page === 'new' && <ObsForm key={editing?.id || 'new'} init={editing} obs={obs} s={settings} onSave={save} onCancel={() => go('records')}/>}
          {page === 'checklist' && <Checklist obs={obs}/>}
          {page === 'prod' && <Productivity obs={obs}/>}
          {page === 'analytics' && <Analytics obs={obs}/>}
          {page === 'test' && <Testing tests={tests} set={setTests}/>}
          {page === 'settings' && <SettingsPage s={settings} set={v => { setSettings(v); setToast('Settings saved') }} hasDemo={hasDemo}
            loadDemo={() => { setObs([...obs.filter(o => !o.demo), ...makeDemo()]); setToast('Demo data loaded') }} clearDemo={() => { setObs(obs.filter(o => !o.demo)); setToast('Demo data removed') }}/>}
        </>}
      </div>
    </div>
    {viewing && <Details o={viewing} close={() => setViewing(null)}/>}
    {toast && <div className="toast"><CheckCircle size={16} style={{verticalAlign:'middle'}}/> {toast}</div>}
  </div>
}
const newId = (date:string, obs:Observation[]) => { let n = obs.length + 1, id = ''; do { id = `OBS-${date.replace(/-/g, '')}-${String(n++).padStart(3, '0')}` } while (obs.some(o => o.id === id)); return id }
const Chart = ({title,children}:{title:string;children:ReactNode}) => <div className="card"><h3>{title}</h3><div style={{height:250}}><ResponsiveContainer>{children as any}</ResponsiveContainer></div></div>
const series = (obs:Observation[]) => [...obs].filter(isValid).sort((a, b) => a.date.localeCompare(b.date)).map(o => ({ id:o.id, osh:+obsScore(o)!.toFixed(2), prod:+obsProd(o)!.toFixed(3) }))

function Dashboard({obs,s,go}:{obs:Observation[];s:Settings;go:(p:Page)=>void}) {
  const valid = obs.filter(isValid), d = series(obs), avg = (a:number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null
  const last = d[d.length - 1], pct = Math.min(100, (valid.length / s.target) * 100)
  if (!obs.length) return <div className="card"><Empty text="No observations yet. Record your first daily observation, or preview the dashboard with demo data (Settings)."><button className="btn" onClick={() => go('new')}><Plus size={16}/>New Observation</button></Empty></div>
  return <div className="grid">
    <div className="grid g4">
      <Stat icon={ClipboardCheck} label="Total Observations" value={String(obs.length)}/><Stat icon={CheckCircle} label="Valid Paired Observations" value={String(valid.length)}/>
      <Stat icon={ShieldCheck} label="Average OSH Compliance" value={`${fmt(avg(d.map(x => x.osh)))}%`}/><Stat icon={Gauge} label="Average Productivity (m²/LH)" value={fmt(avg(d.map(x => x.prod)))}/>
      <Stat icon={Activity} label="Latest OSH Score" value={last ? `${fmt(last.osh)}%` : '—'}/><Stat icon={Activity} label="Latest Productivity (m²/LH)" value={last ? fmt(last.prod) : '—'}/>
      <Stat icon={Target} label="Target Observations" value={String(s.target)}/></div>
    <div className="card"><h3>Observation Progress — {valid.length} / {s.target} valid observations ({pct.toFixed(0)}% complete)</h3><div className="bar"><i style={{width:`${pct}%`}}/></div></div>
    <div className="grid g2"><Chart title="OSH Compliance by Observation (%)"><BarChart data={d}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="id" hide/><YAxis domain={[0,100]}/><Tooltip/><Bar dataKey="osh" fill="#16a34a" radius={[4,4,0,0]}/></BarChart></Chart>
      <Chart title="Productivity by Observation (m²/LH)"><BarChart data={d}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="id" hide/><YAxis/><Tooltip/><Bar dataKey="prod" fill="#f59e0b" radius={[4,4,0,0]}/></BarChart></Chart>
      <Scatter2 d={d}/></div></div>
}
const Scatter2 = ({d}:{d:{osh:number;prod:number}[]}) => <Chart title="OSH vs Productivity"><ScatterChart><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" dataKey="osh" name="OSH %" domain={[0,100]}/><YAxis type="number" dataKey="prod" name="m²/LH"/><Tooltip/><Scatter data={d} fill="#2563eb"/></ScatterChart></Chart>

function Records({obs,q,view,del,dup,edit,go}:{obs:Observation[];q:string;view:(o:Observation)=>void;del:(o:Observation)=>void;dup:(o:Observation)=>void;edit:(o:Observation)=>void;go:(p:Page)=>void}) {
  const [crew, setCrew] = useState(''); const [status, setStatus] = useState(''); const [from, setFrom] = useState(''); const [sort, setSort] = useState<'date'|'osh'|'prod'>('date'); const [asc, setAsc] = useState(false)
  const crews = [...new Set(obs.map(o => o.crew))]
  const rows = useMemo(() => obs.filter(o => (!q || `${o.id} ${o.crew} ${o.area} ${o.activity}`.toLowerCase().includes(q.toLowerCase())) && (!crew || o.crew === crew) && (!from || o.date >= from) && (!status || (status === 'valid') === isValid(o)))
    .sort((a, b) => { const f = (o:Observation) => sort === 'date' ? o.date : sort === 'osh' ? obsScore(o) ?? -1 : obsProd(o) ?? -1; const r = f(a) < f(b) ? -1 : f(a) > f(b) ? 1 : 0; return asc ? r : -r }), [obs, q, crew, status, from, sort, asc])
  const th = (k:'date'|'osh'|'prod', l:string) => <th onClick={() => { setSort(k); setAsc(sort === k ? !asc : false) }}>{l}{sort === k ? (asc ? ' ▲' : ' ▼') : ''}</th>
  return <div className="card"><div className="row2" style={{marginBottom:12}}>
    <select value={crew} onChange={e => setCrew(e.target.value)}><option value="">All crews</option>{crews.map(c => <option key={c}>{c}</option>)}</select>
    <select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option value="valid">Valid</option><option value="inc">Incomplete</option></select>
    <input type="date" value={from} onChange={e => setFrom(e.target.value)} title="From date"/><button className="btn" onClick={() => go('new')}><Plus size={16}/>New</button></div>
    {!rows.length ? <Empty text="No matching observations."/> : <div className="scroll"><table className="tbl"><thead><tr><th>ID</th>{th('date','Date')}<th>Crew</th><th>Activity</th><th>Area</th>{th('osh','OSH')}{th('prod','m²/LH')}<th>Pair</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {rows.map(o => <tr key={o.id}><td>{o.id}</td><td>{o.date}</td><td>{o.crew}</td><td>{o.activity}</td><td>{o.area}</td><td>{fmt(obsScore(o))}{obsScore(o) != null && '%'}</td><td>{fmt(obsProd(o))}</td>
        <td>{isValid(o) ? <Badge t="VALID" c="g"/> : <Badge t="INCOMPLETE" c="y"/>}</td><td>{o.demo ? <Badge t="DEMO" c="y"/> : <Badge t="ACTUAL" c="n"/>}</td>
        <td style={{whiteSpace:'nowrap'}}><button className="icon-btn" title="View" onClick={() => view(o)}><Eye size={16}/></button><button className="icon-btn" title="Edit" onClick={() => edit(o)}><Pencil size={16}/></button><button className="icon-btn" title="Duplicate" onClick={() => dup(o)}><Copy size={16}/></button><button className="icon-btn" title="Delete" onClick={() => del(o)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>}</div>
}

function Details({o,close}:{o:Observation;close:()=>void}) {
  const s = oshStats(o.osh)
  return <div className="modal" onClick={close}><div onClick={e => e.stopPropagation()}><h2 style={{marginTop:0}}>{o.id} {o.demo && <Badge t="DEMO DATA" c="y"/>}</h2>
    <p>{o.date} · {o.crew} · {o.activity} · {o.area} · {o.period} · Observer: {o.observer}</p>
    <OshSummary s={s}/><p><b>Productivity:</b> {o.output ?? '—'} m² ÷ {o.laborHours ?? '—'} LH = <b>{fmt(obsProd(o))} m²/LH</b></p>
    {categoryStats(o.osh).map(c => <p key={c.id} style={{margin:'4px 0'}}>{c.name}: {c.stats.compliant}/{c.stats.applicable} compliant</p>)}
    <h4>Contextual conditions</h4>{Object.entries(o.ctx).filter(([, v]) => v).map(([k, v]) => <p key={k} style={{margin:'2px 0'}}><b>{k}:</b> {v}</p>)}
    <button className="btn o" onClick={close}>Close</button></div></div>
}
function OshSummary({s}:{s:ReturnType<typeof oshStats>}) {
  return <div className="calc"><small>OVERALL OSH COMPLIANCE</small><big>{s.score == null ? 'Cannot compute' : `${s.score.toFixed(2)}%`}</big>
    <small>Applicable {s.applicable} · Compliant {s.compliant} · Non-Compliant {s.non} · N/A {s.na}{s.unanswered ? ` · Unanswered ${s.unanswered}` : ''}<br/>
      {s.score != null ? `${s.compliant} ÷ ${s.applicable} × 100 — N/A items excluded` : 'Needs at least 1 applicable (Compliant / Non-Compliant) item'}</small></div>
}

function ObsForm({init,obs,s,onSave,onCancel}:{init:Observation|null;obs:Observation[];s:Settings;onSave:(o:Observation)=>void;onCancel:()=>void}) {
  const [o, setO] = useState<Observation>(() => init ? structuredClone(init) : emptyObs(s)); const [step, setStep] = useState(0); const [errs, setErrs] = useState<Record<string,string>>({})
  const set = (k:keyof Observation, v:any) => setO(p => ({ ...p, [k]:v })); const ctx = (k:string, v:string) => setO(p => ({ ...p, ctx:{ ...p.ctx, [k]:v } }))
  const num = (v:string) => v === '' ? null : Number(v)
  const st = oshStats(o.osh), pr = productivity(o.output, o.laborHours)
  const validate = () => { const e:Record<string,string> = {}
    if (step === 0) { (['date','crew','activity','area','period','observer'] as const).forEach(k => { if (!o[k]) e[k] = 'Required' }) }
    if (step === 1 && st.unanswered) e.osh = `${st.unanswered} indicator(s) still unanswered`
    if (step === 1 && !st.unanswered && st.applicable === 0) e.osh = 'All items are N/A — OSH score cannot be computed'
    if (step === 2) { if (o.output == null || o.output < 0) e.output = 'Enter output ≥ 0'; if (!o.laborHours || o.laborHours <= 0) e.laborHours = 'Labor-hours must be greater than 0' }
    setErrs(e); return !Object.keys(e).length }
  const next = () => validate() && setStep(step + 1)
  const F = (l:string, k:keyof Observation, type = 'text') => <div className="fld"><label>{l}</label><input type={type} value={(o[k] as any) ?? ''} onChange={e => set(k, e.target.value)}/>{errs[k] && <span className="err">{errs[k]}</span>}</div>
  const N = (l:string, k:'output'|'laborHours'|'workers'|'workHours') => <div className="fld"><label>{l}</label><input type="number" min="0" step="any" value={o[k] ?? ''} onChange={e => { const v = num(e.target.value); setO(p => { const n = { ...p, [k]:v }; if ((k === 'workers' || k === 'workHours') && n.workers && n.workHours) n.laborHours = n.workers * n.workHours; return n }) }}/>{errs[k] && <span className="err">{errs[k]}</span>}</div>
  const C = (l:string, k:keyof Observation['ctx']) => <div className="fld"><label>{l}</label><input value={o.ctx[k]} onChange={e => ctx(k, e.target.value)}/></div>
  const finish = () => { const id = o.id || newId(o.date, obs); onSave({ ...o, id }) }
  return <div className="card"><div className="steps">{['Information','OSH Checklist','Productivity','Context','Review'].map((n, i) => <div key={n} className={`step ${i === step ? 'on' : i < step ? 'done' : ''}`}>{i + 1}. {n}</div>)}</div>
    {step === 0 && <div className="row2"><div className="fld"><label>Observation ID</label><input disabled value={o.id || 'Auto-generated on save'}/></div>{F('Date','date','date')}{F('Project','project')}{F('Work Area','area')}{F('Activity','activity')}{F('Crew','crew')}{F('Observation Period','period')}{F('Observer','observer')}<div className="fld"><label>Notes</label><textarea value={o.notes} onChange={e => set('notes', e.target.value)}/></div></div>}
    {step === 1 && <>{CATEGORIES.map(c => { const cs = oshStats(o.osh, c.items.map(i => i.id)); return <div key={c.id} style={{marginBottom:18}}><h3>{c.name} <Badge t={`${cs.compliant}/${cs.applicable} applicable`} c="b"/></h3>
      {c.items.map(i => <div className="item" key={i.id}><span>{i.label}</span><div className="opts">{([['C','Compliant'],['N','Non-Compliant'],['NA','N/A']] as [Answer & string,string][]).map(([v, l]) => <button key={v} className={`${v} ${o.osh[i.id] === v ? 'on' : ''}`} onClick={() => setO(p => ({ ...p, osh:{ ...p.osh, [i.id]:v } }))}>{l}</button>)}</div></div>)}</div> })}
      {errs.osh && <p className="err">{errs.osh}</p>}<OshSummary s={st}/></>}
    {step === 2 && <><div className="row2">{N('Actual Work Output (m²)','output')}{N('Number of Workers','workers')}{N('Work Hours per Worker','workHours')}{N('Total Labor-Hours','laborHours')}<div className="fld"><label>Task Accomplishment</label><input value={o.accomplishment} onChange={e => set('accomplishment', e.target.value)}/></div></div>
      <div className="calc"><small>PRODUCTIVITY RATE (Output ÷ Labor-Hours)</small><big>{pr == null ? 'Enter output and labor-hours > 0' : `${pr.toFixed(2)} m²/LH`}</big></div></>}
    {step === 3 && <div className="row2"><p style={{gridColumn:'1/-1',color:'var(--mute)'}}>Contextual information is recorded for reference only; it is not part of the main OSH–productivity correlation.</p>{C('Weather','weather')}{C('Material Availability','material')}{C('Equipment Interruption','equipment')}{C('Crew Change','crewChange')}{C('Overtime','overtime')}{C('Work Interruption','interruption')}{C('Unusual Work Stoppage','stoppage')}{C('Work Location / Conditions','location')}{C('Remarks','remarks')}</div>}
    {step === 4 && <><p><b>{o.id || 'New observation'}</b> · {o.date} · {o.crew} · {o.activity} · {o.area} · {o.period} · {o.observer}</p><OshSummary s={st}/><p><b>Productivity:</b> {o.output} m² ÷ {o.laborHours} LH = <b>{fmt(pr)} m²/LH</b></p>
      <p>{Object.entries(o.ctx).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'No contextual conditions recorded.'}</p></>}
    <div style={{display:'flex',gap:8,marginTop:16,justifyContent:'space-between',flexWrap:'wrap'}}><button className="btn o" onClick={step ? () => setStep(step - 1) : onCancel}>{step ? 'Back' : 'Cancel'}</button>
      {step < 4 ? <button className="btn" onClick={next}>Next</button> : <button className="btn" onClick={finish}><CheckCircle size={16}/>Save Observation</button>}</div></div>
}

function Checklist({obs}:{obs:Observation[]}) {
  const valid = obs.filter(isValid)
  return <div className="grid"><div className="banner"><Info size={16}/>Indicator wording is an editable placeholder in <code>src/lib/data.ts</code> — replace it with the checklist from your thesis appendix.</div>
    {CATEGORIES.map(c => { const rate = valid.length ? valid.reduce((a, o) => a + (oshStats(o.osh, c.items.map(i => i.id)).score ?? 0), 0) / valid.length : null
      return <div className="card" key={c.id}><h3><HardHat size={16}/> {c.name} <Badge t={rate == null ? 'no data' : `avg ${rate.toFixed(1)}%`} c="b"/></h3>{c.items.map((i, n) => <p key={i.id} style={{margin:'6px 0'}}>{c.id[0].toUpperCase()}{n + 1}. {i.label}</p>)}</div> })}
    <div className="card">Scoring: <b>Compliant ÷ (Compliant + Non-Compliant) × 100</b>. N/A is removed from both numerator and denominator.</div></div>
}

function Productivity({obs}:{obs:Observation[]}) {
  const rows = obs.filter(o => obsProd(o) != null).sort((a, b) => a.date.localeCompare(b.date))
  if (!rows.length) return <div className="card"><Empty text="No productivity data yet."/></div>
  const p = rows.map(o => obsProd(o)!), out = rows.reduce((a, o) => a + (o.output ?? 0), 0), lh = rows.reduce((a, o) => a + (o.laborHours ?? 0), 0)
  return <div className="grid"><div className="grid g4"><Stat icon={Gauge} label="Average (m²/LH)" value={fmt(p.reduce((a, b) => a + b, 0) / p.length)}/><Stat icon={Activity} label="Highest" value={fmt(Math.max(...p))}/><Stat icon={Activity} label="Lowest" value={fmt(Math.min(...p))}/><Stat icon={ClipboardCheck} label="Total Output (m²)" value={fmt(out, 1)}/><Stat icon={Users} label="Total Labor-Hours" value={fmt(lh, 1)}/></div>
    <Chart title="Daily Productivity (m²/LH) — Masonry / CHB Laying"><LineChart data={rows.map(o => ({ d:o.date, v:+obsProd(o)!.toFixed(3) }))}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="d"/><YAxis/><Tooltip/><Line dataKey="v" stroke="#f59e0b" strokeWidth={3}/></LineChart></Chart></div>
}

function Analytics({obs}:{obs:Observation[]}) {
  const d = series(obs), n = d.length, MIN = 5, x = d.map(v => v.osh), y = d.map(v => v.prod)
  const r = n >= MIN ? pearson(x, y) : null, rho = n >= MIN ? spearman(x, y) : null
  return <div className="grid"><div className="banner"><Info size={16}/><b>Association / Correlation</b> — this describes how the two measures move together; it does not show that OSH compliance causes productivity changes.</div>
    <div className="grid g4"><Stat icon={CheckCircle} label="Valid paired observations" value={String(n)}/><Stat icon={BarChart3} label="Pearson r" value={fmt(r, 3)}/><Stat icon={BarChart3} label="Spearman ρ" value={fmt(rho, 3)}/></div>
    {n < MIN ? <div className="card"><Empty text={`At least ${MIN} valid paired observations are needed before showing a correlation (currently ${n}). The thesis targets 20.`}/></div>
      : <div className="card">{r != null ? <>Pearson r = <b>{r.toFixed(3)}</b> ({strength(r)}); Spearman ρ = <b>{rho != null ? rho.toFixed(3) : '—'}</b>. Per the thesis, use Pearson if its assumptions hold, otherwise Spearman. <i>This tool does not test the assumptions or p-values — check them in SPSS/Excel/Python.</i></> : 'Correlation undefined (no variation in one variable).'}</div>}
    <div className="grid g2"><Scatter2 d={d}/><Chart title="Daily OSH Trend (%)"><LineChart data={d}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="id" hide/><YAxis domain={[0,100]}/><Tooltip/><Line dataKey="osh" stroke="#16a34a" strokeWidth={3}/></LineChart></Chart>
      <Chart title="Daily Productivity Trend (m²/LH)"><LineChart data={d}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="id" hide/><YAxis/><Tooltip/><Line dataKey="prod" stroke="#f59e0b" strokeWidth={3}/></LineChart></Chart></div></div>
}

function Testing({tests,set}:{tests:Record<number,{actual:string;status:string}>;set:(v:Record<number,{actual:string;status:string}>)=>void}) {
  const upd = (i:number, k:'actual'|'status', v:string) => set({ ...tests, [i]:{ actual:'', status:'', ...tests[i], [k]:v } })
  return <div className="card scroll"><table className="tbl"><thead><tr><th>#</th><th>Test Case</th><th>Expected Result</th><th>Actual Result</th><th>Status</th></tr></thead><tbody>
    {TESTS.map(([t, e], i) => { const s = tests[i]?.status; return <tr key={i}><td>{i + 1}</td><td>{t}</td><td>{e}</td><td><input value={tests[i]?.actual ?? ''} onChange={ev => upd(i, 'actual', ev.target.value)} placeholder="Enter actual result"/></td>
      <td><select value={s ?? ''} onChange={ev => upd(i, 'status', ev.target.value)}><option value="">To be determined</option><option>PASS</option><option>FAIL</option></select> {s && <Badge t={s} c={s === 'PASS' ? 'g' : 'r'}/>}</td></tr> })}</tbody></table></div>
}

function SettingsPage({s,set,hasDemo,loadDemo,clearDemo}:{s:Settings;set:(s:Settings)=>void;hasDemo:boolean;loadDemo:()=>void;clearDemo:()=>void}) {
  const [f, setF] = useState(s); const k = (l:string, key:keyof Settings, t = 'text') => <div className="fld"><label>{l}</label><input type={t} value={f[key]} onChange={e => setF({ ...f, [key]: t === 'number' ? Number(e.target.value) : e.target.value })}/></div>
  return <div className="grid"><div className="card"><div className="row2">{k('Project name','project')}{k('Project location','location')}{k('Default activity','activity')}{k('Default crew','crew')}{k('Observer name / role','observer')}{k('Target valid observations','target','number')}</div>
    <button className="btn" disabled={f.target < 1} onClick={() => set(f)}>Save Settings</button></div>
    <div className="card"><h3>Demo data</h3><p>Preview the dashboard with generated <b>DEMO DATA — NOT ACTUAL RESEARCH RESULTS</b>.</p>
      <button className="btn o" onClick={loadDemo}>Load demo data</button> <button className="btn d" disabled={!hasDemo} onClick={clearDemo}>Remove demo data</button></div>
    <div className="card" style={{fontSize:13,color:'var(--mute)'}}>This tool supplements — and does not replace — safety officers, mandatory OSH programs, inspections, legal requirements, or professional safety judgment. Data is stored in this browser only (localStorage).</div></div>
}
