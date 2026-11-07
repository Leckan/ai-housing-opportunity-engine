"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight, ArrowUpRight, Bookmark, Check, ChevronDown, ChevronRight,
  CircleHelp, Download, ExternalLink, FileText, Filter, Info, Layers3, MapPin,
  Plus, Search, Send, ShieldAlert, Sparkles, Target, TrendingUp,
} from "lucide-react";
import OpportunityMap from "@/components/opportunity-map";
import {
  answerDemoQuestion, calculateFeasibility, currency, defaultFeasibilityInputs,
  demoDataSources, demoParcels, demoRegionalIndicators, demoZoningEvidence, type DemoParcel, type FeasibilityInputs,
  type FeasibilityResult, type OpportunityCategory,
} from "@/lib/domain";

export type WorkspaceSection =
  | "Overview" | "Housing Opportunity Map" | "Property Intelligence" | "Zoning Intelligence"
  | "Development Feasibility" | "Affordable Housing" | "Opportunity Rankings" | "Regional Intelligence"
  | "AI Housing Assistant" | "Reports" | "Data Sources" | "Projects" | "Saved Properties"
  | "Analysis History" | "Team Members" | "Notifications" | "Organization Settings" | "User Management"
  | "Data Integrations" | "AI Configuration" | "Billing and Subscription" | "Audit Logs";

type SharedProps = {
  active: WorkspaceSection;
  parcels: DemoParcel[];
  selected: DemoParcel;
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  savedIds: string[];
  onSelect: (parcel: DemoParcel) => void;
  onSave: (parcel: DemoParcel) => void;
  onNavigate: (section: WorkspaceSection) => void;
  onToast: (message: string) => void;
};

const money = (value: number) => currency(value, true);
const categories: Array<"All opportunities" | OpportunityCategory> = ["All opportunities", "Vacant land", "Underutilized residential", "Commercial reuse", "Small multifamily", "Transit-oriented", "Public land", "ADU potential", "Mixed-use", "Parking / commercial site", "Locally identified"];

export function WorkspaceView(props: SharedProps) {
  switch (props.active) {
    case "Overview": return <OverviewView {...props} />;
    case "Housing Opportunity Map": return <MapView {...props} />;
    case "Property Intelligence": return <PropertyView {...props} />;
    case "Zoning Intelligence": return <ZoningView {...props} />;
    case "Development Feasibility": return <FeasibilityView {...props} />;
    case "Affordable Housing": return <AffordableView {...props} />;
    case "Opportunity Rankings": return <RankingsView {...props} />;
    case "Regional Intelligence": return <RegionalView {...props} />;
    case "AI Housing Assistant": return <AssistantView {...props} />;
    case "Reports": return <ReportsView {...props} />;
    case "Data Sources": return <DataSourcesView {...props} />;
    default: return <WorkspaceUtilityView {...props} />;
  }
}

function ViewHeading({ eyebrow, title, description, right }: { eyebrow?: string; title: string; description?: string; right?: React.ReactNode }) {
  return <div className="view-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{right && <div className="heading-actions">{right}</div>}</div>;
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="section-label"><h2>{children}</h2>{action}</div>;
}

function ScoreBadge({ score }: { score: number }) {
  const grade = score >= 80 ? "strong" : score >= 65 ? "good" : "watch";
  return <span className={`score-badge ${grade}`}><span />{score}</span>;
}

function OpportunityRows({ parcels, onSelect, limit = 5 }: { parcels: DemoParcel[]; onSelect: (parcel: DemoParcel) => void; limit?: number }) {
  return <div className="opportunity-rows">{parcels.slice(0, limit).map((parcel, index) => <button className="opportunity-row" key={parcel.id} onClick={() => onSelect(parcel)}>
    <span className="row-rank">{String(index + 1).padStart(2, "0")}</span><span className="parcel-initial"><MapPin size={15} /></span>
    <span className="row-main"><strong>{parcel.address}</strong><small>{parcel.city}, {parcel.state} <span>·</span> {parcel.category}</small></span>
    <span className="row-units"><strong>{parcel.units}</strong><small>est. units</small></span><ScoreBadge score={parcel.score} /><ChevronRight size={16} className="muted-icon" />
  </button>)}</div>;
}

function OverviewView(props: SharedProps) {
  const sorted = useMemo(() => [...props.parcels].sort((a, b) => b.score - a.score), [props.parcels]);
  const high = props.parcels.filter((p) => p.score >= 80).length;
  const totalUnits = props.parcels.reduce((sum, p) => sum + p.units, 0);
  return <>
    <ViewHeading eyebrow="Workspace overview" title="Good morning, Alex" description="Your Southern California housing opportunity workspace is ready." right={<button className="button button-primary" onClick={() => props.onNavigate("Housing Opportunity Map")}><MapPin size={16} /> Explore opportunity map</button>} />
    <div className="demo-banner"><span className="demo-banner-icon"><Info size={15} /></span><span><strong>Demonstration environment</strong> · All parcel records, rankings, and indicators shown are synthetic and unverified.</span><button onClick={() => props.onNavigate("Data Sources")}>About demo data <ArrowRight size={13} /></button></div>
    <div className="metric-grid">
      <MetricCard icon={<MapPin size={17} />} label="Sites screened" value={String(props.parcels.length)} delta="100 demo parcels" tone="teal" />
      <MetricCard icon={<Target size={17} />} label="High potential" value={String(high)} delta="Score of 80+" tone="blue" />
      <MetricCard icon={<Layers3 size={17} />} label="Indicative capacity" value={totalUnits.toLocaleString()} delta="Synthetic unit estimate" tone="amber" />
      <MetricCard icon={<TrendingUp size={17} />} label="Avg. opportunity score" value={`${Math.round(props.parcels.reduce((sum, p) => sum + p.score, 0) / Math.max(1, props.parcels.length))}`} delta="Across current view" tone="violet" />
    </div>
    <div className="dashboard-grid dashboard-top-grid">
      <section className="panel map-panel"><div className="panel-heading"><div><h2>Opportunity landscape</h2><p>Los Angeles County · synthetic demonstration sites</p></div><button className="icon-button" aria-label="Open map" onClick={() => props.onNavigate("Housing Opportunity Map")}><ArrowRight size={16} /></button></div><div className="overview-map"><OpportunityMap parcels={props.parcels.slice(0, 45)} selectedId={props.selected.id} onSelect={(p) => { props.onSelect(p); props.onNavigate("Property Intelligence"); }} compact /></div><div className="map-summary"><span><i className="dot dot-teal" /> Opportunity candidates</span><button className="text-button" onClick={() => props.onNavigate("Housing Opportunity Map")}>Open full map <ArrowRight size={13} /></button></div></section>
      <section className="panel score-panel"><div className="panel-heading"><div><h2>Opportunity score</h2><p>Distribution across screened sites</p></div><button className="select-button">Last 30 days <ChevronDown size={13} /></button></div><ScoreDistribution parcels={props.parcels} /><div className="score-stat-row"><div><strong>{high}</strong><small>Strong candidates</small></div><div><strong>{props.parcels.filter((p) => p.score >= 65 && p.score < 80).length}</strong><small>Needs review</small></div><div><strong>{props.parcels.filter((p) => p.confidence === "Low").length}</strong><small>Low confidence</small></div></div></section>
    </div>
    <div className="dashboard-grid dashboard-bottom-grid">
      <section className="panel"><div className="panel-heading"><div><h2>Top opportunities</h2><p>Ranked by the current screening model</p></div><button className="text-button" onClick={() => props.onNavigate("Opportunity Rankings")}>View rankings <ArrowRight size={13} /></button></div><OpportunityRows parcels={sorted} onSelect={(p) => { props.onSelect(p); props.onNavigate("Property Intelligence"); }} limit={5} /></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Across your workspace</p></div><button className="icon-button" aria-label="Analysis history" onClick={() => props.onNavigate("Analysis History")}><ArrowRight size={16} /></button></div><div className="activity-list"><Activity icon={<Sparkles size={15} />} title="Demo workspace initialized" body="100 synthetic parcels loaded" time="Just now" /><Activity icon={<FileText size={15} />} title="Zoning library ready" body="2 fictional source excerpts" time="Just now" /><Activity icon={<Target size={15} />} title="Screening model completed" body="All 5 scoring factors calculated" time="Just now" /></div><button className="button button-secondary full-width" onClick={() => props.onNavigate("Analysis History")}>View analysis history</button></section>
    </div>
  </>;
}

