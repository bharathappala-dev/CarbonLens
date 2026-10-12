import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Car,
  Home,
  Utensils,
  Recycle,
  Sparkles,
  Check,
  RotateCcw,
  BookmarkPlus,
  Shuffle,
  HelpCircle,
  ArrowRight,
  AlertTriangle,
  Plane,
  Flame,
  ShoppingBag,
  Tv,
  Wifi,
  Cpu,
  Calculator,
  Loader2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  TreePine,
} from 'lucide-react';
import {
  CarbonInputProfile,
  PredictionResult,
  PRESET_PROFILES,
  DATASET_SAMPLES,
  BodyType,
  Sex,
  Diet,
  ShowerFrequency,
  HeatingSource,
  TransportMode,
  VehicleType,
  SocialActivity,
  AirTravelFrequency,
  WasteBagSize,
  EnergyEfficiency,
  RecyclingMaterial,
  CookingAppliance,
} from '../data/carbonDataset';

interface CalculatorViewProps {
  profile: CarbonInputProfile;
  prediction: PredictionResult;
  hasUnsavedChanges: boolean;
  onUpdateProfile: (patch: Partial<CarbonInputProfile>) => void;
  onReplaceProfile: (newProfile: CarbonInputProfile, label?: string) => void;
  onSaveScenario: (name: string) => void;
  onResetProfile: () => void;
  onNavigateToModels: () => void;
}

type CategoryTab = 'transport' | 'home' | 'diet' | 'waste';
type SelectedModelType = 'lstm' | 'rf';

interface AiSuggestionItem {
  title: string;
  category: string;
  priority?: string;
  estimatedSavingKg: number;
  advice: string;
}

interface AiSuggestionsResponse {
  treesToPlantMonthly?: number;
  summary: string;
  suggestions: AiSuggestionItem[];
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  profile,
  prediction,
  hasUnsavedChanges,
  onUpdateProfile,
  onReplaceProfile,
  onSaveScenario,
  onResetProfile,
  onNavigateToModels,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('transport');
  const [isSampling, setIsSampling] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Model Selection & Prediction State
  const [selectedModel, setSelectedModel] = useState<SelectedModelType | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [hasPredicted, setHasPredicted] = useState(false);

