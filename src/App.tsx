import { useState, useEffect } from 'react';
import { Career, UserSkillState, Attempt, UserState, Skill, RoadmapItem, Question } from './types';
import { CAREERS_PRESETS, SKILLS_POOL } from './data/careers';
import { QUESTIONS_BANK } from './data/questions';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Assessment from './components/Assessment';
import RoadmapView from './components/RoadmapView';
import QuestionBankExaminer from './components/QuestionBankExaminer';
import Auth from './components/Auth';
import ResumeParser from './components/ResumeParser';
import CodingArena from './components/CodingArena';
import ThemeSelector from './components/ThemeSelector';
import GraduateBackgroundPattern from './components/GraduateBackgroundPattern';
import { syncUserStateToFirebase, logOutUser } from './lib/firebase';
import { Compass, Sparkles, Database, RotateCcw, Cpu, LogOut, LogIn, FileCheck, Brain, Loader2, Code2, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_KEY = 'krust_user_state';
const AUTH_USER_KEY = 'krust_username';
const AUTH_TOKEN_KEY = 'krust_token';
const RESUME_ANALYSIS_KEY = 'krust_resume_analysis';
const CUSTOM_ROADMAP_KEY = 'krust_custom_roadmap';

const initialUserState: UserState = {
  selectedCareerId: null,
  skills: {},
  customCareers: [],
  completedMilestones: []
};

const sanitizeUserState = (state: any): UserState => {
  return {
    ...initialUserState,
    ...state,
    customCareers: Array.isArray(state?.customCareers) ? state.customCareers : [],
    customSkills: Array.isArray(state?.customSkills) ? state.customSkills : [],
    customQuestions: Array.isArray(state?.customQuestions) ? state.customQuestions : [],
    customRoadmaps: Array.isArray(state?.customRoadmaps) ? state.customRoadmaps : [],
    completedMilestones: Array.isArray(state?.completedMilestones) ? state.completedMilestones : [],
    skills: state?.skills || {}
  };
};

export default function App() {
  const [userState, setUserState] = useState<UserState>(initialUserState);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<any | null>(null);
  const [customRoadmap, setCustomRoadmap] = useState<RoadmapItem[] | null>(null);
  
  const [currentView, setCurrentView] = useState<'auth' | 'onboarding' | 'dashboard' | 'assessment' | 'roadmap' | 'explorer' | 'resume' | 'compiler'>('auth');
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Load state from LocalStorage & session info on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (savedUser && savedToken) {
      setUsername(savedUser);
      setToken(savedToken);
      
      const savedAnalysis = localStorage.getItem(RESUME_ANALYSIS_KEY);
      if (savedAnalysis) {
        try {
          setResumeAnalysis(JSON.parse(savedAnalysis));
        } catch {}
      }
      
      const savedRoadmap = localStorage.getItem(CUSTOM_ROADMAP_KEY);
      if (savedRoadmap) {
        try {
          setCustomRoadmap(JSON.parse(savedRoadmap));
        } catch {}
      }
    }

    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const validated = sanitizeUserState(parsed);
        setUserState(validated);
        if (savedUser && savedToken) {
          // If logged in, route them appropriately
          if (validated.selectedCareerId) {
            setCurrentView('dashboard');
          } else {
            setCurrentView('onboarding');
          }
        } else {
          // Force auth if no session found
          setCurrentView('auth');
        }
      } catch (e) {
        console.error('Failed parsing saved state', e);
      }
    } else {
      if (savedUser && savedToken) {
        setCurrentView('onboarding');
      } else {
        setCurrentView('auth');
      }
    }
  }, []);

  // Sync state to LocalStorage and Server if logged in
  const saveState = async (newState: UserState, updatedRoadmap = customRoadmap, updatedAnalysis = resumeAnalysis) => {
    setUserState(newState);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    
    if (username && token) {
      // Sync to Firebase Firestore first
      try {
        await syncUserStateToFirebase(
          token, // UID
          username, // Email/username
          username,
          newState,
          updatedRoadmap,
          updatedAnalysis
        );
      } catch (fError) {
        console.warn('Deferred background sync with Firestore:', fError);
      }

      // Fallback/Legacy Express sync
      try {
        await fetch('/api/user/save-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            userState: newState,
            roadmap: updatedRoadmap,
            resumeAnalysis: updatedAnalysis
          })
        });
      } catch (err) {
        console.error('Failed syncing state with database server', err);
      }
    }
  };

  const handleAuthSuccess = (
    user: string,
    authToken: string,
    srvUserState: any,
    srvRoadmap: any[] | null,
    srvResumeAnalysis: any | null
  ) => {
    setUsername(user);
    setToken(authToken);
    localStorage.setItem(AUTH_USER_KEY, user);
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);

    if (srvResumeAnalysis) {
      setResumeAnalysis(srvResumeAnalysis);
      localStorage.setItem(RESUME_ANALYSIS_KEY, JSON.stringify(srvResumeAnalysis));
    } else {
      setResumeAnalysis(null);
      localStorage.removeItem(RESUME_ANALYSIS_KEY);
    }

    if (srvRoadmap) {
      setCustomRoadmap(srvRoadmap);
      localStorage.setItem(CUSTOM_ROADMAP_KEY, JSON.stringify(srvRoadmap));
    } else {
      setCustomRoadmap(null);
      localStorage.removeItem(CUSTOM_ROADMAP_KEY);
    }

    const stateToApply = sanitizeUserState(srvUserState || initialUserState);
    setUserState(stateToApply);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToApply));

    if (stateToApply.selectedCareerId) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('onboarding');
    }
  };

  const handleContinueAsGuest = () => {
    setUsername(null);
    setToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(RESUME_ANALYSIS_KEY);
    localStorage.removeItem(CUSTOM_ROADMAP_KEY);
    
    setResumeAnalysis(null);
    setCustomRoadmap(null);
    setUserState(initialUserState);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    setCurrentView('onboarding');
  };

  const handleLogout = () => {
    logOutUser().catch(err => console.warn("Firebase logout warning/error:", err));
    setUsername(null);
    setToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(RESUME_ANALYSIS_KEY);
    localStorage.removeItem(CUSTOM_ROADMAP_KEY);
    
    setResumeAnalysis(null);
    setCustomRoadmap(null);
    setUserState(initialUserState);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    setCurrentView('auth');
  };

  const handleSelectCareer = (careerId: string, customCareersList?: Career[]) => {
    const nextState = {
      ...userState,
      selectedCareerId: careerId,
      customCareers: customCareersList || userState.customCareers
    };
    saveState(nextState);
    setCurrentView('dashboard');
  };

  const handleUpdateCustomCareers = (careers: Career[]) => {
    const nextState = {
      ...userState,
      customCareers: careers
    };
    saveState(nextState);
  };

  const handleGenerateAICareer = (
    career: Career,
    skills: Skill[],
    questions: Question[],
    roadmaps: RoadmapItem[]
  ) => {
    const nextCustomSkills = [...(userState.customSkills || []), ...skills];
    const nextCustomQuestions = [...(userState.customQuestions || []), ...questions];
    const nextCustomRoadmaps = [...(userState.customRoadmaps || []), ...roadmaps];
    const nextCustomCareers = [...userState.customCareers, career];

    const nextState = {
      ...userState,
      customCareers: nextCustomCareers,
      customSkills: nextCustomSkills,
      customQuestions: nextCustomQuestions,
      customRoadmaps: nextCustomRoadmaps,
      selectedCareerId: career.id
    };

    saveState(nextState);
    setCurrentView('dashboard');
  };

  // Launch assessment for a skill
  const handleStartAssessment = async (skillId: string) => {
    setActiveSkillId(skillId);
    
    const skillHistory = userState.skills[skillId]?.history || [];
    
    setIsGeneratingQuestions(true);
    setGenError(null);
    
    const activeCareer = userState.customCareers.find(c => c.id === userState.selectedCareerId) || CAREERS_PRESETS.find(c => c.id === userState.selectedCareerId);
    const activeSkill = [...SKILLS_POOL, ...(userState.customSkills || [])].find(s => s.id === skillId);
    
    if (!activeCareer || !activeSkill) {
      setIsGeneratingQuestions(false);
      setCurrentView('assessment');
      return;
    }
    
    // Gather all seen question texts to pass as negative constraints
    const seenTexts = new Set<string>();
    skillHistory.forEach(att => {
      att.details.forEach(det => {
        const q = [...QUESTIONS_BANK, ...(userState.customQuestions || [])].find(que => que.id === det.questionId);
        if (q) seenTexts.add(q.questionText);
      });
    });
    
    // Include current bank questions to prevent duplicate/similar content
    const allPool = [...QUESTIONS_BANK, ...(userState.customQuestions || [])].filter(q => q.skillId === skillId);
    allPool.forEach(q => seenTexts.add(q.questionText));
    
    const lastAttempt = skillHistory[skillHistory.length - 1];
    const lastScore = lastAttempt ? lastAttempt.score : null;
    const attemptsCount = skillHistory.length;
    
    try {
      const response = await fetch('/api/assessment/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          skillName: activeSkill.name,
          careerName: activeCareer.name,
          existingQuestionTexts: Array.from(seenTexts),
          lastScore,
          attemptsCount
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate fresh questions. Falling back to question bank.");
      }
      
      const data = await response.json();
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        // Add newly generated custom questions to the userState
        const updatedCustomQuestions = [...(userState.customQuestions || []), ...data.questions];
        const nextState = {
          ...userState,
          customQuestions: updatedCustomQuestions
        };
        // Save to local storage and sync with DB
        await saveState(nextState);
      }
    } catch (err: any) {
      console.warn("Assessment question generation warning:", err);
      setGenError("Could not generate brand-new questions due to a temporary demand spike. Loading remaining alternative questions from the local bank!");
      // Wait for a short duration so user can read the error message, then continue
      await new Promise(resolve => setTimeout(resolve, 3500));
    } finally {
      setIsGeneratingQuestions(false);
      setCurrentView('assessment');
    }
  };

  // Process assessment completion
  const handleCompleteAssessment = (attempt: Attempt) => {
    const skillId = attempt.skillId;
    const existingSkillState = userState.skills[skillId] || {
      skillId,
      readinessScore: null,
      weakConcepts: [],
      strongConcepts: [],
      history: []
    };

    const newHistory = [...existingSkillState.history, attempt];

    // Calculate progression-based readiness score:
    // Latest attempt counts for 70%, previous history accounts for 30%.
    // If only one attempt exists, it represents 100%.
    let newScore = attempt.score;
    if (existingSkillState.history.length > 0) {
      const prevAttempt = existingSkillState.history[existingSkillState.history.length - 1];
      newScore = Math.round(attempt.score * 0.7 + prevAttempt.score * 0.3);
    }

    // Dynamic weak concepts tracking
    // Extract concepts where the user got answers incorrect in the last attempt
    const weakMap: Record<string, number> = {};
    const strongSet = new Set<string>();

    attempt.details.forEach(detail => {
      if (!detail.correct) {
        weakMap[detail.topic] = (weakMap[detail.topic] || 0) + 1;
      } else {
        strongSet.add(detail.topic);
      }
    });

    const weakConcepts = Object.keys(weakMap).sort((a, b) => weakMap[b] - weakMap[a]);
    const strongConcepts = Array.from(strongSet).filter(topic => !weakMap[topic]);

    const updatedSkillState: UserSkillState = {
      ...existingSkillState,
      readinessScore: newScore,
      weakConcepts,
      strongConcepts,
      history: newHistory
    };

    const nextState = {
      ...userState,
      skills: {
        ...userState.skills,
        [skillId]: updatedSkillState
      }
    };

    saveState(nextState);
    setCurrentView('dashboard');
    setActiveSkillId(null);
  };

  // View roadmap
  const handleViewRoadmap = (skillId: string) => {
    setActiveSkillId(skillId);
    setCurrentView('roadmap');
  };

  // Toggle checklist milestones
  const handleToggleMilestone = (milestoneId: string) => {
    const isCompleted = userState.completedMilestones.includes(milestoneId);
    let updated: string[];
    if (isCompleted) {
      updated = userState.completedMilestones.filter(id => id !== milestoneId);
    } else {
      updated = [...userState.completedMilestones, milestoneId];
    }

    const nextState = {
      ...userState,
      completedMilestones: updated
    };
    saveState(nextState);
  };

  // System Reset
  const handleResetSystem = () => {
    if (window.confirm("Are you sure you want to completely reset KRÜSt? This will clear all assessments, custom roles, and milestone checklists.")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setUserState(initialUserState);
      setCurrentView('onboarding');
      setActiveSkillId(null);
    }
  };

  // Select Career object
  const activeCareer = [...CAREERS_PRESETS, ...(userState.customCareers || [])].find(
    c => c.id === userState.selectedCareerId
  ) || null;

  const activeSkill = [...SKILLS_POOL, ...(userState.customSkills || [])].find(s => s.id === activeSkillId) || null;
  const activeSkillState = activeSkillId ? userState.skills[activeSkillId] || {
    skillId: activeSkillId,
    readinessScore: null,
    weakConcepts: [],
    strongConcepts: [],
    history: []
  } : {
    skillId: '',
    readinessScore: null,
    weakConcepts: [],
    strongConcepts: [],
    history: []
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden">
      {/* Background Graduation & Career Watermark Pattern (40% space coverage) */}
      <GraduateBackgroundPattern />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div 
            onClick={() => {
              if (currentView === 'auth') return;
              if (activeCareer) setCurrentView('dashboard');
              else setCurrentView('onboarding');
            }} 
            className={`flex items-center gap-2.5 select-none ${currentView !== 'auth' ? 'cursor-pointer' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <span className="font-extrabold text-sm text-emerald-400 font-mono tracking-tight">K</span>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">KRÜSt</span>
              <span className="text-[10px] text-slate-500 block font-mono">CAREER READINESS ENGINE</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* UI Theme Selector */}
            <ThemeSelector />

            {currentView !== 'auth' && (
              <>
                {/* Resume ATS Audit Button (Only shown if career is selected) */}
                {activeCareer && (
                  <button
                    id="resume-audit-menu-btn"
                    onClick={() => setCurrentView('resume')}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      currentView === 'resume'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                        : 'bg-emerald-950/30 hover:bg-emerald-950/50 border-emerald-500/20 text-emerald-300 hover:text-emerald-100'
                    }`}
                  >
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span className="hidden md:inline">Resume ATS Audit</span>
                  </button>
                )}

                <button
                  id="coding-arena-menu-btn"
                  onClick={() => setCurrentView('compiler')}
                  className={`text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    currentView === 'compiler' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline">Coding Arena</span>
                </button>

                <button
                  id="explorer-menu-btn"
                  onClick={() => setCurrentView('explorer')}
                  className={`text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    currentView === 'explorer' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-4.5 h-4.5 text-blue-400" />
                  <span className="hidden lg:inline">Engine Explorer</span>
                </button>
                
                <button
                  id="reset-system-btn"
                  onClick={handleResetSystem}
                  className="text-xs bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/20 font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Reset System</span>
                </button>

                <div className="h-5 w-px bg-slate-850 mx-0.5 hidden sm:block"></div>

                {/* User Session Indicators */}
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex flex-col items-end text-right">
                    <span className="text-[10px] font-bold text-slate-200 font-mono">
                      {username ? `👤 ${username}` : '👤 Sandbox Guest'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {username ? 'Synchronized Session' : 'Offline Mode'}
                    </span>
                  </div>
                  {username ? (
                    <button
                      onClick={handleLogout}
                      title="Log Out"
                      className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentView('auth')}
                      title="Sign In"
                      className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign In</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Application Switcher */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {isGeneratingQuestions && (
            <motion.div
              key="generating-questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl max-w-md w-full text-center space-y-6 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 bg-emerald-500/5 w-40 h-40 rounded-full blur-2xl"></div>
                
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <Brain className="w-8 h-8 text-emerald-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white">Generating Fresh Evaluation</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    {genError ? genError : "Designing 10 brand-new, customized assessment questions to guarantee high assessment variance and prevent repetitions."}
                  </p>
                </div>

                {!genError ? (
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="text-[10px] font-mono text-emerald-500 tracking-wider uppercase animate-pulse">
                      DEDUPLICATING CONCEPTS & ANALYSING PATHS...
                    </span>
                  </div>
                ) : (
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-amber-500 tracking-wider uppercase">
                      TEMPORARY DELAY: LOADING LOCAL RESERVES...
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentView === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Auth
                onAuthSuccess={handleAuthSuccess}
                onContinueAsGuest={handleContinueAsGuest}
              />
            </motion.div>
          )}

          {currentView === 'onboarding' && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Onboarding
                onSelectCareer={handleSelectCareer}
                customCareers={userState.customCareers}
                onUpdateCustomCareers={handleUpdateCustomCareers}
                onGenerateAICareer={handleGenerateAICareer}
                customSkills={userState.customSkills}
              />
            </motion.div>
          )}

          {currentView === 'dashboard' && activeCareer && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard
                career={activeCareer}
                skillsState={userState.skills}
                onStartAssessment={handleStartAssessment}
                onViewRoadmap={handleViewRoadmap}
                onBackToCareers={() => setCurrentView('onboarding')}
                resumeAnalysis={resumeAnalysis}
                onOpenResumeAudit={() => setCurrentView('resume')}
                customSkills={userState.customSkills}
              />
            </motion.div>
          )}

          {currentView === 'assessment' && activeSkill && (
            <motion.div
              key="assessment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Assessment
                skill={activeSkill}
                skillState={activeSkillState}
                onComplete={handleCompleteAssessment}
                onCancel={() => setCurrentView('dashboard')}
                customQuestions={userState.customQuestions || []}
                career={activeCareer}
              />
            </motion.div>
          )}

          {currentView === 'roadmap' && activeSkill && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RoadmapView
                skill={activeSkill}
                completedMilestones={userState.completedMilestones}
                onToggleMilestone={handleToggleMilestone}
                onBackToDashboard={() => setCurrentView('dashboard')}
                customRoadmap={[...(customRoadmap || []), ...(userState.customRoadmaps || [])]}
              />
            </motion.div>
          )}

          {currentView === 'resume' && activeCareer && (
            <motion.div
              key="resume"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8"
            >
              <div className="mb-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="text-xs text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  ← BACK TO DASHBOARD
                </button>
              </div>
              <ResumeParser
                career={activeCareer}
                username={username}
                currentAnalysis={resumeAnalysis}
                currentRoadmap={customRoadmap}
                onApplyRoadmap={(roadmap, analysis) => {
                  setCustomRoadmap(roadmap);
                  setResumeAnalysis(analysis);
                  localStorage.setItem(RESUME_ANALYSIS_KEY, JSON.stringify(analysis));
                  localStorage.setItem(CUSTOM_ROADMAP_KEY, JSON.stringify(roadmap));
                  saveState(userState, roadmap, analysis);
                  setCurrentView('dashboard');
                }}
              />
            </motion.div>
          )}

          {currentView === 'explorer' && (
            <motion.div
              key="explorer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QuestionBankExaminer
                customQuestions={userState.customQuestions || []}
                career={activeCareer}
                customSkills={userState.customSkills || []}
                onAddCustomQuestions={(questions) => {
                  const updatedQuestions = [...(userState.customQuestions || []), ...questions];
                  saveState({
                    ...userState,
                    customQuestions: updatedQuestions
                  });
                }}
                onBack={() => {
                  if (activeCareer) setCurrentView('dashboard');
                  else setCurrentView('onboarding');
                }}
              />
            </motion.div>
          )}
          {currentView === 'compiler' && (
            <motion.div
              key="compiler"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CodingArena career={activeCareer} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Humble Corporate Footer */}
      <footer className="border-t border-slate-800/60 py-6 bg-slate-950/20">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 font-mono">
          <p>© 2026 KRÜSt Career Readiness Engine. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Evaluation Sandbox v1.4</span>
            <span>•</span>
            <span>SaaS Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