function MetricCard({ icon, label, value, delta, tone }: { icon: React.ReactNode; label: string; value: string; delta: string; tone: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{delta}</small></div><div className="metric-spark"><svg viewBox="0 0 62 24" aria-hidden="true"><path d="M1 19 C9 16 11 18 18 11 S28 14 36 9 S49 12 61 3" /></svg></div></div>;
}

function Activity({ icon, title, body, time }: { icon: React.ReactNode; title: string; body: string; time: string }) {
  return <div className="activity-item"><span className="activity-icon">{icon}</span><div><strong>{title}</strong><p>{body}</p></div><time>{time}</time></div>;
}

function ScoreDistribution({ parcels }: { parcels: DemoParcel[] }) {
  const buckets = ["0–39", "40–54", "55–69", "70–84", "85–100"].map((label, i) => {
    const min = [0, 40, 55, 70, 85][i];
    const max = [39, 54, 69, 84, 100][i];
    return { label, count: parcels.filter((p) => p.score >= min && p.score <= max).length };
  });
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return <div className="distribution-chart">{buckets.map((bucket, i) => <div className="distribution-column" key={bucket.label}><span className="distribution-count">{bucket.count}</span><div className="distribution-track"><i style={{ height: `${Math.max(8, bucket.count / max * 100)}%` }} className={i > 2 ? "highlight" : ""} /></div><small>{bucket.label}</small></div>)}</div>;
}

function MapView(props: SharedProps) {
  const [savedView, setSavedView] = useState<{ query: string; category: string; selectedParcelId: string } | null>(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(window.localStorage.getItem("ahoe-demo-map-view-v1") ?? "null") as { query: string; category: string; selectedParcelId: string } | null; } catch { return null; }
  });
  function saveMapView() {
    const view = { query: props.query, category: props.category, selectedParcelId: props.selected.id };
    try { window.localStorage.setItem("ahoe-demo-map-view-v1", JSON.stringify(view)); setSavedView(view); props.onToast("Map search and selected site saved in this browser."); }
    catch { props.onToast("Browser storage is unavailable; this map view could not be saved."); }
  }
  function restoreMapView() {
    if (!savedView) return;
    props.setQuery(savedView.query); props.setCategory(savedView.category);
    const parcel = demoParcels.find((candidate) => candidate.id === savedView.selectedParcelId);
    if (parcel) props.onSelect(parcel);
    props.onToast("Saved map search and selected site restored.");
  }
  return <>
    <ViewHeading eyebrow="Geospatial intelligence" title="Housing opportunity map" description="Explore, filter, and compare synthetic demonstration sites across the pilot region." right={<><button className="button button-secondary" onClick={saveMapView}><Bookmark size={15} /> Save map view</button>{savedView && <button className="button button-secondary" onClick={restoreMapView}>Restore saved view</button>}</>} />
    <div className="map-toolbar panel"><label className="search-field map-search"><Search size={16} /><input aria-label="Search sites" placeholder="Search address, parcel ID, city…" value={props.query} onChange={(e) => props.setQuery(e.target.value)} /><kbd>⌘ K</kbd></label><div className="toolbar-divider" /><div className="filter-control"><Filter size={15} /><select aria-label="Opportunity category" value={props.category} onChange={(e) => props.setCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><button className="button button-secondary" onClick={() => { props.setQuery(""); props.setCategory("All opportunities"); }}><span>Clear filters</span></button><span className="results-count">{props.parcels.length} sites</span></div>
    <div className="map-workspace"><div className="map-main-panel"><OpportunityMap parcels={props.parcels} selectedId={props.selected.id} onSelect={props.onSelect} /></div><aside className="map-side-panel"><div className="map-side-heading"><div><h2>Opportunity sites</h2><p>Ranked by screening score</p></div><button className="icon-button" aria-label="Filter sites" onClick={() => props.onToast("Use the category and search filters above to refine sites.")}><Filter size={16} /></button></div><div className="map-result-list">{props.parcels.length ? [...props.parcels].sort((a, b) => b.score - a.score).slice(0, 30).map((parcel) => <button key={parcel.id} className={`map-result ${props.selected.id === parcel.id ? "selected" : ""}`} onClick={() => props.onSelect(parcel)}><span className="map-result-pin"><MapPin size={14} /></span><span className="map-result-body"><strong>{parcel.address}</strong><small>{parcel.city} · {parcel.category}</small><span className="map-result-meta">{parcel.areaSqFt.toLocaleString()} sf <i>·</i> {parcel.units} indicative units</span></span><ScoreBadge score={parcel.score} /></button>) : <EmptyState title="No sites match" body="Adjust your search or clear filters to see more demonstration sites." />}</div><button className="button button-secondary full-width" onClick={() => props.onNavigate("Opportunity Rankings")}>Compare all rankings <ArrowRight size={14} /></button></aside></div>
  </>;
}

