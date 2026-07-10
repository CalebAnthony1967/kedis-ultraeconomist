import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { toast } from '@/components/ui/use-toast';
import LanguageToggle from '@/components/LanguageToggle';
import {
  Shield, Brain, Map, ArrowRight, Database, GitBranch, Lock,
  TrendingUp, Building2, Users, Globe, BarChart3, Layers, CheckCircle2,
  Sparkles, Activity, Cpu, Target, ChevronDown, Zap, Server, FileCheck, 
  Network, Satellite, MessageSquare, BookOpen, Workflow
} from 'lucide-react';

export default function Landing() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth(); // Sovereign Auth Context
  const [scrolled, setScrolled] = useState(false);
  const [activePortal, setActivePortal] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const stats = [
    { value: '8,400+', label: t('landing.stat.indicators'), icon: BarChart3 },
    { value: '1,450', label: t('landing.stat.wards'), icon: Map },
    { value: '1963–2063', label: t('landing.stat.years'), icon: TrendingUp },
    { value: '17', label: t('landing.stat.sdgs'), icon: Target },
  ];

  const pillars = [
    { icon: Database, title: t('landing.pillar1.title'), desc: t('landing.pillar1.desc'), color: 'from-amber-500 to-orange-600' },
    { icon: Brain, title: t('landing.pillar2.title'), desc: t('landing.pillar2.desc'), color: 'from-emerald-500 to-primary' },
    { icon: Satellite, title: t('landing.pillar3.title'), desc: t('landing.pillar3.desc'), color: 'from-teal-500 to-cyan-600' },
  ];

  const portals = [
    {
      path: '/admin',
      icon: Shield,
      title: t('portal.admin.title'),
      desc: t('portal.admin.desc'),
      accent: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/20',
      features: [
        'Multi-Source "Connect to Data" Engine',
        'Silo-Healing (Auto Forward-Fill)',
        'FAIR Scorecard & SPI Tagging',
        'Master Record Management (CRUD)',
        'Super Admin Vault (Double-Lock MFA)',
        'National Audit Trail (SHA-256)',
        'Privacy Master-Switch (KDPA)',
        'Routing Control',
      ],
    },
    {
      path: '/staff',
      icon: Brain,
      title: t('portal.staff.title'),
      desc: t('portal.staff.desc'),
      accent: 'from-emerald-500 to-primary',
      glow: 'shadow-emerald-500/20',
      features: [
        'Departmental Handshake Portal',
        'Governance Center (National Pulse)',
        'AlphaEconomist AI Agent (EN/SW)',
        'Digital Twin Sandbox (VECM)',
        'Integrated Modelling Hub (IEMH)',
        'Ward-Level SAE Observatory',
        'Automated Report Generator',
        'Cross-Directorate Collaboration',
      ],
    },
    {
      path: '/public',
      icon: Users,
      title: t('portal.public.title'),
      desc: t('portal.public.desc'),
      accent: 'from-teal-500 to-cyan-600',
      glow: 'shadow-teal-500/20',
      features: [
        'Persona-Based Porta (Citizen/Researcher/Media)',
        'Ward-Level GIS (1,450 wards)',
        'Policy Playground (Budget Simulator)',
        'Ground-Truthing Lab (Crowdsourcing)',
        'Data Storytelling (EN/SW)',
        'SDG VNR Generator (UN)',
        'Media Room & Infographic Generator',
        'Bulk Data Downloads (CSV/JSON/SDMX)',
      ],
    },
  ];

