import { useState, useEffect } from 'react';
import { QUESTIONS_BANK } from '../data/questions';
import { SKILLS_POOL } from '../data/careers';
import { 
  Search, 
  Sparkles, 
  Cpu, 
  Eye, 
  Brain, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Target, 
  Award,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, Career, Skill } from '../types';

interface QuestionBankExaminerProps {
  onBack: () => void;
  customQuestions?: Question[];
  career?: Career | null;
  customSkills?: Skill[];
  onAddCustomQuestions?: (questions: Question[]) => void;
}

// Preset mapping of specialized subtopics to ensure high diagnostic precision
const SKILL_TOPICS_MAPPING: Record<string, string[]> = {
  // Frontend
  'fe_core': ['ES6+ Javascript', 'Asynchronous Promise Patterns', 'DOM Manipulation & Memory Leaks', 'State Management Architecture'],
  'fe_frameworks': ['React Lifecycle & Hooks', 'Virtual DOM Diffing', 'Routing & SSR/SSG', 'Performance Optimization'],
  'fe_perf': ['Code Splitting & Lazy Loading', 'Resource Hinting (Preload/Prefetch)', 'Bundle Size Auditing', 'Rendering Performance (Layout Thrashing)'],
  
  // Backend
  'be_apis': ['RESTful Design Principles', 'GraphQL Schemas & Resolvers', 'Rate Limiting & Throttling', 'WebSockets & Event-Driven APIs'],
  'be_db': ['SQL Query Tuning', 'NoSQL Document Schema Design', 'Database Transaction Isolation levels', 'Indexing Strategies'],
  'be_scaling': ['Distributed Caching (Redis)', 'Message Queues (Kafka/RabbitMQ)', 'Microservices Architecture', 'Load Balancing & Reverse Proxies'],
  
  // Product Management
  'pm_strategy': ['Market Analysis & TAM', 'Product Vision & Roadmap', 'KPI Formulation', 'Competitive Intelligence'],
  'pm_analytics': ['A/B Testing Methodologies', 'Funnel Conversion Analysis', 'Cohort Analysis', 'SQL for Product Metrics'],
  'pm_ux': ['User Persona Mapping', 'Information Architecture', 'Wireframing & Prototyping', 'Usability Testing'],
  
  // Data Science
  'ds_ml': ['Supervised/Unsupervised Learning', 'Feature Engineering', 'Model Tuning & Hyperparameters', 'Overfitting Prevention'],
  'ds_stats': ['Hypothesis Testing & p-values', 'Probability Distributions', 'Regression Analysis', 'Statistical Power'],
  'ds_pipeline': ['Data Cleaning & Imputation', 'ETL Architecture', 'Spark/Hadoop Parallelism', 'Feature Store Systems'],
  'coding_test': ['Basic Recursion', 'Variable Reference', 'Time Complexity', 'Array Operations', 'Dynamic Programming', 'Graph Traversals'],
};

function getTopicsForSkill(skillId: string, skillName: string): string[] {
  return SKILL_TOPICS_MAPPING[skillId] || [
    `Core Foundations of ${skillName}`,
    `Advanced Concepts & Methodologies`,
    `Practical Applications & Workflows`,
    `Edge Cases, Debugging & Optimizations`
  ];
}