function PropertyView(props: SharedProps) {
  const [tab, setTab] = useState("Overview");
  const [showSaved, setShowSaved] = useState(false);
  const p = props.selected;
  const tabs = ["Overview", "Zoning", "Development potential", "Financial analysis", "Environmental", "AI assessment"];
  const tabDescriptions: Record<string, string> = {
    "Overview": "Parcel-level attributes from the synthetic demonstration provider.",
    "Zoning": "Fictional sample labels only. Verify current adopted zoning with the local planning authority.",
    "Development potential": "Capacity is a preliminary screening estimate and does not establish entitlement.",
    "Financial analysis": "Illustrative assumptions for comparison; no verified land, cost, or market data is connected.",
    "Environmental": "Screening placeholders only. A qualified site assessment is required.",
    "AI assessment": "Explainable demo score based on five synthetic indicators.",
  };
  const scoreFactors = [
    ["Parcel area", p.parcelSizeScore],
    ["Housing need", p.housingNeed], ["Transit access", p.transit],
    ["Infrastructure readiness", p.infrastructure], ["Constraint screen", p.constraintScore],
  ] as const;
  return <>
    <ViewHeading eyebrow="Property intelligence" title={p.address} description={`${p.city}, ${p.county} County, ${p.state} · ${p.apn}`} right={<><button className={`button ${showSaved || props.savedIds.includes(p.id) ? "button-saved" : "button-secondary"}`} onClick={() => { props.onSave(p); setShowSaved(true); }}>{showSaved || props.savedIds.includes(p.id) ? <Check size={15} /> : <Bookmark size={15} />}{showSaved || props.savedIds.includes(p.id) ? "Saved" : "Save property"}</button><button className="button button-primary" onClick={() => props.onNavigate("Development Feasibility")}>Run feasibility <ArrowRight size={15} /></button></>} />
    <div className="property-top-grid"><section className="panel property-score-card"><div className="score-ring" style={{ "--score": `${p.score * 3.6}deg` } as React.CSSProperties}><div><strong>{p.score}</strong><small>/ 100</small></div></div><div className="property-score-copy"><span className="eyebrow">HOUSING OPPORTUNITY INDEX</span><h2>{p.score >= 80 ? "Strong screening signal" : p.score >= 65 ? "Promising, review constraints" : "Early-stage candidate"}</h2><p>Preliminary score · {p.confidence.toLowerCase()} confidence</p><div className="badge-line"><span className="pill pill-teal">{p.category}</span><span className="pill">Demo record</span></div></div><div className="property-quick-stats"><div><small>Indicative capacity</small><strong>{p.units} units</strong></div><div><small>Parcel area</small><strong>{p.areaSqFt.toLocaleString()} sf</strong></div><div><small>Land use</small><strong>{p.landUse}</strong></div></div></section><section className="panel parcel-map-card"><div className="panel-heading"><div><h2>Location context</h2><p>Approximate synthetic coordinates</p></div><button className="text-button" onClick={() => props.onNavigate("Housing Opportunity Map")}>Open map <ArrowRight size={13} /></button></div><div className="parcel-map-preview"><OpportunityMap parcels={[p]} selectedId={p.id} onSelect={props.onSelect} compact /></div></section></div>
    <section className="panel property-tabs-panel"><div className="tabs-scroll">{tabs.map((item) => <button key={item} className={`tab-button ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>{item}</button>)}</div><div className="tab-content"><p className="tab-disclaimer"><Info size={14} />{tabDescriptions[tab]}</p>
      {tab === "Overview" && <div className="property-detail-grid"><Detail label="Parcel identifier" value={p.apn} /><Detail label="Geography" value={`${p.city}, ${p.county} County, CA`} /><Detail label="Parcel area" value={`${p.areaSqFt.toLocaleString()} sq ft`} /><Detail label="Existing use" value={p.landUse} /><Detail label="Sample zoning label" value={p.zoning} /><Detail label="Assessed value (synthetic)" value={currency(p.assessedValue)} /><Detail label="Record source" value="Synthetic demonstration provider" /><Detail label="Retrieved" value="Generated in demo session" /></div>}
      {tab === "Zoning" && <div className="zoning-tab-content"><div><span className="eyebrow">SAMPLE DISTRICT LABEL</span><h3>{p.zoning}</h3><p>This label is generated for interface demonstration. No local zoning code has been ingested or verified.</p></div><button className="button button-secondary" onClick={() => props.onNavigate("Zoning Intelligence")}>Open zoning research <ArrowRight size={14} /></button></div>}
      {tab === "Development potential" && <div className="development-potential"><div className="detail-card"><small>Preliminary capacity range</small><strong>{Math.max(2, Math.round(p.units * 0.65))}–{Math.round(p.units * 1.18)} homes</strong><span>Rule-of-thumb estimate based on synthetic site area and density assumptions.</span></div><div className="detail-card"><small>Potential formats</small><strong>Low-rise multifamily</strong><span>Townhomes · courtyard apartments · mixed-use concepts</span></div><div className="detail-card"><small>Follow-up needed</small><strong>Verify code and constraints</strong><span>Survey, title, utility capacity, environmental and entitlement review.</span></div></div>}
      {tab === "Financial analysis" && <div className="finance-preview"><div className="detail-card"><small>Illustrative land basis</small><strong>{currency(p.assessedValue)}</strong></div><div className="detail-card"><small>Indicative units</small><strong>{p.units}</strong></div><div className="detail-card"><small>Potential gross rent / yr</small><strong>{currency(p.units * 2450 * 12)}</strong></div><button className="button button-primary" onClick={() => props.onNavigate("Development Feasibility")}>Configure assumptions</button></div>}
      {tab === "Environmental" && <div className="constraint-list">{p.constraints.map((c) => <div key={c} className="constraint-item"><ShieldAlert size={16} /><span><strong>{c}</strong><small>Demo screening indicator · not an official hazard finding</small></span><span className="pill pill-amber">Review</span></div>)}</div>}
      {tab === "AI assessment" && <div className="assessment-layout"><div className="factor-list">{scoreFactors.map(([label, value]) => <div className="factor-row" key={label}><div><span>{label}</span><strong>{value}</strong></div><div className="factor-track"><i style={{ width: `${value}%` }} /></div></div>)}</div><div className="assessment-note"><Sparkles size={18} /><strong>What supports the score?</strong><p>Parcel size, housing need, transit context, infrastructure indicator, and constraint flag contribute to the preliminary index. The score is for demonstration only and does not predict approvals or outcomes.</p></div></div>}
    </div></section>
  </>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="property-detail"><small>{label}</small><strong>{value}</strong></div>;
}

function ZoningView(props: SharedProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const examples = ["What housing uses are allowed here?", "What setbacks should I investigate?", "Which documents support this result?"];
  async function ask(value = question) {
    if (!value.trim()) return;
    setQuestion(value); setLoading(true); setAnswer("");
    try {
      const res = await fetch("/api/v1/zoning/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: value, parcelId: props.selected.id }) });
      if (!res.ok) throw new Error("Zoning service is unavailable.");
      const data = await res.json() as { answer: string };
      setAnswer(data.answer);
    } catch { setAnswer(answerDemoQuestion(value)); }
    finally { setLoading(false); }
  }
  return <>
    <ViewHeading eyebrow="Regulatory research" title="Zoning intelligence" description="Search a source-linked research library and keep uncertainty visible." right={<button className="button button-secondary" onClick={() => props.onToast("Document upload is available in the production architecture; this demo uses fictional sample excerpts.")}><Plus size={15} /> Add document</button>} />
    <div className="demo-banner warning"><span className="demo-banner-icon"><ShieldAlert size={15} /></span><span><strong>Not legal or entitlement advice</strong> · No official zoning source is connected in this demo. All retrieved excerpts are fictional.</span></div>
    <div className="zoning-layout"><section className="panel zoning-query-panel"><div className="panel-heading"><div><h2>Ask a zoning question</h2><p>Current parcel: {props.selected.apn} · {props.selected.city}</p></div><span className="source-count"><span className="green-dot" /> 2 demo excerpts</span></div><form className="zoning-search" onSubmit={(e) => { e.preventDefault(); void ask(); }}><textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about allowed housing uses, density limits, setbacks, parking, or ADUs…" rows={3} /><div className="zoning-submit-row"><span>Answers cite the selected demonstration library.</span><button className="button button-primary" disabled={loading || !question.trim()}>{loading ? <><span className="spinner-small" /> Searching</> : <><Search size={14} /> Search sources</>}</button></div></form><div className="question-suggestions"><span>TRY ASKING</span>{examples.map((example) => <button key={example} onClick={() => void ask(example)}>{example}<ArrowUpRight size={12} /></button>)}</div>{answer && <div className="answer-card"><div className="answer-head"><span className="ai-mark"><Sparkles size={15} /></span><div><strong>Research response</strong><small>Demo retrieval · {props.selected.apn}</small></div><span className="pill pill-amber">Unverified</span></div><p>{answer}</p><div className="answer-sources"><span>Sources returned</span>{demoZoningEvidence.map((e) => <div key={e.title}><FileText size={14} /><span><strong>{e.title}</strong><small>{e.citation}</small></span><ExternalLink size={13} /></div>)}</div></div>}</section>
      <aside className="zoning-aside"><section className="panel"><div className="panel-heading"><div><h2>Source library</h2><p>Sample jurisdiction · demonstration</p></div><button className="icon-button" aria-label="More sources" onClick={() => props.onToast("Source administration is disabled in demonstration mode.")}><Plus size={15} /></button></div><div className="source-list">{demoZoningEvidence.map((e, i) => <div className="source-item" key={e.title}><span className="source-icon"><FileText size={15} /></span><span><strong>{e.title}</strong><small>{i === 0 ? "PDF · Fictional sample" : "TXT · Fictional sample"}</small><em>{e.citation}</em></span><span className="source-version">v0.{i + 1}</span></div>)}</div></section><section className="panel safeguards"><div className="safeguard-icon"><CircleHelp size={17} /></div><div><strong>How to use this safely</strong><p>Confirm every rule against the currently adopted ordinance and official planning guidance. Parcel-level conditions may also apply.</p><button className="text-button" onClick={() => props.onToast("This demo has no official jurisdiction sources to verify against.")}>Review source safeguards <ArrowRight size={13} /></button></div></section></aside></div>
  </>;
}

function FeasibilityView(props: SharedProps) {
  const [inputs, setInputs] = useState<FeasibilityInputs>({ ...defaultFeasibilityInputs, parcelAreaSqFt: props.selected.areaSqFt });
  const [result, setResult] = useState<FeasibilityResult | null>(null);
  const [analysisId, setAnalysisId] = useState("");
  function setField(key: keyof FeasibilityInputs, value: string) { setInputs((current) => ({ ...current, [key]: Number(value) })); }
  function run() {
    setResult(calculateFeasibility(inputs)); setAnalysisId(`FEAS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
    props.onToast("Feasibility scenario calculated with local demo assumptions.");
  }
  const current = result ?? calculateFeasibility(inputs);
  return <>
    <ViewHeading eyebrow="Development intelligence" title="Development feasibility" description={`Build a preliminary scenario for ${props.selected.apn}. Results are illustrative, assumption-driven, and not a valuation.`} right={<button className="button button-secondary" onClick={() => { setInputs({ ...defaultFeasibilityInputs, parcelAreaSqFt: props.selected.areaSqFt }); setResult(null); props.onToast("Inputs reset to the demo assumptions."); }}>Reset assumptions</button>} />
    <div className="demo-banner warning"><span className="demo-banner-icon"><Info size={15} /></span><span>Construction costs, rents, and zoning density below are demo assumptions. No market or regulatory data is verified.</span></div>
    <div className="feasibility-layout"><section className="panel assumptions-panel"><div className="panel-heading"><div><h2>Scenario assumptions</h2><p>Adjust inputs and run the deterministic model</p></div><span className="pill">Scenario 01</span></div><div className="assumption-grid">
      <NumberField label="Parcel area" unit="sq ft" value={inputs.parcelAreaSqFt} onChange={(v) => setField("parcelAreaSqFt", v)} />
      <NumberField label="Density assumption" unit="units / acre" value={inputs.densityUnitsPerAcre} onChange={(v) => setField("densityUnitsPerAcre", v)} />
      <NumberField label="Net-to-gross efficiency" unit="%" value={Math.round(inputs.netToGross * 100)} onChange={(v) => setField("netToGross", String(Math.min(100, Math.max(0, Number(v))) / 100))} />
      <NumberField label="Average unit size" unit="sq ft" value={inputs.unitSizeSqFt} onChange={(v) => setField("unitSizeSqFt", v)} />
      <NumberField label="Construction cost" unit="$ / sq ft" value={inputs.constructionCostPerSqFt} onChange={(v) => setField("constructionCostPerSqFt", v)} />
      <NumberField label="Land basis" unit="$ / sq ft" value={inputs.landCostPerSqFt} onChange={(v) => setField("landCostPerSqFt", v)} />
      <NumberField label="Monthly market rent" unit="$ / unit" value={inputs.monthlyRentPerUnit} onChange={(v) => setField("monthlyRentPerUnit", v)} />
      <NumberField label="Affordable unit share" unit="%" value={inputs.affordableSharePct} onChange={(v) => setField("affordableSharePct", String(Math.min(100, Math.max(0, Number(v)))))} />
      </div><button className="button button-primary full-width run-button" onClick={run}><Sparkles size={15} /> Run feasibility analysis</button><div className="calculation-note"><Info size={14} /><span>Capacity is the lower of assumed density and net residential floor area. Costs apply fixed illustrative soft cost, contingency, and financing ratios.</span></div></section>
      <section className="feasibility-results"><div className="panel result-hero"><div className="result-header"><div><span className="eyebrow">PRELIMINARY DEVELOPMENT SCENARIO</span><h2>Estimated project profile</h2></div>{analysisId && <span className="run-id">{analysisId}</span>}</div><div className="result-primary"><div><strong>{current.units}</strong><span>indicative homes</span></div><div className="yield-box"><small>NOI yield on cost</small><strong>{current.yieldOnCost.toFixed(1)}%</strong></div></div><div className="result-kpis"><ResultKpi label="Total development cost" value={money(current.totalDevelopmentCost)} /><ResultKpi label="Gross floor area" value={`${current.grossFloorAreaSqFt.toLocaleString()} sf`} /><ResultKpi label="Annual gross rent" value={money(current.annualGrossRent)} /><ResultKpi label="Annual NOI" value={money(current.annualNetOperatingIncome)} /></div></div><div className="panel cost-breakdown"><SectionLabel>Cost breakdown <span className="subtle-label">USD · illustrative</span></SectionLabel><CostLine label="Land acquisition" value={current.landAcquisition} total={current.totalDevelopmentCost} /><CostLine label="Hard costs" value={current.hardCosts} total={current.totalDevelopmentCost} /><CostLine label="Soft costs · 22% of hard" value={current.softCosts} total={current.totalDevelopmentCost} /><CostLine label="Contingency · 8% of hard" value={current.contingency} total={current.totalDevelopmentCost} /><CostLine label="Financing · 7% of subtotal" value={current.financing} total={current.totalDevelopmentCost} /><div className="cost-total"><span>Total development cost</span><strong>{currency(current.totalDevelopmentCost)}</strong></div></div><div className="result-affordable"><span className="afford-icon"><Target size={17} /></span><div><small>Illustrative affordability mix</small><strong>{current.affordableUnits} below-market units</strong></div><span>{currency(current.affordableMonthlyRent)} / mo est.</span><button className="text-button" onClick={() => props.onNavigate("Affordable Housing")}>Model affordability <ArrowRight size={13} /></button></div></section></div>
  </>;
}

function NumberField({ label, unit, value, onChange }: { label: string; unit: string; value: number; onChange: (value: string) => void }) {
  return <label className="number-field"><span>{label}</span><div><input type="number" min="0" value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(e.target.value)} /><small>{unit}</small></div></label>;
}

function ResultKpi({ label, value }: { label: string; value: string }) {
  return <div className="result-kpi"><small>{label}</small><strong>{value}</strong></div>;
}

function CostLine({ label, value, total }: { label: string; value: number; total: number }) {
  return <div className="cost-line"><span>{label}</span><div className="cost-line-track"><i style={{ width: `${total ? value / total * 100 : 0}%` }} /></div><strong>{currency(value)}</strong></div>;
}

function AffordableView(props: SharedProps) {
  const [units, setUnits] = useState(Math.max(12, props.selected.units));
  const [marketRent, setMarketRent] = useState(2450);
  const [share, setShare] = useState(30);
  const [amiBand, setAmiBand] = useState("60% AMI · illustrative");
  const affordableUnits = Math.round(units * share / 100);
  const illustrativeRent = Math.round(marketRent * (amiBand.startsWith("50") ? 0.58 : amiBand.startsWith("80") ? 0.82 : 0.7));
  const mix = [{ label: "Extremely low", count: Math.round(affordableUnits * 0.2), share: 20 }, { label: "Very low", count: Math.round(affordableUnits * 0.32), share: 32 }, { label: "Low income", count: Math.max(0, affordableUnits - Math.round(affordableUnits * 0.52)), share: 48 }];
  return <>
    <ViewHeading eyebrow="Housing affordability" title="Affordable housing optimization" description="Explore how an illustrative income-restricted share changes the unit mix and revenue assumptions." right={<button className="button button-secondary" onClick={() => props.onToast("Affordability scenario saved in this session.")}><Bookmark size={15} /> Save scenario</button>} />
    <div className="demo-banner warning"><span className="demo-banner-icon"><Info size={15} /></span><span>Rent figures and income bands are simplified demonstration inputs. Use current HUD, state, and local program limits for real underwriting.</span></div>
    <div className="affordable-grid"><section className="panel affordability-inputs"><div className="panel-heading"><div><h2>Scenario setup</h2><p>Selected property · {props.selected.apn}</p></div></div><div className="affordable-controls"><NumberField label="Total residential units" unit="units" value={units} onChange={(v) => setUnits(Math.max(0, Number(v)))} /><NumberField label="Affordable share" unit="%" value={share} onChange={(v) => setShare(Math.min(100, Math.max(0, Number(v))))} /><NumberField label="Market rent assumption" unit="$ / month" value={marketRent} onChange={(v) => setMarketRent(Math.max(0, Number(v)))} /><label className="number-field"><span>Income limit band</span><div className="select-input"><select value={amiBand} onChange={(e) => setAmiBand(e.target.value)}><option>50% AMI · illustrative</option><option>60% AMI · illustrative</option><option>80% AMI · illustrative</option></select><ChevronDown size={14} /></div></label></div><div className="afford-output"><div className="afford-output-icon"><Target size={18} /></div><div><small>Illustrative affordable homes</small><strong>{affordableUnits} <span>of {units} total units</span></strong></div><span className="pill pill-teal">{share}% set-aside</span></div></section>
      <section className="panel affordability-mix"><div className="panel-heading"><div><h2>Illustrative rent mix</h2><p>Based on selected percentage band and demo market rent</p></div><button className="icon-button" aria-label="About affordability" onClick={() => props.onToast("Actual rent limits depend on jurisdiction, household size, and program rules.")}><Info size={15} /></button></div><div className="affordable-rent-highlight"><div><span>Estimated affordable rent</span><strong>{currency(illustrativeRent)} <small>/ unit / month</small></strong></div><span className="pill">{amiBand}</span></div><div className="rent-bars">{mix.map((item) => <div className="rent-row" key={item.label}><div><span>{item.label}</span><strong>{item.count} units</strong></div><div className="rent-track"><i style={{ width: `${affordableUnits ? item.count / affordableUnits * 100 : 0}%` }} /></div></div>)}</div><div className="afford-note"><Info size={14} /><span>Illustrative rents use a simplified share of market rent. Household size, utility allowances, and official limits are not modeled.</span></div><button className="button button-primary full-width" onClick={() => props.onToast("Affordability model recalculated from the current inputs.")}>Update scenario <ArrowRight size={14} /></button></section></div>
    <section className="panel affordability-programs"><div className="panel-heading"><div><h2>Funding programs to research</h2><p>Potential sources to evaluate · availability not verified</p></div><button className="text-button" onClick={() => props.onNavigate("Data Sources")}>Explore data sources <ArrowRight size={13} /></button></div><div className="program-grid"><Program name="Low-Income Housing Tax Credit" agency="California Tax Credit Allocation Committee" type="Tax credit" /><Program name="HOME Investment Partnerships" agency="U.S. Department of Housing and Urban Development" type="Federal" /><Program name="Affordable Housing and Sustainable Communities" agency="California Strategic Growth Council" type="State" /></div></section>
  </>;
}

function Program({ name, agency, type }: { name: string; agency: string; type: string }) {
  return <div className="program-card"><div className="program-mark"><FileText size={16} /></div><span className="pill">{type}</span><strong>{name}</strong><small>{agency}</small><button onClick={() => window.alert("Program eligibility and current funding are not verified in this demo.")}>Review program <ExternalLink size={12} /></button></div>;
}

function RankingsView(props: SharedProps) {
  const [sortKey, setSortKey] = useState<"score" | "units" | "areaSqFt">("score");
  const [minScore, setMinScore] = useState(0);
  const ranked = [...props.parcels].filter((p) => p.score >= minScore).sort((a, b) => b[sortKey] - a[sortKey]);
  return <>
    <ViewHeading eyebrow="Decision support" title="Opportunity rankings" description="Compare candidates by explainable screening factors. Scores are synthetic and do not imply development approval." right={<button className="button button-secondary" onClick={() => props.onToast("Ranking export is ready from the Reports module.")}><Download size={15} /> Export ranking</button>} />
    <div className="rank-summary-grid"><div className="rank-summary-card"><span className="rank-sum-icon"><Target size={17} /></span><div><small>Ranked sites</small><strong>{ranked.length}</strong></div></div><div className="rank-summary-card"><span className="rank-sum-icon amber"><TrendingUp size={17} /></span><div><small>High priority · score 80+</small><strong>{ranked.filter((p) => p.score >= 80).length}</strong></div></div><div className="rank-summary-card"><span className="rank-sum-icon blue"><Layers3 size={17} /></span><div><small>Indicative unit capacity</small><strong>{ranked.reduce((n, p) => n + p.units, 0).toLocaleString()}</strong></div></div><div className="rank-summary-card"><span className="rank-sum-icon violet"><Info size={17} /></span><div><small>Medium / low confidence</small><strong>{ranked.filter((p) => p.confidence !== "High").length}</strong></div></div></div>
    <section className="panel ranking-panel"><div className="ranking-toolbar"><div><h2>Ranked candidate sites</h2><p>Composite index weights: parcel size 30% · housing need 27% · transit 20% · infrastructure 13% · constraint screen 10%</p></div><div className="ranking-controls"><label>Minimum score <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}><option value={0}>Any</option><option value={60}>60+</option><option value={70}>70+</option><option value={80}>80+</option></select></label><label>Sort by <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)}><option value="score">Score</option><option value="units">Unit estimate</option><option value="areaSqFt">Parcel area</option></select></label></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Rank</th><th>Property</th><th>Opportunity</th><th>Parcel area</th><th>Indicative units</th><th>Confidence</th><th>Score</th><th></th></tr></thead><tbody>{ranked.slice(0, 50).map((p, i) => <tr key={p.id} onClick={() => props.onSelect(p)}><td className="rank-number">{String(i + 1).padStart(2, "0")}</td><td><strong>{p.address}</strong><small>{p.apn} · {p.city}</small></td><td><span className="pill">{p.category}</span></td><td>{p.areaSqFt.toLocaleString()} sf</td><td>{p.units}</td><td><span className={`confidence ${p.confidence.toLowerCase()}`}><i />{p.confidence}</span></td><td><ScoreBadge score={p.score} /></td><td><button className="table-open" onClick={(e) => { e.stopPropagation(); props.onSelect(p); props.onNavigate("Property Intelligence"); }} aria-label={`Open ${p.apn}`}><ChevronRight size={15} /></button></td></tr>)}</tbody></table></div><div className="ranking-footer"><Info size={13} /> Top 50 of {ranked.length} matching demonstration sites · Score is an explainable screening aid only.</div></section>
    <section className="panel ranking-explanation"><div><span className="eyebrow">MODEL TRANSPARENCY</span><h2>How the score is composed</h2><p>Each component is scaled to 0–100 and combined with fixed weights. No protected characteristics are used.</p></div><div className="weight-list"><Weight label="Parcel size" value="30%" /><Weight label="Housing need indicator" value="27%" /><Weight label="Transit context" value="20%" /><Weight label="Infrastructure indicator" value="13%" /><Weight label="Constraint screen" value="10%" /></div></section>
  </>;
}

