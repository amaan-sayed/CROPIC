import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Image as ImageIcon, Loader2, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [growthStage, setGrowthStage] = useState('Vegetative (15–45 days)');
  const [location, setLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => { fetchLocation(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (location) {
      formData.append("lat", location.lat.toString());
      formData.append("lon", location.lon.toString());
    }
    formData.append("growth_stage", growthStage);

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error("Server rejected the image.");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Failed to fetch");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-6 md:p-10 font-sans">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            Upload Crop Image
          </h1>
          <p className="text-slate-500 mt-1">Submit a crop photo with GPS location and growth stage for AI assessment.</p>
        </div>

        <div className="space-y-4">

          {/* Section 1: Image Upload */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-slate-800">Capture or Upload Image</h2>
            </div>
            <p className="text-slate-400 text-sm mb-4">JPEG, PNG, or WebP. Clear field-level shot preferred.</p>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-12 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all"
              >
                <UploadCloud className="w-12 h-12 mb-3" />
                <p className="font-semibold text-slate-600">Click to browse or drag & drop</p>
                <p className="text-sm mt-1">Supports JPG, PNG, WEBP</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden shadow-md">
                <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover rounded-xl" />
                
                {/* Clear Selection Button - Fixes TS Error 6133 */}
                <button 
                  onClick={clearSelection}
                  className="absolute top-3 left-3 p-1.5 bg-white/90 hover:bg-white text-rose-500 rounded-full shadow-sm transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute top-3 right-3 bg-slate-900/60 text-white text-xs px-2 py-1 rounded-lg">
                  {selectedFile && `${Math.round(selectedFile.size / 1024)}KB`}
                </div>
              </div>
            )}

            {previewUrl && (
              <div className="mt-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 font-medium">Image ready for submission</span>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              {previewUrl ? 'Change Image' : 'Browse Files'}
            </button>
          </div>

          {/* Section 2: Location */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-slate-800">Capture Location</h2>
            </div>
            <p className="text-slate-400 text-sm mb-4">GPS coordinates for crop location tracking</p>

            {locLoading ? (
              <div className="flex items-center gap-2 text-slate-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Fetching GPS signal...
              </div>
            ) : location ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Latitude</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">{location.lat.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Longitude</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">{location.lon.toFixed(6)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-slate-500 font-medium">Accuracy: ±{Math.round(location.accuracy)}m</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 mb-4 text-slate-400 text-sm font-medium">
                Location unavailable. Please allow browser location access.
              </div>
            )}

            <button
              onClick={fetchLocation}
              className="w-full py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Recapture Location
            </button>
          </div>

          {/* Section 3: Growth Stage */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-slate-800">Crop Growth Stage</h2>
            </div>
            <p className="text-slate-400 text-sm mb-4">Select the current growth stage of the crop</p>

            <label className="block text-sm font-medium text-slate-600 mb-2">Growth Stage</label>
            <select
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white cursor-pointer"
            >
              <option>Seedling (0–14 days)</option>
              <option>Vegetative (15–45 days)</option>
              <option>Flowering (46–65 days)</option>
              <option>Grain Filling (66–85 days)</option>
              <option>Maturity (86–100 days)</option>
            </select>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium animate-pulse">
              <X className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Result Card */}
          {result && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl"
              >
                <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Analysis Report
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm">Detected Status</p>
                    <p className={`text-2xl font-extrabold mt-1 ${result.status === 'Healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-2">AI Confidence Score</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence}%` }}
                          className="h-full bg-emerald-500 rounded-full" 
                        />
                      </div>
                      <span className="font-bold text-sm">{result.confidence}%</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm mb-1 font-semibold uppercase tracking-wider">Recommendation</p>
                    <p className="text-slate-200 text-sm">{result.recommendation}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Submit Action */}
          <button
            disabled={!selectedFile || isAnalyzing}
            onClick={handleAnalyze}
            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md ${
              !selectedFile ? 'bg-slate-300 cursor-not-allowed' :
              isAnalyzing ? 'bg-emerald-400 cursor-wait' :
              'bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98]'
            }`}
          >
            {isAnalyzing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing AI Models...</>
            ) : (
              <><ImageIcon className="w-5 h-5" /> Submit Crop Image</>
            )}
          </button>

          <button
            onClick={() => navigate('/home')}
            className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-bold py-2 transition-colors"
          >
            ← Back to Home
          </button>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-10 font-medium">
          CROPIC © 2026 | Digital Crop Monitoring Initiative | Ministry of Agriculture
        </p>
      </div>
    </div>
  );
};

export default Upload;