import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CheckCircle2, ChevronRight, Info, ShoppingBag, Sparkles, Store, TrendingUp, X } from 'lucide-react';
import { completeOnboarding, recordOnboardingEvent } from '../lib/onboardingApi';
import { getOpsConfig } from '../lib/opsConfigApi';

interface OnboardingProps {
  onFinish: () => void;
}

type Slide = {
  title: string;
  subtitle: string;
  highlight?: string;
  tooltip: string;
  preview: string;
  tips?: string[];
  steps?: Array<{ label: string; value?: string }>;
  badges?: string[];
  leaderboard?: Array<{ rank: number; name: string; stars?: number }>;
  progress?: { current?: number; target?: number; label?: string };
  summary?: string;
  type: 'welcome' | 'stars' | 'photo' | 'leaderboard' | 'dashboard' | 'search' | 'location' | 'compare' | 'ai';
};

const DEFAULT_SLIDES: Slide[] = [
  {
    title: 'Welcome to Sconnect',
    subtitle: 'Buyers discover, compare, and earn rewards. Sellers grow visibility and reach more customers.',
    highlight: 'Connected commerce for both sides',
    tooltip: 'Sconnect brings everyday buying and selling into one place.',
    summary: 'One platform for shopping, selling, and growing together.',
    preview: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80',
    type: 'welcome'
  },
  {
    title: 'Earn Stars',
    subtitle: 'Complete actions to unlock rewards.',
    tooltip: 'Stars and rewards are configured by your operator.',
    preview: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80',
    steps: [
      { label: 'Upload receipts' },
      { label: 'Invite other shops' },
      { label: 'Sync inventory' }
    ],
    progress: {
      label: 'Progress updates after your first activity.'
    },
    type: 'stars'
  },
  {
    title: 'Photo to Inventory',
    subtitle: 'Capture stock without typing.',
    tooltip: 'Use camera capture to speed up stock updates.',
    preview: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    steps: [
      { label: 'Open camera' },
      { label: 'Capture shelf' },
      { label: 'Review detected items' }
    ],
    badges: ['Camera', 'AI Count', 'Fast sync'],
    summary: 'Capture is available from the main app once onboarding is complete.',
    type: 'photo'
  },
  {
    title: 'Local Rankings',
    subtitle: 'See how you rank once data is available.',
    tooltip: 'Rankings appear when enough activity is recorded.',
    preview: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    summary: 'Leaderboards will appear after your first week.',
    type: 'leaderboard'
  },
  {
    title: 'Your Insights Dashboard',
    subtitle: 'Track progress, inventory, and demand.',
    tooltip: 'All metrics are sourced from live activity.',
    preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    summary: 'Your dashboard fills in as soon as you connect data sources.',
    type: 'dashboard'
  },
  {
    title: 'Multi-Modal Search',
    subtitle: 'Search by text, voice, or photo.',
    tooltip: 'Use camera + voice to find items without typing.',
    preview: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80',
    tips: ['Tap mic for voice search', 'Use camera for visual search', 'Filter fast with chips'],
    type: 'search'
  },
  {
    title: 'Near Me Accuracy',
    subtitle: 'See nearby shops with live availability.',
    tooltip: 'Turn on location for accurate stock and distance.',
    preview: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    tips: ['Enable location', 'Set radius in filters', 'Open map for pins'],
    type: 'location'
  },
  {
    title: 'Compare Before You Buy',
    subtitle: 'Side-by-side features and prices.',
    tooltip: 'Add to comparison and open the compare bar.',
    preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    tips: ['Tap compare icon', 'Review price/stock', 'Open map overlays'],
    type: 'compare'
  },
  {
    title: 'AI Assistant',
    subtitle: 'Ask questions before you buy.',
    tooltip: 'AI answers product questions and suggests alternatives.',
    preview: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    tips: ['Open AI chat on product', 'Ask for price insights', 'Compare alternatives'],
    type: 'ai'
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const [index, setIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [secondaryCta, setSecondaryCta] = useState<string>('');

  const slide = slides[index];
  const progressDots = useMemo(() => slides.map((_, i) => i <= index), [index]);

  useEffect(() => {
    recordOnboardingEvent({ step: index, action: 'view' }).catch(() => {});
  }, [index]);

  useEffect(() => {
    let active = true;
    const loadConfig = async () => {
      try {
        const resp = await getOpsConfig('content.onboarding');
        const value = (resp as any)?.value || {};
        const configSlides = Array.isArray(value.slides) ? value.slides : [];
        const normalized = configSlides
          .map((raw: any) => ({
            title: String(raw?.title || ''),
            subtitle: String(raw?.subtitle || ''),
            highlight: raw?.highlight ? String(raw.highlight) : undefined,
            tooltip: String(raw?.tooltip || ''),
            preview: String(raw?.preview || ''),
            tips: Array.isArray(raw?.tips) ? raw.tips.map((tip: any) => String(tip)) : undefined,
            steps: Array.isArray(raw?.steps)
              ? raw.steps.map((step: any) => ({
                  label: String(step?.label || ''),
                  value: step?.value ? String(step.value) : undefined,
                })).filter((step: any) => step.label)
              : undefined,
            badges: Array.isArray(raw?.badges) ? raw.badges.map((badge: any) => String(badge)) : undefined,
            leaderboard: Array.isArray(raw?.leaderboard)
              ? raw.leaderboard.map((row: any) => ({
                  rank: Number(row?.rank ?? 0),
                  name: String(row?.name || ''),
                  stars: row?.stars !== undefined ? Number(row.stars) : undefined,
                })).filter((row: any) => row.rank > 0 && row.name)
              : undefined,
            progress: raw?.progress
              ? {
                  current: raw.progress.current !== undefined ? Number(raw.progress.current) : undefined,
                  target: raw.progress.target !== undefined ? Number(raw.progress.target) : undefined,
                  label: raw.progress.label ? String(raw.progress.label) : undefined,
                }
              : undefined,
            summary: raw?.summary ? String(raw.summary) : undefined,
            type: raw?.type as Slide['type'],
          }))
          .filter((item: any) => item.title && item.subtitle && item.tooltip && item.preview && item.type);
        const ctaLabel = String(value?.cta_secondary?.label || '');
        if (!active) return;
        if (normalized.length > 0) {
          setSlides(normalized);
        } else {
          setSlides(DEFAULT_SLIDES);
        }
        setSecondaryCta(ctaLabel);
        setIndex((prev) => Math.min(prev, Math.max(0, (normalized.length || DEFAULT_SLIDES.length) - 1)));
      } catch {
        if (!active) return;
        setSlides(DEFAULT_SLIDES);
        setSecondaryCta('');
      }
    };
    loadConfig();
    return () => {
      active = false;
    };
  }, []);

  const handleNext = async () => {
    if (index === slides.length - 1) {
      try {
        await completeOnboarding();
      } catch {}
      onFinish();
      return;
    }
    setShowTooltip(false);
    setIndex(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-50 text-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50" />

      <div className="relative h-full w-full flex flex-col p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black">SC</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Onboarding</p>
              <p className="text-xs text-slate-500">Photo to Stars to Rank</p>
            </div>
          </div>
          <button
            onClick={() => {
              recordOnboardingEvent({ step: index, action: 'exit' }).catch(() => {});
              completeOnboarding().catch(() => {});
              onFinish();
            }}
            className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-slate-500 hover:text-slate-900"
            aria-label="Exit onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {progressDots.map((active, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${active ? 'w-6 bg-blue-600' : 'w-2 bg-blue-200'}`}
              />
            ))}
          </div>
          <div className="text-[10px] font-black text-blue-600">{index + 1}/{slides.length}</div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md"
            >
              <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 mb-1">{slide.title}</h1>
                    <p className="text-sm text-slate-500">{slide.subtitle}</p>
                    {slide.highlight && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black">
                        <TrendingUp className="w-3 h-3" /> {slide.highlight}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowTooltip(prev => !prev)}
                    className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"
                    aria-label="Show tooltip"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {showTooltip && (
                  <div className="mt-4 p-3 bg-blue-600 text-white rounded-2xl text-[10px] font-bold">
                    {slide.tooltip}
                  </div>
                )}

                {slide.type === 'welcome' ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-[28px] bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-[1px] shadow-[0_20px_60px_rgba(37,99,235,0.18)]">
                      <div className="rounded-[27px] overflow-hidden bg-white/95 backdrop-blur">
                        <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto_1fr] md:p-5">
                          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-[0.28em] text-blue-600">Buyer</span>
                              <ShoppingBag className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="mt-4 h-24 rounded-2xl bg-white border border-slate-100 p-3 flex flex-col justify-between">
                              <div>
                                <div className="text-sm font-black text-slate-900">Discover and compare</div>
                                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                  Find products, compare prices, and see rewards as you shop.
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-black text-blue-600">
                                <span className="px-2 py-1 rounded-full bg-blue-50">Search</span>
                                <span className="px-2 py-1 rounded-full bg-blue-50">Compare</span>
                                <span className="px-2 py-1 rounded-full bg-blue-50">Earn</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center py-2 md:py-0">
                            <div className="relative flex flex-col items-center">
                              <div className="absolute inset-0 -m-6 rounded-full bg-blue-200/60 blur-xl" />
                              <div className="relative w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg">
                                SC
                              </div>
                              <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                                <ArrowRight className="w-3 h-3 text-blue-600" />
                                Connected commerce
                              </div>
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-950 bg-slate-950 p-4 text-white">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-[0.28em] text-cyan-300">Seller</span>
                              <Store className="w-4 h-4 text-cyan-300" />
                            </div>
                            <div className="mt-4 h-24 rounded-2xl bg-white/5 border border-white/10 p-3 flex flex-col justify-between">
                              <div>
                                <div className="text-sm font-black">Sell and grow</div>
                                <p className="mt-1 text-[10px] leading-4 text-slate-300">
                                  Reach more customers, manage products, and track demand.
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-black text-cyan-300">
                                <span className="px-2 py-1 rounded-full bg-white/10">Visibility</span>
                                <span className="px-2 py-1 rounded-full bg-white/10">Insights</span>
                                <span className="px-2 py-1 rounded-full bg-white/10">Growth</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 md:px-5">
                          <div className="flex flex-wrap items-center gap-2">
                            {['Buy better', 'Sell smarter', 'Grow together', 'Rewards built in'].map((label) => (
                              <span key={label} className="px-3 py-1.5 rounded-full bg-white border border-blue-100 text-[10px] font-black text-slate-700">
                                {label}
                              </span>
                            ))}
                          </div>
                          <p className="mt-3 text-[10px] font-bold leading-4 text-slate-500">
                            Sconnect is the connected marketplace where buyers discover products, sellers reach customers, and commerce moves in one place.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { title: 'For buyers', value: 'Discover, compare, and earn rewards.' },
                        { title: 'For sellers', value: 'List products, grow visibility, and sell more.' }
                      ].map((item) => (
                        <div key={item.title} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                          <div className="text-[9px] font-black uppercase tracking-[0.24em] text-blue-600">{item.title}</div>
                          <div className="mt-1 text-[10px] font-bold leading-4 text-slate-600">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5">
                    <div className="relative h-40 rounded-2xl overflow-hidden border border-blue-100">
                      <img src={slide.preview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 text-[10px] font-black uppercase tracking-widest text-white/90">Preview</div>
                    </div>
                  </div>
                )}

                {slide.type === 'stars' && (
                  <div className="mt-5 space-y-3">
                    {(slide.steps || []).map((step) => (
                      <div key={step.label} className="flex items-center justify-between text-[10px] font-bold">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Sparkles className="w-3 h-3" /> {step.label}
                        </div>
                        {step.value && <span className="text-blue-600">{step.value}</span>}
                      </div>
                    ))}
                    {(slide.progress?.current !== undefined && slide.progress?.target !== undefined) ? (
                      <div className="mt-3">
                        <div className="w-full bg-blue-100 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, Math.round((slide.progress.current / Math.max(1, slide.progress.target)) * 100)))}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-bold">
                          {slide.progress.current}/{slide.progress.target} stars
                        </p>
                      </div>
                    ) : (
                      slide.progress?.label && (
                        <div className="mt-3 text-[10px] text-slate-500 font-bold">{slide.progress.label}</div>
                      )
                    )}
                  </div>
                )}

                {slide.type === 'photo' && (
                  <div className="mt-5 space-y-3">
                    {slide.steps && slide.steps.length > 0 && (
                      <ol className="text-[10px] text-slate-600 font-bold space-y-2">
                        {slide.steps.map((step, idx) => (
                          <li key={step.label}>{idx + 1}. {step.label}</li>
                        ))}
                      </ol>
                    )}
                    {slide.badges && slide.badges.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {slide.badges.map((label) => (
                          <div key={label} className="bg-blue-50 rounded-xl text-[9px] font-black text-blue-600 p-2 text-center">
                            {label}
                          </div>
                        ))}
                      </div>
                    )}
                    {slide.summary && (
                      <div className="text-[10px] text-slate-500 font-bold">
                        {slide.summary}
                      </div>
                    )}
                  </div>
                )}

                {slide.type === 'leaderboard' && (
                  <div className="mt-5 space-y-2">
                    {slide.leaderboard && slide.leaderboard.length > 0 ? (
                      slide.leaderboard.map((row) => (
                        <div key={row.rank} className="flex items-center p-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-bold">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3">
                            {row.rank}
                          </div>
                          <span className="text-slate-700">{row.name}</span>
                          {row.stars !== undefined && <span className="ml-auto text-blue-600">{row.stars} stars</span>}
                        </div>
                      ))
                    ) : (
                      slide.summary && (
                        <div className="text-[10px] text-slate-500 font-bold">
                          {slide.summary}
                        </div>
                      )
                    )}
                  </div>
                )}

                {slide.type === 'dashboard' && (
                  slide.summary ? (
                    <div className="mt-5 bg-blue-50 rounded-2xl p-3 text-[10px] font-bold text-blue-700">
                      {slide.summary}
                    </div>
                  ) : null
                )}

                {slide.tips && (
                  <div className="mt-5 space-y-2">
                    {slide.tips.map((tip) => (
                      <div key={tip} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {tip}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (index === 0) {
                recordOnboardingEvent({ step: index, action: 'back_disabled' }).catch(() => {});
                return;
              }
              recordOnboardingEvent({ step: index, action: 'back' }).catch(() => {});
              setShowTooltip(false);
              setIndex(prev => Math.max(0, prev - 1));
            }}
            disabled={index === 0}
            className="px-4 py-3 bg-white border border-blue-100 text-blue-600 rounded-xl text-[10px] font-black disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-5 py-3 bg-blue-600 text-white rounded-xl font-black text-sm flex items-center gap-2 active:scale-95 transition-transform"
          >
            {index === slides.length - 1 ? (
              <>
                Get Started <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                Next <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
          {index === slides.length - 1 && secondaryCta && (
            <button
              onClick={handleNext}
              className="px-4 py-3 bg-white border border-blue-100 text-blue-600 rounded-xl text-[10px] font-black"
            >
              {secondaryCta}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