function Weight({ label, value }: { label: string; value: string }) { return <div className="weight-item"><span>{label}</span><strong>{value}</strong></div>; }

function RegionalView(props: SharedProps) {
  const regions = demoRegionalIndicators;
  return <>
    <ViewHeading eyebrow="Regional intelligence" title="Southern California overview" description="Compare regional indicators and pilot coverage across target jurisdictions." right={<button className="select-button" onClick={() => props.onToast("Regional scope is fixed to the Southern California pilot in this demo.")}><MapPin size={13} /> Southern California pilot</button>} />
    <div className="demo-banner"><span className="demo-banner-icon"><Info size={15} /></span><span>Only Los Angeles County has synthetic demo sites loaded. All regional comparisons are placeholder indicators, not official statistics.</span></div>
    <div className="regional-metrics"><div className="regional-card"><small>Target jurisdictions</small><strong>5</strong><span>Configured for pilot consideration</span></div><div className="regional-card"><small>Demo coverage</small><strong>1 <em>of 5</em></strong><span>Los Angeles County · synthetic</span></div><div className="regional-card"><small>Regional opportunity index</small><strong>67 <em>/ 100</em></strong><span>Illustrative weighted average</span></div></div>
    <div className="regional-grid"><section className="panel region-chart-panel"><div className="panel-heading"><div><h2>Regional screening indicators</h2><p>Composite opportunity index · demo values</p></div><button className="icon-button" aria-label="About chart" onClick={() => props.onToast("Regional values are placeholder synthetic indicators.")}><Info size={15} /></button></div><div className="region-chart">{regions.map((r, i) => <div className="region-bar-row" key={r.name}><span>{r.name}</span><div><i style={{ width: `${r.score}%` }} className={i === 0 ? "active" : ""} /></div><strong>{r.score}</strong></div>)}</div><div className="chart-legend"><span><i /> Opportunity index</span><span><i className="legend-need" /> Housing need indicator</span></div></section><section className="panel region-coverage-panel"><div className="panel-heading"><div><h2>Jurisdiction readiness</h2><p>Pilot data coverage checklist</p></div></div><div className="jurisdiction-list">{regions.map((region, i) => <div className="jurisdiction-row" key={region.name}><span className={`jurisdiction-state ${i === 0 ? "ready" : "pending"}`}>{i === 0 ? <Check size={13} /> : <CircleHelp size={13} />}</span><span><strong>{region.name}</strong><small>{i === 0 ? "Demo parcel sample available" : "Coverage requires verification"}</small></span><span className={`pill ${i === 0 ? "pill-teal" : ""}`}>{i === 0 ? "Demo ready" : "Not verified"}</span></div>)}</div></section></div>
    <section className="panel regional-insight"><span className="ai-mark"><Sparkles size={15} /></span><div><span className="eyebrow">AI GENERATED INSIGHT · DEMO</span><h2>Coverage is currently centered on Los Angeles County</h2><p>Other target counties need parcel, zoning, housing, and environmental source verification before regional comparisons can be treated as decision support. The current indicator values are placeholders.</p></div><button className="button button-secondary" onClick={() => props.onNavigate("Data Sources")}>Review data readiness <ArrowRight size={14} /></button></section>
  </>;
}

