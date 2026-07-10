import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  Users, FlaskConical, Newspaper, ArrowRight, Map,
  Database, MessageSquare, Globe2, Sparkles, BookOpen, Shield
} from 'lucide-react';

const PERSONAS = [
  {
    id: 'citizen',
    label_en: 'Citizen',
    label_sw: 'Mwananchi',
    desc_en: 'See how national policies affect your ward. Simple visuals, local impact.',
    desc_sw: 'Ona jinsi sera za taifa zinavyoathiri kata yako. Picha rahisi, athari ya karibu.',
    icon: Users,
    color: 'from-teal-500 to-cyan-600',
    path: '/public',
    features: ['Kenya at a Glance', 'Ward-Level GIS', 'Policy Playground', 'Ground-Truthing'],
  },
  {
    id: 'researcher',
    label_en: 'Researcher',
    label_sw: 'Mtafiti',
    desc_en: 'Full metadata, SPI citations, bulk downloads & M2M API access.',
    desc_sw: 'Metadata kamili, nukuu za SPI, kupakua kwa wingi na API ya mashine.',
    icon: FlaskConical,
    color: 'from-emerald-500 to-primary',
    path: '/public/research',
    features: ['Master Data Library', 'SPI Metadata Registry', 'CSV/JSON/SDMX Downloads', 'Developer API Access'],
  },
  {
    id: 'media',
    label_en: 'Media Professional',
    label_sw: 'Mtaalamu wa Habari',
    desc_en: 'Headlines, infographics with KIPPRA watermark & release calendar.',
    desc_sw: 'Vichwa vya habari, infografik na kalenda ya kutolewa.',
    icon: Newspaper,
    color: 'from-amber-500 to-orange-600',
    path: '/public/media',
    features: ['Automated Headlines', 'Infographic Generator', 'Release Calendar (e-GDDS)', 'KIPPRA Watermarked Charts'],
  },
];

export default function PersonaGateway() {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-4 shadow-lg">
            <Globe2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Karibu kwenye Maabara ya Mwananchi' : 'Welcome to the Citizen Lab'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {lang === 'sw'
              ? 'Chagua "Mlango wa Mbele" kulingana na mahitaji yako. Hakuna nenosiri linalohitajika.'
              : 'Choose your portal based on your needs. No password required — Open Access.'}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Shield className="h-3.5 w-3.5" />
            {lang === 'sw' ? 'Kilaini cha Faragha Kimeamilishwa' : 'Privacy Shield Active (KDPA)'}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PERSONAS.map((persona, i) => (
            <motion.button
              key={persona.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8 }}
              onClick={() => navigate(persona.path)}
              className="group text-left rounded-2xl border border-border bg-card/80 backdrop-blur overflow-hidden transition-shadow hover:shadow-2xl"
            >
              <div className={`h-1.5 bg-gradient-to-r ${persona.color}`} />
              <div className="p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${persona.color} mb-4 shadow-lg`}>
                  <persona.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  {lang === 'sw' ? persona.label_sw : persona.label_en}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {lang === 'sw' ? persona.desc_sw : persona.desc_en}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {persona.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-foreground/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${persona.color} px-5 py-3 text-sm font-semibold text-white transition-all group-hover:shadow-lg`}>
                  {lang === 'sw' ? 'Ingia' : 'Enter'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {lang === 'sw'
              ? 'Hakuna jina la kibinafsi kutoka kwa hifadhi ya ndani litaonekana hapa. Kwa kuzuia data — "Maliza Kikao"inafuta kumbukumbu yote.'
              : 'No personal names or sensitive IDs from the internal lakehouse are visible here. "Terminate Session" wipes all cached data.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}