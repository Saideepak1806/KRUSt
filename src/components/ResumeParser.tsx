import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Career, RoadmapItem } from "../types";
import { 
  Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Sparkles, 
  ChevronRight, ArrowRight, ArrowUpRight, Award, Layers, Target, 
  ExternalLink, ListChecks, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ResumeParserProps {
  career: Career;
  onApplyRoadmap: (roadmap: RoadmapItem[], resumeAnalysis: any) => void;
  username: string | null;
  currentAnalysis: any;
  currentRoadmap: RoadmapItem[] | null;
  onBack?: () => void;
}

export default function ResumeParser({
  career,
  onApplyRoadmap,
  username,
  currentAnalysis,
  currentRoadmap,
  onBack
}: ResumeParserProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "results">(currentAnalysis ? "results" : "upload");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Analysis result states
  const [results, setResults] = useState<{
    targetCareerId?: string;
    targetCareerName?: string;
    atsScore: number;
    summary: string;
    parsedSkills: string[];
    goods?: string[];
    bads?: string[];
    projectGaps?: string[];
    skillGaps: string[];
    experienceGaps: string[];
    roadmap: RoadmapItem[];
  } | null>(currentAnalysis ? { ...currentAnalysis, roadmap: currentRoadmap || [] } : null);

  const isCareerMismatch = results && results.targetCareerName && results.targetCareerName.toLowerCase() !== career.name.toLowerCase();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingSteps = [
    "Reading file raw bytes...",
    "Decoding resume layout & structure...",
    "Cross-referencing target role competencies...",
    "Running ATS match score algorithm...",
    "Identifying technical & experience gaps...",
    "Compiling personalized learning milestones..."
  ];

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ["application/pdf", "text/plain"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".pdf")) {
      setError("Supported file types are PDF (.pdf) and Plain Text (.txt)");
      return;
    }
    setFile(file);
    setPastedText(""); // Clear pasted text if file is uploaded
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data URL prefix (e.g. "data:application/pdf;base64,")
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const runAnalysis = async () => {
    if (!file && !pastedText.trim()) {
      setError("Please upload a resume file or paste your resume text first.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setError(null);

    // Rotate loading messages
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 2200);

    try {
      let fileData = "";
      let mimeType = "";
      let resumeText = pastedText;

      if (file) {
        fileData = await convertFileToBase64(file);
        mimeType = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "text/plain");
        if (file.name.endsWith(".txt")) {
          // If txt, read content as well
          resumeText = await file.text();
        }
      }

      const response = await fetch("/api/resume/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          fileData,
          mimeType,
          targetCareer: career,
          username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed to analyze the resume.");
      }

      const parsedResponse = await response.json();
      clearInterval(stepInterval);
      setResults(parsedResponse);
      setActiveTab("results");
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || "Connection to parsing server timed out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRoadmap = () => {
    if (results) {
      onApplyRoadmap(results.roadmap, {
        targetCareerId: results.targetCareerId || career.id,
        targetCareerName: results.targetCareerName || career.name,
        atsScore: results.atsScore,
        summary: results.summary,
        parsedSkills: results.parsedSkills,
        goods: results.goods || [],
        bads: results.bads || [],
        projectGaps: results.projectGaps || [],
        skillGaps: results.skillGaps,
        experienceGaps: results.experienceGaps,
      });
      alert(`Adaptive Roadmap for "${career.name}" synced and saved successfully! Your dashboard has been updated.`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 stroke-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 50) return "text-amber-400 stroke-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 stroke-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-md">
      {/* Tab Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition-colors mb-2 cursor-pointer"
            >
              ← BACK TO DASHBOARD
            </button>
          )}
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            Adaptive AI Resume Auditor
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Audit your resume against the <strong className="text-emerald-400">{career.name}</strong> standard to detect gaps and unlock a personalized roadmap.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            AUDIT DESK
          </button>
          <button
            onClick={() => {
              if (results) setActiveTab("results");
            }}
            disabled={!results}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "results"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            LATEST REPORTS
          </button>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-500/10 border-t-emerald-400 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin-reverse" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest font-mono">
                  ATS ENGINE IS COMPUTING
                </h3>
                <p className="text-xs text-slate-400 font-medium animate-pulse min-h-[1.5rem]">
                  {loadingSteps[loadingStep]}
                </p>
              </div>
              <div className="w-64 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  className="bg-emerald-500 h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                  transition={{ duration: 1.5 }}
                />
              </div>
            </motion.div>
          ) : activeTab === "upload" ? (
            <motion.div
              key="upload-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-400 bg-emerald-500/5"
                    : file
                    ? "border-emerald-500/30 bg-slate-950/20 hover:bg-slate-950/40"
                    : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt"
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className={`p-3.5 rounded-full ${file ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-900 text-slate-400"}`}>
                    {file ? <CheckCircle className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-bold text-white">{file.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        {(file.size / 1024).toFixed(1)} KB • Ready for Audit
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        Drag and drop your resume file here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports PDF (.pdf) or Plain Text (.txt) formats
                      </p>
                    </div>
                  )}
                  {!file && (
                    <button
                      type="button"
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 font-semibold py-1.5 px-3 rounded-lg mt-2 transition-colors cursor-pointer"
                    >
                      Browse Files
                    </button>
                  )}
                </div>
              </div>

              {/* Text Area backup */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    OR Paste Resume Plain Text
                  </label>
                  {pastedText && (
                    <button
                      onClick={() => setPastedText("")}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-mono cursor-pointer"
                    >
                      Clear text
                    </button>
                  )}
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    if (file) setFile(null); // Clear file if text is pasted
                  }}
                  placeholder="Paste contents of your resume (experience, skills, certifications, education) here directly..."
                  className="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none font-mono"
                ></textarea>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Audit Error: </span>
                    {error}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                {results && (
                  <button
                    onClick={() => setActiveTab("results")}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer font-mono"
                  >
                    View Last Report
                  </button>
                )}
                <button
                  onClick={runAnalysis}
                  disabled={!file && !pastedText.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold py-2 px-5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  Run ATS Gap Audit
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results-report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Career Switch Warning Banner */}
              {isCareerMismatch && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-300">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-200">Career Goal Switched! </span>
                      Your current audit report was computed for <strong className="text-white underline">{results?.targetCareerName || 'Previous Role'}</strong>. You are now viewing <strong className="text-emerald-400">{career.name}</strong>.
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-lg text-xs shrink-0 cursor-pointer transition-all flex items-center gap-1.5 font-mono"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Audit for {career.name}
                  </button>
                </div>
              )}

              {/* Report Header Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-950/40 p-5 rounded-xl border border-slate-800/80">
                {/* Score circle */}
                <div className="flex flex-col items-center text-center justify-center space-y-2 md:border-r border-slate-800/80">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        className="stroke-slate-900"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="56"
                        cy="56"
                        r="48"
                        className={results ? getScoreColor(results.atsScore).split(" ")[1] : "stroke-emerald-500"}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={301.6}
                        initial={{ strokeDashoffset: 301.6 }}
                        animate={{ strokeDashoffset: 301.6 - (301.6 * (results?.atsScore || 0)) / 100 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-white">{results?.atsScore}%</span>
                      <span className="text-[8px] uppercase tracking-wider font-mono text-slate-500">ATS MATCH</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold ${results ? getScoreColor(results.atsScore).split(" ").slice(2).join(" ") : ""}`}>
                    {(results?.atsScore || 0) >= 80 ? "EXCELLENT FIT" : (results?.atsScore || 0) >= 50 ? "GAP IDENTIFIED" : "CRITICAL REFINEMENTS"}
                  </span>
                </div>

                {/* Match Summary */}
                <div className="md:col-span-2 space-y-2">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    AI Executive Audit Summary
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {results?.summary}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Audit target profile: <strong className="text-slate-300">{career.name}</strong> • Real-time database cross-reference OK.
                  </p>
                </div>
              </div>

              {/* Goods & Bads Analysis Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resume Goods (Strengths) */}
                <div className="bg-emerald-950/20 p-5 rounded-xl border border-emerald-800/40 space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    Resume Goods & Strong Points (Highlights)
                  </h4>
                  {results?.goods && results.goods.length > 0 ? (
                    <ul className="space-y-2">
                      {results.goods.map((good, idx) => (
                        <li key={idx} className="text-xs text-emerald-200/90 flex items-start gap-2 bg-emerald-950/40 p-2.5 rounded border border-emerald-900/50">
                          <span className="text-emerald-400 font-bold select-none">✓</span>
                          <span>{good}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400">Baseline resume profile loaded.</p>
                  )}
                </div>

                {/* Resume Bads (Weaknesses & Red Flags) */}
                <div className="bg-rose-950/20 p-5 rounded-xl border border-rose-800/40 space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    Resume Weaknesses & Red Flags (Bads)
                  </h4>
                  {results?.bads && results.bads.length > 0 ? (
                    <ul className="space-y-2">
                      {results.bads.map((bad, idx) => (
                        <li key={idx} className="text-xs text-rose-200/90 flex items-start gap-2 bg-rose-950/40 p-2.5 rounded border border-rose-900/50">
                          <span className="text-rose-400 font-bold select-none">✕</span>
                          <span>{bad}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> No major red flags detected in resume formatting!
                    </p>
                  )}
                </div>
              </div>

              {/* Recommended Projects & Portfolio Gaps */}
              {results?.projectGaps && results.projectGaps.length > 0 && (
                <div className="bg-cyan-950/20 p-5 rounded-xl border border-cyan-800/40 space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
                    Missing Portfolio Projects (Build These to Stand Out)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {results.projectGaps.map((proj, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-3.5 rounded-lg border border-cyan-900/40 flex items-start gap-2.5">
                        <span className="text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded shrink-0">
                          PROJ #{idx + 1}
                        </span>
                        <p className="text-xs text-cyan-100 font-medium leading-relaxed">{proj}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Gaps breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Technical Skills Gaps */}
                <div className="bg-slate-950/20 p-5 rounded-xl border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    Identified Competency Gaps
                  </h4>
                  {results?.skillGaps && results.skillGaps.length > 0 ? (
                    <ul className="space-y-1.5">
                      {results.skillGaps.map((gap, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-amber-500 font-mono mt-0.5">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> No major competency gaps found!
                    </p>
                  )}
                </div>

                {/* Experience Gaps */}
                <div className="bg-slate-950/20 p-5 rounded-xl border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 shrink-0 text-amber-400" />
                    Experiential & Depth Gaps
                  </h4>
                  {results?.experienceGaps && results.experienceGaps.length > 0 ? (
                    <ul className="space-y-1.5">
                      {results.experienceGaps.map((gap, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-amber-500 font-mono mt-0.5">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Minimal experiential barriers detected.
                    </p>
                  )}
                </div>
              </div>

              {/* Custom Adaptive Roadmap Preview */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-emerald-400" />
                  Personalized Roadmap Recommendations
                </h3>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                  {results?.roadmap && results.roadmap.map((item, idx) => (
                    <div key={idx} className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/60 flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase tracking-wide bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded">
                            {item.skillId.toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            item.priority === "high" ? "bg-red-500/10 text-red-400" : item.priority === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {item.priority} Priority
                          </span>
                        </div>

                        {/* Topics */}
                        <div className="text-xs">
                          <span className="text-slate-500 font-medium">Core Syllabus: </span>
                          <span className="text-slate-300">{item.topics.join(", ")}</span>
                        </div>

                        {/* Practice recommendations */}
                        <div className="text-xs">
                          <span className="text-emerald-400 font-medium">Practice Labs: </span>
                          <span className="text-slate-400">{item.practiceRecommendations[0]}</span>
                        </div>
                      </div>

                      {/* Resources */}
                      <div className="md:w-64 shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800/60 pt-3 md:pt-0 md:pl-4 space-y-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block">Reference Resources</span>
                          {item.externalResources.slice(0, 2).map((resItem, resIdx) => (
                            <a
                              key={resIdx}
                              href={resItem.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline transition-all"
                            >
                              <span>{resItem.name}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sync Actions */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-slate-800/60">
                <button
                  onClick={() => setActiveTab("upload")}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-mono"
                >
                  <RefreshCw className="w-4 h-4" /> Re-audit Resume
                </button>

                <button
                  onClick={handleApplyRoadmap}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold py-2.5 px-5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  Apply Adaptive Roadmap & Sync Progress
                  <Award className="w-4.5 h-4.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
