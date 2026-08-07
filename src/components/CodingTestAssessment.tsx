import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, CheckCircle2, XCircle, Code, Award, RefreshCw, 
  Terminal, Sparkles, HelpCircle, ChevronRight, Loader2, BookOpen, AlertTriangle, ArrowRight, Check, CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Skill, Attempt, QuestionAnswerDetail, UserSkillState, Career } from '../types';
import { PRESET_PROBLEMS, Problem } from '../data/codingProblems';

interface CodingTestAssessmentProps {
  skill: Skill;
  skillState: UserSkillState;
  onComplete: (attempt: Attempt) => void;
  onCancel: () => void;
  career?: Career | null;
}

const ROLE_PROBLEMS: Record<string, { easy: string; medium: string; hard: string }> = {
  software_engineer: {
    easy: "two_sum",
    medium: "longest_substring",
    hard: "trapping_rain_water"
  },
  data_scientist: {
    easy: "single_number",
    medium: "merge_intervals",
    hard: "median_two_arrays"
  },
  data_analyst: {
    easy: "fizz_buzz",
    medium: "group_anagrams",
    hard: "sliding_window_max"
  },
  ui_ux_designer: {
    easy: "reverse_string",
    medium: "flatten_array",
    hard: "lru_cache"
  },
  cloud_engineer: {
    easy: "valid_parentheses",
    medium: "merge_intervals",
    hard: "network_delay_time"
  }
};

