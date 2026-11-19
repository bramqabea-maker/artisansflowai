import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Activity, ArrowUpRight, Bell, BriefcaseBusiness, Check, ChevronDown, ChevronRight,
  CircleHelp, ClipboardList, Download, FileText, Filter, Hammer, LayoutDashboard, Menu,
  MoreHorizontal, Plus, Search, Settings, ShieldCheck, Sparkles, Trash2, TrendingUp, Users, Wrench, X
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const STORE = 'artisanflow-v2';
const SUBSCRIPTION_STORE = 'artisanflow-subscription-v1';
const euro = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n || 0));
const dateFR = value => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
const plans = [
  { id:'free', name:'Découverte', price:0, description:'Pour tester ArtisanFlow avec vos premiers dossiers.', features:['Jusqu’à 5 demandes','Création de devis','Gestion des clients','Export CSV'] },
  { id:'pro', name:'Pro', price:19, description:'Pour les artisans qui veulent gagner du temps chaque semaine.', popular:true, features:['Demandes illimitées','Devis illimités','Suivi commercial','Export CSV','Assistance prioritaire'] },
  { id:'business', name:'Équipe', price:39, description:'Pour développer votre activité et travailler à plusieurs.', features:['Tout le forfait Pro','Jusqu’à 5 utilisateurs','Espace équipe','Suivi avancé','Assistance prioritaire'] }
];
const statusOptions = ['Nouveau','À contacter','Devis envoyé','En cours','Accepté','Refusé'];
const statusClass = s => ({'Nouveau':'blue','À contacter':'amber','Devis envoyé':'violet','En cours':'amber','Accepté':'green','Refusé':'red'}[s] || 'gray');

function readLocal(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : []; } catch { return []; } }

export default function App() {
  return <AuthGate />;
}

function AuthGate() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);
  async function submitAuth(e) {
    e.preventDefault(); setAuthError(''); setAuthMessage('');
    if (!supabase) return;
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    if (result.error) { setAuthError(mode === 'login' ? 'E-mail ou mot de passe incorrect.' : result.error.message); return; }
    if (mode === 'signup' && !result.data.session) setAuthMessage('Compte créé. Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous.');
  }
  if (checking) return <div className="auth-screen"><div className="auth-card">Vérification de la connexion…</div></div>;
  if (!supabase) return <div className="auth-screen"><div className="auth-card"><div className="brand auth-brand"><div className="brand-mark"><Wrench size={20}/></div><span>artisan<span className="brand-light">flow</span><sup>AI</sup></span></div><h1>Connexion sécurisée à configurer</h1><p>Pour protéger les comptes de chaque entreprise, connectez d’abord votre projet Supabase.</p><ol><li>Créez un projet sur Supabase.</li><li>Copiez son URL et sa clé publique anon/publishable dans le fichier <code>.env</code>.</li><li>Exécutez le fichier <code>supabase/schema.sql</code> dans SQL Editor.</li><li>Redémarrez l’application avec <code>npm run dev</code>.</li></ol><p className="auth-help">Sans cette configuration, l’application reste verrouillée : aucun mot de passe codé en dur n’est utilisé.</p></div></div>;
  if (!session) return <div className="auth-screen"><form className="auth-card" onSubmit={submitAuth}><div className="brand auth-brand"><div className="brand-mark"><Wrench size={20}/></div><span>artisan<span className="brand-light">flow</span><sup>AI</sup></span></div><h1>{mode === 'login' ? 'Connectez-vous' : 'Créer un compte entreprise'}</h1><p>{mode === 'login' ? 'Accédez à votre espace professionnel.' : 'Créez un accès personnel et sécurisé.'}</p><label>Adresse e-mail<input className="field" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@entreprise.fr"/></label><label>Mot de passe<input className="field" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="8 caractères minimum"/></label>{authError && <p className="auth-error">{authError}</p>}{authMessage && <p className="auth-message">{authMessage}</p>}<button className="primary-button full-button" type="submit">{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button><button className="auth-switch" type="button" onClick={()=>{setMode(mode==='login'?'signup':'login');setAuthError('');setAuthMessage('');}}>{mode === 'login' ? 'Première connexion ? Créer un compte' : 'Déjà un compte ? Se connecter'}</button><small>Les mots de passe sont vérifiés par Supabase et ne sont jamais enregistrés dans le code de l’application.</small></form></div>;
  return <AppContent key={session.user.id} user={session.user} onLogout={() => supabase.auth.signOut()}/>;
}

