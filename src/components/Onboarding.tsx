import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, ChevronRight, CheckCircle2, Info, Trophy, TrendingUp, Sparkles, X } from 'lucide-react';
import { completeOnboarding, recordOnboardingEvent } from '../lib/onboardingApi';

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
  type: 'welcome' | 'stars' | 'photo' | 'leaderboard' | 'dashboard' | 'search' | 'location' | 'compare' | 'ai';
};

const slides: Slide[] = [
  {
    title: 'Welcome to Sconnect',
    subtitle: "Kenya's duka demand engine • Works on WhatsApp + PWA",
    highlight: 'See Omo +47% before stockout',
    tooltip: 'Your dukas get real-time demand from 16k shops across Kenya.',
    preview: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80',
    type: 'welcome'
  },
  {
    title: 'Earn Stars = Get Rich',
    subtitle: 'Photo, refer, upload. Win upgrades fast.',
    tooltip: 'Stars unlock free upgrades and top rankings. Photo daily.',
    preview: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80',
    type: 'stars'
  },
  {
    title: 'Photo to Stars to Rank',
    subtitle: 'Point. Shoot. We count your stock.',
    tooltip: 'No typing. Point and shoot. We count your stock automatically.',
    preview: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    type: 'photo'
  },
  {
    title: 'Mombasa Hot List',
    subtitle: 'Top 3 win Unilever vouchers.',
    tooltip: 'Beat your neighbors. Top dukas get brand deals and priority alerts.',
    preview: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    type: 'leaderboard'
  },
  {
    title: 'Your Stars Dashboard',
    subtitle: 'Daily check: photo stock, check rank, beat Ali.',
    tooltip: 'Daily check: photo stock, check rank, beat Ali. Free report starts now.',
    preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
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
  const [showDemo, setShowDemo] = useState(false);
  const [demoStep, setDemoStep] = useState<'ready' | 'counted' | 'earned'>('ready');

  const slide = slides[index];
  const progressDots = useMemo(() => slides.map((_, i) => i <= index), [index]);

  useEffect(() => {
    recordOnboardingEvent({ step: index, action: 'view' }).catch(() => {});
  }, [index]);

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

  const startDemo = () => {
    setShowDemo(true);
    setDemoStep('ready');
    recordOnboardingEvent({ step: index, action: 'demo_start' }).catch(() => {});
  };

  const advanceDemo = () => {
    if (demoStep === 'ready') {
      setDemoStep('counted');
      recordOnboardingEvent({ step: index, action: 'demo_counted' }).catch(() => {});
      return;
    }
    if (demoStep === 'counted') {
      setDemoStep('earned');
      recordOnboardingEvent({ step: index, action: 'demo_earned' }).catch(() => {});
      return;
    }
    setShowDemo(false);
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

                <div className="mt-5">
                  <div className="relative h-40 rounded-2xl overflow-hidden border border-blue-100">
                    <img src={slide.preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 text-[10px] font-black uppercase tracking-widest text-white/90">Screenshot Demo</div>
                  </div>
                </div>

                {slide.type === 'stars' && (
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-2 text-slate-600"><Camera className="w-3 h-3" /> Photo stock</div>
                      <span className="text-blue-600">+2 stars</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-2 text-slate-600"><Trophy className="w-3 h-3" /> Refer duka</div>
                      <span className="text-blue-600">+5 stars</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-2 text-slate-600"><Sparkles className="w-3 h-3" /> CSV upload</div>
                      <span className="text-blue-600">+10 stars</span>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-blue-100 rounded-full h-3">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '94%' }} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-bold">47/50 stars to Free Pro Month</p>
                    </div>
                  </div>
                )}

                {slide.type === 'photo' && (
                  <div className="mt-5 space-y-3">
                    <ol className="text-[10px] text-slate-600 font-bold space-y-2">
                      <li>1. Tap camera</li>
                      <li>2. Show your Omo shelf</li>
                      <li>3. AI counts 142 units and adds 2 stars</li>
                    </ol>
                    <div className="grid grid-cols-3 gap-2">
                      {['Camera', 'AI Count', '+2 stars'].map((label) => (
                        <div key={label} className="bg-blue-50 rounded-xl text-[9px] font-black text-blue-600 p-2 text-center">
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={startDemo}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black"
                      >
                        Try Demo
                      </button>
                      <button
                        onClick={handleNext}
                        className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                {slide.type === 'leaderboard' && (
                  <div className="mt-5 space-y-2">
                    {[
                      { rank: 1, name: 'Ali', stars: 12 },
                      { rank: 2, name: 'Fatma', stars: 9 },
                      { rank: 3, name: 'YOU', stars: 2 }
                    ].map((row) => (
                      <div key={row.rank} className="flex items-center p-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-bold">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3">
                          {row.rank}
                        </div>
                        <span className="text-slate-700">{row.name}</span>
                        <span className="ml-auto text-blue-600">{row.stars} stars</span>
                      </div>
                    ))}
                  </div>
                )}

                {slide.type === 'dashboard' && (
                  <div className="mt-5 bg-blue-50 rounded-2xl p-3 text-[10px] font-bold text-blue-700">
                    Stars 2/50 progress. Rank #3 Mombasa. Quick actions ready.
                  </div>
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
          {index === slides.length - 1 && (
            <button
              onClick={handleNext}
              className="px-4 py-3 bg-white border border-blue-100 text-blue-600 rounded-xl text-[10px] font-black"
            >
              Basic KSh2k/mo
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.98, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 10 }}
              className="w-full max-w-sm bg-white rounded-3xl overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="text-xs font-black text-slate-800">Photo Demo</div>
                <button onClick={() => setShowDemo(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="h-40 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">
                  Fake Camera Preview
                </div>
                {demoStep === 'ready' && (
                  <div className="text-[10px] text-slate-500 font-bold">Tap capture to count stock.</div>
                )}
                {demoStep === 'counted' && (
                  <div className="text-[10px] text-blue-600 font-bold">AI counted 142 units.</div>
                )}
                {demoStep === 'earned' && (
                  <div className="text-[10px] text-emerald-600 font-bold">+2 stars. Leaderboard updated.</div>
                )}
                <button
                  onClick={advanceDemo}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black"
                >
                  {demoStep === 'earned' ? 'Close' : 'Capture'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