function AssistantView(props: SharedProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([{ role: "assistant", text: "Hi Alex. I can help explore this demonstration workspace, compare synthetic sites, or explain the screening model. I’ll label any missing or unverified evidence clearly." }]);
  const [busy, setBusy] = useState(false);
  const prompts = ["What are the top 5 opportunities?", "How is the opportunity score calculated?", "What should I verify before a site visit?"];
  async function send(value = input) {
    if (!value.trim() || busy) return;
    setMessages((items) => [...items, { role: "user", text: value.trim() }]); setInput(""); setBusy(true);
    try {
      const res = await fetch("/api/v1/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: value.trim(), parcelId: props.selected.id }) });
      if (!res.ok) throw new Error("Assistant API unavailable");
      const data = await res.json() as { answer: string };
      setMessages((items) => [...items, { role: "assistant", text: data.answer }]);
    } catch {
      setMessages((items) => [...items, { role: "assistant", text: fallbackAssistant(value, props.parcels, props.selected) }]);
    } finally { setBusy(false); }
  }
  return <>
    <ViewHeading eyebrow="AI research workspace" title="AI housing assistant" description="Ask questions about the synthetic demonstration data and review the evidence behind each answer." right={<span className="assistant-status"><i /> Demo mode</span>} />
    <div className="assistant-grid"><section className="panel chat-panel"><div className="chat-header"><div className="assistant-avatar"><Sparkles size={16} /></div><div><strong>AHOE research assistant</strong><small>Workspace scope · synthetic demo data</small></div><button className="icon-button" aria-label="Clear chat" onClick={() => setMessages([])}>↻</button></div><div className="chat-messages">{messages.map((message, i) => <div key={`${message.role}-${i}`} className={`chat-message ${message.role}`}><div className="chat-message-avatar">{message.role === "assistant" ? <Sparkles size={13} /> : "A"}</div><div className="chat-bubble">{message.text}{message.role === "assistant" && i > 0 && <div className="chat-citation"><FileText size={12} /> Demonstration dataset · {props.selected.apn}</div>}</div></div>)}{busy && <div className="chat-message assistant"><div className="chat-message-avatar"><Sparkles size={13} /></div><div className="chat-bubble typing"><i /><i /><i /></div></div>}</div><div className="prompt-chips">{prompts.map((p) => <button key={p} onClick={() => void send(p)}>{p}</button>)}</div><form className="chat-input-row" onSubmit={(e) => { e.preventDefault(); void send(); }}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about sites, scores, or next steps…" /><button className="send-button" disabled={!input.trim() || busy} aria-label="Send message"><Send size={16} /></button></form><div className="chat-footnote"><Info size={12} /> Answers may be incomplete. Verify all property, zoning, and financial information.</div></section><aside className="assistant-sidebar"><section className="panel context-panel"><div className="panel-heading"><div><h2>Current context</h2><p>Information available to assistant</p></div></div><div className="context-record"><span className="context-pin"><MapPin size={15} /></span><div><strong>{props.selected.apn}</strong><small>{props.selected.city}, CA · demo record</small></div><ScoreBadge score={props.selected.score} /></div><div className="context-divider" /><ContextLine label="Site area" value={`${props.selected.areaSqFt.toLocaleString()} sf`} /><ContextLine label="Opportunity type" value={props.selected.category} /><ContextLine label="Confidence" value={props.selected.confidence} /><ContextLine label="Source coverage" value="Synthetic only" /><button className="text-button" onClick={() => props.onNavigate("Property Intelligence")}>Open property profile <ArrowRight size={13} /></button></section><section className="panel agent-info"><div className="agent-icon"><Layers3 size={16} /></div><strong>Available demo tools</strong><p>The assistant can inspect parcel attributes, score factors, sample zoning excerpts, and local feasibility calculations.</p><div className="agent-tags"><span>Parcel search</span><span>Scoring</span><span>Feasibility</span><span>Sample sources</span></div></section></aside></div>
  </>;
}

function fallbackAssistant(question: string, parcels: DemoParcel[], selected: DemoParcel) {
  const q = question.toLowerCase();
  if (q.includes("top") || q.includes("rank")) {
    return `The highest-scoring sites in this synthetic view are ${[...parcels].sort((a, b) => b.score - a.score).slice(0, 5).map((p) => `${p.apn} (${p.score})`).join(", ")}. These are model outputs only and are not verified properties or development recommendations.`;
  }
  if (q.includes("score")) return "The demo score weights parcel size (30%), housing need indicator (27%), transit context (20%), infrastructure indicator (13%), and a constraint screen (10%). All component values are synthetic and no protected characteristics are used.";
  return `For ${selected.apn}, I can see a synthetic ${selected.areaSqFt.toLocaleString()} sq ft site with a ${selected.score}/100 demo opportunity score. Before any real site decision, verify ownership, survey, current zoning, title, environmental conditions, utilities, access, market assumptions, and community priorities with authoritative sources.`;
}

function ContextLine({ label, value }: { label: string; value: string }) { return <div className="context-line"><span>{label}</span><strong>{value}</strong></div>; }

function ReportsView(props: SharedProps) {
  const [generated, setGenerated] = useState(false);
  const [format, setFormat] = useState<"json" | "csv">("json");
  const report = {
    title: "AHOE Demonstration Property Brief",
    notice: "DEMONSTRATION DATA — NOT VERIFIED PROPERTY INFORMATION",
    generatedAt: new Date().toISOString(),
    property: props.selected,
    disclaimer: "Synthetic property and indicator records. Not legal, financial, engineering, environmental, or entitlement advice.",
    scoreFactors: { parcelArea: 30, housingNeed: 27, transit: 20, infrastructure: 13, constraintScreen: 10 },
  };
  function download(format: "json" | "csv") {
    const content = format === "json" ? JSON.stringify(report, null, 2) : ["field,value", `parcel_id,${props.selected.id}`, `apn,${props.selected.apn}`, `site_label,${props.selected.address}`, `city,${props.selected.city}`, `area_sq_ft,${props.selected.areaSqFt}`, `opportunity_score,${props.selected.score}`, `category,${props.selected.category}`, `confidence,${props.selected.confidence}`, `data_classification,synthetic demonstration data`].join("\n");
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `ahoe-${props.selected.apn.toLowerCase()}-demo.${format}`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setGenerated(true); props.onToast(`${format.toUpperCase()} demonstration report downloaded.`);
  }
  return <>
    <ViewHeading eyebrow="Decision-ready outputs" title="Reports & exports" description="Generate a source-labeled property brief or export the current ranked sites." right={<button className="button button-primary" onClick={() => download(format)}><FileText size={15} /> Download {format.toUpperCase()}</button>} />
    <div className="demo-banner"><span className="demo-banner-icon"><Info size={15} /></span><span>Reports generated here clearly label synthetic demonstration data and carry the same unverified-data disclaimers.</span></div>
    <div className="report-feature-grid">
      <section className="panel report-generator">
        <div className="report-feature-icon"><FileText size={19} /></div><span className="eyebrow">PROPERTY REPORT</span><h2>Demonstration property brief</h2>
        <p>Generate a structured summary with site attributes, opportunity score, confidence, source classification, and screening cautions.</p>
        <div className="report-select-row">
          <label>Property<select value={props.selected.id} onChange={(e) => { const p = demoParcels.find((item) => item.id === e.target.value); if (p) props.onSelect(p); }}>{demoParcels.map((p) => <option key={p.id} value={p.id}>{p.apn} · {p.city}</option>)}</select></label>
          <label>Format<select value={format} onChange={(e) => setFormat(e.target.value as "json" | "csv")}><option value="json">JSON</option><option value="csv">CSV</option></select></label>
        </div>
        <div className="report-actions"><button className="button button-primary" onClick={() => download(format)}><Download size={14} /> Download {format.toUpperCase()}</button><button className="button button-secondary" onClick={() => download(format === "json" ? "csv" : "json")}><Download size={14} /> Download {format === "json" ? "CSV" : "JSON"}</button></div>
        {generated && <div className="inline-success"><Check size={14} /> Report generated with a demonstration-data notice.</div>}
      </section>
      <section className="panel report-preview">
        <div className="panel-heading"><div><h2>Report preview</h2><p>Property brief · {props.selected.apn}</p></div><span className="pill pill-teal">Ready</span></div>
        <div className="report-preview-page"><div className="report-preview-brand"><span className="brand-mark small-mark">A</span><span>AHOE <small>PROPERTY BRIEF</small></span></div><div className="report-preview-banner">DEMONSTRATION DATA · NOT VERIFIED</div><h3>{props.selected.address}</h3><p>{props.selected.city}, {props.selected.state} · {props.selected.apn}</p><div className="report-preview-score"><strong>{props.selected.score}</strong><span>Preliminary opportunity score</span><small>{props.selected.confidence} confidence · synthetic score</small></div><div className="report-preview-values"><div><small>Parcel area</small><strong>{props.selected.areaSqFt.toLocaleString()} sf</strong></div><div><small>Indicative units</small><strong>{props.selected.units}</strong></div><div><small>Opportunity type</small><strong>{props.selected.category}</strong></div></div><p className="report-preview-disclaimer">This report contains synthetic demonstration values and is not a verified property record or development recommendation.</p></div>
      </section>
    </div>
    <section className="panel export-options"><SectionLabel>Other exports</SectionLabel><div className="export-row"><div className="export-icon"><Layers3 size={17} /></div><div><strong>Opportunity ranking</strong><small>Download filtered parcel scores and explainable factors.</small></div><button className="button button-secondary" onClick={() => { const rows = ["APN,City,Category,Area Sq Ft,Units,Score,Confidence", ...[...props.parcels].sort((a, b) => b.score - a.score).map((p) => `${p.apn},${p.city},${p.category},${p.areaSqFt},${p.units},${p.score},${p.confidence}`)]; const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = "ahoe-demo-opportunity-ranking.csv"; a.click(); URL.revokeObjectURL(url); props.onToast("Ranking CSV downloaded."); }}><Download size={14} /> CSV</button></div></section>
  </>;
}

function DataSourcesView(props: SharedProps) {
  const [activeTab, setActiveTab] = useState("Connected providers");
  const [tested, setTested] = useState(false);
  const candidateSources = [
    ["HUD eGIS", "Housing and community development data", "Federal"],
    ["U.S. Census Bureau", "ACS demographic and housing estimates", "Federal"],
    ["FEMA National Flood Hazard Layer", "Flood hazard screening", "Federal"],
    ["California HCD", "Housing element and state housing data", "California"],
    ["Local planning departments", "Zoning code, parcel, and land use records", "Jurisdiction specific"],
  ];
  return <>
    <ViewHeading eyebrow="Data & provenance" title="Data sources" description="Review connected demo providers and candidates for a verified Southern California pilot." right={<button className="button button-secondary" onClick={() => { setTested(true); props.onToast("Demo provider check complete. No external data connections are configured."); }}><TrendingUp size={15} /> Test connections</button>} />
    <div className="demo-banner warning"><span className="demo-banner-icon"><Info size={15} /></span><span>No external provider credentials or authoritative datasets are configured. Candidate integrations below are unconnected.</span></div>
    <div className="source-tabs">{["Connected providers", "Integration catalog", "Data quality"].map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
    {activeTab === "Connected providers" && <section className="panel connected-source-panel"><div className="panel-heading"><div><h2>Workspace providers</h2><p>Source classification is visible throughout the application</p></div><span className={`provider-status ${tested ? "offline" : "demo"}`}><i />{tested ? "0 live connections" : "Demo mode"}</span></div><div className="table-wrap"><table className="data-table source-table"><thead><tr><th>Provider</th><th>Data type</th><th>Status</th><th>Last update</th><th>Provenance notes</th><th></th></tr></thead><tbody>{demoDataSources.map((source) => <tr key={source.name}><td><strong>{source.name}</strong></td><td>{source.type}</td><td><span className="provider-status demo"><i />{source.status}</span></td><td>{source.updated}</td><td>{source.note}</td><td><button className="table-open" onClick={() => props.onToast("Demo provider is read-only and synthetic.")}><ChevronRight size={15} /></button></td></tr>)}</tbody></table></div></section>}
    {activeTab === "Integration catalog" && <section className="panel catalog-panel"><div className="panel-heading"><div><h2>Potential pilot integrations</h2><p>Catalog only · availability and terms must be confirmed</p></div></div><div className="catalog-grid">{candidateSources.map(([name, description, category]) => <div key={name} className="catalog-card"><span className="catalog-category">{category}</span><div className="catalog-icon"><Layers3 size={16} /></div><strong>{name}</strong><p>{description}</p><button onClick={() => props.onToast(`${name} is listed as a candidate integration; it is not connected.`)}>View integration notes <ArrowRight size={12} /></button></div>)}</div></section>}
    {activeTab === "Data quality" && <section className="panel quality-panel"><div className="panel-heading"><div><h2>Demo data quality status</h2><p>100% of current records are synthetic</p></div><span className="pill pill-amber">Not for decisions</span></div><div className="quality-grid"><QualityItem label="Parcel geometry" value="Synthetic rectangles" status="Not verified" /><QualityItem label="Zoning" value="Fictional labels" status="No official source" /><QualityItem label="Housing indicators" value="Generated scores" status="Not official" /><QualityItem label="Environmental" value="Placeholder flags" status="Not a site assessment" /></div><div className="quality-callout"><Info size={15} /><span>Before a municipal pilot, independently confirm licensing, update cadence, geographic coverage, schema, coordinate reference system, and acceptable use for every source.</span></div></section>}
  </>;
}

function QualityItem({ label, value, status }: { label: string; value: string; status: string }) { return <div className="quality-item"><small>{label}</small><strong>{value}</strong><span><i />{status}</span></div>; }

function WorkspaceUtilityView(props: SharedProps) {
  const copy: Record<string, { title: string; description: string; action: string }> = {
    "Projects": { title: "Projects", description: "Organize candidate sites, analyses, and reports by initiative.", action: "Create project" },
    "Saved Properties": { title: "Saved properties", description: "Your bookmarked demonstration sites are stored in this browser session.", action: "Explore map" },
    "Analysis History": { title: "Analysis history", description: "Review recent parcel screens and feasibility runs in the workspace.", action: "Run analysis" },
    "Team Members": { title: "Team members", description: "Manage workspace access and role assignments.", action: "Invite teammate" },
    "Notifications": { title: "Notifications", description: "Stay current on saved searches, data updates, and analyses.", action: "Mark all as read" },
    "Organization Settings": { title: "Organization settings", description: "Configure workspace identity, geography, and data retention preferences.", action: "Edit settings" },
    "User Management": { title: "User management", description: "Review members and role access for this demonstration organization.", action: "Invite user" },
    "Data Integrations": { title: "Data integrations", description: "Configure provider credentials and scheduled ingestion jobs.", action: "Browse integrations" },
    "AI Configuration": { title: "AI configuration", description: "Set provider, model, retrieval scope, and safety controls.", action: "Edit configuration" },
    "Billing and Subscription": { title: "Billing and subscription", description: "Subscription management is not enabled in this local demonstration.", action: "View plan options" },
    "Audit Logs": { title: "Audit logs", description: "Track workspace changes, exports, and analysis actions.", action: "Export audit log" },
  };
  const item = copy[props.active] ?? copy.Projects;
  const [showInvite, setShowInvite] = useState(false);
  const saved = props.parcels.filter((parcel) => props.savedIds.includes(parcel.id));
  const activityRows = props.active === "Analysis History" ? ["Initial synthetic parcel screening · 100 sites · Completed just now", `Property snapshot · ${props.selected.apn} · Available`, "Feasibility model · No run recorded"] : props.active === "Notifications" ? ["Demo environment loaded successfully", "No verified data integrations are connected", "Review synthetic data notice before sharing reports"] : [];
  const handleClick = () => {
    if (props.active === "Saved Properties") props.onNavigate("Housing Opportunity Map");
    else if (props.active === "Analysis History") props.onNavigate("Development Feasibility");
    else if (props.active === "Data Integrations") props.onNavigate("Data Sources");
    else if (["Team Members", "User Management"].includes(props.active)) setShowInvite(true);
    else props.onToast(`${props.active} action is ready for configuration in the production workspace.`);
  };
  return <>
    <ViewHeading eyebrow="Workspace" title={item.title} description={item.description} right={<button className="button button-primary" onClick={handleClick}>{["Team Members", "User Management"].includes(props.active) ? <Plus size={15} /> : <ArrowRight size={15} />}{item.action}</button>} />
    {props.active === "Saved Properties" ? <section className="panel utility-list-panel"><SectionLabel>Saved demonstration sites <span className="subtle-label">{saved.length} saved</span></SectionLabel>{saved.length ? <div className="opportunity-rows">{saved.map((p) => <button className="opportunity-row" key={p.id} onClick={() => { props.onSelect(p); props.onNavigate("Property Intelligence"); }}><span className="parcel-initial"><Bookmark size={14} /></span><span className="row-main"><strong>{p.address}</strong><small>{p.apn} · {p.city} · {p.category}</small></span><ScoreBadge score={p.score} /><ChevronRight size={15} /></button>)}</div> : <EmptyState title="No saved sites yet" body="Save a site from its property profile or opportunity map to keep it here." />}</section> : props.active === "Team Members" || props.active === "User Management" ? <section className="panel team-panel"><SectionLabel>Workspace access <span className="pill pill-teal">Demo organization</span></SectionLabel><div className="member-row"><span className="member-avatar">AC</span><span><strong>Alex Chen</strong><small>alex.chen@demo.ahoe.app</small></span><span className="member-role">Organization admin</span><span className="pill pill-teal">Active</span><button className="icon-button" aria-label="Member options" onClick={() => props.onToast("The current demo administrator cannot be removed.")}><ChevronDown size={14} /></button></div><div className="empty-team"><span className="team-graphic"><Plus size={21} /></span><strong>Bring your team into the workspace</strong><p>Invite planners, analysts, and reviewers with role-based access.</p><button className="button button-secondary" onClick={() => setShowInvite(true)}><Plus size={14} /> Invite a teammate</button></div>{showInvite && <InviteModal onClose={() => setShowInvite(false)} onToast={props.onToast} />}</section> : props.active === "Analysis History" || props.active === "Notifications" ? <section className="panel utility-list-panel"><SectionLabel>Recent items</SectionLabel>{activityRows.map((row, i) => <div className="utility-row" key={row}><span className="activity-icon"><FileText size={15} /></span><div><strong>{row}</strong><small>{i === 0 ? "Today" : "Demonstration workspace"}</small></div><button className="text-button" onClick={() => props.onNavigate(i === 1 ? "Property Intelligence" : "Development Feasibility")}>Open <ArrowRight size={12} /></button></div>)}</section> : props.active === "Projects" ? <section className="panel project-grid-panel"><SectionLabel>Active projects <span className="pill">1 project</span></SectionLabel><button className="project-card" onClick={() => props.onNavigate("Housing Opportunity Map")}><div className="project-card-top"><span className="project-icon"><MapPin size={17} /></span><span className="pill pill-teal">In progress</span></div><h3>Southern California Housing Pilot</h3><p>Explore and prioritize early-stage housing sites across target jurisdictions.</p><div className="project-meta"><span><MapPin size={12} /> 5 counties</span><span><Layers3 size={12} /> 100 demo sites</span><span>Updated just now</span></div><div className="project-progress"><i /></div><strong className="project-progress-label">Pilot readiness · 20%</strong></button></section> : <section className="panel settings-panel"><div className="settings-head"><span className="settings-icon"><Layers3 size={18} /></span><div><h2>{item.title} configuration</h2><p>Values are local to this demonstration workspace. Production settings require authenticated server-side controls.</p></div></div><div className="settings-list"><Setting label="Organization" value="Civic Housing Lab · Demo" /><Setting label="Workspace role" value="Organization administrator" /><Setting label="Data mode" value="Synthetic demonstration" /><Setting label="Geographic scope" value="Southern California pilot" /><Setting label="Access control" value="Local browser demo · not enforced server-side" /></div><div className="settings-warning"><ShieldAlert size={15} /> Do not use this demo for confidential or regulated data.</div></section>}
  </>;
}

function Setting({ label, value }: { label: string; value: string }) { return <div className="setting-row"><span>{label}</span><strong>{value}</strong><button className="text-button" onClick={() => window.alert("This local demonstration setting is read-only.")}>Edit</button></div>; }

function InviteModal({ onClose, onToast }: { onClose: () => void; onToast: (message: string) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Analyst");
  const [sent, setSent] = useState(false);
  return <div className="modal-backdrop" onClick={onClose}><div className="invite-modal" onClick={(e) => e.stopPropagation()}><div className="panel-heading"><div><h2>Invite teammate</h2><p>Demo invite flow · no email will be sent</p></div><button className="icon-button" onClick={onClose}>×</button></div>{sent ? <div className="invite-success"><span><Check size={20} /></span><strong>Invite staged</strong><p>{email} is shown as a pending demo invitation. No email was sent.</p><button className="button button-primary" onClick={onClose}>Done</button></div> : <form onSubmit={(e) => { e.preventDefault(); if (!email.includes("@")) return; setSent(true); onToast("Demo invitation staged locally. No email was sent."); }}><label className="number-field"><span>Email address</span><div><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@organization.org" /></div></label><label className="number-field role-field"><span>Workspace role</span><div><select value={role} onChange={(e) => setRole(e.target.value)}><option>Analyst</option><option>Viewer</option><option>Government planner</option><option>Organization admin</option></select></div></label><div className="role-description">{role} access will be simulated in this local demo.</div><div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary"><Send size={14} /> Stage invitation</button></div></form>}</div></div>;
}

function EmptyState({ title, body }: { title: string; body: string }) { return <div className="empty-state"><div><Search size={18} /></div><strong>{title}</strong><p>{body}</p></div>; }

