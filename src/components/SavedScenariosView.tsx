import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bookmark,
  Trash2,
  ArrowUpRight,
  Download,
  PlusCircle,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { SavedScenario, CarbonInputProfile } from '../data/carbonDataset';

interface SavedScenariosViewProps {
  scenarios: SavedScenario[];
  onLoadScenario: (scenario: CarbonInputProfile, name: string) => void;
  onDeleteScenario: (id: string) => void;
  onClearAll: () => void;
  onSeedStarterScenarios: () => void;
  onNavigateToCalculator: () => void;
}

export const SavedScenariosView: React.FC<SavedScenariosViewProps> = ({
  scenarios,
  onLoadScenario,
  onDeleteScenario,
  onClearAll,
  onSeedStarterScenarios,
  onNavigateToCalculator,
}) => {
  const [showClearModal, setShowClearModal] = useState(false);

  const handleExportSaved = () => {
    const headers = [
      'Name',
      'CreatedAt',
      'LSTMPredictionKg',
      'RandomForestPredictionKg',
      'Diet',
      'Transport',
      'VehicleType',
      'MonthlyDistanceKm',
      'AirTravel',
      'HeatingSource',
      'EnergyEfficiency',
    ];
    const rows = scenarios.map((s) =>
      [
        `"${s.name.replace(/"/g, '""')}"`,
        s.createdAt,
        s.lstmPrediction,
        s.rfPrediction,
        s.diet,
        s.transport,
        s.vehicleType,
        s.vehicleMonthlyDistanceKm,
        s.airTravelFrequency,
        s.heatingSource,
        s.energyEfficiency,
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'carbonlens_saved_scenarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (scenarios.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-xl p-10 sm:p-14 text-center max-w-2xl mx-auto my-4"
      >
        {/* Animated Empty State Illustration */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center mx-auto mb-5"
        >
          <Bookmark className="w-7 h-7" />
        </motion.div>

        <h3 className="text-lg font-bold text-slate-900">
          No Saved Footprint Scenarios Yet
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          Save profiles from the Footprint Calculator to compare lifestyle changes side-by-side, track your carbon reduction progress, or export comparison reports.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onNavigateToCalculator}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Scenario</span>
          </button>
          <button
            type="button"
            onClick={onSeedStarterScenarios}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>Load 3 Demo Comparison Scenarios</span>
          </button>
        </div>
      </motion.div>
    );
  }

  const lowestScenario = [...scenarios].sort((a, b) => a.lstmPrediction - b.lstmPrediction)[0];
  const highestScenario = [...scenarios].sort((a, b) => b.lstmPrediction - a.lstmPrediction)[0];
  const maxSavings = highestScenario.lstmPrediction - lowestScenario.lstmPrediction;

  return (
    <div className="space-y-6">
      {/* Top Comparison Summary Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Saved Scenarios & Side-by-Side Comparison ({scenarios.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {scenarios.length > 1
              ? `Potential reduction between your highest and lowest saved scenario: ${maxSavings.toLocaleString()} kg CO₂e / month`
              : 'Save another scenario in the calculator to measure net carbon reduction.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportSaved}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenarios.map((scen) => {
          const isLowest = scenarios.length > 1 && scen.id === lowestScenario.id;
          return (
            <motion.div
              key={scen.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-white rounded-xl p-5 border transition-all flex flex-col justify-between ${
                isLowest ? 'border-emerald-600' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{scen.createdAt}</span>
                  {isLowest && (
                    <span className="font-semibold text-emerald-700">
                      Lowest Footprint
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
                  {scen.name}
                </h3>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                    {scen.lstmPrediction.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">kg CO₂e / mo (LSTM)</span>
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                  Random Forest: {scen.rfPrediction.toLocaleString()} kg CO₂e / mo
                </div>

                {/* Unboxed Metadata Summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Transport:</span>{' '}
                    <span className="font-medium text-slate-800 capitalize">
                      {scen.transport}
                    </span>{' '}
                    ·{' '}
                    <span className="font-mono tabular-nums">
                      {scen.vehicleMonthlyDistanceKm.toLocaleString()} km/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Aviation & Heating:</span>{' '}
                    <span className="font-medium text-slate-800 capitalize">
                      {scen.airTravelFrequency} flights
                    </span>{' '}
                    ·{' '}
                    <span className="capitalize">{scen.heatingSource}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Diet & Circularity:</span>{' '}
                    <span className="font-medium text-slate-800 capitalize">
                      {scen.diet}
                    </span>{' '}
                    ·{' '}
                    <span>{scen.recycling.length}/4 recycled</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onDeleteScenario(scen.id)}
                  aria-label={`Delete scenario ${scen.name}`}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onLoadScenario(scen, scen.name)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Load in Calculator</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showClearModal && (
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
                <div className="p-2 rounded-lg bg-red-50 text-red-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Remove All Saved Scenarios?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    This action will permanently remove all {scenarios.length} saved footprint scenarios from your browser storage.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setShowClearModal(false);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                >
                  Delete All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
