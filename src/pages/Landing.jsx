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
  const { isAuthenticated, user } = useAuth();
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
    { 
      icon: Database, 
      title: lang === 'sw' ? 'Kituo cha Data Ya Kuaminika' : 'Trusted Data Hub',
      desc: lang === 'sw' 
        ? 'Tunakusanya na kupanga data ya kiuchumi kutoka wizara zote za serikali katika chanzo kimoja cha kuaminika.'
        : 'We collect and organize economic data from all government ministries into one reliable source.',
      color: 'from-amber-500 to-orange-600' 
    },
    { 
      icon: Brain, 
      title: lang === 'sw' ? 'Vifaa vya Uchambuzi' : 'Smart Analysis Tools',
      desc: lang === 'sw'
        ? 'Wanauchumi na watafiti hutumia vifaa vyetu kusoma mwelekeo, kujaribu mawazo, na kuandika ripoti.'
        : 'Economists and researchers use our tools to study trends, test ideas, and write reports.',
      color: 'from-emerald-500 to-primary' 
    },
    { 
      icon: Satellite, 
      title: lang === 'sw' ? 'Wazi kwa Raia Wote' : 'Open to All Citizens',
      desc: lang === 'sw'
        ? 'Kila mtu anaweza kuona ramani za kata, chati, na ripoti — kwa Kiingereza na Kiswahili.'
        : 'Anyone can view ward-level maps, charts, and reports — in English and Swahili.',
      color: 'from-teal-500 to-cyan-600' 
    },
  ];

  const portals = [
    {
      path: '/staff',
      icon: Brain,
      title: t('portal.staff.title'),
      desc: t('portal.staff.desc'),
      accent: 'from-emerald-500 to-primary',
      glow: 'shadow-emerald-500/20',
      features: lang === 'sw' ? [
        'Kushirikiana kati ya idara',
        'Kuandika ripoti kiotomatiki',
        'Kuiga hali za kiuchumi',
        'Kufuata malengo ya taifa (SDGs)',
        'Uchambuzi wa data ya kata',
        'Kwa Kiingereza na Kiswahili',
      ] : [
        'Work together across departments',
        'Generate reports automatically',
        'Model economic scenarios',
        'Track national goals (SDGs)',
        'Ward-level data analysis',
        'Bilingual (English & Swahili)',
      ],
    },
    {
      path: '/public',
      icon: Users,
      title: t('portal.public.title'),
      desc: t('portal.public.desc'),
      accent: 'from-teal-500 to-cyan-600',
      glow: 'shadow-teal-500/20',
      features: lang === 'sw' ? [
        'Tafuta kata yako kwenye ramani',
        'Soma hadithi za data na chati',
        'Jaribu kigeuzi cha bajeti',
        'Ripoti kuhusu kinachoendelea kwako',
        'Pakua data (CSV, JSON)',
        'Soma kwa Kiingereza au Kiswahili',
      ] : [
        'Explore your ward on a map',
        'See charts and data stories',
        'Try the budget simulator',
        'Report what is happening in your area',
        'Download data (CSV, JSON)',
        'Read in English or Swahili',
      ],
    },
  ];

  const handlePortalAccess = (path) => {
    const safePath = (typeof path === 'string' && path.trim().startsWith('/')) 
      ? path.trim() 
      : '/';

    if (safePath === '/public' || safePath === '/public/gateway') {
      navigate('/public/gateway');
      return;
    }

    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(safePath)}`);
      return;
    }

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
    { 
      num: 1, 
      icon: Database, 
      title: lang === 'sw' ? 'Mkusanyiko' : 'Collection', 
      desc: lang === 'sw' ? 'Afisa wa data katika kata anatuma faili la Excel.' : 'A data officer in the ward sends an Excel file.' 
    },
    { 
      num: 2, 
      icon: Workflow, 
      title: lang === 'sw' ? 'Usafishaji' : 'Cleaning', 
      desc: lang === 'sw' ? 'Mfumo unarekebisha makosa ya muundo na kutoa kitambulisho cha kipekee.' : 'The system fixes formatting issues and assigns a unique ID.' 
    },
    { 
      num: 3, 
      icon: FileCheck, 
      title: lang === 'sw' ? 'Uthibitisho' : 'Verification', 
      desc: lang === 'sw' ? 'Mchambuzi wa sera anaangalia data na kuidhinisha.' : 'A policy analyst checks the data and approves it.' 
    },
    { 
      num: 4, 
      icon: Brain, 
      title: lang === 'sw' ? 'Uchambuzi' : 'Analysis', 
      desc: lang === 'sw' ? 'Mwanachuoni anasoma data na kupata matokeo muhimu.' : 'An economist studies the data and finds useful insights.' 
    },
    { 
      num: 5, 
      icon: Users, 
      title: lang === 'sw' ? 'Ufichuzi' : 'Sharing', 
      desc: lang === 'sw' ? 'Raia anaona chati wazi kwa Kiswahili.' : 'A citizen sees a clear chart in Swahili.' 
    },
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
          <div className="hidden md:flex items-center gap-6">
            <a href__="#portals" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {lang === 'sw' ? 'Vituo' : 'Portals'}
            </a>
            <a href__="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {lang === 'sw' ? 'Jinsi Inavyofanya Kazi' : 'How It Works'}
            </a>
            <a href__="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {lang === 'sw' ? 'Kuhusu' : 'About'}
            </a>
          </div>
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
              <span className="text-xs font-semibold text-primary tracking-wide">
                {lang === 'sw' ? 'Jukwaa Rasmi la Data ya Kiuchumi la Kenya' : "Kenya's Official Economic Data Platform"}
              </span>
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
              {lang === 'sw'
                ? 'Sehemu moja ya kuaminika ambapo data ya serikali kuhusu uchumi, kata, na malengo ya taifa inakusanywa, kuangaliwa, na kushirikiwa na raia.'
                : 'One trusted place where government data on the economy, wards, and national goals is gathered, checked, and shared with citizens.'}
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
                {lang === 'sw' ? 'Chunguza Data ya Umma' : 'Explore Public Data'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href__="#portals"
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
              ? 'Majukwaa mawili — kila moja limeundwa kwa watumiaji wake.'
              : 'Two portals — each tailored to its users.'}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
      <section id="how-it-works" className="bg-card/50 border-y border-border">
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

      {/* About / CTA */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
              {lang === 'sw' ? 'Anza Kuchunguza Data ya Kiuchumi ya Kenya' : 'Begin Exploring Kenya\u2019s Economic Data'}
            </h2>
            <p className="mt-3 text-white/80 max-w-2xl mx-auto text-sm lg:text-base">
              {lang === 'sw'
                ? 'Pata data wazi, ramani, na ripoti — bure kwa kila Mkenya.'
                : 'Access open data, maps, and reports — free for every Kenyan.'}
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

      {/* Professional Government Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Top section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Column 1 — About */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                  <span className="font-display font-extrabold text-lg text-primary-foreground">K</span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-heading font-bold text-sm text-foreground">KEDIS</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">UltraEconomist</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'sw'
                  ? 'Jukwaa rasmi la Kenya kwa data ya kiuchumi na akili.'
                  : "Kenya's official platform for economic data and intelligence."}
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1">
                <Shield className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold text-primary">
                  {lang === 'sw' ? 'Mfumo Rasmi wa Serikali' : 'Official Government System'}
                </span>
              </div>
            </div>

            {/* Column 2 — Explore */}
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground mb-4">
                {lang === 'sw' ? 'Chunguza' : 'Explore'}
              </h4>
              <ul className="space-y-2.5">
                <li><Link to="/public" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Ramani za Data za Kata' : 'Ward Data Maps'}</Link></li>
                <li><Link to="/public/stories" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Hadithi za Data' : 'Data Stories'}</Link></li>
                <li><Link to="/public/playground" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Kigeuzi cha Bajeti' : 'Budget Simulator'}</Link></li>
                <li><Link to="/public/vnr" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Kifuatilio cha SDG' : 'SDG Tracker'}</Link></li>
                <li><Link to="/public/research" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Nafasi ya Utafiti' : 'Research Workspace'}</Link></li>
              </ul>
            </div>

            {/* Column 3 — Resources */}
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground mb-4">
                {lang === 'sw' ? 'Rasilimali' : 'Resources'}
              </h4>
              <ul className="space-y-2.5">
                <li><a href__="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Kuhusu KIPPRA' : 'About KIPPRA'}</a></li>
                <li><a href__="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Mbinu ya Data' : 'Data Methodology'}</a></li>
                <li><a href__="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Pakua Data' : 'Bulk Downloads'}</a></li>
                <li><a href__="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Nyaraka' : 'Documentation'}</a></li>
                <li><a href__="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Maswali Yanayoulizwa' : 'FAQ'}</a></li>
              </ul>
            </div>

            {/* Column 4 — Legal & Privacy */}
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground mb-4">
                {lang === 'sw' ? 'Sheria & Faragha' : 'Legal & Privacy'}
              </h4>
              <ul className="space-y-2.5">
                <li><a href__="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Sera ya Faragha' : 'Privacy Policy'}</a></li>
                <li><a href__="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Masharti ya Matumizi' : 'Terms of Use'}</a></li>
                <li><a href__="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Notisi ya Ulinzi wa Data' : 'Data Protection Notice'}</a></li>
                <li><a href__="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Taarifa ya Ufikiaji' : 'Accessibility Statement'}</a></li>
                <li><a href__="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lang === 'sw' ? 'Sera ya Cookies' : 'Cookie Policy'}</a></li>
              </ul>
            </div>

            {/* Column 5 — Contact */}
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground mb-4">
                {lang === 'sw' ? 'Wasiliana Nasi' : 'Contact'}
              </h4>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>KIPPRA Headquarters, Nairobi, Kenya</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>info@kippra.or.ke</span>
                </li>
                <li className="flex items-start gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{lang === 'sw' ? 'Jumatatu–Ijumaa, 8AM–5PM' : 'Mon–Fri, 8AM–5PM'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-display font-extrabold text-sm text-primary-foreground">K</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">KEDIS UltraEconomist</span>
                <span className="hidden sm:inline"> — {lang === 'sw' ? 'Jukwaa la Akili ya Data' : 'Data Intelligence Platform'}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-primary" />
                {lang === 'sw' ? 'Mfumo Rasmi wa Data wa Serikali ya Kenya' : 'An Official Government of Kenya Data System'}
              </span>
              <span className="hidden sm:inline">·</span>
              <span>© 2026 KIPPRA — {lang === 'sw' ? 'Haki zote zimehifadhiwa' : 'All rights reserved'}</span>
              <span className="hidden sm:inline">·</span>
              <span>v1.1.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
