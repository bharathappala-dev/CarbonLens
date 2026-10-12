import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  Download,
  Database,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { DATASET_SAMPLES } from '../data/carbonDataset';

const DEFAULT_RAW_COLUMNS = [
  'Body Type',
  'Sex',
  'Diet',
  'How Often Shower',
  'Heating Energy Source',
  'Transport',
  'Vehicle Type',
  'Social Activity',
  'Monthly Grocery Bill',
  'Frequency of Traveling by Air',
  'Vehicle Monthly Distance Km',
  'Waste Bag Size',
  'Waste Bag Weekly Count',
  'How Long TV PC Daily Hour',
  'How Many New Clothes Monthly',
  'How Long Internet Daily Hour',
  'Energy efficiency',
  'Recycling',
  'Cooking_With',
  'CarbonEmission',
];

const DEFAULT_56_ENGINEERED_FEATURES = [
  // 6 Numerical Features
  'Monthly Grocery Bill',
  'Vehicle Monthly Distance Km',
  'Waste Bag Weekly Count',
  'How Long TV PC Daily Hour',
  'How Many New Clothes Monthly',
  'How Long Internet Daily Hour',
  // 41 One-Hot Encoded Categorical Features
  'Body Type_normal',
  'Body Type_obese',
  'Body Type_overweight',
  'Body Type_underweight',
  'Sex_female',
  'Sex_male',
  'Diet_omnivore',
  'Diet_pescatarian',
  'Diet_vegan',
  'Diet_vegetarian',
  'How Often Shower_daily',
  'How Often Shower_less frequently',
  'How Often Shower_more frequently',
  'How Often Shower_twice a day',
  'Heating Energy Source_coal',
  'Heating Energy Source_electricity',
  'Heating Energy Source_natural gas',
  'Heating Energy Source_wood',
  'Transport_private',
  'Transport_public',
  'Transport_walk/bicycle',
  'Vehicle Type_Unknown',
  'Vehicle Type_diesel',
  'Vehicle Type_electric',
  'Vehicle Type_hybrid',
  'Vehicle Type_lpg',
  'Vehicle Type_petrol',
  'Social Activity_never',
  'Social Activity_often',
  'Social Activity_sometimes',
  'Frequency of Traveling by Air_frequently',
  'Frequency of Traveling by Air_never',
  'Frequency of Traveling by Air_rarely',
  'Frequency of Traveling by Air_very frequently',
  'Waste Bag Size_extra large',
  'Waste Bag Size_large',
  'Waste Bag Size_medium',
  'Waste Bag Size_small',
  'Energy efficiency_No',
  'Energy efficiency_Sometimes',
  'Energy efficiency_Yes',
  // 9 Binary Features from Recycling & Cooking_With
  'Recycling_Glass',
  'Recycling_Metal',
  'Recycling_Paper',
  'Recycling_Plastic',
  'Cooking_Airfryer',
  'Cooking_Grill',
  'Cooking_Microwave',
  'Cooking_Oven',
  'Cooking_Stove',
];

