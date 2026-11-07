"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowDownToLine, Bell, ChevronDown, ChevronsLeft, ChevronsRight,
  CircleHelp, Command, Database, FileText, FolderKanban, Gauge, Home, Layers,
  Map, Menu, Search, Settings,
  ShieldCheck, Sparkles, Target, Users, X, Zap,
} from "lucide-react";
import { demoParcels, type DemoParcel } from "@/lib/domain";
import { WorkspaceView, type WorkspaceSection } from "@/components/module-views";

type NavItem = { label: WorkspaceSection; icon: React.ReactNode; badge?: string };
const mainNavigation: NavItem[] = [
  { label: "Overview", icon: <Home size={16} /> },
  { label: "Housing Opportunity Map", icon: <Map size={16} /> },
  { label: "Property Intelligence", icon: <Layers size={16} /> },
  { label: "Zoning Intelligence", icon: <FileText size={16} /> },
  { label: "Development Feasibility", icon: <Gauge size={16} /> },
  { label: "Affordable Housing", icon: <Target size={16} /> },
  { label: "Opportunity Rankings", icon: <Activity size={16} /> },
  { label: "Regional Intelligence", icon: <Database size={16} /> },
  { label: "AI Housing Assistant", icon: <Sparkles size={16} />, badge: "AI" },
  { label: "Reports", icon: <FileText size={16} /> },
  { label: "Data Sources", icon: <Database size={16} /> },
];
const workspaceNavigation: NavItem[] = [
  { label: "Projects", icon: <FolderKanban size={16} /> },
  { label: "Saved Properties", icon: <Target size={16} /> },
  { label: "Analysis History", icon: <Activity size={16} /> },
  { label: "Team Members", icon: <Users size={16} /> },
  { label: "Notifications", icon: <Bell size={16} />, badge: "2" },
];
const adminNavigation: NavItem[] = [
  { label: "Organization Settings", icon: <Settings size={16} /> },
  { label: "User Management", icon: <Users size={16} /> },
  { label: "Data Integrations", icon: <Database size={16} /> },
  { label: "AI Configuration", icon: <Sparkles size={16} /> },
  { label: "Billing and Subscription", icon: <Zap size={16} /> },
  { label: "Audit Logs", icon: <ShieldCheck size={16} /> },
];