export default function CodingTestAssessment({
  skill,
  skillState,
  onComplete,
  onCancel,
  career = null
}: CodingTestAssessmentProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [consoleTab, setConsoleTab] = useState<"results" | "stdout" | "coach">("results");
  const [tab, setTab] = useState<"description" | "testcases">("description");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Determine initial recommended difficulty based on attempts history count
  const attemptsCount = skillState?.history?.length || 0;
  const initialDifficulty = attemptsCount === 0 ? "easy" : attemptsCount === 1 ? "medium" : "hard";

  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>(initialDifficulty);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);

  const getRoleProblems = () => {
    const careerId = career?.id || "software_engineer";
    const mapped = ROLE_PROBLEMS[careerId] || ROLE_PROBLEMS.software_engineer;
    
    return {
      easy: PRESET_PROBLEMS.find(p => p.id === mapped.easy) || PRESET_PROBLEMS[0],
      medium: PRESET_PROBLEMS.find(p => p.id === mapped.medium) || PRESET_PROBLEMS[5],
      hard: PRESET_PROBLEMS.find(p => p.id === mapped.hard) || PRESET_PROBLEMS[10]
    };
  };

  const roleProblems = getRoleProblems();

  // Load appropriate problem when difficulty or language or career changes
  useEffect(() => {
    const activeProblem = roleProblems[currentDifficulty];
    if (activeProblem) {
      setCurrentProblem(activeProblem);
      setCode(activeProblem.starterTemplates[selectedLanguage] || "");
      setRunResult(null);
    }
  }, [currentDifficulty, selectedLanguage, career?.id]);

  // Sync template when changing languages
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    if (currentProblem) {
      setCode(currentProblem.starterTemplates[lang] || "");
    }
    setRunResult(null);
  };

  // Support pressing TAB key inside the editor instead of escaping focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const targetValue = e.currentTarget.value;
      const newValue = targetValue.substring(0, start) + "    " + targetValue.substring(end);
      setCode(newValue);

      // Reset cursor position to right after inserted tab
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleRunCode = async (isSubmit: boolean = false) => {
    if (!currentProblem) return;
    if (isSubmit) setIsSubmitting(true);
    else setIsRunning(true);
    setRunResult(null);

    const trimmed = (code || "").trim();
    const lower = trimmed.toLowerCase();
    const isUnedited = 
      !trimmed || 
      trimmed.length < 15 || 
      lower.includes("write your solution here") || 
      lower.includes("write your code here") ||
      (lower.includes("pass") && trimmed.length < 45) ||
      (lower.includes("return [];") && trimmed.length < 45);

    if (isUnedited) {
      setRunResult({
        success: false,
        status: "Compile Error",
        stderr: `Error: No code implementation written in ${selectedLanguage}. You must write your solution algorithm in ${selectedLanguage} before submitting.`,
        stdout: "[Sandbox] Aborted execution: Unedited starter template.",
        testCases: currentProblem.testCases.map(tc => ({ ...tc, passed: false, actual: "No output" })),
        complexity: { time: "N/A", space: "N/A" },
        aiFeedback: `❌ **No Code Typed**: Please write your algorithm solution code in ${selectedLanguage} before evaluating.`
      });
      setIsRunning(false);
      setIsSubmitting(false);
      setConsoleTab("stdout");
      return;
    }

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

      // If it's a submission and it succeeded/completed, we allow finishing the assessment
      if (isSubmit) {
        // We'll let the user click "Submit and Finish Assessment" or do it automatically
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
        aiFeedback: "⚠️ Sandbox error. Please check bracket closures and method signatures."
      });
    } finally {
      setIsRunning(false);
      setIsSubmitting(false);
    }
  };

  const handleFinishAssessment = () => {
    if (!currentProblem) return;

    // Determine correctness and score based on compiled results or testCases passed
    let passedCount = 0;
    const totalCount = currentProblem.testCases.length;

    if (runResult && Array.isArray(runResult.testCases)) {
      passedCount = runResult.testCases.filter((tc: any) => tc.passed).length;
    } else if (runResult?.status === "Accepted") {
      passedCount = totalCount;
    }

    // Mathematically clean scoring: (passed test cases / total test cases) * 100
    const score = Math.round((passedCount / totalCount) * 100);

    // Create details matching QuestionAnswerDetail schema for persistence
    const detail: QuestionAnswerDetail = {
      questionId: currentProblem.id,
      topic: currentProblem.category,
      selectedIndex: runResult?.status === "Accepted" ? 1 : 0,
      correct: passedCount === totalCount,
      difficulty: currentProblem.difficulty
    };

    const attempt: Attempt = {
      id: `attempt_${Date.now()}`,
      timestamp: Date.now(),
      skillId: skill.id,
      score,
      correctCount: passedCount,
      totalCount,
      details: [detail]
    };

    onComplete(attempt);
  };

  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);

  if (!currentProblem) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <Loader2 className="w-12 h-12 text-slate-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Initializing adaptive coding specifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800/80 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg text-emerald-400">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                Interactive Coding Challenge
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded uppercase">
                Active Assessment
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">
              {skill.name}: Real Programming Evaluation
            </h2>
          </div>
        </div>
        
        <button
          id="quit-coding-test-btn"
          onClick={() => {
            if (window.confirm("Are you sure you want to quit? Your code will not be submitted, and progress is lost.")) {
              onCancel();
            }
          }}
          className="text-xs text-slate-400 hover:text-red-400 font-mono transition-colors cursor-pointer border border-slate-800 px-3 py-1.5 rounded-lg hover:border-red-500/20 hover:bg-red-500/5"
        >
          QUIT ASSESSMENT ×
        </button>
      </div>

      {/* LeetCode Layout Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left column - Problem Description */}
        <div className="lg:col-span-2 flex flex-col space-y-4 bg-slate-900/30 border border-slate-800/80 rounded-xl p-6 min-h-[500px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                Category: {currentProblem.category}
              </span>
              <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                currentProblem.difficulty === 'hard' 
                  ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                  : currentProblem.difficulty === 'medium'
                  ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                {currentProblem.difficulty}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{currentProblem.title}</h3>
          </div>

          {/* Active Role Identifier and Difficulty Selection */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              {career?.name || "Software Engineer"} Assessment Path
            </span>
            <div className="bg-slate-950/80 p-1 rounded-lg border border-slate-800/60 flex items-center gap-1">
              {(['easy', 'medium', 'hard'] as const).map((diff) => {
                const isRecommended = diff === initialDifficulty;
                const isActive = diff === currentDifficulty;
                return (
                  <button
                    key={diff}
                    id={`diff-tab-${diff}`}
                    onClick={() => {
                      setCurrentDifficulty(diff);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-md font-mono text-[10px] uppercase transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isActive
                        ? diff === 'easy'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold'
                          : diff === 'medium'
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold'
                          : 'bg-red-500/10 border border-red-500/20 text-red-400 font-bold'
                        : 'border border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
                    }`}
                  >
                    <span>{diff}</span>
                    {isRecommended && (
                      <span className="text-[7px] opacity-70 mt-0.5 font-sans font-medium">
                        Recommended
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-slate-800/80 gap-4 text-xs font-mono">
            <button
              id="problem-desc-tab"
              onClick={() => setTab("description")}
              className={`pb-2 border-b-2 transition-colors ${tab === "description" ? "border-emerald-400 text-emerald-400 font-bold" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              Description
            </button>
            <button
              id="problem-cases-tab"
              onClick={() => setTab("testcases")}
              className={`pb-2 border-b-2 transition-colors ${tab === "testcases" ? "border-emerald-400 text-emerald-400 font-bold" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              Examples ({currentProblem.testCases.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 text-slate-300 text-xs md:text-sm leading-relaxed max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-slate-800">
            {tab === "description" ? (
              <div className="space-y-4">
                <div className="whitespace-pre-line">{currentProblem.description}</div>
                
                {/* Constraints */}
                {currentProblem.constraints.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-lg space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Constraints:</span>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 font-mono">
                      {currentProblem.constraints.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {currentProblem.testCases.map((tc, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Example {idx + 1}</div>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="text-slate-400"><strong className="text-slate-500">Input:</strong> {tc.input}</div>
                      <div className="text-emerald-400"><strong className="text-slate-500">Expected:</strong> {tc.expected}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment Advice Banner */}
          <div className="bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-lg text-slate-400 text-xs space-y-1 font-sans">
            <span className="font-bold text-emerald-400 block flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Assessment Evaluation Guidelines:
            </span>
            <p>Your performance score is computed on a real code compiler. Ensure all initial test cases pass before final submission.</p>
          </div>
        </div>

        {/* Right columns - Code Editor & Console */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          
          {/* Language Selector & Controls */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">Language:</span>
              <select
                id="assessment-lang-select"
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (ES6)</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java 17</option>
                <option value="cpp">C++ (GCC)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                id="assess-run-code-btn"
                disabled={isRunning || isSubmitting}
                onClick={() => handleRunCode(false)}
                className="k-btn-secondary text-xs py-1.5 px-4"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Code</span>
                  </>
                )}
              </button>

              <button
                id="assess-submit-code-btn"
                disabled={isRunning || isSubmitting}
                onClick={() => handleRunCode(true)}
                className="k-btn-primary text-xs py-1.5 px-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Submit & Evaluate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Code Editor Pane */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col flex-1 min-h-[350px]">
            {/* Editor Header Bar */}
            <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                editor.txt
              </span>
              <span>UTF-8</span>
            </div>

            {/* Editor Body */}
            <div className="flex flex-1 relative font-mono text-xs md:text-sm min-h-[300px]">
              {/* Line Numbers Gutter */}
              <div className="bg-slate-950/40 select-none text-right pr-3 pl-4 py-4 text-slate-600 border-r border-slate-900 flex flex-col leading-6 min-w-[3rem]">
                {lineNumbers.map(n => (
                  <span key={n}>{n}</span>
                ))}
              </div>

              {/* Editable Text Area */}
              <textarea
                ref={editorRef}
                id="code-assessment-editor-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck="false"
                className="flex-1 bg-transparent text-slate-100 py-4 px-4 resize-none focus:outline-none leading-6 font-mono border-none"
                style={{ tabSize: 4 }}
                placeholder="// Write your algorithmic code solution here..."
              />
            </div>
          </div>

          {/* Console Output & Test Results Container */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col space-y-4">
            
            {/* Console Tab Header */}
            <div className="flex border-b border-slate-800 gap-4 text-xs font-mono">
              <button
                id="console-results-tab"
                onClick={() => setConsoleTab("results")}
                className={`pb-2 border-b-2 transition-colors ${consoleTab === "results" ? "border-emerald-400 text-emerald-400 font-bold" : "border-transparent text-slate-400 hover:text-white"}`}
              >
                Execution Results
              </button>
              <button
                id="console-stdout-tab"
                onClick={() => setConsoleTab("stdout")}
                className={`pb-2 border-b-2 transition-colors ${consoleTab === "stdout" ? "border-emerald-400 text-emerald-400 font-bold" : "border-transparent text-slate-400 hover:text-white"}`}
              >
                Stdout / Stderr
              </button>
              <button
                id="console-coach-tab"
                onClick={() => setConsoleTab("coach")}
                className={`pb-2 border-b-2 transition-colors ${consoleTab === "coach" ? "border-emerald-400 text-emerald-400 font-bold" : "border-transparent text-slate-400 hover:text-white"}`}
              >
                AI Coach Blueprint
              </button>
            </div>

            {/* Console Tab Content */}
            <div className="min-h-[120px] bg-slate-950 rounded-lg p-4 font-mono text-xs overflow-auto max-h-[250px]">
              
              {/* Fallback - No run yet */}
              {!runResult && !isRunning && !isSubmitting && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-6 text-center space-y-1">
                  <Play className="w-5 h-5 opacity-40 animate-pulse" />
                  <span>Terminal output idle. Press "Run Code" or "Submit & Evaluate" to start compiling.</span>
                </div>
              )}

              {/* Running Loader */}
              {(isRunning || isSubmitting) && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <span>Compiling module and invoking container sandbox test runners...</span>
                </div>
              )}

              {/* Show results */}
              {runResult && !isRunning && !isSubmitting && (
                <>
                  {consoleTab === "results" && (
                    <div className="space-y-4">
                      {/* Header Badge */}
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-slate-500 font-bold">STATUS REPORT</span>
                        <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                          runResult.status === "Accepted"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                        }`}>
                          {runResult.status}
                        </span>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded">
                          <span className="text-[10px] text-slate-500 block">TIME COMPLEXITY</span>
                          <span className="text-slate-300 font-bold">{runResult.complexity?.time || "O(N)"}</span>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded">
                          <span className="text-[10px] text-slate-500 block">SPACE COMPLEXITY</span>
                          <span className="text-slate-300 font-bold">{runResult.complexity?.space || "O(1)"}</span>
                        </div>
                      </div>

                      {/* Test Case Breakdown */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] text-slate-500 block">TEST RUNS:</span>
                        {runResult.testCases && runResult.testCases.map((tc: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between border border-slate-900 p-2 rounded bg-slate-900/10">
                            <span className="text-slate-400">Test Case {idx + 1}: <span className="text-[10px] text-slate-600 font-mono">{tc.input}</span></span>
                            <span className="flex items-center gap-1.5 font-bold">
                              <span className="text-[10px] text-slate-500">Output: {tc.actual || tc.expected}</span>
                              {tc.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Final Step Completeness Trigger */}
                      {runResult.status === "Accepted" && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-lg flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5 text-xs">
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <Award className="w-4 h-4" /> Challenge Solved!
                            </span>
                            <p className="text-slate-400 text-[11px]">All test cases matched. Submit this challenge to finalize your readiness score.</p>
                          </div>
                          <button
                            id="finish-coding-test-btn"
                            onClick={handleFinishAssessment}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            Finish Assessment
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {consoleTab === "stdout" && (
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-500 text-[10px] block">STANDARD OUTPUT (STDOUT)</span>
                        <pre className="bg-slate-900 border border-slate-800 p-3 rounded text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-[120px]">
                          {runResult.stdout || "[Empty Output stream]"}
                        </pre>
                      </div>
                      {runResult.stderr && (
                        <div>
                          <span className="text-rose-400 text-[10px] block">STANDARD ERROR (STDERR)</span>
                          <pre className="bg-red-500/5 border border-red-500/15 p-3 rounded text-rose-300 overflow-x-auto whitespace-pre-wrap max-h-[120px]">
                            {runResult.stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {consoleTab === "coach" && (
                    <div className="space-y-2 leading-relaxed text-slate-300 text-xs">
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI COACH RECONCILIATION ANALYTICS
                      </div>
                      <p className="whitespace-pre-line text-slate-400 bg-slate-900 border border-slate-800 p-3 rounded-lg leading-relaxed font-sans">
                        {runResult.aiFeedback || "Solve the challenge or run compilations to unlock Gemini-powered optimization tips, Big-O metrics, and debugging plans."}
                      </p>
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Submit Action Block when code ran but not accepted */}
            {runResult && runResult.status !== "Accepted" && !isRunning && !isSubmitting && (
              <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                <span className="text-xs text-slate-400 leading-relaxed font-sans">
                  ⚠️ Some tests failed. You can refine your code and execute runs again, or accept this progress to finish the test.
                </span>
                <button
                  id="finish-coding-test-anyway-btn"
                  onClick={handleFinishAssessment}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-sans text-xs font-bold py-1.5 px-4 rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Submit Current Progress
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
