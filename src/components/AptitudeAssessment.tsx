import { useState, useEffect, useCallback } from 'react';
import { Career, Skill, UserSkillState, Attempt, AptitudeQuestion, AptitudeCategory, AptitudeAttemptDetail } from '../types';
import { APTITUDE_QUESTIONS_BANK } from '../data/aptitudeQuestions';
import { APTITUDE_TAXONOMY, CAREER_APTITUDE_WEIGHTS } from '../data/aptitudeTaxonomy';
import { 
  Calculator, Puzzle, MessageSquareText, BarChart2, Workflow, Clock, 
  CheckCircle2, XCircle, Award, RefreshCw, ChevronRight, ArrowLeft, 
  Sparkles, HelpCircle, AlertCircle, Bookmark, Layers, Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AptitudeAssessmentProps {
  skill: Skill;
  skillState: UserSkillState;
  career: Career | null;
  onComplete: (attempt: Attempt) => void;
  onCancel: () => void;
}

export default function AptitudeAssessment({
  skill,
  skillState,
  career,
  onComplete,
  onCancel
}: AptitudeAssessmentProps) {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isTestStarted, setIsTestStarted] = useState<boolean>(false);
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  
  // Timer state (seconds)
  const [timeRemaining, setTimeRemaining] = useState<number>(900); // 15 mins default
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // Result state
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [attemptResult, setAttemptResult] = useState<Attempt | null>(null);
  const [categoryScores, setCategoryScores] = useState<Record<AptitudeCategory, { correct: number; total: number; percent: number }>>({
    QUANTITATIVE: { correct: 0, total: 0, percent: 0 },
    LOGICAL: { correct: 0, total: 0, percent: 0 },
    VERBAL: { correct: 0, total: 0, percent: 0 },
    DATA_INTERPRETATION: { correct: 0, total: 0, percent: 0 },
    SYSTEM_ABSTRACT: { correct: 0, total: 0, percent: 0 }
  });

  const careerKey = career?.id && CAREER_APTITUDE_WEIGHTS[career.id] ? career.id : 'default';
  const roleWeights = CAREER_APTITUDE_WEIGHTS[careerKey] || CAREER_APTITUDE_WEIGHTS.default;

  // Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeRemaining > 0 && !isSubmitted) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, isSubmitted]);

  // Load questions for the assessment
  const handleStartTest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate-aptitude-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: career?.name || 'Target Role',
          level: selectedLevel,
          count: 10,
          categories: Object.keys(roleWeights)
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          initTestState(data.questions.length);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Using curated questions fallback for Aptitude.');
    }

    // Fallback to local curated questions bank
    const fallbackList = APTITUDE_QUESTIONS_BANK.filter(q => {
      if (selectedLevel === 1) return q.difficulty === 'easy';
      if (selectedLevel === 2) return q.difficulty === 'medium';
      return q.difficulty === 'hard' || q.difficulty === 'medium';
    });
    
    // Shuffle and pick 10
    const shuffled = [...fallbackList, ...APTITUDE_QUESTIONS_BANK].slice(0, 10);
    setQuestions(shuffled);
    initTestState(shuffled.length);
    setIsLoading(false);
  };

  const initTestState = (count: number) => {
    setCurrentIdx(0);
    setAnswers({});
    setFlagged({});
    setTimeRemaining(count * 90); // 90 secs per question
    setTimerActive(true);
    setIsTestStarted(true);
    setIsSubmitted(false);
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const toggleFlag = (qIdx: number) => {
    setFlagged(prev => ({ ...prev, [qIdx]: !prev[qIdx] }));
  };

  const handleSubmitTest = useCallback(() => {
    setTimerActive(false);
    setIsSubmitted(true);

    const details: AptitudeAttemptDetail[] = [];
    const catStats: Record<AptitudeCategory, { correct: number; total: number }> = {
      QUANTITATIVE: { correct: 0, total: 0 },
      LOGICAL: { correct: 0, total: 0 },
      VERBAL: { correct: 0, total: 0 },
      DATA_INTERPRETATION: { correct: 0, total: 0 },
      SYSTEM_ABSTRACT: { correct: 0, total: 0 }
    };

    let totalCorrect = 0;

    questions.forEach((q, idx) => {
      const selected = answers[idx] ?? -1;
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) totalCorrect++;

      const cat = q.aptitudeCategory || 'QUANTITATIVE';
      catStats[cat].total++;
      if (isCorrect) catStats[cat].correct++;

      details.push({
        questionId: q.id,
        topic: q.topic || cat,
        selectedIndex: selected,
        correct: isCorrect,
        difficulty: q.difficulty,
        category: cat
      });
    });

    const overallPercent = Math.round((totalCorrect / (questions.length || 1)) * 100);

    const computedCategoryScores: Record<AptitudeCategory, { correct: number; total: number; percent: number }> = {
      QUANTITATIVE: {
        correct: catStats.QUANTITATIVE.correct,
        total: catStats.QUANTITATIVE.total,
        percent: catStats.QUANTITATIVE.total > 0 ? Math.round((catStats.QUANTITATIVE.correct / catStats.QUANTITATIVE.total) * 100) : 0
      },
      LOGICAL: {
        correct: catStats.LOGICAL.correct,
        total: catStats.LOGICAL.total,
        percent: catStats.LOGICAL.total > 0 ? Math.round((catStats.LOGICAL.correct / catStats.LOGICAL.total) * 100) : 0
      },
      VERBAL: {
        correct: catStats.VERBAL.correct,
        total: catStats.VERBAL.total,
        percent: catStats.VERBAL.total > 0 ? Math.round((catStats.VERBAL.correct / catStats.VERBAL.total) * 100) : 0
      },
      DATA_INTERPRETATION: {
        correct: catStats.DATA_INTERPRETATION.correct,
        total: catStats.DATA_INTERPRETATION.total,
        percent: catStats.DATA_INTERPRETATION.total > 0 ? Math.round((catStats.DATA_INTERPRETATION.correct / catStats.DATA_INTERPRETATION.total) * 100) : 0
      },
      SYSTEM_ABSTRACT: {
        correct: catStats.SYSTEM_ABSTRACT.correct,
        total: catStats.SYSTEM_ABSTRACT.total,
        percent: catStats.SYSTEM_ABSTRACT.total > 0 ? Math.round((catStats.SYSTEM_ABSTRACT.correct / catStats.SYSTEM_ABSTRACT.total) * 100) : 0
      }
    };

    setCategoryScores(computedCategoryScores);

    const existingLevelScores = skillState?.levelScores || {};
    const updatedLevelScores = {
      ...existingLevelScores,
      [selectedLevel]: overallPercent
    };

    const attemptObj: Attempt = {
      id: `apt_attempt_${Date.now()}`,
      timestamp: Date.now(),
      skillId: skill.id,
      score: overallPercent,
      correctCount: totalCorrect,
      totalCount: questions.length,
      details,
      levelScores: updatedLevelScores
    };

    setAttemptResult(attemptObj);
  }, [answers, questions, selectedLevel, skill.id, skillState?.levelScores]);

  const handleFinishAndSave = () => {
    if (attemptResult) {
      onComplete(attemptResult);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderCategoryIcon = (cat: AptitudeCategory) => {
    switch (cat) {
      case 'QUANTITATIVE': return <Calculator className="w-4 h-4 text-emerald-400" />;
      case 'LOGICAL': return <Puzzle className="w-4 h-4 text-purple-400" />;
      case 'VERBAL': return <MessageSquareText className="w-4 h-4 text-sky-400" />;
      case 'DATA_INTERPRETATION': return <BarChart2 className="w-4 h-4 text-amber-400" />;
      case 'SYSTEM_ABSTRACT': return <Workflow className="w-4 h-4 text-indigo-400" />;
    }
  };

  const currentQ = questions[currentIdx];

  return (
    <div className="max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <button
          onClick={onCancel}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Aptitude Module</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            {career?.name || 'Target Role'} Aptitude
          </span>
        </div>
      </div>

      {/* STEP 1: PRE-TEST CONFIGURATION SCREEN */}
      {!isTestStarted && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="k-card p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-emerald-500/30 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> KRÜSt Role-Weighted Assessment
                </span>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 mt-1">
                  General & Analytical Aptitude Assessment
                </h1>
                <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
                  Evaluate your quantitative reasoning, logical deduction, verbal interpretation, data analysis, and algorithmic system logic tailored specifically to <strong className="text-emerald-400">{career?.name || 'your target career'}</strong>.
                </p>
              </div>
              <div className="hidden sm:block p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <Calculator className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            {/* Role Weightings Grid */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
                Aptitude Taxonomy Weightings for {career?.name || 'Target Role'}:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(Object.entries(roleWeights) as [AptitudeCategory, number][]).map(([cat, weight]) => {
                  const meta = APTITUDE_TAXONOMY[cat];
                  return (
                    <div key={cat} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5">
                        {renderCategoryIcon(cat)}
                        <span className="text-[11px] font-bold text-slate-200">{meta.shortLabel}</span>
                      </div>
                      <div className="text-lg font-extrabold text-emerald-400 font-mono">
                        {Math.round(weight * 100)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Difficulty Level Selector */}
          <div className="k-card p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Select Assessment Difficulty Level
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { level: 1, title: 'Level 1: Foundational Speed', desc: 'Basic numeric speed, series patterns, and quick verbal comprehension.' },
                { level: 2, title: 'Level 2: Applied Scenarios', desc: 'Work-rate ratios, syllogisms, funnel analysis, and loop tracing.' },
                { level: 3, title: 'Level 3: Multi-Step Analytical', desc: 'System availability proofs, state transitions, and tabular interpretation.' }
              ].map(item => (
                <button
                  key={item.level}
                  onClick={() => setSelectedLevel(item.level)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                    selectedLevel === item.level
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-100 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono text-emerald-400">Level 0{item.level}</span>
                    {skillState?.levelScores?.[item.level] !== undefined && (
                      <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-emerald-300 px-2 py-0.5 rounded">
                        Score: {skillState.levelScores[item.level]}%
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleStartTest}
                disabled={isLoading}
                className="k-btn-primary py-3 px-6 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Preparing Role Questions...</span>
                  </>
                ) : (
                  <>
                    <span>Begin Aptitude Assessment</span>
                    <ChevronRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 2: ACTIVE ASSESSMENT SCREEN */}
      {isTestStarted && !isSubmitted && currentQ && (
        <div className="space-y-6">
          {/* Active Header & Timer */}
          <div className="k-card p-4 bg-slate-900 flex flex-wrap items-center justify-between gap-4 border-slate-800">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono font-bold text-xs text-emerald-400 flex items-center justify-center">
                {currentIdx + 1}/{questions.length}
              </span>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  {renderCategoryIcon(currentQ.aptitudeCategory)}
                  {APTITUDE_TAXONOMY[currentQ.aptitudeCategory]?.name || currentQ.aptitudeCategory}
                </span>
                <h3 className="text-xs font-bold text-slate-200">{currentQ.topic || 'Aptitude Problem'}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleFlag(currentIdx)}
                className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                  flagged[currentIdx] ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{flagged[currentIdx] ? 'Flagged' : 'Flag'}</span>
              </button>

              <div className={`p-2 px-3 rounded-lg border font-mono font-bold text-xs flex items-center gap-2 ${
                timeRemaining < 180 ? 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse' : 'bg-slate-950 border-slate-800 text-emerald-400'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Question Palette Grid */}
          <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-7 h-7 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  currentIdx === i
                    ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/50'
                    : answers[i] !== undefined
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : flagged[i]
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Question Card */}
          <div className="k-card p-6 space-y-6">
            <div className="space-y-3">
              <h2 className="text-sm md:text-base font-bold text-slate-100 whitespace-pre-line leading-relaxed">
                {currentQ.questionText}
              </h2>

              {/* Render Data Snippet if present */}
              {currentQ.dataSnippet && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 my-4">
                  {currentQ.dataSnippet.title && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                      {currentQ.dataSnippet.title}
                    </span>
                  )}
                  {currentQ.dataSnippet.type === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            {Object.keys(JSON.parse(currentQ.dataSnippet.content)[0] || {}).map((col, idx) => (
                              <th key={idx} className="p-2">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {JSON.parse(currentQ.dataSnippet.content).map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="border-b border-slate-900 hover:bg-slate-900/50">
                              {Object.values(row).map((val: any, cIdx: number) => (
                                <td key={cIdx} className="p-2">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {currentQ.dataSnippet.type === 'pseudocode' && (
                    <pre className="text-xs font-mono text-emerald-300 bg-slate-900/90 p-3 rounded-lg overflow-x-auto border border-slate-800/80">
                      {currentQ.dataSnippet.content}
                    </pre>
                  )}
                  {currentQ.dataSnippet.type === 'passage' && (
                    <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      "{currentQ.dataSnippet.content}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = answers[currentIdx] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentIdx, optIdx)}
                    className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-slate-100 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-xs md:text-sm font-medium">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                  className="k-btn-primary py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitTest}
                  className="k-btn-primary py-2.5 px-6 text-xs bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Submit Assessment</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SUBMITTED RESULTS & TAXONOMY REVIEW */}
      {isSubmitted && attemptResult && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Result Banner */}
          <div className="k-card p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-emerald-500/30 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                Aptitude Assessment Complete
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 mt-1">
                Score: {attemptResult.score}%
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                You correctly answered {attemptResult.correctCount} of {attemptResult.totalCount} questions at Level 0{selectedLevel}.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleFinishAndSave}
                className="k-btn-primary py-3 px-8 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xl"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Sync Score to KRÜSt Readiness Index</span>
              </button>
            </div>
          </div>

          {/* Taxonomy Category Breakdown */}
          <div className="k-card p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" /> Category Performance Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(categoryScores) as [AptitudeCategory, { correct: number; total: number; percent: number }][]).map(([cat, stat]) => {
                const meta = APTITUDE_TAXONOMY[cat];
                if (stat.total === 0) return null;
                return (
                  <div key={cat} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {renderCategoryIcon(cat)}
                        <span className="text-xs font-bold text-slate-200">{meta.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">{stat.percent}%</span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${stat.percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {stat.correct} / {stat.total} correct
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question-by-Question Solution Review */}
          <div className="k-card p-6 space-y-6">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" /> Detailed Solution Review
            </h3>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userChoice = answers[idx] ?? -1;
                const isCorrect = userChoice === q.correctIndex;

                return (
                  <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                          isCorrect ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {q.aptitudeCategory}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-200">{q.questionText}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-mono">
                        <span className="text-[10px] text-slate-500 uppercase block">Your Answer</span>
                        <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                          {userChoice >= 0 ? `${String.fromCharCode(65 + userChoice)}. ${q.options[userChoice]}` : 'Unattempted'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-mono">
                        <span className="text-[10px] text-slate-500 uppercase block">Correct Answer</span>
                        <span className="text-emerald-400">
                          {String.fromCharCode(65 + q.correctIndex)}. {q.options[q.correctIndex]}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">Explanation</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
