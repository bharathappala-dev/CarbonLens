/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator,
  Database,
  Cpu,
  Bookmark,
  CheckCircle2,
  Menu,
  X,
  Download,
} from 'lucide-react';
import {
  CarbonInputProfile,
  SavedScenario,
  PRESET_PROFILES,
  predictEmissions,
} from './data/carbonDataset';
import { CalculatorView } from './components/CalculatorView';
import { DatasetExplorerView } from './components/DatasetExplorerView';
import { ModelBenchmarkView } from './components/ModelBenchmarkView';
import { SavedScenariosView } from './components/SavedScenariosView';

type ActivePage = 'calculator' | 'dataset' | 'models' | 'saved';

const STORAGE_KEY_PROFILE = 'carbonlens_active_profile_v1';
const STORAGE_KEY_SCENARIOS = 'carbonlens_saved_scenarios_v1';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('calculator');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load current profile from localStorage or default to Average Urban Household
  const [profile, setProfile] = useState<CarbonInputProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return PRESET_PROFILES[1].profile;
  });

  // Load saved comparison scenarios from localStorage or seed with 2 initial reference scenarios
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCENARIOS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    const p1 = PRESET_PROFILES[1].profile;
    const pred1 = predictEmissions(p1);
    const p2 = PRESET_PROFILES[0].profile;
    const pred2 = predictEmissions(p2);
    return [
      {
        ...p1,
        id: 'seed-1',
        name: 'Urban Household Baseline',
        createdAt: 'Oct 10, 2026',
        lstmPrediction: pred1.lstmPrediction,
        rfPrediction: pred1.rfPrediction,
      },
      {
        ...p2,
        id: 'seed-2',
        name: 'Eco-Conscious Commuter Target',
        createdAt: 'Oct 10, 2026',
        lstmPrediction: pred2.lstmPrediction,
        rfPrediction: pred2.rfPrediction,
      },
    ];
  });

  // Persist profile automatically to prevent accidental data loss
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch {
      // ignore storage errors
    }
  }, [profile]);

  // Persist saved scenarios
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCENARIOS, JSON.stringify(savedScenarios));
    } catch {
      // ignore storage errors
    }
  }, [savedScenarios]);

  // Warn before unload if user has modified inputs without saving a scenario
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const prediction = useMemo(() => predictEmissions(profile), [profile]);

  const handleUpdateProfile = (patch: Partial<CarbonInputProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
    setHasUnsavedChanges(true);
  };

  const handleReplaceProfile = (newProfile: CarbonInputProfile, label?: string) => {
    setProfile({ ...newProfile });
    setHasUnsavedChanges(false);
    if (label) {
      showToast(`Loaded "${label}" into calculator`);
    }
  };

  const handleSaveScenario = (name: string) => {
    const newScenario: SavedScenario = {
      ...profile,
      id: `scen-${Date.now()}`,
      name,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      lstmPrediction: prediction.lstmPrediction,
      rfPrediction: prediction.rfPrediction,
    };
    setSavedScenarios((prev) => [newScenario, ...prev]);
    setHasUnsavedChanges(false);
    showToast(`Saved "${name}" to Scenarios`);
  };

  const handleResetProfile = () => {
    setProfile(PRESET_PROFILES[1].profile);
    setHasUnsavedChanges(false);
    showToast('Calculator inputs restored to default baseline');
  };

  const handleSeedStarterScenarios = () => {
    const starters = PRESET_PROFILES.slice(0, 3).map((p, idx) => {
      const pred = predictEmissions(p.profile);
      return {
        ...p.profile,
        id: `starter-${Date.now()}-${idx}`,
        name: p.label,
        createdAt: 'Oct 10, 2026',
        lstmPrediction: pred.lstmPrediction,
        rfPrediction: pred.rfPrediction,
      };
    });
    setSavedScenarios(starters);
    showToast('Loaded 3 benchmark comparison scenarios');
  };

  const handleExportCurrentReport = () => {
    const lines = [
      'Parameter,Value',
      `Predicted Monthly Carbon Emission (LSTM),${prediction.lstmPrediction} kg CO2e`,
      `Predicted Monthly Carbon Emission (Random Forest),${prediction.rfPrediction} kg CO2e`,
      `Dataset Percentile,${prediction.percentile}th percentile`,
      `Impact Rating,${prediction.rating}`,
      `Transport Mode,${profile.transport}`,
      `Vehicle Type,${profile.vehicleType}`,
      `Vehicle Monthly Distance Km,${profile.vehicleMonthlyDistanceKm}`,
      `Frequency of Traveling by Air,${profile.airTravelFrequency}`,
      `Heating Energy Source,${profile.heatingSource}`,
      `Energy Efficiency,${profile.energyEfficiency}`,
      `Diet,${profile.diet}`,
      `Monthly Grocery Bill,$${profile.monthlyGroceryBill}`,
      `Waste Bag Size,${profile.wasteBagSize}`,
      `Waste Bag Weekly Count,${profile.wasteBagWeeklyCount}`,
      `Recycling Materials,"${profile.recycling.join(', ') || 'None'}"`,
      `Cooking Appliances,"${profile.cookingWith.join(', ') || 'None'}"`,
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `carbonlens_report_${prediction.lstmPrediction}kg.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded current footprint CSV report');
  };

  const navItems: {
    id: ActivePage;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      id: 'calculator',
      label: 'Footprint Calculator',
      shortLabel: 'Calculator',
      icon: <Calculator className="w-4 h-4" />,
      description: 'Interactive 19-feature carbon estimator & what-if simulator',
    },
    {
      id: 'dataset',
      label: 'Dataset Explorer',
      shortLabel: 'Dataset',
      icon: <Database className="w-4 h-4" />,
      description: 'Explore 10,000 household records & emission drivers from Carbon Emission.csv',
    },
    {
      id: 'models',
      label: 'ML Model Benchmark',
      shortLabel: 'ML Models',
      icon: <Cpu className="w-4 h-4" />,
      description: 'Random Forest (R² 0.9237) vs. LSTM Deep Neural Network (R² 0.9803)',
    },
    {
      id: 'saved',
      label: `Saved Scenarios (${savedScenarios.length})`,
      shortLabel: 'Scenarios',
      icon: <Bookmark className="w-4 h-4" />,
      description: 'Compare saved household configurations side-by-side',
    },
  ];

  const activeNavMeta = navItems.find((i) => i.id === activePage) || navItems[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#calculator"
          onClick={(e) => {
            e.preventDefault();
            setActivePage('calculator');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
        >
          CarbonLens
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          {navItems.map((item) => {
            const isCurrent = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isCurrent
                    ? 'border-emerald-700 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action (+ mobile menu toggle on small screens) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCurrentReport}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 z-20"
          >
            {navItems.map((item) => {
              const isCurrent = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActivePage(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-50 text-emerald-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Body: Left Sidebar (Desktop) + Main Viewport */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Desktop Sidebar Navigation (256px) */}
        <aside className="hidden xl:flex flex-col justify-between w-64 shrink-0 border-r border-slate-200 bg-white/60 p-5">
          <div className="space-y-6">
            <div>
              <div className="text-xs font-semibold text-slate-400 px-2.5 mb-2">
                Workspace Views
              </div>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const isCurrent = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePage(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-left ${
                        isCurrent
                          ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Footprint Summary Widget in Sidebar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="text-xs text-slate-500">Active Profile Estimate</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {prediction.lstmPrediction.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">kg/mo</span>
              </div>
              <div className="text-[11px] text-slate-500">
                LSTM R² 0.9803 · {prediction.rating}
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((prediction.lstmPrediction / 5000) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/80 text-[11px] text-slate-400 space-y-1">
            <div className="font-medium text-slate-600">Dataset & Models</div>
            <div>10,000 Respondent Records</div>
            <div>56 Engineered Features</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Page Header & Context Bar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">
                Carbon Emission Analytics Studio · {activeNavMeta.shortLabel}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
                {activeNavMeta.label}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {activeNavMeta.description}
              </p>
            </div>

            {/* Quick Context Switcher */}
            {activePage !== 'calculator' && (
              <button
                type="button"
                onClick={() => setActivePage('calculator')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap"
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                <span>Back to Calculator</span>
              </button>
            )}
          </div>

          {/* Animated Page View */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {activePage === 'calculator' && (
                <CalculatorView
                  profile={profile}
                  prediction={prediction}
                  hasUnsavedChanges={hasUnsavedChanges}
                  onUpdateProfile={handleUpdateProfile}
                  onReplaceProfile={handleReplaceProfile}
                  onSaveScenario={handleSaveScenario}
                  onResetProfile={handleResetProfile}
                  onNavigateToModels={() => setActivePage('models')}
                />
              )}

              {activePage === 'dataset' && <DatasetExplorerView />}

              {activePage === 'models' && <ModelBenchmarkView />}

              {activePage === 'saved' && (
                <SavedScenariosView
                  scenarios={savedScenarios}
                  onLoadScenario={(scen, name) => {
                    handleReplaceProfile(scen, name);
                    setActivePage('calculator');
                  }}
                  onDeleteScenario={(id) => {
                    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
                    showToast('Removed scenario');
                  }}
                  onClearAll={() => {
                    setSavedScenarios([]);
                    showToast('Cleared all saved scenarios');
                  }}
                  onSeedStarterScenarios={handleSeedStarterScenarios}
                  onNavigateToCalculator={() => setActivePage('calculator')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Confirmation Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            CarbonLens — Personal Carbon Emission Intelligence & ML Benchmark Studio
          </div>
          <div className="font-mono tabular-nums">
            Dataset: 10,000 records · LSTM R²: 0.9803 · Random Forest R²: 0.9237
          </div>
        </div>
      </footer>
    </div>
  );
}