function AppContent({ user, onLogout }) {
  const userStore = `${STORE}-${user.id}`;
  const subscriptionStore = `${SUBSCRIPTION_STORE}-${user.id}`;
  const [leads, setLeads] = useState(() => readLocal(userStore));
  const [subscription, setSubscription] = useState(() => { try { return JSON.parse(localStorage.getItem(subscriptionStore)) || { plan:'free', status:'active' }; } catch { return { plan:'free', status:'active' }; } });
  const [page, setPage] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Tous');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState({ company:'Mon entreprise', owner:'Mon compte', email:'', phone:'' });
  const [form, setForm] = useState({ name:'', email:'', phone:'', service:'Plomberie', description:'', address:'', amount:'' });
  const [quoteItems, setQuoteItems] = useState([{label:'Prestation',qty:1,price:0}]);
  const [quoteClient, setQuoteClient] = useState('');
  const [quoteTax, setQuoteTax] = useState(10);

  useEffect(() => { localStorage.setItem(userStore, JSON.stringify(leads)); }, [leads, userStore]);
  useEffect(() => { localStorage.setItem(subscriptionStore, JSON.stringify(subscription)); }, [subscription, subscriptionStore]);
  useEffect(() => { if (notice) { const t = setTimeout(() => setNotice(''), 3200); return () => clearTimeout(t); } }, [notice]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session || !active) return;
      const { data: rows, error } = await supabase.from('leads').select('*').order('created_at', { ascending:false });
      if (!error && active && rows) setLeads(rows.map(row => ({ id:row.reference, dbId:row.id, name:row.name, email:row.email, phone:row.phone, service:row.service, description:row.description, address:row.address, status:row.status, amount:Number(row.amount || 0), createdAt:row.created_at })));
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => leads.filter(l => {
    const q = query.toLowerCase();
    const matches = [l.name,l.email,l.service,l.id].some(v => String(v || '').toLowerCase().includes(q));
    return matches && (filter === 'Tous' || l.status === filter);
  }), [leads, query, filter]);
  const total = leads.reduce((a,l) => a + Number(l.amount || 0), 0);
  const accepted = leads.filter(l => l.status === 'Accepté');
  const conversion = leads.length ? Math.round(accepted.length / leads.length * 100) : 0;
  const stats = [
    { label:'Demandes reçues', value:leads.length, change:'Vos demandes', icon:ClipboardList, tone:'blue' },
    { label:'Devis en attente', value:leads.filter(l => ['Nouveau','À contacter','Devis envoyé'].includes(l.status)).length, change:'À traiter', icon:FileText, tone:'violet' },
    { label:'Chantiers acceptés', value:accepted.length, change:`${conversion}% conversion`, icon:Hammer, tone:'green' },
    { label:'Valeur estimée', value:euro(total), change:'Tous les dossiers', icon:TrendingUp, tone:'orange' }
  ];

  async function addLead(e) {
    e.preventDefault();
    if (subscription.plan === 'free' && leads.length >= 5) { setModal(false); setPage('subscription'); setNotice('La formule Découverte est limitée à 5 demandes. Choisissez Pro pour continuer.'); return; }
    const lead = { id:`AF-${Math.floor(1000 + Math.random()*8999)}`, name:form.name.trim(), email:form.email.trim(), phone:form.phone.trim(), service:form.service, description:form.description.trim(), address:form.address.trim(), status:'Nouveau', amount:Number(form.amount || 0), createdAt:new Date().toISOString() };
    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data, error } = await supabase.from('leads').insert({ reference:lead.id, name:lead.name, email:lead.email, phone:lead.phone, service:lead.service, description:lead.description, address:lead.address, status:lead.status, amount:lead.amount, user_id:sessionData.session.user.id }).select().single();
        if (error) { setNotice(`Erreur Supabase : ${error.message}`); return; }
        lead.dbId = data.id;
      }
    }
    setLeads(prev => [lead,...prev]); setForm({ name:'', email:'', phone:'', service:'Plomberie', description:'', address:'', amount:'' }); setModal(false); setNotice('Demande ajoutée avec succès.');
  }
  async function updateStatus(id, status) {
    const lead = leads.find(l => l.id === id);
    if (supabase && lead?.dbId) { const { error } = await supabase.from('leads').update({ status }).eq('id',lead.dbId); if (error) { setNotice(error.message); return; } }
    setLeads(prev => prev.map(l => l.id === id ? {...l,status} : l)); setSelected(prev => prev?.id === id ? {...prev,status} : prev); setNotice('Statut mis à jour.');
  }
  async function deleteLead(id) {
    const lead = leads.find(l => l.id === id);
    if (!window.confirm('Supprimer définitivement cette demande ?')) return;
    if (supabase && lead?.dbId) { const { error } = await supabase.from('leads').delete().eq('id',lead.dbId); if (error) { setNotice(error.message); return; } }
    setLeads(prev => prev.filter(l => l.id !== id)); setSelected(null); setNotice('Demande supprimée.');
  }
  function draftReply(lead) {
    const text = `Bonjour ${lead.name},\n\nMerci pour votre demande concernant : ${lead.service.toLowerCase()}.\n\nNous avons bien reçu votre message et allons étudier votre besoin : « ${lead.description} ». Nous reviendrons vers vous rapidement afin de préciser les éléments nécessaires et convenir de la suite.\n\nBien cordialement,\n${profile.company}`;
    navigator.clipboard?.writeText(text).then(() => setNotice('Réponse préparée et copiée. À relire avant envoi.')).catch(() => setNotice('Réponse préparée : utilisez le panneau de détail pour la copier.'));
    return text;
  }
  function exportCsv() {
    const rows = [['Référence','Nom','E-mail','Téléphone','Service','Statut','Montant','Date'], ...filtered.map(l => [l.id,l.name,l.email,l.phone,l.service,l.status,l.amount,dateFR(l.createdAt)])];
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})); a.download = 'artisanflow-demandes.csv'; a.click(); URL.revokeObjectURL(a.href); setNotice('Export CSV téléchargé.');
  }
  function choosePlan(planId) {
    if (planId === 'free') { setSubscription({ plan:'free', status:'active' }); setNotice('Forfait Découverte sélectionné.'); return; }
    const paymentLink = planId === 'pro' ? import.meta.env.VITE_STRIPE_PAYMENT_LINK_PRO : import.meta.env.VITE_STRIPE_PAYMENT_LINK_BUSINESS;
    if (!paymentLink) { setNotice('Paiement non configuré : ajoute le lien Stripe de cette formule dans le fichier .env. Aucun paiement n’a été effectué.'); return; }
    window.location.assign(paymentLink);
  }

  const nav = [
    { id:'dashboard', label:'Vue d’ensemble', icon:LayoutDashboard },
    { id:'leads', label:'Demandes & clients', icon:Users, count:leads.length },
    { id:'quotes', label:'Créer un devis', icon:FileText },
    { id:'subscription', label:'Abonnement', icon:ShieldCheck },
    { id:'settings', label:'Paramètres', icon:Settings }
  ];
  const go = id => { setPage(id); setMobileOpen(false); setSelected(null); };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?'sidebar-open':''}`}>
      <div className="brand"><div className="brand-mark"><Wrench size={20}/></div><span>artisan<span className="brand-light">flow</span><sup>AI</sup></span></div>
      <div className="workspace"><div className="workspace-avatar">AF</div><div className="workspace-copy"><strong>{profile.company}</strong><span>Espace professionnel</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">ESPACE DE TRAVAIL</div>
      <nav>{nav.map(item => <button key={item.id} className={`nav-item ${page===item.id?'active':''}`} onClick={() => go(item.id)}><item.icon size={18}/><span>{item.label}</span>{item.count !== undefined && <small>{item.count}</small>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Besoin d’aide ?</strong><p>Retrouvez les conseils pour bien démarrer.</p><button onClick={() => setNotice('Centre d’aide : documentation bientôt disponible.')}>Consulter le guide <ChevronRight size={14}/></button></div><div className="user-row"><div className="user-avatar">AF</div><div className="user-info"><strong>{profile.owner}</strong><span>Administrateur</span></div><button className="icon-button" title="Paramètres" onClick={() => go('settings')}><MoreHorizontal size={18}/></button></div></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu"/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)}><Menu size={20}/></button><div className="breadcrumb">Espace de travail <ChevronRight size={14}/> <strong>{nav.find(n=>n.id===page)?.label || 'Détail'}</strong></div></div><div className="topbar-actions"><div className="mode-pill"><span/> Offre {plans.find(p=>p.id===subscription.plan)?.name || 'Découverte'}</div><button className="icon-button notification" onClick={() => setNotice('Vous êtes à jour.')} title="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">{(user.email || 'AF').slice(0,2).toUpperCase()}</div><button className="secondary-button logout-button" onClick={onLogout}>Déconnexion</button></div></header>
      <div className="page-content">
        {page==='dashboard' && <>
          <div className="page-heading"><div><div className="eyebrow">VOTRE ACTIVITÉ</div><h1>Bonjour {profile.owner.split(' ')[0]} <span className="wave">✦</span></h1><p>Voici ce qui se passe dans votre activité aujourd’hui.</p></div><button className="primary-button" onClick={() => setModal(true)}><Plus size={17}/> Nouvelle demande</button></div>
          <section className="stats-grid">{stats.map((s,i)=><div className="stat-card" key={s.label}><div className="stat-top"><span>{s.label}</span><div className={`stat-icon ${s.tone}`}><s.icon size={18}/></div></div><div className="stat-value">{s.value}</div><div className="stat-foot">{i===0?<ArrowUpRight size={14}/>:i===3?<ArrowUpRight size={14}/>:<Activity size={14}/>}<span>{s.change}</span><em>{i===0?'vs. période précédente':''}</em></div></div>)}</section>
          <section className="dashboard-grid"><div className="panel chart-panel"><div className="panel-heading"><div><h2>Activité commerciale</h2><p>Statistiques calculées à partir de vos propres dossiers</p></div></div><div className="chart-summary"><strong>{euro(total)}</strong><span>Valeur estimée de vos demandes</span></div>{leads.length ? <div className="activity-bars">{statusOptions.map(st=><div className="activity-row" key={st}><span>{st}</span><strong>{leads.filter(l=>l.status===st).length}</strong></div>)}</div> : <div className="empty-state">Aucune donnée pour le moment. Ajoutez votre première demande pour commencer.</div>}</div>
            <div className="panel status-panel"><div className="panel-heading"><div><h2>État des demandes</h2><p>Répartition de votre activité</p></div><button className="icon-button" onClick={() => go('leads')}><MoreHorizontal size={19}/></button></div><div className="donut-wrap"><div className="donut" style={{'--p':`${leads.length?leads.filter(l=>l.status==='Accepté').length/leads.length*100:0}%`}}><div><strong>{leads.length}</strong><span>Demandes</span></div></div></div><div className="legend-list">{[['Nouveau','blue'],['En cours','amber'],['Accepté','green'],['Refusé','red']].map(([label,color])=><div className="legend-row" key={label}><span><i className={color}/> {label}</span><strong>{leads.filter(l=>l.status===label).length}</strong></div>)}</div></div></section>
          <section className="panel recent-panel"><div className="panel-heading"><div><h2>Demandes récentes</h2><p>Suivez les dernières demandes de vos clients.</p></div><button className="text-button" onClick={() => go('leads')}>Voir toutes les demandes <ChevronRight size={15}/></button></div><LeadTable leads={leads.slice(0,5)} onSelect={setSelected} onStatus={updateStatus}/></section>
        </>}
        {page==='leads' && <><div className="page-heading"><div><div className="eyebrow">GESTION COMMERCIALE</div><h1>Demandes & clients</h1><p>Centralisez les demandes et gardez le fil de chaque opportunité.</p></div><button className="primary-button" onClick={() => setModal(true)}><Plus size={17}/> Nouvelle demande</button></div><section className="panel list-panel"><div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un client, un service…"/></div><div className="toolbar-right"><div className="filter-wrap"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}>{['Tous',...statusOptions].map(s=><option key={s}>{s}</option>)}</select></div><button className="secondary-button" onClick={exportCsv}><Download size={16}/> Exporter</button></div></div><LeadTable leads={filtered} onSelect={setSelected} onStatus={updateStatus}/>{filtered.length===0&&<div className="empty-state">Aucune demande ne correspond à votre recherche.</div>}</section></>}
        {page==='quotes' && <><div className="page-heading"><div><div className="eyebrow">DOCUMENT COMMERCIAL</div><h1>Créer un devis</h1><p>Préparez une estimation claire à valider avec votre client.</p></div><button className="secondary-button" onClick={() => {setQuoteItems([{label:'Prestation',qty:1,price:0}]);setQuoteClient('');}}>Réinitialiser</button></div><div className="quote-layout"><section className="panel quote-editor"><div className="panel-heading"><div><h2>Informations du devis</h2><p>Complétez les éléments de votre proposition.</p></div><span className="draft-tag">BROUILLON</span></div><label className="field-label">Client</label><select className="field" value={quoteClient} onChange={e=>setQuoteClient(e.target.value)}><option value="">Sélectionner un client</option>{leads.map(l=><option key={l.id} value={l.name}>{l.name} — {l.service}</option>)}</select><div className="quote-items-head"><strong>Prestations</strong><button className="text-button" onClick={()=>setQuoteItems(v=>[...v,{label:'Nouvelle prestation',qty:1,price:0}])}><Plus size={14}/> Ajouter une ligne</button></div>{quoteItems.map((it,i)=><div className="quote-line" key={i}><input className="field" value={it.label} onChange={e=>setQuoteItems(v=>v.map((x,j)=>j===i?{...x,label:e.target.value}:x))}/><input className="field qty" type="number" min="1" value={it.qty} onChange={e=>setQuoteItems(v=>v.map((x,j)=>j===i?{...x,qty:Number(e.target.value)}:x))}/><input className="field price" type="number" min="0" value={it.price} onChange={e=>setQuoteItems(v=>v.map((x,j)=>j===i?{...x,price:Number(e.target.value)}:x))}/><button className="icon-button danger-icon" onClick={()=>setQuoteItems(v=>v.filter((_,j)=>j!==i))}><Trash2 size={16}/></button></div>)}<label className="field-label tax-label">TVA applicable (%) — à vérifier selon votre situation</label><input className="field tax-input" type="number" min="0" max="100" value={quoteTax} onChange={e=>setQuoteTax(Number(e.target.value))}/><button className="primary-button full-button" onClick={()=>{if(!quoteClient){setNotice('Sélectionnez un client avant de générer le devis.');return;}window.print();}}> <Download size={16}/> Imprimer / enregistrer en PDF</button></section><section className="panel quote-preview" id="quote-print"><div className="quote-brand"><div className="brand-mark"><Wrench size={18}/></div><strong>{profile.company}</strong><span>DEVIS</span></div><div className="quote-preview-title"><h2>Proposition commerciale</h2><p>Référence DEV-{new Date().getFullYear()}-{String(Date.now()).slice(-4)}</p></div><div className="quote-client"><span>DESTINATAIRE</span><strong>{quoteClient || 'Nom du client'}</strong><small>Devis établi le {dateFR(new Date())}</small></div><div className="preview-table"><div className="preview-row preview-head"><span>DÉSIGNATION</span><span>QTÉ</span><span>PRIX HT</span><span>TOTAL HT</span></div>{quoteItems.map((it,i)=><div className="preview-row" key={i}><span>{it.label}</span><span>{it.qty}</span><span>{euro(it.price)}</span><strong>{euro(it.qty*it.price)}</strong></div>)}</div><div className="quote-totals"><div><span>Total HT</span><strong>{euro(quoteItems.reduce((a,x)=>a+x.qty*x.price,0))}</strong></div><div><span>TVA ({quoteTax}%)</span><strong>{euro(quoteItems.reduce((a,x)=>a+x.qty*x.price,0)*quoteTax/100)}</strong></div><div className="grand-total"><span>Total TTC</span><strong>{euro(quoteItems.reduce((a,x)=>a+x.qty*x.price,0)*(1+quoteTax/100))}</strong></div></div><p className="quote-disclaimer">Document de démonstration à compléter et vérifier avant toute utilisation commerciale. Vérifiez notamment les mentions légales et fiscales obligatoires.</p></section></div></>}
        {page==='subscription' && <><div className="page-heading"><div><div className="eyebrow">OFFRES & FACTURATION</div><h1>Votre abonnement</h1><p>Choisissez la formule adaptée à votre activité. Vous pouvez commencer gratuitement.</p></div><span className="draft-tag">OFFRE ACTUELLE : {(plans.find(p=>p.id===subscription.plan)?.name || 'Découverte').toUpperCase()}</span></div><div className="subscription-status panel"><div><strong>Forfait actuel : {plans.find(p=>p.id===subscription.plan)?.name || 'Découverte'}</strong><p>Le choix de formule est mémorisé sur cet appareil. Le paiement doit être activé séparément.</p></div><span className="status-badge green">Actif</span></div><div className="plans-grid">{plans.map(plan=><section className={`panel plan-card ${plan.popular?'plan-popular':''}`} key={plan.id}>{plan.popular&&<span className="plan-ribbon">LE PLUS POPULAIRE</span>}<div className="plan-name">{plan.name}</div><p>{plan.description}</p><div className="plan-price">{plan.price===0?'Gratuit':<>{plan.price} €<small> / mois</small></>}</div><ul>{plan.features.map(f=><li key={f}><Check size={15}/>{f}</li>)}</ul><button className={subscription.plan===plan.id?'secondary-button':'primary-button'} onClick={()=>choosePlan(plan.id)}>{subscription.plan===plan.id?'Forfait actuel':plan.price===0?'Passer à Découverte':`Choisir ${plan.name}`}</button></section>)}</div><div className="billing-note panel"><ShieldCheck size={18}/><p><strong>Paiement en ligne non activé.</strong> Les tarifs sont proposés à titre de base. Pour encaisser réellement les abonnements, il faudra créer les liens de paiement Stripe et les ajouter au fichier .env. Aucun paiement n’est prélevé actuellement.</p></div></>}
        {page==='settings' && <><div className="page-heading"><div><div className="eyebrow">PERSONNALISATION</div><h1>Paramètres</h1><p>Gérez les informations de votre espace professionnel.</p></div><button className="primary-button" onClick={()=>setNotice('Paramètres enregistrés localement.') }><Check size={16}/> Enregistrer</button></div><section className="panel settings-panel"><div className="settings-title"><div className="settings-icon"><BriefcaseBusiness size={19}/></div><div><h2>Informations de l’entreprise</h2><p>Ces informations apparaissent dans vos documents.</p></div></div><div className="settings-form"><label>Nom de l’entreprise<input className="field" value={profile.company} onChange={e=>setProfile({...profile,company:e.target.value})}/></label><label>Nom du responsable<input className="field" value={profile.owner} onChange={e=>setProfile({...profile,owner:e.target.value})}/></label><label>Adresse e-mail<input className="field" type="email" value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})}/></label><label>Téléphone<input className="field" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></label></div><div className="security-note"><ShieldCheck size={19}/><div><strong>Stockage local</strong><p>Les demandes sont enregistrées sur cet appareil. Pour une utilisation commerciale avec plusieurs comptes, configurez Supabase et activez une authentification sécurisée.</p></div></div></section></>}
      </div>
      <footer className="footer"><span>© 2026 ArtisanFlow</span><span>Conçu pour simplifier votre quotidien <Sparkles size={13}/></span></footer>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="modal-card" onSubmit={addLead}><div className="modal-heading"><div><span className="eyebrow">NOUVELLE OPPORTUNITÉ</span><h2>Ajouter une demande</h2></div><button type="button" className="icon-button" onClick={()=>setModal(false)}><X size={20}/></button></div><div className="form-grid"><label>Nom du client *<input className="field" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex. Camille Laurent"/></label><label>E-mail *<input className="field" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="client@email.fr"/></label><label>Téléphone<input className="field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="06 00 00 00 00"/></label><label>Type de travaux<select className="field" value={form.service} onChange={e=>setForm({...form,service:e.target.value})}>{['Plomberie','Électricité','Peinture','Menuiserie','Rénovation','Maçonnerie','Autre'].map(x=><option key={x}>{x}</option>)}</select></label><label className="wide">Adresse du chantier<input className="field" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Adresse du chantier"/></label><label className="wide">Description du besoin *<textarea className="field textarea" required value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Décrivez les travaux demandés…"/></label><label>Montant estimé (€)<input className="field" type="number" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0"/></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setModal(false)}>Annuler</button><button className="primary-button" type="submit"><Plus size={16}/> Ajouter la demande</button></div></form></div>}
    {selected && <div className="detail-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><aside className="detail-panel"><div className="detail-top"><span className="eyebrow">DOSSIER CLIENT · {selected.id}</span><button className="icon-button" onClick={()=>setSelected(null)}><X size={20}/></button></div><h2>{selected.name}</h2><p className="detail-service">{selected.service} · Reçu le {dateFR(selected.createdAt)}</p><div className="detail-status"><span className={`status-badge ${statusClass(selected.status)}`}>{selected.status}</span><select value={selected.status} onChange={e=>updateStatus(selected.id,e.target.value)}>{statusOptions.map(s=><option key={s}>{s}</option>)}</select></div><div className="detail-section"><h3>Coordonnées</h3><p>{selected.email}</p><p>{selected.phone || 'Téléphone non renseigné'}</p><p>{selected.address || 'Adresse non renseignée'}</p></div><div className="detail-section"><h3>Description du besoin</h3><p>{selected.description}</p></div><div className="detail-amount"><span>Montant estimé</span><strong>{euro(selected.amount)}</strong></div><button className="primary-button full-button" onClick={()=>draftReply(selected)}><Sparkles size={16}/> Préparer une réponse</button><button className="secondary-button full-button" onClick={()=>{setQuoteClient(selected.name);setPage('quotes');setSelected(null)}}><FileText size={16}/> Créer un devis</button><button className="delete-button" onClick={()=>deleteLead(selected.id)}><Trash2 size={15}/> Supprimer cette demande</button></aside></div>}
    {notice && <div className="toast"><Check size={17}/>{notice}<button onClick={()=>setNotice('')}><X size={15}/></button></div>}
  </div>;
}

function LeadTable({ leads, onSelect, onStatus }) {
  return <div className="table-scroll"><table className="lead-table"><thead><tr><th>CLIENT</th><th>SERVICE</th><th>DATE</th><th>MONTANT ESTIMÉ</th><th>STATUT</th><th></th></tr></thead><tbody>{leads.map(l=><tr key={l.id} onClick={()=>onSelect(l)}><td><div className="client-cell"><div className="client-avatar">{l.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div><strong>{l.name}</strong><span>{l.email}</span></div></div></td><td><span className="service-cell">{l.service}</span></td><td className="date-cell">{dateFR(l.createdAt)}</td><td className="amount-cell">{euro(l.amount)}</td><td><span className={`status-badge ${statusClass(l.status)}`}><i/>{l.status}</span></td><td><button className="icon-button row-more" onClick={e=>{e.stopPropagation();onSelect(l)}}><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table></div>;
}