export default function AppShell() {
  const [active, setActive] = useState<WorkspaceSection>("Overview");
  const [selected, setSelected] = useState<DemoParcel>(demoParcels[9]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All opportunities");
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("ahoe-demo-saved-v1") ?? "[]") as string[]; } catch { return []; }
  });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [workspaceName, setWorkspaceName] = useState("Civic Housing Lab");
  const searchRef = useRef<HTMLInputElement>(null);
  const filteredParcels = useMemo(() => demoParcels.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [p.apn, p.id, p.address, p.city, p.category].some((value) => value.toLowerCase().includes(q));
    return matchesQuery && (category === "All opportunities" || p.category === category);
  }), [query, category]);

  useEffect(() => {
    try { window.localStorage.setItem("ahoe-demo-saved-v1", JSON.stringify(savedIds)); } catch { /* browser storage may be disabled */ }
  }, [savedIds]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === "Escape") { setMobileOpen(false); setProfileOpen(false); setOrgOpen(false); setNotificationsOpen(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string) => setToast(message), []);
  const navigate = useCallback((section: WorkspaceSection) => { setActive(section); setMobileOpen(false); }, []);
  function saveProperty(parcel: DemoParcel) {
    setSavedIds((current) => current.includes(parcel.id) ? current.filter((id) => id !== parcel.id) : [...current, parcel.id]);
    setToast(savedIds.includes(parcel.id) ? "Property removed from saved sites." : "Property saved to this browser workspace.");
  }

  return <div className={`app-frame ${collapsed ? "sidebar-collapsed" : ""}`}>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-brand-row"><button className="brand-lockup" onClick={() => navigate("Overview")} aria-label="AHOE home"><span className="brand-mark">A</span><span className="brand-wordmark">AHOE<small>HOUSING INTELLIGENCE</small></span></button><button className="sidebar-collapse-button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}</button><button className="mobile-close" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
      <div className="organization-switcher-wrap"><button className="organization-switcher" onClick={() => setOrgOpen((open) => !open)}><span className="organization-avatar">CH</span><span className="organization-label"><strong>{workspaceName}</strong><small>DEMO WORKSPACE</small></span><ChevronDown size={14} className="org-chevron" /></button>{orgOpen && <div className="popover org-popover"><span className="popover-eyebrow">WORKSPACES</span><button onClick={() => { setWorkspaceName("Civic Housing Lab"); setOrgOpen(false); }}><span className="organization-avatar">CH</span><span><strong>Civic Housing Lab</strong><small>Current · Demo</small></span><span className="active-check">✓</span></button><button onClick={() => { setWorkspaceName("Regional Housing Lab"); setOrgOpen(false); notify("Switched to Regional Housing Lab demo workspace."); }}><span className="organization-avatar org-alt">RH</span><span><strong>Regional Housing Lab</strong><small>Demo workspace</small></span></button><div className="popover-divider" /><button className="popover-action" onClick={() => { setOrgOpen(false); notify("Workspace creation is not persisted in this demo."); }}><span className="plus-mini">+</span> Create workspace</button></div>}</div>
      <div className="sidebar-scroll"><NavGroup title="EXPLORE" items={mainNavigation} active={active} onSelect={navigate} collapsed={collapsed} /><NavGroup title="WORKSPACE" items={workspaceNavigation} active={active} onSelect={navigate} collapsed={collapsed} /><NavGroup title="ADMINISTRATION" items={adminNavigation} active={active} onSelect={navigate} collapsed={collapsed} /></div>
      <div className="sidebar-bottom">
        <div className="sidebar-help-card"><div className="help-card-icon"><CircleHelp size={15} /></div><div className="help-card-copy"><strong>Need a hand?</strong><span>Visit the product guide</span></div><button aria-label="Help" onClick={() => notify("Product guide is part of the local demo documentation.")}><ArrowDownToLine size={14} /></button></div>
        <div className="profile-switcher-wrap">
          <button className="profile-switcher" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
            <span className="profile-avatar">AC</span><span className="profile-copy"><strong>Alex Chen</strong><small>Organization admin</small></span><ChevronDown size={14} />
          </button>
          {profileOpen && <div className="popover profile-popover"><span className="popover-eyebrow">YOUR ACCOUNT</span><button onClick={() => { navigate("Organization Settings"); setProfileOpen(false); }}>Profile settings</button><button onClick={() => { notify("You are signed in to a local demonstration session."); setProfileOpen(false); }}>Session information</button><div className="popover-divider" /><button onClick={() => { notify("Logout is not enabled in the local demonstration."); setProfileOpen(false); }}>Sign out</button></div>}
        </div>
      </div>
    </aside>
    <div className="main-column"><header className="topbar"><div className="topbar-left"><button className="mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><ChevronDown size={12} /><strong>{active}</strong></div></div><div className="topbar-right"><label className="global-search"><Search size={15} /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search parcels, places, projects…" /><kbd><Command size={11} /> K</kbd></label><span className="topbar-divider" /><button className={`topbar-icon ${notificationsOpen ? "selected" : ""}`} aria-label="Notifications" onClick={() => setNotificationsOpen((open) => !open)}><Bell size={17} /><i /></button>{notificationsOpen && <div className="popover notification-popover"><div className="notification-popover-head"><strong>Notifications</strong><span className="pill pill-teal">2 new</span></div><div className="notification-entry"><span className="notif-dot" /><div><strong>Demo workspace is ready</strong><small>100 synthetic sites loaded · just now</small></div></div><div className="notification-entry"><span className="notif-dot amber-dot" /><div><strong>Data verification required</strong><small>No authoritative sources connected · just now</small></div></div><button className="text-button" onClick={() => { navigate("Notifications"); setNotificationsOpen(false); }}>View all notifications <span>→</span></button></div>}<span className="topbar-env"><i /> Demo</span><span className="user-mini-avatar">AC</span></div></header>
      <main className="main-content"><WorkspaceView active={active} parcels={filteredParcels} selected={selected} query={query} setQuery={setQuery} category={category} setCategory={setCategory} savedIds={savedIds} onSelect={setSelected} onSave={saveProperty} onNavigate={navigate} onToast={notify} /></main>
      <footer className="app-footer"><span><span className="footer-mark">A</span> AHOE <span className="footer-copy">AI Housing Opportunity Engine</span></span><span className="footer-center"><ShieldCheck size={12} /> Source transparency by design</span><span className="footer-demo"><i /> Synthetic demonstration environment</span></footer>
    </div>
    {toast && <div role="status" className="toast"><span className="toast-check">✓</span>{toast}<button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={14} /></button></div>}
  </div>;
}

function NavGroup({ title, items, active, onSelect, collapsed }: { title: string; items: NavItem[]; active: WorkspaceSection; onSelect: (section: WorkspaceSection) => void; collapsed: boolean }) {
  return <div className="nav-group"><div className="nav-group-title">{collapsed ? <span className="nav-collapsed-rule" /> : title}</div>{items.map((item) => <button key={item.label} className={`nav-item ${active === item.label ? "active" : ""}`} onClick={() => onSelect(item.label)} title={collapsed ? item.label : undefined}><span className="nav-icon">{item.icon}</span><span className="nav-label">{item.label}</span>{item.badge && <span className={`nav-badge ${item.badge === "AI" ? "ai" : ""}`}>{item.badge}</span>}</button>)}</div>;
}

