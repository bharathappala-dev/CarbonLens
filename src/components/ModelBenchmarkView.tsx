import React, { useState } from 'react';
import { Cpu, Play } from 'lucide-react';
import { LSTM_TRAINING_HISTORY, MODEL_BENCHMARKS } from '../data/carbonDataset';

export const ModelBenchmarkView: React.FC = () => {
  const [selectedEpoch, setSelectedEpoch] = useState<number>(50);
  const [scaleMode, setScaleMode] = useState<'linear' | 'log'>('linear');
  const [isReplaying, setIsReplaying] = useState(false);

  const currentEpochData =
    LSTM_TRAINING_HISTORY.find((e) => e.epoch === selectedEpoch) ||
    LSTM_TRAINING_HISTORY[LSTM_TRAINING_HISTORY.length - 1];

  const handleReplayTraining = () => {
    if (isReplaying) return;
    setIsReplaying(true);
    setSelectedEpoch(1);
    let ep = 1;
    const interval = setInterval(() => {
      ep += 1;
      setSelectedEpoch(ep);
      if (ep >= 50) {
        clearInterval(interval);
        setIsReplaying(false);
      }
    }, 45);
  };

  // Compute SVG polyline coordinates for the 50-epoch loss curve
  const chartWidth = 720;
  const chartHeight = 220;
  const padX = 44;
  const padY = 20;
  const innerW = chartWidth - padX * 2;
  const innerH = chartHeight - padY * 2;

  const getY = (val: number) => {
    if (scaleMode === 'log') {
      const minLog = Math.log10(15000);
      const maxLog = Math.log10(6500000);
      const norm = (Math.log10(Math.max(15000, val)) - minLog) / (maxLog - minLog);
      return padY + innerH * (1 - norm);
    } else {
      const maxVal = 6300000;
      const norm = val / maxVal;
      return padY + innerH * (1 - norm);
    }
  };

  const getX = (epoch: number) => {
    return padX + ((epoch - 1) / 49) * innerW;
  };

  const visibleHistory = LSTM_TRAINING_HISTORY.slice(0, selectedEpoch);

  const trainPoints = visibleHistory
    .map((d) => `${getX(d.epoch).toFixed(1)},${getY(d.loss).toFixed(1)}`)
    .join(' ');

  const valPoints = visibleHistory
    .map((d) => `${getX(d.epoch).toFixed(1)},${getY(d.valLoss).toFixed(1)}`)
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Head-to-Head Model Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: LSTM Model (Winner) */}
        <div className="bg-white border border-emerald-600/80 rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-emerald-700">
              Primary Production Model · Best Accuracy
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              21,451 params
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            {MODEL_BENCHMARKS.lstm.name}
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {MODEL_BENCHMARKS.lstm.architecture}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
            <div>
              <div className="text-[11px] text-slate-500">R² Score</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                {(MODEL_BENCHMARKS.lstm.r2 * 100).toFixed(2)}%
              </div>
              <div className="text-[11px] font-mono text-slate-400">0.9803</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">MAE (Test)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {MODEL_BENCHMARKS.lstm.mae.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">kg CO₂e</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">RMSE (Test)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {MODEL_BENCHMARKS.lstm.rmse.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">kg CO₂e</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Test MSE</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                20,496
              </div>
              <div className="text-[11px] text-slate-400">50 epochs</div>
            </div>
          </div>
        </div>

        {/* Card 2: Random Forest Regressor */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-600">
              Baseline Tree Ensemble Model
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              100 estimators
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            {MODEL_BENCHMARKS.randomForest.name}
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {MODEL_BENCHMARKS.randomForest.architecture}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
            <div>
              <div className="text-[11px] text-slate-500">R² Score</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {(MODEL_BENCHMARKS.randomForest.r2 * 100).toFixed(2)}%
              </div>
              <div className="text-[11px] font-mono text-slate-400">0.9237</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">MAE (Test)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {MODEL_BENCHMARKS.randomForest.mae.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">kg CO₂e</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">RMSE (Test)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {MODEL_BENCHMARKS.randomForest.rmse.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">kg CO₂e</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Test MSE</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                79,339
              </div>
              <div className="text-[11px] text-slate-400">random_state=42</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 50-Epoch LSTM Training & Validation Loss Curve */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-700" />
              <span>LSTM 50-Epoch Training & Validation Convergence</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Epoch-by-epoch MSE loss telemetry from the training run (8,000 train samples, 20% validation split, batch size 32)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setScaleMode('linear')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  scaleMode === 'linear'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Linear Scale
              </button>
              <button
                type="button"
                onClick={() => setScaleMode('log')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  scaleMode === 'log'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Log Scale
              </button>
            </div>

            <button
              type="button"
              onClick={handleReplayTraining}
              disabled={isReplaying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isReplaying ? `Epoch ${selectedEpoch}/50` : 'Replay 50 Epochs'}</span>
            </button>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="mt-5 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-52 overflow-visible"
            role="img"
            aria-label="LSTM Training and Validation Loss Curve over 50 Epochs"
          >
            {/* Horizontal Grid Lines */}
            {[0.2, 0.5, 0.8].map((ratio) => (
              <line
                key={ratio}
                x1={padX}
                x2={chartWidth - padX}
                y1={padY + innerH * ratio}
                y2={padY + innerH * ratio}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
              />
            ))}

            {/* Validation Loss Polyline */}
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              points={valPoints}
            />

            {/* Training Loss Polyline */}
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              points={trainPoints}
            />

            {/* Current Selected Epoch Marker */}
            <circle
              cx={getX(currentEpochData.epoch)}
              cy={getY(currentEpochData.loss)}
              r={5}
              className="fill-emerald-600 stroke-white stroke-2"
            />
            <circle
              cx={getX(currentEpochData.epoch)}
              cy={getY(currentEpochData.valLoss)}
              r={4}
              className="fill-amber-500 stroke-white stroke-2"
            />
          </svg>

          {/* Interactive Scrubber & Epoch Readout */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <label
                htmlFor="epoch-scrubber"
                className="text-xs font-semibold text-slate-700 whitespace-nowrap"
              >
                Inspect Epoch:
              </label>
              <input
                id="epoch-scrubber"
                type="range"
                min={1}
                max={50}
                value={selectedEpoch}
                onChange={(e) => setSelectedEpoch(Number(e.target.value))}
                className="w-full max-w-xs bg-slate-200 rounded-lg h-1.5"
              />
              <span className="text-xs font-mono tabular-nums font-bold text-slate-900">
                Epoch {currentEpochData.epoch} / 50
              </span>
            </div>

            <div className="flex items-center gap-5 text-xs font-mono tabular-nums">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
                <span className="text-slate-500">Train Loss:</span>
                <span className="font-semibold text-slate-900">
                  {Math.round(currentEpochData.loss).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-amber-500 inline-block" />
                <span className="text-slate-500">Val Loss:</span>
                <span className="font-semibold text-slate-900">
                  {Math.round(currentEpochData.valLoss).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
