import { useState, useEffect } from 'react';
import { Career, UserSkillState, Attempt, UserState, Skill, RoadmapItem, Question, UserRole } from './types';
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
import AIInterview from './components/AIInterview';
import { JDAnalyzer } from './components/JDAnalyzer';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginModal from './components/AdminLoginModal';
import GraduateBackgroundPattern from './components/GraduateBackgroundPattern';
import { syncUserStateToFirebase, logOutUser, subscribeToAuthState, fetchUserStateFromFirebase } from './lib/firebase';
import { Compass, Sparkles, Database, RotateCcw, Cpu, LogOut, LogIn, FileCheck, Brain, Loader2, Code2, GraduationCap, Menu, X, LayoutDashboard, Bot, FileText, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_KEY = 'krust_user_state';
import { getDomainIconName } from './lib/utils';

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

const sanitizeCareer = (c: any): Career => {
  const skillIds = Array.isArray(c?.skillIds) ? c.skillIds : [];
  const rawWeights = c?.weights || {};
  const weights: Record<string, number> = {};
  
  let validWeightSum = 0;
  skillIds.forEach((sid: string) => {
    const w = typeof rawWeights[sid] === 'number' && !isNaN(rawWeights[sid]) && rawWeights[sid] > 0
      ? rawWeights[sid]
      : (1 / (skillIds.length || 1));
    weights[sid] = w;
    validWeightSum += w;
  });

  if (validWeightSum > 0 && Math.abs(validWeightSum - 1.0) > 0.02) {
    skillIds.forEach((sid: string) => {
      weights[sid] = parseFloat((weights[sid] / validWeightSum).toFixed(2));
    });
  }

  return {
    id: c?.id || `custom_${Date.now()}`,
    name: c?.name || 'Custom Career',
    description: c?.description || 'Custom career track.',
    skillIds,
    weights,
    domainIcon: c?.domainIcon || getDomainIconName(c?.name || 'Custom'),
    roleType: c?.roleType === 'internship' ? 'internship' : 'job'
  };
};

const sanitizeUserState = (state: any): UserState => {
  const rawCustomCareers = Array.isArray(state?.customCareers) ? state.customCareers : [];
  const sanitizedCustomCareers = rawCustomCareers.map(sanitizeCareer);

  return {
    ...initialUserState,
    ...state,
    customCareers: sanitizedCustomCareers,
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
  
  const [currentView, setCurrentView] = useState<'auth' | 'onboarding' | 'dashboard' | 'assessment' | 'roadmap' | 'explorer' | 'resume' | 'jdanalyzer' | 'compiler' | 'interview' | 'admin'>('auth');
  const [userRole, setUserRole] = useState<UserRole>('candidate');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [isAdminPreviewMode, setIsAdminPreviewMode] = useState<boolean>(false);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [showInterviewLockedModal, setShowInterviewLockedModal] = useState<boolean>(false);

  // Load state from LocalStorage & session info on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('krust_theme_mode', 'dark');
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

    // Subscribe to Firebase Auth changes for seamless Google Auth persistence across reloads
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        const displayName = firebaseUser.displayName || firebaseUser.email || 'Google User';
        const uid = firebaseUser.uid;
        
        setUsername(displayName);
        setToken(uid);
        localStorage.setItem(AUTH_USER_KEY, displayName);
        localStorage.setItem(AUTH_TOKEN_KEY, uid);

        try {
          const record = await fetchUserStateFromFirebase(uid);
          if (record) {
            if (record.userState) {
              const validated = sanitizeUserState(record.userState);
              setUserState(validated);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validated));
              if (validated.selectedCareerId) {
                setCurrentView('dashboard');
              } else {
                setCurrentView('onboarding');
              }
            }
            if (record.resumeAnalysis) {
              setResumeAnalysis(record.resumeAnalysis);
              localStorage.setItem(RESUME_ANALYSIS_KEY, JSON.stringify(record.resumeAnalysis));
            }
            if (record.roadmap) {
              setCustomRoadmap(record.roadmap);
              localStorage.setItem(CUSTOM_ROADMAP_KEY, JSON.stringify(record.roadmap));
            }
          }
        } catch (err) {
          console.warn("Background Firebase user state fetch warning:", err);
        }
      }
    });

    return () => unsubscribe();
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
    srvResumeAnalysis: any | null,
    isAdmin?: boolean
  ) => {
    setUsername(user);
    setToken(authToken);
    localStorage.setItem(AUTH_USER_KEY, user);
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);

    if (user.toLowerCase() === 'admin' || isAdmin) {
      setIsAdminLoggedIn(true);
      setIsAdminPreviewMode(false);
      setCurrentView('admin');
      return;
    }

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

    // Persist account creation and user details to Firestore database
    syncUserStateToFirebase(
      authToken || user,
      user,
      user,
      stateToApply,
      srvRoadmap,
      srvResumeAnalysis
    ).catch(err => console.warn('Account creation database sync warning:', err));

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
    const isCareerSwitch = userState.selectedCareerId && userState.selectedCareerId !== careerId;
    
    let updatedAnalysis = resumeAnalysis;
    let updatedRoadmap = customRoadmap;

    // If career path switched, clear old resume analysis/roadmap so user is re-asked to perform re-audit for new career profile
    if (isCareerSwitch && resumeAnalysis) {
      const allCareers = [...CAREERS_PRESETS, ...(customCareersList || userState.customCareers)];
      const newCareerObj = allCareers.find(c => c.id === careerId);
      if (newCareerObj && resumeAnalysis.targetCareerName && resumeAnalysis.targetCareerName.toLowerCase() !== newCareerObj.name.toLowerCase()) {
        console.log(`[Career Switch] Career path changed to ${newCareerObj.name}. Prompting user for re-audit.`);
        updatedAnalysis = null;
        updatedRoadmap = null;
        setResumeAnalysis(null);
        setCustomRoadmap(null);
        localStorage.removeItem(RESUME_ANALYSIS_KEY);
        localStorage.removeItem(CUSTOM_ROADMAP_KEY);
      }
    }

    const nextState = {
      ...userState,
      selectedCareerId: careerId,
      customCareers: customCareersList || userState.customCareers
    };
    saveState(nextState, updatedRoadmap, updatedAnalysis);
    setCurrentView('dashboard');
  };

  const handleUpdateCustomCareers = (careers: Career[]) => {
    const isSelectedDeleted = userState.selectedCareerId && 
      !CAREERS_PRESETS.some(c => c.id === userState.selectedCareerId) && 
      !careers.some(c => c.id === userState.selectedCareerId);

    const nextState = {
      ...userState,
      customCareers: careers,
      selectedCareerId: isSelectedDeleted ? null : userState.selectedCareerId
    };
    saveState(nextState);
    if (isSelectedDeleted && currentView === 'dashboard') {
      setCurrentView('onboarding');
    }
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
        signal: AbortSignal.timeout(2200),
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
      console.warn("Assessment question generation notice:", err);
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
      levelScores: attempt.levelScores || existingSkillState?.levelScores || {},
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

    // Check if ALL core competencies for active role are completed at >= 80%
    const currentCareer = [...CAREERS_PRESETS, ...(userState.customCareers || [])].find(
      c => c.id === nextState.selectedCareerId
    );
    const roleSkills = currentCareer ? currentCareer.skillIds : [];
    const passedAll80 = roleSkills.length > 0 && roleSkills.every(sId => {
      const sState = nextState.skills[sId];
      return sState && sState.readinessScore !== null && sState.readinessScore >= 80;
    });

    if (passedAll80) {
      if (window.confirm(`🎉 CONGRATULATIONS!\n\nYou have completed ALL core competencies for ${currentCareer?.name} with an average score of ≥80%!\n\nAI Personal HR Mock Interview is now UNLOCKED! Would you like to launch the AI Personal Mock Interview now?`)) {
        setCurrentView('interview');
      } else {
        setCurrentView('dashboard');
      }
    } else {
      setCurrentView('dashboard');
    }
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
  const allCareers = [...CAREERS_PRESETS, ...(userState.customCareers || [])];
  const activeCareer = allCareers.find(
    c => c.id === userState.selectedCareerId
  ) || null;

  const allSkillsPool = [...SKILLS_POOL, ...(userState.customSkills || [])];
  const activeRoleCompetencyIds = activeCareer ? activeCareer.skillIds : [];

  const completedCompetenciesAbove80 = activeRoleCompetencyIds.filter(skillId => {
    const state = userState.skills[skillId];
    return state && state.readinessScore !== null && state.readinessScore >= 80;
  });

  const isAIInterviewUnlocked = Boolean(isAdminLoggedIn);

  const activeSkill = [...SKILLS_POOL, ...(userState.customSkills || [])].find(s => s.id === activeSkillId) || (
    activeSkillId ? {
      id: activeSkillId,
      name: activeSkillId.replace('custom_ai_', '').replace('custom_', '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: 'Custom generated competency requirement.',
      category: 'Specialized'
    } : null
  );
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
        {/* Admin Candidate Preview Banner */}
        {isAdminPreviewMode && currentView !== 'admin' && (
          <div className="bg-gradient-to-r from-amber-600/90 via-purple-600/90 to-indigo-600/90 py-1.5 px-4 text-center font-mono text-xs font-bold text-white flex items-center justify-center gap-3 shadow-md">
            <span>🔑 ADMIN CANDIDATE PREVIEW MODE: All Features Unlocked for Verification</span>
            <button
              onClick={() => setCurrentView('admin')}
              className="bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold border border-amber-400/40 cursor-pointer transition-colors"
            >
              Return to Admin Dashboard
            </button>
          </div>
        )}

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

          <div className="flex items-center gap-2 sm:gap-3">
            {currentView !== 'auth' && (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-2">
                  {activeCareer && (
                    <button
                      id="dashboard-menu-btn"
                      onClick={() => setCurrentView('dashboard')}
                      className={`text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        currentView === 'dashboard'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                      <span>Dashboard</span>
                    </button>
                  )}

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
                      <span>Resume Audit</span>
                    </button>
                  )}

                  <button
                    id="jd-analyzer-menu-btn"
                    onClick={() => setCurrentView('jdanalyzer')}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      currentView === 'jdanalyzer'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>JD Analyzer</span>
                  </button>

                  {activeCareer && (
                    <button
                      id="ai-interview-menu-btn"
                      onClick={() => {
                        if (isAIInterviewUnlocked) {
                          setCurrentView('interview');
                        } else {
                          setShowInterviewLockedModal(true);
                        }
                      }}
                      className={`text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        currentView === 'interview' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Bot className="w-4 h-4 text-emerald-400" />
                      <span>AI Mock Interview</span>
                      {!isAIInterviewUnlocked && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">🔒</span>
                      )}
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
                    <span>Coding Arena</span>
                  </button>

                  <button
                    id="explorer-menu-btn"
                    onClick={() => setCurrentView('explorer')}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      currentView === 'explorer' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Cpu className="w-4.5 h-4.5 text-blue-400" />
                    <span>Engine Explorer</span>
                  </button>

                  <button
                    id="reset-system-btn"
                    onClick={handleResetSystem}
                    className="text-xs bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/20 font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <div className="h-5 w-px bg-slate-850 mx-0.5"></div>

                  {/* User Session Indicators */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[10px] font-bold text-slate-200 font-mono">
                        {username ? `👤 ${username}` : '👤 Sandbox Guest'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">
                        {username ? 'Synchronized' : 'Offline'}
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
                        <span>Sign In</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Hamburger Toggle Button */}
                <button
                  id="mobile-menu-toggle-btn"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Navigation Menu"
                  className="md:hidden p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && currentView !== 'auth' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Navigation Menu
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {username ? `Logged in: ${username}` : 'Guest Mode'}
                </span>
              </div>

              {activeCareer && (
                <button
                  onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between text-xs font-semibold border ${
                    currentView === 'dashboard'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                    <span>Career Dashboard ({activeCareer.name})</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => { setCurrentView('onboarding'); setMobileMenuOpen(false); }}
                className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between text-xs font-semibold border ${
                  currentView === 'onboarding'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Careers & AI Custom Role Creator</span>
                </div>
              </button>

              {activeCareer && (
                <button
                  onClick={() => { setCurrentView('resume'); setMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between text-xs font-semibold border ${
                    currentView === 'resume'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Resume ATS Audit</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => { setCurrentView('compiler'); setMobileMenuOpen(false); }}
                className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between text-xs font-semibold border ${
                  currentView === 'compiler'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>Coding Arena</span>
                </div>
              </button>

              <button
                onClick={() => { setCurrentView('explorer'); setMobileMenuOpen(false); }}
                className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between text-xs font-semibold border ${
                  currentView === 'explorer'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>Engine Explorer</span>
                </div>
              </button>

              <button
                onClick={() => { setCurrentView('jdanalyzer'); setMobileMenuOpen(false); }}
                className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between text-xs font-semibold border ${
                  currentView === 'jdanalyzer'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>JD Analyzer & Skill Gaps</span>
                </div>
              </button>

              {activeCareer && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (isAIInterviewUnlocked) {
                      setCurrentView('interview');
                    } else {
                      setShowInterviewLockedModal(true);
                    }
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between text-xs font-semibold border ${
                    currentView === 'interview'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>AI Mock Interview</span>
                  </div>
                  {!isAIInterviewUnlocked && (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">Locked 🔒</span>
                  )}
                </button>
              )}

              <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
                <button
                  onClick={() => { handleResetSystem(); setMobileMenuOpen(false); }}
                  className="py-2 px-3 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset System</span>
                </button>

                {username ? (
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="py-2 px-3 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setCurrentView('auth'); setMobileMenuOpen(false); }}
                    className="py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Application Switcher */}
      <main className="flex-grow">
        <AnimatePresence>
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
        </AnimatePresence>

        <AnimatePresence>

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

          {(currentView === 'onboarding' || (currentView === 'dashboard' && !activeCareer)) && (
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
                onOpenJDAnalyzer={() => setCurrentView('jdanalyzer')}
                onOpenAIInterview={() => {
                  if (isAIInterviewUnlocked) {
                    setCurrentView('interview');
                  } else {
                    setShowInterviewLockedModal(true);
                  }
                }}
                customSkills={userState.customSkills}
                isAdminLoggedIn={isAdminLoggedIn}
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
          {currentView === 'jdanalyzer' && (
            <motion.div
              key="jdanalyzer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <JDAnalyzer
                selectedCareer={activeCareer}
                careers={allCareers}
                userSkillsState={userState.skills}
                onBackToDashboard={() => setCurrentView('dashboard')}
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
          {currentView === 'interview' && activeCareer && (
            <motion.div
              key="interview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isAIInterviewUnlocked ? (
                <AIInterview
                  career={activeCareer}
                  onBack={() => setCurrentView('dashboard')}
                />
              ) : (
                <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-6 shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-extrabold text-white">AI HR Mock Interview Locked 🔒</h2>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                      AI Technical & Behavioral Mock Interview is locked for normal users. Only <strong className="text-emerald-400">Admin accounts</strong> have permissions to access the 1-on-1 AI Interviewer simulator.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <button onClick={() => setCurrentView('dashboard')} className="k-btn-primary text-xs cursor-pointer">
                      Return to Career Dashboard
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {currentView === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard
                currentUsername={username || 'admin'}
                userRole={userRole}
                onRoleChange={setUserRole}
                isAdminPreviewMode={isAdminPreviewMode}
                onToggleAdminPreviewMode={setIsAdminPreviewMode}
                onLaunchTestAssessment={(skillId) => {
                  setIsAdminPreviewMode(true);
                  handleStartAssessment(skillId);
                }}
                onExitAdminView={() => {
                  setIsAdminLoggedIn(false);
                  setIsAdminPreviewMode(false);
                  if (activeCareer) setCurrentView('dashboard');
                  else setCurrentView('onboarding');
                }}
                onLaunchUserPreviewView={() => {
                  setIsAdminPreviewMode(true);
                  if (activeCareer) setCurrentView('dashboard');
                  else setCurrentView('onboarding');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Locked AI Interview Eligibility Modal */}
      <AnimatePresence>
        {showInterviewLockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">AI HR Mock Interview Locked 🔒</h3>
                    <p className="text-xs text-slate-400">
                      Access Restricted: The 1-on-1 AI Interviewer is <strong className="text-amber-400">Locked for normal users</strong> and available strictly for <strong className="text-emerald-400">Admin accounts</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInterviewLockedModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Competency progress details */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 uppercase">Role Competency Progress</span>
                  <span className="text-emerald-400 font-bold">
                    {completedCompetenciesAbove80.length} / {activeRoleCompetencyIds.length} Passed
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-850">
                  {activeRoleCompetencyIds.map(skillId => {
                    const sk = allSkillsPool.find(s => s.id === skillId);
                    const state = userState.skills[skillId];
                    const score = state?.readinessScore;
                    const passed = score !== undefined && score !== null && score >= 80;

                    return (
                      <div key={skillId} className="flex justify-between items-center text-xs">
                        <span className="text-slate-200 font-medium">{sk?.name || skillId}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className={passed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {score !== null && score !== undefined ? `${score}%` : 'Not Completed'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${
                            passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {passed ? 'Passed ✅' : 'Needs ≥80% ⚠️'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setShowInterviewLockedModal(false);
                    const firstUnpassed = activeRoleCompetencyIds.find(sId => {
                      const st = userState.skills[sId];
                      return !st || st.readinessScore === null || st.readinessScore < 80;
                    });
                    if (firstUnpassed) {
                      handleStartAssessment(firstUnpassed);
                    } else if (activeCareer) {
                      setCurrentView('dashboard');
                    }
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-500/10"
                >
                  Start Core Competency Assessment
                  <GraduationCap className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowInterviewLockedModal(false)}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 font-mono text-xs py-2 px-4 rounded-xl cursor-pointer transition-colors border border-slate-800"
                >
                  Close & Return to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Credentials Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => {
          setIsAdminLoggedIn(true);
          setShowAdminLoginModal(false);
          setUserRole('admin');
          setCurrentView('admin');
        }}
      />

      {/* Humble Corporate Footer */}
      <footer className="border-t border-slate-800/60 py-6 bg-slate-950/20">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 font-mono">
          <p>© 2026 KRÜSt Career Readiness Engine. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Evaluation Sandbox v1.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