export default function QuestionBankExaminer({ 
  onBack, 
  customQuestions = [], 
  career = null, 
  customSkills = [],
  onAddCustomQuestions
}: QuestionBankExaminerProps) {
  
  const allSkillsPool = [...SKILLS_POOL, ...customSkills];
  const fullQuestionsBank = [...QUESTIONS_BANK, ...customQuestions];

  // Tab State
  const [activeTab, setActiveTab] = useState<'explorer' | 'syllabus'>('explorer');

  // Search & Filter State
  const [selectedSkillId, setSelectedSkillId] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Practice Mode State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  
  // AI Explanation State
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [loadingExplanationId, setLoadingExplanationId] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  // Syllabus Booster Generator State
  const [generatingBoosterTopic, setGeneratingBoosterTopic] = useState<string | null>(null);
  const [boosterSuccessMessage, setBoosterSuccessMessage] = useState<string | null>(null);
  const [boosterError, setBoosterError] = useState<string | null>(null);

  // Auto-focus selected skill in explorer if user filters by skill
  const filteredQuestions = fullQuestionsBank.filter(q => {
    const matchesSkill = selectedSkillId === 'all' || q.skillId === selectedSkillId;
    const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    const matchesQuery = 
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSkill && matchesDifficulty && matchesQuery;
  });

  // Calculate syllabus coverage
  const activeSkillsForRole = career 
    ? allSkillsPool.filter(s => career.skillIds.includes(s.id))
    : allSkillsPool.slice(0, 3); // Fallback to first 3 skills if no active career

  // Helper to count questions in a subtopic/concept
  const getSubtopicCount = (skillId: string, subtopic: string) => {
    return fullQuestionsBank.filter(q => {
      if (q.skillId !== skillId) return false;
      const term = subtopic.toLowerCase();
      return (
        q.topic.toLowerCase().includes(term) ||
        q.questionText.toLowerCase().includes(term) ||
        q.tags.some(t => term.includes(t.toLowerCase()) || t.toLowerCase().includes(term))
      );
    }).length;
  };

  // Trigger AI Question Explanation
  const handleExplainWithAICopilot = async (q: Question) => {
    setLoadingExplanationId(q.id);
    setExplanationError(null);
    
    const skillObj = allSkillsPool.find(s => s.id === q.skillId);
    
    try {
      const response = await fetch('/api/explorer/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: q.questionText,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          careerName: career ? career.name : 'Professional Consultant',
          skillName: skillObj ? skillObj.name : 'Core Competency'
        })
      });

      if (!response.ok) {
        throw new Error("Temporary system congestion. Please try again.");
      }

      const data = await response.json();
      if (data && data.explanation) {
        setAiExplanations(prev => ({ ...prev, [q.id]: data.explanation }));
      } else {
        throw new Error("Unable to construct tutoring breakdown.");
      }
    } catch (err: any) {
      console.error(err);
      setExplanationError(err.message || "Failed to generate AI breakdown.");
    } finally {
      setLoadingExplanationId(null);
    }
  };

  // Trigger AI Syllabus Booster Questions Generation
  const handleGenerateBooster = async (skillId: string, skillName: string, subtopic: string) => {
    setGeneratingBoosterTopic(subtopic);
    setBoosterError(null);
    setBoosterSuccessMessage(null);

    try {
      const response = await fetch('/api/explorer/generate-booster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          skillName,
          careerName: career ? career.name : 'Elite Professional',
          targetTopic: subtopic
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact dynamic generator. Please try again.");
      }

      const data = await response.json();
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        if (onAddCustomQuestions) {
          onAddCustomQuestions(data.questions);
          setBoosterSuccessMessage(`Success! Generated 3 premium syllabus questions covering "${subtopic}". Added to explorer pool!`);
        } else {
          throw new Error("Syllabus modification callback is offline.");
        }
      } else {
        throw new Error("No custom questions returned.");
      }
    } catch (err: any) {
      console.error(err);
      setBoosterError(err.message || "Dynamic generation paused due to spike in service requests.");
    } finally {
      setGeneratingBoosterTopic(null);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition-colors mb-2 cursor-pointer"
          >
            ← BACK TO SYSTEM
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <Cpu className="w-6.5 h-6.5 text-emerald-400" />
            AI-Powered Question Engine Explorer
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Analyze active topic coverage, check item properties, practice answers, or request deep concept coaching from AI.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`px-4 py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
              activeTab === 'explorer' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            QUESTION EXAMINER
          </button>
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'syllabus' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            SYLLABUS COVERAGE & EXAM PREP
          </button>
        </div>
      </div>

      {activeTab === 'syllabus' ? (
        /* Syllabus and Exam Coverage Tab */
        <div className="space-y-6">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                <Target className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white">Career Syllabus Coverage Monitor</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Every sub-topic must be comprehensively covered before your final assessment. Since your career path is configured for <strong className="text-emerald-400">{career ? career.name : "Custom Selected Focus"}</strong>, our system maps out critical learning competencies. Tap <strong className="text-emerald-400">⚡ AI Booster</strong> to generate high-rigor (SUPER HARD) evaluation sets for under-covered areas.
                </p>
              </div>
            </div>

            {/* Notification/Status message box inside syllabus */}
            <AnimatePresence>
              {boosterSuccessMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-mono flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{boosterSuccessMessage}</span>
                </motion.div>
              )}
              {boosterError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{boosterError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Grid of skills and their topics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeSkillsForRole.map(skill => {
              const topics = getTopicsForSkill(skill.id, skill.name);
              return (
                <div key={skill.id} className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3 flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] font-mono text-emerald-500 tracking-wider uppercase">REQUIRED COMPETENCY</span>
                      <h4 className="font-extrabold text-white text-sm mt-0.5">{skill.name}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                      ID: {skill.id}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {topics.map((topic, idx) => {
                      const count = getSubtopicCount(skill.id, topic);
                      const isCovered = count > 0;
                      const isGenerating = generatingBoosterTopic === topic;

                      return (
                        <div key={idx} className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 flex justify-between items-center gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 block">TOPIC {idx + 1}</span>
                            <span className="text-slate-200 text-xs font-medium block pr-2">{topic}</span>
                            
                            <div className="flex items-center gap-1.5 pt-1">
                              {isCovered ? (
                                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  Covered ({count} items)
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                                  Uncovered (0 items)
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            disabled={generatingBoosterTopic !== null}
                            onClick={() => handleGenerateBooster(skill.id, skill.name, topic)}
                            className={`shrink-0 py-1.5 px-2.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-all flex items-center gap-1 ${
                              isGenerating 
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                : 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 text-emerald-400 hover:border-emerald-500/20'
                            }`}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                ⚡ AI Booster
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Explorer Tab */
        <>
          {/* Info Panel explaining Adaptivity */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0 h-fit">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <h4 className="font-bold text-slate-100">Adaptive Question Selection Protocol</h4>
              <p className="leading-relaxed">
                Our dynamic evaluation engine scales rigor adaptively. If you re-assess a skill, Gemini designs brand-new scenario questions optimized with high exclusion controls and tighter distraction patterns (ensuring correct option brevity and highly realistic wrong answers).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-slate-400 font-mono text-[11px]">
                <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">1. DYNAMIC START</span>
                  Starts with a Medium question. Success goes up to Hard, failure drops to Easy.
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">2. CONCEALED PATTERNS</span>
                  Correct options do not contain bloated definitions, forcing authentic conceptual mastery.
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">3. ROLE COHERENCE</span>
                  Coaching breakdown aligns specifically to the context of {career ? career.name : "your configured career pathway"}.
                </div>
              </div>
            </div>
          </div>

          {/* Filters bar */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* Skill Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500">SKILL:</span>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-slate-300">All Skills</option>
                  {allSkillsPool.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-slate-300">{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500">DIFFICULTY:</span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All</option>
                  <option value="easy" className="bg-slate-900">Easy</option>
                  <option value="medium" className="bg-slate-900">Medium</option>
                  <option value="hard" className="bg-slate-900">Hard</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search topic, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-4">
            <div className="flex justify-between text-xs font-mono text-slate-500 px-2">
              <span>MATCHED RECORDS: {filteredQuestions.length}</span>
              <span>POOL CAPACITY: {fullQuestionsBank.length} (PRESETS + AI GENERATED)</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredQuestions.map(q => {
                const isExpanded = expandedQuestionId === q.id;
                const skillObj = allSkillsPool.find(s => s.id === q.skillId);
                const isCustomQuestion = q.id.includes('_re_') || q.id.includes('_booster_');
                const selectedAns = selectedAnswers[q.id];
                const hasAnswered = selectedAns !== undefined;
                const isCorrect = hasAnswered && selectedAns === q.correctIndex;

                const aiExplanation = aiExplanations[q.id];
                const isExplaining = loadingExplanationId === q.id;

                return (
                  <div
                    key={q.id}
                    id={`q-record-${q.id}`}
                    className={`bg-slate-900/30 border rounded-xl p-5 transition-all ${
                      isExpanded 
                        ? 'border-emerald-500/30 shadow-lg shadow-emerald-950/10' 
                        : 'border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5 flex-grow">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                            {skillObj?.name || q.skillId}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            Topic: {q.topic}
                          </span>
                          {isCustomQuestion && (
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
                              <Brain className="w-3 h-3" />
                              AI Generated
                            </span>
                          )}
                          <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${
                            q.difficulty === 'hard'
                              ? 'text-red-400 bg-red-500/10 border-red-500/20'
                              : q.difficulty === 'medium'
                              ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-slate-200 text-sm font-medium">{q.questionText}</p>
                      </div>

                      <button
                        id={`toggle-details-${q.id}`}
                        onClick={() => {
                          setExpandedQuestionId(isExpanded ? null : q.id);
                          // Clear answer state if collapsing to reset practice
                          if (isExpanded) {
                            setSelectedAnswers(prev => {
                              const copy = { ...prev };
                              delete copy[q.id];
                              return copy;
                            });
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-3 py-1.5 rounded border border-slate-700/80 flex items-center gap-1.5 font-semibold transition-colors cursor-pointer shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isExpanded ? 'Hide Parameters' : 'Practice & Inspect'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-5 pt-4 border-t border-slate-800/60 space-y-5">
                        
                        {/* Interactive Practice Option Selector */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                              PRACTICE QUIZ: CHOOSE ONE ANSWER
                            </span>
                            {hasAnswered && (
                              <span className={`text-[10px] font-mono flex items-center gap-1 font-bold ${
                                isCorrect ? 'text-emerald-400 animate-pulse' : 'text-rose-400'
                              }`}>
                                {isCorrect ? (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Correct Option selected!
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" />
                                    Incorrect. Learn below.
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {q.options.map((opt, oidx) => {
                              const isSelected = selectedAns === oidx;
                              const isActualCorrect = q.correctIndex === oidx;
                              
                              let optionStyle = "bg-slate-950/40 border-slate-900 text-slate-300 hover:bg-slate-900/60 hover:border-slate-800";
                              if (hasAnswered) {
                                if (isActualCorrect) {
                                  optionStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium";
                                } else if (isSelected) {
                                  optionStyle = "bg-rose-500/10 border-rose-500/30 text-rose-400";
                                } else {
                                  optionStyle = "bg-slate-950/20 border-slate-950 text-slate-500";
                                }
                              } else if (isSelected) {
                                optionStyle = "bg-emerald-500/5 border-emerald-500/30 text-emerald-400";
                              }

                              return (
                                <button
                                  key={oidx}
                                  onClick={() => {
                                    if (!hasAnswered) {
                                      setSelectedAnswers(prev => ({ ...prev, [q.id]: oidx }));
                                    }
                                  }}
                                  className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2 cursor-pointer ${optionStyle}`}
                                >
                                  <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5">[{oidx + 1}]</span>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Standard Explanation Box */}
                        <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-900 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono text-slate-400 block tracking-wider uppercase">
                              Standard Syllabus Explanation
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">Correct Index: Option {q.correctIndex + 1}</span>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed">{q.explanation}</p>
                        </div>

                        {/* AI Tutor Breakdown Call */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <button
                              disabled={isExplaining}
                              onClick={() => handleExplainWithAICopilot(q)}
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold px-4 py-2 rounded-lg border border-emerald-500/30 shadow-md shadow-emerald-950/20 flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              {isExplaining ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  AI Tutor Analysing...
                                </>
                              ) : (
                                <>
                                  <Brain className="w-3.5 h-3.5 animate-pulse text-emerald-200" />
                                  Ask AI Copilot for Personalized Coaching
                                </>
                              )}
                            </button>

                            <p className="text-[10px] text-slate-500 font-mono">
                              Get step-by-step tactics customized for {career ? career.name : "your configured career profile"}.
                            </p>
                          </div>

                          {/* AI Explanation Result Box */}
                          <AnimatePresence>
                            {aiExplanation && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="bg-emerald-950/15 border border-emerald-800/20 p-5 rounded-lg space-y-3.5"
                              >
                                <div className="flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                                  <span className="text-xs font-bold text-emerald-300 font-mono">AI COMPREHENSIVE COPILOT COACHING</span>
                                </div>
                                <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                                  {aiExplanation}
                                </div>
                              </motion.div>
                            )}

                            {explanationError && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-950/20 border border-red-900/30 p-4 rounded-lg text-xs text-red-400 font-mono"
                              >
                                {explanationError}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {q.tags.map(tag => (
                            <span key={tag} className="text-[9px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