  // AI Suggestions State (shown after prediction)
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState<AiSuggestionsResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiExpanded, setIsAiExpanded] = useState(true);
  const [showAiModal, setShowAiModal] = useState(false);

  const tabs: { id: CategoryTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'transport',
      label: 'Transport & Travel',
      icon: <Car className="w-4 h-4" />,
    },
    {
      id: 'home',
      label: 'Home & Energy',
      icon: <Home className="w-4 h-4" />,
    },
    {
      id: 'diet',
      label: 'Diet & Lifestyle',
      icon: <Utensils className="w-4 h-4" />,
    },
    {
      id: 'waste',
      label: 'Waste & Recycling',
      icon: <Recycle className="w-4 h-4" />,
    },
  ];

  const activeEmissionValue =
    selectedModel === 'rf' ? prediction.rfPrediction : prediction.lstmPrediction;

  const treesRequiredMonthly = Math.max(2, Math.ceil(activeEmissionValue / 120));

  const handleSelectModel = (model: SelectedModelType) => {
    setSelectedModel(model);
    setAiResponse(null);
    setAiError(null);
  };

  const handleRunPrediction = () => {
    if (!selectedModel) return;
    setIsPredicting(true);
    setAiResponse(null);
    setAiError(null);
    setTimeout(() => {
      setIsPredicting(false);
      setHasPredicted(true);
    }, 320);
  };

  const handleFetchAiSuggestions = async () => {
    if (!selectedModel) return;
    setIsLoadingAi(true);
    setIsAiExpanded(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          selectedModel,
          predictedEmission: activeEmissionValue,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not generate AI suggestions at this time.');
      }
      setAiResponse(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to reach AI suggestion service.';
      setAiError(message);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const totalAiSavingsKg = aiResponse
    ? aiResponse.suggestions.reduce((acc, s) => acc + (Number(s.estimatedSavingKg) || 0), 0)
    : 0;

  const handleLoadRandomSample = () => {
    setIsSampling(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * DATASET_SAMPLES.length);
      const sample = DATASET_SAMPLES[randomIndex];
      onReplaceProfile(sample, `Dataset Record #${sample.sampleId}`);
      setAiResponse(null);
      setIsSampling(false);
    }, 280);
  };

  const handleToggleRecycling = (material: RecyclingMaterial) => {
    const exists = profile.recycling.includes(material);
    const updated = exists
      ? profile.recycling.filter((m) => m !== material)
      : [...profile.recycling, material];
    onUpdateProfile({ recycling: updated, groundTruthEmission: undefined });
    setAiResponse(null);
  };

  const handleToggleCooking = (appliance: CookingAppliance) => {
    const exists = profile.cookingWith.includes(appliance);
    const updated = exists
      ? profile.cookingWith.filter((a) => a !== appliance)
      : [...profile.cookingWith, appliance];
    onUpdateProfile({ cookingWith: updated, groundTruthEmission: undefined });
    setAiResponse(null);
  };

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName =
      scenarioName.trim() ||
      `${profile.diet.charAt(0).toUpperCase() + profile.diet.slice(1)} · ${profile.transport} (${activeEmissionValue} kg)`;
    onSaveScenario(cleanName);
    setScenarioName('');
    setShowSaveModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Quick-Load Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Quick-Load Reference Profiles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a benchmark household archetype or load a real record from the 10,000-row dataset
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_PROFILES.map((preset) => {
            const isSelected = profile.sampleId === preset.profile.sampleId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onReplaceProfile(preset.profile, preset.label);
                  setAiResponse(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleLoadRandomSample}
            disabled={isSampling}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <Shuffle className={`w-3.5 h-3.5 ${isSampling ? 'animate-spin' : ''}`} />
            <span>{isSampling ? 'Sampling...' : 'Random CSV Row'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Calculator & Model Prediction Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 4-Category Interactive Form (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Category Segmented Navigation */}
          <div className="border-b border-slate-200 bg-slate-50/70 p-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span
                    className={`p-1.5 rounded-md shrink-0 ${
                      isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="text-xs font-semibold whitespace-nowrap truncate">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form Body */}
          <div className="p-5 sm:p-6">
            {isSampling ? (
              <div className="space-y-5 py-2 animate-pulse" aria-busy="true" aria-label="Loading sample profile">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-16 bg-slate-100 rounded-lg" />
                  <div className="h-16 bg-slate-100 rounded-lg" />
                  <div className="h-16 bg-slate-100 rounded-lg" />
                </div>
                <div className="h-12 bg-slate-100 rounded-lg" />
                <div className="h-12 bg-slate-100 rounded-lg" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'transport' && (
                  <motion.div
                    key="transport"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-900">
                          Primary Transport Mode
                        </label>
                        <span className="text-xs text-slate-500">
                          Feature: Transport
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-2.5">
                        {(
                          [
                            { value: 'walk/bicycle', label: 'Walk / Bicycle', sub: 'Zero tailpipe' },
                            { value: 'public', label: 'Public Transit', sub: 'Bus, rail, metro' },
                            { value: 'private', label: 'Private Vehicle', sub: 'Car or motorbike' },
                          ] as { value: TransportMode; label: string; sub: string }[]
                        ).map((opt) => {
                          const active = profile.transport === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                onUpdateProfile({
                                  transport: opt.value,
                                  vehicleType:
                                    opt.value === 'private'
                                      ? profile.vehicleType === 'Unknown'
                                        ? 'petrol'
                                        : profile.vehicleType
                                      : 'Unknown',
                                  groundTruthEmission: undefined,
                                })
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                active
                                  ? 'border-emerald-600 bg-emerald-50/50 text-slate-900'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div className="text-xs font-semibold whitespace-nowrap truncate">
                                {opt.label}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {opt.sub}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vehicle Type */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <label className="text-sm font-semibold text-slate-900">
                            Vehicle Fuel / Powertrain Type
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveTooltip(activeTooltip === 'vehicle' ? null : 'vehicle')
                              }
                              aria-label="Explain Vehicle Type imputation"
                              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                            {activeTooltip === 'vehicle' && (
                              <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 bg-slate-900 text-white text-xs rounded-lg shadow-lg z-20">
                                Non-private transport rows have NaN for Vehicle Type in the raw dataset and are imputed as &quot;Unknown&quot;.
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">
                          {profile.transport !== 'private'
                            ? 'Auto-set to Unknown (Non-private)'
                            : `Selected: ${profile.vehicleType.toUpperCase()}`}
                        </span>
                      </div>

                      {profile.transport === 'private' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2.5">
                          {(['electric', 'hybrid', 'lpg', 'petrol', 'diesel'] as VehicleType[]).map(
                            (vType) => {
                              const active = profile.vehicleType === vType;
                              return (
                                <button
                                  key={vType}
                                  type="button"
                                  onClick={() =>
                                    onUpdateProfile({
                                      vehicleType: vType,
                                      groundTruthEmission: undefined,
                                    })
                                  }
                                  className={`py-2.5 px-3 rounded-lg border text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                                    active
                                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  {vType === 'lpg' ? 'LPG' : vType}
                                </button>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                          When walking, cycling, or using public transit, personal vehicle fuel type is imputed as{' '}
                          <span className="font-mono font-medium text-slate-800">Unknown</span>.
                        </div>
                      )}
                    </div>

                    {/* Monthly Vehicle Distance Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label
                          htmlFor="distance-slider"
                          className="text-sm font-semibold text-slate-900"
                        >
                          Monthly Travel Distance
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={10000}
                            value={profile.vehicleMonthlyDistanceKm}
                            onChange={(e) =>
                              onUpdateProfile({
                                vehicleMonthlyDistanceKm: Math.min(
                                  10000,
                                  Math.max(0, Number(e.target.value) || 0)
                                ),
                                groundTruthEmission: undefined,
                              })
                            }
                            aria-label="Monthly travel distance in kilometers"
                            className="w-24 px-2.5 py-1 text-right text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:border-emerald-600"
                          />
                          <span className="text-xs font-mono text-slate-500">km / mo</span>
                        </div>
                      </div>
                      <input
                        id="distance-slider"
                        type="range"
                        min={0}
                        max={10000}
                        step={25}
                        value={profile.vehicleMonthlyDistanceKm}
                        onChange={(e) =>
                          onUpdateProfile({
                            vehicleMonthlyDistanceKm: Number(e.target.value),
                            groundTruthEmission: undefined,
                          })
                        }
                        className="w-full bg-slate-200 rounded-lg h-1.5"
                      />
                      <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400 mt-1">
                        <span>0 km</span>
                        <span>2,500 km</span>
                        <span>5,000 km</span>
                        <span>7,500 km</span>
                        <span>10,000 km</span>
                      </div>
                    </div>

                    {/* Frequency of Traveling by Air */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                          <Plane className="w-4 h-4 text-slate-500" />
                          <span>Frequency of Traveling by Air</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                        {(
                          [
                            { value: 'never', label: 'Never', impact: 'No flights' },
                            { value: 'rarely', label: 'Rarely', impact: '1–2 / yr' },
                            { value: 'frequently', label: 'Frequently', impact: 'Quarterly' },
                            { value: 'very frequently', label: 'Very Frequently', impact: 'Monthly+' },
                          ] as { value: AirTravelFrequency; label: string; impact: string }[]
                        ).map((air) => {
                          const active = profile.airTravelFrequency === air.value;
                          return (
                            <button
                              key={air.value}
                              type="button"
                              onClick={() =>
                                onUpdateProfile({
                                  airTravelFrequency: air.value,
                                  groundTruthEmission: undefined,
                                })
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                active
                                  ? 'border-emerald-600 bg-emerald-50/50 text-slate-900'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div className="text-xs font-semibold whitespace-nowrap">
                                {air.label}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {air.impact}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'home' && (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-slate-500" />
                        <span>Heating Energy Source</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                        {(
                          [
                            { value: 'electricity', label: 'Electricity', sub: 'Grid / Heat pump' },
                            { value: 'natural gas', label: 'Natural Gas', sub: 'Piped gas' },
                            { value: 'wood', label: 'Wood', sub: 'Biomass / Pellet' },
                            { value: 'coal', label: 'Coal', sub: 'High carbon solid' },
                          ] as { value: HeatingSource; label: string; sub: string }[]
                        ).map((src) => {
                          const active = profile.heatingSource === src.value;
                          return (
                            <button
                              key={src.value}
                              type="button"
                              onClick={() =>
                                onUpdateProfile({
                                  heatingSource: src.value,
                                  groundTruthEmission: undefined,
                                })
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                active
                                  ? 'border-emerald-600 bg-emerald-50/50 text-slate-900'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div className="text-xs font-semibold whitespace-nowrap">
                                {src.label}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {src.sub}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-900">
                        Household Energy Efficiency Practices
                      </label>
                      <div className="grid grid-cols-3 gap-2.5 mt-2.5">
                        {(
                          [
                            { value: 'Yes', label: 'Yes (High Efficiency)' },
                            { value: 'Sometimes', label: 'Sometimes (Partial)' },
                            { value: 'No', label: 'No (Standard)' },
                          ] as { value: EnergyEfficiency; label: string }[]
                        ).map((eff) => {
                          const active = profile.energyEfficiency === eff.value;
                          return (
                            <button
                              key={eff.value}
                              type="button"
                              onClick={() =>
                                onUpdateProfile({
                                  energyEfficiency: eff.value,
                                  groundTruthEmission: undefined,
                                })
                              }
                              className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap truncate ${
                                active
                                  ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              {eff.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                        <div className="flex items-center justify-between mb-3">
                          <label
                            htmlFor="tv-slider"
                            className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                          >
                            <Tv className="w-3.5 h-3.5 text-emerald-700" />
                            <span>TV / PC Daily Hours</span>
                          </label>
                          <span className="text-xs font-mono tabular-nums font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {profile.tvPcDailyHours} hrs/day
                          </span>
                        </div>
                        <div className="py-1">
                          <input
                            id="tv-slider"
                            type="range"
                            min={0}
                            max={24}
                            step={1}
                            value={profile.tvPcDailyHours}
                            onChange={(e) =>
                              onUpdateProfile({
                                tvPcDailyHours: Number(e.target.value),
                                groundTruthEmission: undefined,
                              })
                            }
                            style={{
                              background: `linear-gradient(to right, #047857 0%, #047857 ${(profile.tvPcDailyHours / 24) * 100}%, #CBD5E1 ${(profile.tvPcDailyHours / 24) * 100}%, #CBD5E1 100%)`,
                            }}
                            className="w-full"
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500 mt-1.5">
                          <span>0h</span>
                          <span>6h</span>
                          <span>12h</span>
                          <span>18h</span>
                          <span>24h</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                        <div className="flex items-center justify-between mb-3">
                          <label
                            htmlFor="internet-slider"
                            className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                          >
                            <Wifi className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Internet Daily Hours</span>
                          </label>
                          <span className="text-xs font-mono tabular-nums font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {profile.internetDailyHours} hrs/day
                          </span>
                        </div>
                        <div className="py-1">
                          <input
                            id="internet-slider"
                            type="range"
                            min={0}
                            max={24}
                            step={1}
                            value={profile.internetDailyHours}
                            onChange={(e) =>
                              onUpdateProfile({
                                internetDailyHours: Number(e.target.value),
                                groundTruthEmission: undefined,
                              })
                            }
                            style={{
                              background: `linear-gradient(to right, #047857 0%, #047857 ${(profile.internetDailyHours / 24) * 100}%, #CBD5E1 ${(profile.internetDailyHours / 24) * 100}%, #CBD5E1 100%)`,
                            }}
                            className="w-full"
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500 mt-1.5">
                          <span>0h</span>
                          <span>6h</span>
                          <span>12h</span>
                          <span>18h</span>
                          <span>24h</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-900">
                          Cooking Appliances Used
                        </label>
                        <span className="text-xs text-slate-500">
                          Select all that apply ({profile.cookingWith.length} selected)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {(['Stove', 'Oven', 'Microwave', 'Grill', 'Airfryer'] as CookingAppliance[]).map(
                          (item) => {
                            const selected = profile.cookingWith.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => handleToggleCooking(item)}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                                  selected
                                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-semibold'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                    selected
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {selected && <Check className="w-2.5 h-2.5" />}
                                </span>
                                <span>{item}</span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'diet' && (
                  <motion.div
                    key="diet"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="text-sm font-semibold text-slate-900">
                        Dietary Preference
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                        {(
                          [
                            { value: 'vegan', label: 'Vegan', sub: 'Plant-based only' },
                            { value: 'vegetarian', label: 'Vegetarian', sub: 'Plant + dairy/eggs' },
                            { value: 'pescatarian', label: 'Pescatarian', sub: 'Includes seafood' },
                            { value: 'omnivore', label: 'Omnivore', sub: 'Includes meat' },
                          ] as { value: Diet; label: string; sub: string }[]
                        ).map((d) => {
                          const active = profile.diet === d.value;
                          return (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() =>
                                onUpdateProfile({
                                  diet: d.value,
                                  groundTruthEmission: undefined,
                                })
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                active
                                  ? 'border-emerald-600 bg-emerald-50/50 text-slate-900'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div className="text-xs font-semibold whitespace-nowrap">
                                {d.label}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {d.sub}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label
                            htmlFor="grocery-slider"
                            className="text-xs font-semibold text-slate-800"
                          >
                            Monthly Grocery Expenditure ($)
                          </label>
                          <span className="text-xs font-mono tabular-nums font-semibold text-slate-900">
                            ${profile.monthlyGroceryBill} / mo
                          </span>
                        </div>
                        <input
                          id="grocery-slider"
                          type="range"
                          min={50}
                          max={300}
                          value={profile.monthlyGroceryBill}
                          onChange={(e) =>
                            onUpdateProfile({
                              monthlyGroceryBill: Number(e.target.value),
                              groundTruthEmission: undefined,
                            })
                          }
                          className="w-full bg-slate-200 rounded-lg h-1.5"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label
                            htmlFor="clothes-slider"
                            className="text-xs font-semibold text-slate-800 flex items-center gap-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                            <span>New Clothes Purchased Monthly</span>
                          </label>
                          <span className="text-xs font-mono tabular-nums font-semibold text-slate-900">
                            {profile.newClothesMonthly} items
                          </span>
                        </div>
                        <input
                          id="clothes-slider"
                          type="range"
                          min={0}
                          max={50}
                          value={profile.newClothesMonthly}
                          onChange={(e) =>
                            onUpdateProfile({
                              newClothesMonthly: Number(e.target.value),
                              groundTruthEmission: undefined,
                            })
                          }
                          className="w-full bg-slate-200 rounded-lg h-1.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-2">
                          Shower Frequency
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              'less frequently',
                              'daily',
                              'twice a day',
                              'more frequently',
                            ] as ShowerFrequency[]
                          ).map((freq) => (
                            <button
                              key={freq}
                              type="button"
                              onClick={() =>
                                onUpdateProfile({
                                  showerFrequency: freq,
                                  groundTruthEmission: undefined,
                                })
                              }
                              className={`py-2 px-2.5 rounded-lg border text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap truncate ${
                                profile.showerFrequency === freq
                                  ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              {freq}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-2">
                          Social Activity Frequency
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['never', 'sometimes', 'often'] as SocialActivity[]).map((soc) => (
                            <button
                              key={soc}
                              type="button"
                              onClick={() =>
                                onUpdateProfile({
                                  socialActivity: soc,
                                  groundTruthEmission: undefined,
                                })
                              }
                              className={`py-2 px-2.5 rounded-lg border text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                                profile.socialActivity === soc
                                  ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              {soc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-2">
                          Body Type (Dataset Feature)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['underweight', 'normal', 'overweight', 'obese'] as BodyType[]).map(
                            (bt) => (
                              <button
                                key={bt}
                                type="button"
                                onClick={() =>
                                  onUpdateProfile({
                                    bodyType: bt,
                                    groundTruthEmission: undefined,
                                  })
                                }
                                className={`py-2 px-2.5 rounded-lg border text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                                  profile.bodyType === bt
                                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                {bt}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-2">
                          Biological Sex (Dataset Feature)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['female', 'male'] as Sex[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                onUpdateProfile({
                                  sex: s,
                                  groundTruthEmission: undefined,
                                })
                              }
                              className={`py-2 px-2.5 rounded-lg border text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                                profile.sex === s
                                  ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'waste' && (
                  <motion.div
                    key="waste"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="text-sm font-semibold text-slate-900">
                        Household Waste Bag Size
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                        {(['small', 'medium', 'large', 'extra large'] as WasteBagSize[]).map(
                          (size) => {
                            const active = profile.wasteBagSize === size;
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() =>
                                  onUpdateProfile({
                                    wasteBagSize: size,
                                    groundTruthEmission: undefined,
                                  })
                                }
                                className={`py-3 px-3 rounded-xl border text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                                  active
                                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label
                          htmlFor="waste-count-slider"
                          className="text-sm font-semibold text-slate-900"
                        >
                          Waste Bags Disposed Weekly
                        </label>
                        <span className="text-xs font-mono tabular-nums font-semibold text-slate-900">
                          {profile.wasteBagWeeklyCount} {profile.wasteBagWeeklyCount === 1 ? 'bag' : 'bags'} / week
                        </span>
                      </div>
                      <input
                        id="waste-count-slider"
                        type="range"
                        min={1}
                        max={7}
                        step={1}
                        value={profile.wasteBagWeeklyCount}
                        onChange={(e) =>
                          onUpdateProfile({
                            wasteBagWeeklyCount: Number(e.target.value),
                            groundTruthEmission: undefined,
                          })
                        }
                        className="w-full bg-slate-200 rounded-lg h-1.5"
                      />
                      <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400 mt-1">
                        <span>1 bag</span>
                        <span>3 bags</span>
                        <span>5 bags</span>
                        <span>7 bags</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-900">
                          Active Recycling Materials
                        </label>
                        <span className="text-xs text-slate-500">
                          {profile.recycling.length} of 4 streams active
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                        {(['Paper', 'Plastic', 'Glass', 'Metal'] as RecyclingMaterial[]).map(
                          (mat) => {
                            const selected = profile.recycling.includes(mat);
                            return (
                              <button
                                key={mat}
                                type="button"
                                onClick={() => handleToggleRecycling(mat)}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                  selected
                                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <span className="text-xs font-semibold">{mat}</span>
                                <span
                                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                                    selected
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {selected && <Check className="w-3 h-3" />}
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Bottom Step Navigation & Reset Bar */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Inputs</span>
                </button>
                {hasUnsavedChanges && (
                  <span className="text-xs text-amber-700 font-medium">
                    · Modified from preset
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeTab !== 'waste' && (
                  <button
                    type="button"
                    onClick={() => {
                      const order: CategoryTab[] = ['transport', 'home', 'diet', 'waste'];
                      const nextIdx = (order.indexOf(activeTab) + 1) % order.length;
                      setActiveTab(order[nextIdx]);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Next Category</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Step 1 Select Model -> Step 2 Show Carbon Emission -> Step 3 AI Suggestions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Model Selection & Prediction Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-700" />
                <span>Step 1: Select ML Model for Prediction</span>
              </h3>
              <button
                type="button"
                onClick={onNavigateToModels}
                className="text-xs text-emerald-700 hover:underline font-medium cursor-pointer"
              >
                Compare Models
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Choose which trained regression model to run on your 19 input features
            </p>

            {/* Model Selection Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
              <button
                type="button"
                onClick={() => handleSelectModel('lstm')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedModel === 'lstm'
                    ? 'border-emerald-600 bg-emerald-50/60 text-slate-900 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">LSTM Model</span>
                  {selectedModel === 'lstm' && (
                    <Check className="w-4 h-4 text-emerald-700" />
                  )}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-emerald-700 font-medium mt-1">
                  R² = 0.9803 · MAE 97.98
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Deep Neural Network (50 epochs)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectModel('rf')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedModel === 'rf'
                    ? 'border-emerald-600 bg-emerald-50/60 text-slate-900 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Random Forest</span>
                  {selectedModel === 'rf' && (
                    <Check className="w-4 h-4 text-emerald-700" />
                  )}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-700 font-medium mt-1">
                  R² = 0.9237 · MAE 214.38
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  100 Decision Trees Ensemble
                </div>
              </button>
            </div>

            {/* Predict Action Button */}
            <button
              type="button"
              disabled={!selectedModel || isPredicting}
              onClick={handleRunPrediction}
              className="mt-4 w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPredicting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Model Inference...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>
                    {selectedModel
                      ? `Predict Carbon Emission (${selectedModel === 'lstm' ? 'LSTM' : 'Random Forest'})`
                      : 'Select a Model Above to Predict'}
                  </span>
                </>
              )}
            </button>

            {/* Step 2: Carbon Emission Output (Shown after selecting model & predicting) */}
            <AnimatePresence mode="wait">
              {hasPredicted && selectedModel && !isPredicting && (
                <motion.div
                  key={`${selectedModel}-${activeEmissionValue}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 pt-5 border-t border-slate-200 space-y-5"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {selectedModel === 'lstm'
                          ? 'LSTM Neural Network Output'
                          : 'Random Forest Regressor Output'}
                      </span>
                      <span>·</span>
                      <span
                        className={`font-semibold ${
                          prediction.rating === 'Low Impact'
                            ? 'text-emerald-700'
                            : prediction.rating === 'Moderate Impact'
                            ? 'text-teal-700'
                            : prediction.rating === 'Elevated Impact'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {prediction.rating}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <div>
                        <span className="text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
                          {activeEmissionValue.toLocaleString()}
                        </span>
                        <span className="text-sm font-medium text-slate-500 ml-2">
                          kg CO₂e / month
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Percentile</div>
                        <div className="text-sm font-mono tabular-nums font-semibold text-slate-800">
                          {prediction.percentile}th
                        </div>
                      </div>
                    </div>

                    {/* Monthly Tree-Planting Requirement Callout */}
                    <div className="mt-3.5 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-700 text-white shrink-0">
                        <TreePine className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-slate-800 leading-relaxed">
                        Based on your carbon emission of{' '}
                        <span className="font-mono tabular-nums font-bold text-slate-900">
                          {activeEmissionValue.toLocaleString()} kg/month
                        </span>
                        , you have to plant at least{' '}
                        <span className="font-mono tabular-nums font-bold text-emerald-800 underline decoration-emerald-500/60">
                          {aiResponse?.treesToPlantMonthly || treesRequiredMonthly} trees per month
                        </span>{' '}
                        to offset your footprint.
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown Bars */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-800">
                      Emission Breakdown by Source
                    </div>
                    {(
                      [
                        {
                          label: 'Transport & Aviation',
                          val: prediction.breakdown.transportAndAir,
                          color: 'bg-emerald-600',
                        },
                        {
                          label: 'Home & Energy',
                          val: prediction.breakdown.homeAndEnergy,
                          color: 'bg-teal-600',
                        },
                        {
                          label: 'Diet & Lifestyle',
                          val: prediction.breakdown.dietAndLifestyle,
                          color: 'bg-amber-500',
                        },
                        {
                          label: 'Waste & Consumption',
                          val: prediction.breakdown.wasteAndConsumption,
                          color: 'bg-slate-600',
                        },
                      ] as { label: string; val: number; color: string }[]
                    ).map((item) => {
                      const pct = Math.min(
                        100,
                        Math.round((item.val / Math.max(1, prediction.lstmPrediction)) * 100)
                      );
                      return (
                        <div key={item.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{item.label}</span>
                            <span className="font-mono tabular-nums text-slate-900 font-medium">
                              {item.val.toLocaleString()} kg ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.35 }}
                              className={`h-full rounded-full ${item.color}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons: Get AI Suggestions & Save Scenario */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleFetchAiSuggestions}
                      disabled={isLoadingAi}
                      className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      {isLoadingAi ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating AI Suggestions...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Get AI Suggestions</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSaveModal(true)}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 3: Expandable AI Suggestions Panel (Appears after clicking Get AI Suggestions) */}
          <AnimatePresence>
            {(isLoadingAi || aiResponse || aiError) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                {/* Expandable Header */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-2 bg-slate-50/70 border-b border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setIsAiExpanded(!isAiExpanded)}
                    className="flex items-center gap-2 text-left cursor-pointer flex-1"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Personalized AI Reduction Suggestions
                      </h3>
                      {aiResponse && totalAiSavingsKg > 0 && (
                        <div className="text-[11px] text-slate-500">
                          Potential total reduction:{' '}
                          <span className="font-mono tabular-nums font-semibold text-emerald-700">
                            -{totalAiSavingsKg.toLocaleString()} kg CO₂e/mo
                          </span>
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {aiResponse && !isLoadingAi && (
                      <button
                        type="button"
                        onClick={() => setShowAiModal(true)}
                        title="Open in Modal View"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Modal View</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsAiExpanded(!isAiExpanded)}
                      aria-label={isAiExpanded ? 'Collapse suggestions' : 'Expand suggestions'}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    >
                      {isAiExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Body */}
                <AnimatePresence initial={false}>
                  {isAiExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16 }}
                      className="p-5 sm:p-6"
                    >
                      {isLoadingAi && (
                        <div className="space-y-3 animate-pulse">
                          <div className="h-4 bg-slate-100 rounded w-3/4" />
                          <div className="h-16 bg-slate-100 rounded-lg" />
                          <div className="h-16 bg-slate-100 rounded-lg" />
                          <div className="h-16 bg-slate-100 rounded-lg" />
                        </div>
                      )}

                      {aiError && !isLoadingAi && (
                        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
                          <div className="font-semibold">Could not load AI suggestions</div>
                          <p>{aiError}</p>
                          <button
                            type="button"
                            onClick={handleFetchAiSuggestions}
                            className="px-3 py-1.5 rounded-md bg-white border border-red-200 text-red-800 font-semibold hover:bg-red-100/50 transition-colors cursor-pointer"
                          >
                            Try Again
                          </button>
                        </div>
                      )}

                      {aiResponse && !isLoadingAi && (
                        <div className="space-y-3.5">
                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200/70">
                            {aiResponse.summary}
                          </p>

                          <div className="space-y-2.5">
                            {aiResponse.suggestions.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
                              >
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                  <span>
                                    {item.category}
                                    {item.priority ? ` · ${item.priority}` : ''}
                                  </span>
                                  <span className="font-mono tabular-nums font-semibold text-emerald-700">
                                    Est. -{item.estimatedSavingKg} kg CO₂e/mo
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-slate-900 mt-1">
                                  {item.title}
                                </div>
                                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                  {item.advice}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dedicated AI Suggestions Modal View */}
      <AnimatePresence>
        {showAiModal && aiResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Sustainability Action Plan</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Personalized Carbon Reduction Tips
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Current Footprint:{' '}
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {activeEmissionValue.toLocaleString()} kg CO₂e/mo
                    </span>{' '}
                    · Potential Savings:{' '}
                    <span className="font-mono tabular-nums font-semibold text-emerald-700">
                      -{totalAiSavingsKg.toLocaleString()} kg CO₂e/mo
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  aria-label="Close AI suggestions modal"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 overflow-y-auto space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {aiResponse.summary}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {aiResponse.suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {item.category}
                            {item.priority ? ` · ${item.priority}` : ''}
                          </span>
                          <span className="font-mono tabular-nums font-bold text-emerald-700">
                            -{item.estimatedSavingKg} kg/mo
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 mt-1.5">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          {item.advice}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleFetchAiSuggestions}
                  disabled={isLoadingAi}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate Tips</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Scenario Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl"
            >
              <h3 className="text-base font-semibold text-slate-900">
                Save Footprint Scenario
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Save this configuration ({activeEmissionValue.toLocaleString()} kg CO₂e/mo) to compare side-by-side or export as CSV.
              </p>
              <form onSubmit={handleConfirmSave} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="scenario-name-input"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Scenario Label
                  </label>
                  <input
                    id="scenario-name-input"
                    type="text"
                    autoFocus
                    placeholder="e.g., Current Baseline or After Switching to EV"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    Save Scenario
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Reset Calculator Inputs?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    This will restore all 19 lifestyle and energy parameters to the default urban household baseline.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetProfile();
                    setHasPredicted(false);
                    setAiResponse(null);
                    setShowResetConfirm(false);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