export const DatasetExplorerView: React.FC = () => {
  const [totalRecords, setTotalRecords] = useState<number>(10000);
  const [rawFeatureNames, setRawFeatureNames] = useState<string[]>(DEFAULT_RAW_COLUMNS);
  const [engineeredFeatureNames, setEngineeredFeatureNames] = useState<string[]>(
    DEFAULT_56_ENGINEERED_FEATURES
  );
  const [featureViewMode, setFeatureViewMode] = useState<'raw' | 'engineered'>('raw');
  const [datasetFileName, setDatasetFileName] = useState<string>('Carbon Emission.csv');
  const [uploadedCsvContent, setUploadedCsvContent] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccessMsg(null);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Please upload a valid .csv dataset file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setUploadError('The uploaded CSV file is empty.');
        return;
      }

      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length < 2) {
        setUploadError('The CSV file must contain a header row and at least one data record.');
        return;
      }

      const parsedHeaders = lines[0]
        .split(',')
        .map((h) => h.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
      const recordCount = lines.length - 1;

      setDatasetFileName(file.name);
      setTotalRecords(recordCount);
      setRawFeatureNames(parsedHeaders);
      if (parsedHeaders.length === 20) {
        setEngineeredFeatureNames(DEFAULT_56_ENGINEERED_FEATURES);
      } else {
        setEngineeredFeatureNames(parsedHeaders);
      }
      setUploadedCsvContent(content);
      setUploadSuccessMsg(
        `Successfully loaded "${file.name}" (${recordCount.toLocaleString()} records, ${parsedHeaders.length} features).`
      );
    };

    reader.onerror = () => {
      setUploadError('Failed to read the uploaded file.');
    };

    reader.readAsText(file);
  };

  const handleDownloadDataset = () => {
    let csvData = uploadedCsvContent;

    if (!csvData) {
      const rows = DATASET_SAMPLES.map((r) =>
        [
          r.bodyType,
          r.sex,
          r.diet,
          r.showerFrequency,
          r.heatingSource,
          r.transport,
          r.vehicleType === 'Unknown' ? '' : r.vehicleType,
          r.socialActivity,
          r.monthlyGroceryBill,
          r.airTravelFrequency,
          r.vehicleMonthlyDistanceKm,
          r.wasteBagSize,
          r.wasteBagWeeklyCount,
          r.tvPcDailyHours,
          r.newClothesMonthly,
          r.internetDailyHours,
          r.energyEfficiency,
          `"[${r.recycling.map((m) => `'${m}'`).join(', ')}]"`,
          `"[${r.cookingWith.map((c) => `'${c}'`).join(', ')}]"`,
          r.groundTruthEmission,
        ].join(',')
      );

      csvData = [DEFAULT_RAW_COLUMNS.join(','), ...rows].join('\n');
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', datasetFileName || 'Carbon_Emission.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetToDefault = () => {
    setTotalRecords(10000);
    setRawFeatureNames(DEFAULT_RAW_COLUMNS);
    setEngineeredFeatureNames(DEFAULT_56_ENGINEERED_FEATURES);
    setDatasetFileName('Carbon Emission.csv');
    setUploadedCsvContent(null);
    setUploadSuccessMsg(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayedFeatures =
    featureViewMode === 'raw' ? rawFeatureNames : engineeredFeatureNames;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Total Study Records & Total Features Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Study Records</span>
            <Database className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {totalRecords.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            Active file: <span className="font-medium text-slate-700">{datasetFileName}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Features</span>
            <Layers className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-emerald-700">
              {rawFeatureNames.length}
            </span>
            <span className="text-xs text-slate-500">
              raw columns ({engineeredFeatureNames.length} encoded ML features)
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            All feature names listed below
          </div>
        </motion.div>
      </div>

      {/* All Total Features Names Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Total Features Names ({displayedFeatures.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {featureViewMode === 'raw'
                ? `Showing all ${rawFeatureNames.length} dataset column names from ${datasetFileName}`
                : `Showing all ${engineeredFeatureNames.length} preprocessed & one-hot encoded ML model features`}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFeatureViewMode('raw')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                featureViewMode === 'raw'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw Dataset Columns ({rawFeatureNames.length})
            </button>
            <button
              type="button"
              onClick={() => setFeatureViewMode('engineered')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                featureViewMode === 'engineered'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Encoded ML Features ({engineeredFeatureNames.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {displayedFeatures.map((featureName, idx) => {
            const isTarget = featureName === 'CarbonEmission';
            return (
              <div
                key={`${featureName}-${idx}`}
                className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-2 ${
                  isTarget
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-semibold'
                    : 'border-slate-200 bg-slate-50/50 text-slate-800'
                }`}
              >
                <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="truncate" title={featureName}>
                  {featureName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Dataset & Download Option Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Dataset Upload & Download
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a custom CSV dataset or download the active Carbon Emission dataset
              </p>
            </div>
          </div>

          {uploadedCsvContent && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Default Dataset</span>
            </button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="dataset-csv-upload"
        />

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/40 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Upload Dataset (.CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDataset}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Dataset (.CSV)</span>
          </button>
        </div>

        {/* Upload Feedback Messages */}
        {uploadSuccessMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {uploadError}
          </div>
        )}
      </div>
    </div>
  );
};
