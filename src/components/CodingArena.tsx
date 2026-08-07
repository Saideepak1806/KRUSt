import { useState, useEffect } from "react";
import { 
  Play, CheckCircle2, XCircle, Code, Award, RefreshCw, 
  Terminal, Sparkles, HelpCircle, ChevronRight, Loader2, BookOpen, AlertTriangle, ArrowRight, Check, CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Career } from "../types";

import { TestCase, Problem, PRESET_PROBLEMS, PROBLEM_SPECIFICATIONS } from "../data/codingProblems";

interface CodingArenaProps {
  career?: Career | null;
  customSkills?: any[];
  onBack?: () => void;
}

export default function CodingArena({ career, onBack }: CodingArenaProps) {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"description" | "testcases">("description");
  const [consoleTab, setConsoleTab] = useState<"results" | "stdout" | "coach">("results");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load recommendations based on role
  const getRecommendations = (): string[] => {
    if (!career?.name) return ["two_sum", "valid_parentheses", "fizz_buzz"];
    const normalized = career.name.toLowerCase();
    
    if (normalized.includes("software") || normalized.includes("developer") || normalized.includes("web") || normalized.includes("frontend") || normalized.includes("fullstack") || normalized.includes("full-stack")) {
      return ["two_sum", "valid_parentheses", "longest_substring", "fizz_buzz"];
    }
    if (normalized.includes("data") || normalized.includes("scientist") || normalized.includes("analyst") || normalized.includes("ml") || normalized.includes("machine")) {
      return ["two_sum", "fizz_buzz", "merge_intervals"];
    }
    if (normalized.includes("security") || normalized.includes("devops") || normalized.includes("cloud") || normalized.includes("admin") || normalized.includes("sys")) {
      return ["valid_parentheses", "reverse_string"];
    }
    if (normalized.includes("embed") || normalized.includes("hardware") || normalized.includes("embedded") || normalized.includes("qa") || normalized.includes("test")) {
      return ["reverse_string", "coin_change"];
    }
    return ["two_sum", "valid_parentheses", "coin_change"];
  };

  const recommendations = getRecommendations();

  // Load first problem on mount
  useEffect(() => {
    // Select the first recommended problem on mount
    const initialId = recommendations[0] || "two_sum";
    const found = PRESET_PROBLEMS.find(p => p.id === initialId) || PRESET_PROBLEMS[0];
    setCurrentProblem(found);
  }, []);

  // Update code template when problem or language changes
  useEffect(() => {
    if (currentProblem) {
      const template = currentProblem.starterTemplates[selectedLanguage] || "";
      setCode(template);
      setRunResult(null);
    }
  }, [currentProblem, selectedLanguage]);

  // Load a specific problem
  const selectSpecificProblem = (problem: Problem) => {
    setRunResult(null);
    setCurrentProblem(problem);
  };

  // Generate new/alternative challenge dynamically via AI or fallback
  const fetchNewProblem = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setRunResult(null);
    try {
      const response = await fetch("/api/compiler/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: difficultyFilter,
          category: "Algorithms"
        })
      });
      if (!response.ok) {
        throw new Error("Failed to retrieve coding challenge.");
      }
      const data = await response.json();
      setCurrentProblem(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Unable to retrieve custom coding problem. Restoring safe local sandbox presets.");
      // Fallback
      const randomIndex = Math.floor(Math.random() * PRESET_PROBLEMS.length);
      setCurrentProblem(PRESET_PROBLEMS[randomIndex]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunCode = async (isSubmit: boolean = false) => {
    if (!currentProblem) return;
    setIsRunning(true);
    setRunResult(null);
    setConsoleTab("results");

    try {
      const response = await fetch("/api/compiler/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          problemId: currentProblem.id,
          problemTitle: currentProblem.title,
          problemDescription: currentProblem.description,
          constraints: currentProblem.constraints,
          testCases: currentProblem.testCases,
          isSubmit
        })
      });

      if (!response.ok) {
        throw new Error("Compiler sandbox execution timed out or failed.");
      }

      const data = await response.json();
      setRunResult(data);
      if (data.status === "Accepted") {
        setConsoleTab("results");
      } else if (data.stderr) {
        setConsoleTab("stdout");
      } else {
        setConsoleTab("coach");
      }
    } catch (err: any) {
      console.error(err);
      setRunResult({
        success: false,
        status: "Runtime Error",
        stderr: err.message || "Execution exception occurred inside sandbox environment.",
        stdout: "",
        testCases: currentProblem.testCases.map(tc => ({ ...tc, passed: false, actual: "Compilation Failed" })),
        complexity: { time: "N/A", space: "N/A" },
        aiFeedback: "⚠️ System warning. Please verify bracket closures, import packages correctly, and match method declarations exactly with the starter template."
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Line numbers helper
  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);

  // Filter problems based on selected difficulty if set
  const filteredProblems = PRESET_PROBLEMS.filter(p => {
    if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Back Navigation */}
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="k-btn-ghost text-xs px-0 hover:bg-transparent mb-1"
          >
            ← BACK TO SYSTEM
          </button>
        )}
      </div>

      {/* Dynamic Career Guidance Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 bg-emerald-500/5 w-48 h-48 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
                {career?.name ? `Active Role: ${career.name}` : "GUEST MODE"}
              </span>
              <span className="bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded uppercase">
                LeetCode Sandboxed Engine
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white">
              {career?.name 
                ? `Custom Coding Specifications for: ${career.name}` 
                : "Professional Algorithmic Arena"}
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Different roles require distinct software development profiles. We have mapped core computer science challenges to specific professional roles below so you assess the precise specifications your career path demands.
            </p>
          </div>

          {career?.name ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-3 min-w-[200px] text-right md:text-left">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Role Recommendations</span>
              <span className="text-xs font-extrabold text-emerald-400 block mt-0.5 font-mono">
                {recommendations.length} Challenges Assigned
              </span>
              <div className="flex flex-wrap gap-1 mt-1.5 justify-end md:justify-start">
                {recommendations.map(id => {
                  const prob = PRESET_PROBLEMS.find(p => p.id === id);
                  return prob ? (
                    <span key={id} className="text-[8px] font-mono bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      {prob.title}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 max-w-sm">
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed flex gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>You are coding as a guest. Back on the Onboarding panel, select or generate an active career path to unlock dedicated matching tasks!</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Problem Selector with Custom Role Labels (3 Cols) */}
        <div className="xl:col-span-3 flex flex-col space-y-4 bg-slate-900/20 border border-slate-800/60 p-4 rounded-xl max-h-[700px] overflow-y-auto">
          <div className="space-y-1.5 pb-2 border-b border-slate-800/80">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              Challenge Directory
            </h3>
            <p className="text-[10px] text-slate-500 leading-snug">
              Select standard or tailored challenges mapped to engineering role specs.
            </p>
          </div>

          {/* Difficulty quick toggler */}
          <div className="flex gap-1">
            {["all", "easy", "medium"].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`flex-grow text-[9px] font-mono uppercase font-bold py-1 px-1.5 rounded border transition-all cursor-pointer text-center ${
                  difficultyFilter === diff
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Problems list */}
          <div className="space-y-2 pt-1 flex-grow overflow-y-auto">
            {filteredProblems.map((prob) => {
              const isRecommended = recommendations.includes(prob.id);
              const specMeta = PROBLEM_SPECIFICATIONS[prob.id];
              const isCurrent = currentProblem?.id === prob.id;

              return (
                <button
                  key={prob.id}
                  onClick={() => selectSpecificProblem(prob)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
                    isCurrent
                      ? "bg-slate-950 border-emerald-500/40 shadow-sm"
                      : "bg-slate-950/40 border-slate-900/80 hover:bg-slate-950/90 hover:border-slate-800"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute top-0 right-0 bg-emerald-500/10 border-l border-b border-emerald-500/20 text-emerald-400 text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-bl font-extrabold">
                      MATCHING
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-white leading-tight">
                        {prob.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className={`text-[8px] font-mono uppercase px-1 rounded border font-bold ${
                        prob.difficulty === "easy" 
                          ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" 
                          : "text-amber-400 bg-amber-500/5 border-amber-500/10"
                      }`}>
                        {prob.difficulty}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500">
                        {prob.category}
                      </span>
                    </div>
                  </div>

                  {/* Role Specification Separator Label */}
                  {specMeta && (
                    <div className={`mt-1.5 p-1.5 rounded border text-[9px] font-mono leading-relaxed space-y-1 ${specMeta.bg}`}>
                      <div className="flex justify-between items-center font-bold">
                        <span className={specMeta.text}>⚙️ {specMeta.label} Specification</span>
                      </div>
                      <p className="text-slate-400 font-sans text-[8px] line-clamp-2">
                        {specMeta.spec}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/60">
            <button
              onClick={fetchNewProblem}
              disabled={isGenerating}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-mono uppercase py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Generate New AI task</span>
            </button>
          </div>
        </div>

        {/* Middle Area: Problem Details (4 Cols) */}
        <div className="xl:col-span-4 flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden min-h-[580px]">
          {/* Header Tabs */}
          <div className="flex border-b border-slate-800/80 bg-slate-950/40">
            <button
              onClick={() => setActiveTab("description")}
              className={`px-4 py-2.5 text-xs font-mono tracking-wider font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "description"
                  ? "border-emerald-500 text-emerald-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
              Problem Details
            </button>
            <button
              onClick={() => setActiveTab("testcases")}
              className={`px-4 py-2.5 text-xs font-mono tracking-wider font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "testcases"
                  ? "border-emerald-500 text-emerald-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 inline mr-1.5" />
              Test Cases ({currentProblem?.testCases.length || 0})
            </button>
          </div>

          <div className="p-5 flex-grow overflow-y-auto space-y-6 max-h-[550px]">
            {activeTab === "description" && currentProblem && (
              <div className="space-y-5">
                {/* Title & Metadata */}
                <div className="space-y-2">
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    {currentProblem.title}
                  </h2>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                      currentProblem.difficulty === "easy"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    }`}>
                      {currentProblem.difficulty}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                      {currentProblem.category}
                    </span>
                  </div>
                </div>

                {/* Body description */}
                <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line border-t border-slate-800/40 pt-4">
                  {currentProblem.description}
                </div>

                {/* Role Mapping Specification Panel */}
                {PROBLEM_SPECIFICATIONS[currentProblem.id] && (
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      Role Requirement Map
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      This challenge validates the specific architectural capabilities required by elite professionals:
                    </p>
                    <ul className="space-y-1 text-[10px] text-slate-400 font-mono">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✔</span>
                        <span>Scope: {PROBLEM_SPECIFICATIONS[currentProblem.id].label} specifications</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✔</span>
                        <span>Key skill focus: {PROBLEM_SPECIFICATIONS[currentProblem.id].spec}</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Constraints */}
                {currentProblem.constraints && currentProblem.constraints.length > 0 && (
                  <div className="space-y-2 border-t border-slate-800/40 pt-4">
                    <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest">
                      Constraints
                    </h4>
                    <ul className="space-y-1.5">
                      {currentProblem.constraints.map((c, i) => (
                        <li key={i} className="text-[10px] text-slate-400 font-mono flex items-start gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-900">
                          <span className="text-emerald-500 select-none">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "testcases" && currentProblem && (
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-300">Unit Verification Scenarios</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  These input profiles are fed into your solution function dynamically by our compiler to verify runtime correctness.
                </p>
                
                <div className="space-y-3 pt-1">
                  {currentProblem.testCases.map((tc, index) => (
                    <div key={index} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 font-mono text-xs space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-1.5 uppercase font-bold">
                        <span>Test Case #{index + 1}</span>
                        <span className="text-emerald-500 font-bold">Inputs Matchable</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex gap-1.5">
                          <span className="text-slate-500 w-16 shrink-0">Input:</span>
                          <span className="text-slate-300 select-all bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">{tc.input}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-slate-500 w-16 shrink-0">Expected:</span>
                          <span className="text-emerald-400 font-bold">{tc.expected}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Source Editor & Interactive Compiler (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col space-y-4">
          
          {/* Editor Container */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {/* Editor Header / Language selector */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  SOURCE EDITOR
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Lang:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-emerald-500/50 font-mono cursor-pointer"
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (ES6)</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java (JDK 17)</option>
                  <option value="cpp">C++ (GCC 11)</option>
                </select>
              </div>
            </div>

            {/* Textarea Code block area */}
            <div className="flex font-mono text-xs relative h-[280px] bg-[#0d1117] overflow-hidden">
              {/* Line number rail */}
              <div className="w-10 bg-slate-950/80 text-slate-600 text-right pr-2.5 pt-3 select-none border-r border-slate-900 flex flex-col font-mono">
                {lineNumbers.map((num) => (
                  <div key={num} className="h-5 leading-5 text-[10px]">
                    {num}
                  </div>
                ))}
              </div>

              {/* Editor input */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste or write your programming logic here..."
                className="flex-grow bg-[#0d1117] text-slate-100 p-3 outline-none resize-none font-mono text-xs leading-5 focus:ring-0 overflow-y-auto"
                style={{ whiteSpace: "pre", wordBreak: "keep-all" }}
              />
            </div>

            {/* Compile Console Actions footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-t border-slate-900">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                {lineCount} lines written
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunCode(false)}
                  disabled={isRunning || isGenerating}
                  className="k-btn-secondary text-xs py-1.5 px-4"
                >
                  <Play className="w-3.5 h-3.5 text-slate-400" />
                  <span>Run Verification</span>
                </button>

                <button
                  onClick={() => handleRunCode(true)}
                  disabled={isRunning || isGenerating}
                  className="k-btn-primary text-xs py-1.5 px-5"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Compiling...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Submit Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Console Output & AI Coach Panel */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col flex-grow min-h-[220px]">
            {/* Tab Navigation header */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 justify-between items-center px-2">
              <div className="flex">
                <button
                  onClick={() => setConsoleTab("results")}
                  className={`px-3 py-2 text-[10px] font-mono tracking-wider font-bold border-b-2 transition-all cursor-pointer ${
                    consoleTab === "results"
                      ? "border-emerald-500 text-emerald-400 bg-slate-900/40"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Test Results
                </button>
                <button
                  onClick={() => setConsoleTab("stdout")}
                  className={`px-3 py-2 text-[10px] font-mono tracking-wider font-bold border-b-2 transition-all cursor-pointer ${
                    consoleTab === "stdout"
                      ? "border-emerald-500 text-emerald-400 bg-slate-900/40"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Console Output
                </button>
                <button
                  onClick={() => setConsoleTab("coach")}
                  className={`px-3 py-2 text-[10px] font-mono tracking-wider font-bold border-b-2 transition-all cursor-pointer ${
                    consoleTab === "coach"
                      ? "border-emerald-500 text-emerald-400 bg-slate-900/40"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 inline mr-1" />
                  AI Coach Analysis
                </button>
              </div>

              {runResult && (
                <div className="pr-2 flex items-center gap-1.5 font-mono text-[10px] font-bold">
                  <span className="text-slate-500 uppercase">Status:</span>
                  <span className={`${
                    runResult.status === "Accepted"
                      ? "text-emerald-400"
                      : runResult.status === "Compile Error"
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}>
                    {runResult.status}
                  </span>
                </div>
              )}
            </div>

            {/* Tab Body */}
            <div className="p-4 flex-grow overflow-y-auto max-h-[190px] font-mono text-xs">
              <AnimatePresence mode="wait">
                {isRunning ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">
                      executing assertions in sandboxed compiler...
                    </span>
                  </div>
                ) : !runResult ? (
                  <div className="text-slate-500 flex flex-col items-center justify-center py-10 space-y-1">
                    <Terminal className="w-6 h-6 opacity-30 mb-1" />
                    <p>Run your verification tests above to populate output.</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-600">Supports JS, Python, TS, Java, C++</p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Results Tab */}
                    {consoleTab === "results" && (
                      <div className="space-y-3">
                        {runResult.status === "Accepted" ? (
                          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Congratulations! All test assertions compiled & passed perfectly.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-400 bg-red-500/5 border border-red-500/20 p-2.5 rounded-lg text-xs font-bold">
                            <XCircle className="w-4 h-4" />
                            <span>Assertion Failed. Status: {runResult.status}</span>
                          </div>
                        )}

                        {/* Test case assertion grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                          {runResult.testCases && runResult.testCases.map((tc: any, i: number) => (
                            <div key={i} className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                              tc.passed
                                ? "bg-slate-950/80 border-slate-900"
                                : "bg-red-950/10 border-red-900/30 text-red-300"
                            }`}>
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase pb-1 border-b border-slate-900">
                                <span>Test Assertion #{i + 1}</span>
                                {tc.passed ? (
                                  <span className="text-emerald-400 font-extrabold flex items-center gap-1">Passed ✓</span>
                                ) : (
                                  <span className="text-red-400 font-extrabold flex items-center gap-1">Failed ✗</span>
                                )}
                              </div>
                              <div className="space-y-0.5 font-mono text-[10px]">
                                <p><span className="text-slate-500">Input:</span> <span className="text-slate-300">{tc.input}</span></p>
                                <p><span className="text-slate-500">Expected:</span> <span className="text-emerald-400">{tc.expected}</span></p>
                                <p><span className="text-slate-500">Actual:</span> <span className={tc.passed ? "text-emerald-400" : "text-red-400"}>{tc.actual}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Console Output Tab */}
                    {consoleTab === "stdout" && (
                      <div className="space-y-3 font-mono text-[11px] leading-relaxed">
                        {runResult.stderr ? (
                          <div className="bg-red-950/20 border border-red-900/30 text-red-400 p-3 rounded-lg whitespace-pre-wrap select-text">
                            <p className="font-bold border-b border-red-900/20 pb-1 mb-1 text-xs text-red-300">COMPILER STACK TRACE:</p>
                            {runResult.stderr}
                          </div>
                        ) : null}

                        <div className="bg-slate-950 p-3 rounded-lg whitespace-pre-wrap text-slate-300 select-text">
                          <p className="text-slate-500 border-b border-slate-900 pb-1 mb-1 text-[10px] font-bold">STDOUT / SYSTEM BUFFER:</p>
                          {runResult.stdout || "[Empty Output Buffer]"}
                        </div>
                      </div>
                    )}

                    {/* AI Coach Analysis Tab */}
                    {consoleTab === "coach" && (
                      <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-lg space-y-3 font-sans text-slate-300 select-text leading-relaxed">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-1.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            OPTIMIZATION FEEDBACK
                          </span>
                          
                          {runResult.complexity && (
                            <div className="flex gap-2.5 text-[10px] font-mono font-bold">
                              <span className="text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                Time: <strong className="text-amber-400">{runResult.complexity.time}</strong>
                              </span>
                              <span className="text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                Space: <strong className="text-amber-400">{runResult.complexity.space}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs whitespace-pre-wrap text-slate-200">
                          {runResult.aiFeedback}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