const handlePortalAccess = (path) => {
  // Normalise the path: ensure it's a non-empty string starting with '/'
  const safePath = (typeof path === 'string' && path.trim().startsWith('/')) 
    ? path.trim() 
    : '/';

  // Public Portal is open access
  if (safePath === '/public' || safePath === '/public/gateway') {
    navigate('/public/gateway');
    return;
  }

  // Protected portals
  if (!isAuthenticated) {
    navigate(`/login?next=${encodeURIComponent(safePath)}`);
    return;
  }

  // Role checks remain the same, but use safePath
  if (safePath === '/admin') {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      navigate('/admin');
    } else {
      toast({ title: "Access Denied", description: "Administrative clearance required.", variant: "destructive" });
    }
  } else if (safePath === '/staff') {
    if (['staff', 'admin', 'super_admin'].includes(user?.role)) {
      navigate('/staff/handshake');
    } else {
      toast({ title: "Access Denied", description: "KIPPRA staff credentials required.", variant: "destructive" });
    }
  }
};

  const flowSteps = [
    { num: 1, icon: Database, title: lang === 'sw' ? 'Kuingizwa' : 'Ingestion', desc: lang === 'sw' ? 'Afisa kutoka kata anatuma faili la Excel.' : 'A clerk in the ward sends an Excel file.' },
    { num: 2, icon: Workflow, title: lang === 'sw' ? 'Uponyaji' : 'Healing', desc: lang === 'sw' ? 'Injinia inarekebisha seli zilizounganishwa na kutoa SPI.' : 'Silo-Healing fixes merged cells & assigns SPI.' },
    { num: 3, icon: FileCheck, title: lang === 'sw' ? 'Uthibitisho' : 'Verification', desc: lang === 'sw' ? 'Msimamizi Mkuu anaona mwanga kijani.' : 'Policy Analyst sees a green quality light.' },
    { num: 4, icon: Brain, title: lang === 'sw' ? 'Akili' : 'Intelligence', desc: lang === 'sw' ? 'AI inasema: "Mahindi imeongezeka katika kata hiyo na 12%".' : 'AI says: "Maize in that ward is up 12%".' },
    { num: 5, icon: Users, title: lang === 'sw' ? 'Ufichuzi' : 'Dissemination', desc: lang === 'sw' ? 'Raia  anaona chati kwa Kiswahili.' : 'A resident sees a chart in Swahili.' },
  ];

  const techBadges = [
    { icon: Lock, label: 'FAIR Compliant' },
    { icon: GitBranch, label: 'SHA-256 Audit Lineage' },
    { icon: Globe, label: 'SDMX / IMF e-GDDS' },
    { icon: Cpu, label: 'Bayesian SAE Engine' },
    { icon: Building2, label: 'Kenya G-Cloud Ready' },
    { icon: Network, label: 'Hyperledger Policy Ledger' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-teal-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-border shadow-sm' : 'bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20"
            >
              <span className="font-display font-extrabold text-lg text-primary-foreground">K</span>
            </motion.div>
            <div className="flex flex-col leading-tight">
              <span className="font-heading font-bold text-sm text-foreground">KEDIS</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">UltraEconomist</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 lg:pt-24 lg:pb-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary tracking-wide">{t('landing.badge')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground leading-[1.05] tracking-tight"
            >
              {lang === 'sw' ? (
                <>Mfumo wa Taifa wa <span className="gradient-text">Data ya Kiuchumi</span> ya Kenya</>
              ) : (
                <>Kenya's <span className="gradient-text">Economic Data</span> & Intelligence System</>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed"
            >
              {t('landing.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                to="/public"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
              >
                {t('landing.cta')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#portals"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 backdrop-blur px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-secondary hover:-translate-y-0.5"
              >
                <Layers className="h-4 w-4" />
                {t('portal.select')}
              </a>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border bg-card/80 backdrop-blur p-5 lg:p-6"
              >
                <stat.icon className="h-5 w-5 text-primary mb-2" />
                <div className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{stat.value}</div>
                <div className="mt-1 text-xs lg:text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="group rounded-2xl border border-border bg-card/80 backdrop-blur p-6 transition-shadow hover:shadow-xl"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} mb-4 shadow-lg`}>
                <p.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-foreground">{t('portal.select')}</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            {lang === 'sw'
              ? 'Majukwaa matatu yanayotumia RBAC — kila moja limeundwa kwa watumiaji wake.'
              : 'Three role-based portals with strict RBAC — each tailored to its users.'}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {portals.map((portal, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -8 }}
              onHoverStart={() => setActivePortal(i)}
              onHoverEnd={() => setActivePortal(null)}
              className={`group relative rounded-2xl border border-border bg-card/80 backdrop-blur overflow-hidden transition-shadow hover:shadow-2xl ${portal.glow}`}
            >
              <div className={`h-1.5 bg-gradient-to-r ${portal.accent}`} />
              <div className="p-6 lg:p-7">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${portal.accent} mb-4 shadow-lg`}>
                  <portal.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">{portal.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{portal.desc}</p>
                <ul className="mt-5 space-y-2">
                  {portal.features.map((f, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      animate={activePortal === i ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: j * 0.05 }}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </motion.li>
                  ))}
                </ul>
                {/* Inside portals.map - replace the existing Link with this */}
<button
  onClick={() => handlePortalAccess(portal.path)}
  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${portal.accent} px-5 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95`}
>
  {t('portal.enter')}
  <ArrowRight className="h-4 w-4" />
</button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Data Flow Journey */}
      <section className="bg-card/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-4">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {lang === 'sw' ? 'Safari ya Data' : 'The Journey of a Data Point'}
              </span>
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
              {lang === 'sw' ? 'Kutoka Kata hadi Taifa' : 'From the Ward to the Nation'}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {flowSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                    {step.num}
                  </div>
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
                {i < flowSteps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
          {techBadges.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <badge.icon className="h-4 w-4 text-primary" />
              {badge.label}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-border"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent/80" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
          </div>
          <div className="relative px-6 py-12 lg:px-12 lg:py-16 text-center">
            <Sparkles className="h-8 w-8 text-white/80 mx-auto mb-4" />
            <h2 className="font-display text-2xl lg:text-4xl font-extrabold text-white">
              {lang === 'sw' ? 'Anza Safari ya Ujasiri wa Kidijitali' : 'Begin the Data Intelligence Journey'}
            </h2>
            <p className="mt-3 text-white/80 max-w-2xl mx-auto text-sm lg:text-base">
              {lang === 'sw'
                ? 'Unganisha data zote za MCDA katika chanzo kimoja cha kweli.'
                : 'Unify all MCDA data into a single source of truth.'}
            </p>
            <Link
              to="/public"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-primary shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              {lang === 'sw' ? 'Anza Sasa' : 'Get Started'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-display font-extrabold text-sm text-primary-foreground">K</span>
            </div>
            <span className="text-sm text-muted-foreground">KEDIS UltraEconomist — Data Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>KIPPRA × Intelligence System</span>
            <span>v1.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}