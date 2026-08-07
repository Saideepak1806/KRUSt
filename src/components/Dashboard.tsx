import { useState, useEffect } from 'react';
import { Career, UserSkillState, Attempt, Skill } from '../types';
import { SKILLS_POOL } from '../data/careers';
import { 
  Trophy, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, 
  BookOpen, Calendar, ChevronRight, Award, GraduationCap, RotateCcw,
  Sparkles, ExternalLink, Loader2, Bot, Target, ShieldAlert, FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import Badges from './Badges';
import { getDomainIconName, getDomainIconComponent } from '../lib/utils';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface DashboardProps {
  career: Career;
  skillsState: Record<string, UserSkillState>;
  onStartAssessment: (skillId: string) => void;
  onViewRoadmap: (skillId: string) => void;
  onBackToCareers: () => void;
  resumeAnalysis?: any;
  onOpenResumeAudit?: () => void;
  onOpenJDAnalyzer?: () => void;
  onOpenAIInterview?: () => void;
  customSkills?: Skill[];
  isAdminLoggedIn?: boolean;
}

export default function Dashboard({ 
  career, 
  skillsState, 
  onStartAssessment, 
  onViewRoadmap, 
  onBackToCareers,
  resumeAnalysis,
  onOpenResumeAudit,
  onOpenJDAnalyzer,
  onOpenAIInterview,
  customSkills,
  isAdminLoggedIn = false
}: DashboardProps) {
  
  const allSkillsPool = [...SKILLS_POOL, ...(customSkills || [])];
  const IconComponent = getDomainIconComponent(career.domainIcon || getDomainIconName(career.name));

  // Calculate individual skill scores and identify Strong, Weak, Missing
  const requiredSkills = career.skillIds.map(sid => {
    const foundSkill = allSkillsPool.find(s => s.id === sid);
    const skillObj = foundSkill || {
      id: sid,
      name: sid.replace('custom_ai_', '').replace('custom_', '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: 'Custom generated competency requirement.',
      category: 'Specialized'
    };
    const state = skillsState[sid] || {
      skillId: sid,
      readinessScore: null,
      weakConcepts: [],
      strongConcepts: [],
      history: []
    };
    return {
      ...skillObj,
      state
    };
  });

  // Calculate overall KRI (weighted average)
  let weightedSum = 0;
  let totalWeight = 0;
  requiredSkills.forEach(skill => {
    const rawWeight = career.weights?.[skill.id];
    const weight = (typeof rawWeight === 'number' && !isNaN(rawWeight) && rawWeight > 0)
      ? rawWeight
      : (1 / (requiredSkills.length || 1));
    const score = skill.state.readinessScore || 0;
    weightedSum += score * weight;
    totalWeight += weight;
  });

  const kri = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // Career Status
  let careerStatus = 'Not Ready';
  let badgeClass = 'k-badge-critical';
  if (kri >= 80) {
    careerStatus = 'Career Ready';
    badgeClass = 'k-badge-strong';
  } else if (kri >= 45) {
    careerStatus = 'Progressing';
    badgeClass = 'k-badge-moderate';
  }

  // Strong, Weak, Missing classification
  const strongSkills: typeof requiredSkills = [];
  const weakSkills: typeof requiredSkills = [];
  const missingSkills: typeof requiredSkills = [];

  requiredSkills.forEach(sk => {
    if (sk.state.readinessScore === null) {
      missingSkills.push(sk);
    } else if (sk.state.readinessScore >= 75) {
      strongSkills.push(sk);
    } else {
      weakSkills.push(sk);
    }
  });

  // Recommended Next Action calculation
  let nextActionText = '';
  let nextActionSkillId = '';
  let nextActionType: 'assess' | 'review' | 'celebrate' = 'assess';

  if (missingSkills.length > 0) {
    nextActionSkillId = missingSkills[0].id;
    nextActionText = `Establish your baseline KRI by completing the assessment for ${missingSkills[0].name}.`;
    nextActionType = 'assess';
  } else if (weakSkills.length > 0) {
    const lowestWeak = [...weakSkills].sort((a, b) => (a.state.readinessScore || 0) - (b.state.readinessScore || 0))[0];
    nextActionSkillId = lowestWeak.id;
    nextActionType = 'review';
    
    if (lowestWeak.state.weakConcepts.length > 0) {
      nextActionText = `Improve your ${lowestWeak.name} score. Review weak concepts: "${lowestWeak.state.weakConcepts[0]}", then reassess.`;
    } else {
      nextActionText = `Boost your ${lowestWeak.name} score to exit the weak range and elevate your readiness.`;
    }
  } else {
    nextActionText = "Excellent! You are fully qualified across all core skills. Maintain your readiness or choose another career!";
    nextActionType = 'celebrate';
  }

  // Chronological attempts for history and trend line
  const attemptsChronological: { timestamp: number; skillId: string; score: number }[] = [];
  requiredSkills.forEach(sk => {
    sk.state.history.forEach(att => {
      attemptsChronological.push({
        timestamp: att.timestamp,
        skillId: sk.id,
        score: att.score
      });
    });
  });

  attemptsChronological.sort((a, b) => a.timestamp - b.timestamp);

  // Generate chart data for Recharts
  const chartData: any[] = [];
  const runningScoresForChart: Record<string, number> = {};

  if (attemptsChronological.length > 0) {
    attemptsChronological.forEach((att) => {
      runningScoresForChart[att.skillId] = att.score;

      const formattedDate = new Date(att.timestamp).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      });

      const dataPoint: Record<string, any> = {
        date: formattedDate,
      };

      requiredSkills.forEach(sk => {
        dataPoint[sk.name] = runningScoresForChart[sk.id] !== undefined ? runningScoresForChart[sk.id] : 0;
      });

      let wSum = 0;
      let tW = 0;
      career.skillIds.forEach(sid => {
        const w = career.weights[sid] || 0;
        const s = runningScoresForChart[sid] !== undefined ? runningScoresForChart[sid] : 0;
        wSum += s * w;
        tW += w;
      });
      dataPoint["Overall KRI"] = tW > 0 ? Math.round(wSum / tW) : 0;

      chartData.push(dataPoint);
    });
  } else {
    const baseline: Record<string, any> = {
      date: 'Start',
      "Overall KRI": 0,
    };
    requiredSkills.forEach(sk => {
      baseline[sk.name] = 0;
    });
    chartData.push(baseline);
  }

  const LINE_COLORS = [
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#a855f7', // purple
    '#f59e0b', // amber
    '#f43f5e', // rose
    '#10b981', // emerald
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl font-sans text-xs">
          <p className="font-mono text-slate-400 mb-1.5 font-bold">{label}</p>
          <div className="space-y-1">
            {payload.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}:
                </span>
                <span className="font-mono font-bold" style={{ color: item.color }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            id="back-to-careers-btn"
            onClick={onBackToCareers}
            className="k-btn-ghost text-xs px-0 hover:bg-transparent mb-1"
          >
            ← BACK TO PATHS
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <IconComponent className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
                  {career.name}
                </h1>
                <span className={`k-badge ${badgeClass}`}>
                  {careerStatus}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">{career.description}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenJDAnalyzer && (
            <button
              id="jd-analyzer-dashboard-btn"
              onClick={onOpenJDAnalyzer}
              className="k-btn-primary text-xs bg-slate-900 text-emerald-400 border border-emerald-500/30 hover:bg-slate-850"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Job Description Analyzer</span>
            </button>
          )}

          {onOpenResumeAudit && (
            <button
              id="resume-audit-dashboard-btn"
              onClick={onOpenResumeAudit}
              className={`k-btn-primary text-xs ${
                resumeAnalysis 
                  ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 hover:bg-slate-850' 
                  : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {resumeAnalysis 
                  ? `ATS Match: ${resumeAnalysis.atsScore}%` 
                  : 'Run AI Resume Audit'}
              </span>
            </button>
          )}

          <button
            id="change-path-btn"
            onClick={onBackToCareers}
            className="k-btn-secondary text-xs"
          >
            Switch Career Path
          </button>
        </div>
      </div>

      {/* Hero Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KRI Gauge Card */}
        <div className="k-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 block">
            KRÜSt Readiness Index (KRI)
          </span>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-emerald-500"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={440}
                initial={{ strokeDashoffset: 440 }}
                animate={{ strokeDashoffset: 440 - (440 * kri) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-slate-100 k-metric-value">{kri}%</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Overall Readiness</span>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 max-w-xs mt-4 leading-relaxed">
            Weighted aggregate of all skill benchmarks. Reach <strong className="text-emerald-400">80% KRI</strong> to achieve career readiness status.
          </p>
        </div>

        {/* Priority Action & Metrics Card */}
        <div className="lg:col-span-2 k-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-emerald-400" />
              <h3 className="k-section-title text-sm uppercase tracking-wider text-slate-300 font-mono">
                Priority Action Plan
              </h3>
            </div>
            
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3.5 mb-6">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Recommended Step</span>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">{nextActionText}</p>
                
                {nextActionType !== 'celebrate' && (
                  <button
                    id={`rec-action-btn-${nextActionSkillId}`}
                    onClick={() => {
                      if (nextActionType === 'assess') {
                        onStartAssessment(nextActionSkillId);
                      } else {
                        onViewRoadmap(nextActionSkillId);
                      }
                    }}
                    className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{nextActionType === 'assess' ? 'Launch Assessment' : 'View Roadmap & Recommendations'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Skill status breakdown metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider font-bold">Strong Skills</span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1 block k-metric-value">
                {strongSkills.length} <span className="text-xs text-slate-500 font-normal">/ {requiredSkills.length}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider font-bold">Needs Focus</span>
              <span className="text-xl font-extrabold text-amber-400 mt-1 block k-metric-value">
                {weakSkills.length} <span className="text-xs text-slate-500 font-normal">/ {requiredSkills.length}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider font-bold">Missing Baseline</span>
              <span className="text-xl font-extrabold text-slate-400 mt-1 block k-metric-value">
                {missingSkills.length} <span className="text-xs text-slate-500 font-normal">/ {requiredSkills.length}</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* AI Resume Match Card */}
      {onOpenResumeAudit && (
        <div className="k-card p-6">
          {resumeAnalysis ? (
            <div className="space-y-4">
              {resumeAnalysis.targetCareerName && resumeAnalysis.targetCareerName.toLowerCase() !== career.name.toLowerCase() && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-300 font-mono">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Resume analyzed for <strong className="text-white underline">{resumeAnalysis.targetCareerName}</strong>. Active goal: <strong className="text-emerald-400">{career.name}</strong>.
                    </span>
                  </div>
                  <button
                    onClick={onOpenResumeAudit}
                    className="k-btn-primary text-[11px] py-1 px-3"
                  >
                    Re-Audit Resume for {career.name}
                  </button>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
                <div className="flex flex-col justify-between md:border-r border-slate-800/80 md:pr-8 md:w-1/3 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Dynamic ATS Score
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-100 k-metric-value">
                        {resumeAnalysis.atsScore}%
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Role Fit Match</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {resumeAnalysis.summary}
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={onOpenResumeAudit}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>View Full Resume Analysis & Adaptive Roadmap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    Identified Resume Highlights & Skill Gaps
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resumeAnalysis.goods && resumeAnalysis.goods.length > 0 && (
                      <div className="space-y-1.5 bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono block">
                          Resume Strengths (Goods ✅)
                        </span>
                        <ul className="space-y-1">
                          {resumeAnalysis.goods.slice(0, 2).map((good: string, i: number) => (
                            <li key={i} className="text-[11px] text-emerald-200/90 line-clamp-1 flex items-center gap-1">
                              <span className="text-emerald-400 font-bold">•</span> {good}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {resumeAnalysis.bads && resumeAnalysis.bads.length > 0 && (
                      <div className="space-y-1.5 bg-rose-950/20 p-3 rounded-lg border border-rose-900/30">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono block">
                          Resume Red Flags (Bads ❌)
                        </span>
                        <ul className="space-y-1">
                          {resumeAnalysis.bads.slice(0, 2).map((bad: string, i: number) => (
                            <li key={i} className="text-[11px] text-rose-200/90 line-clamp-1 flex items-center gap-1">
                              <span className="text-rose-400 font-bold">•</span> {bad}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                        Target Prerequisites Missing
                      </span>
                      {resumeAnalysis.skillGaps && resumeAnalysis.skillGaps.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {resumeAnalysis.skillGaps.slice(0, 3).map((gap: string, i: number) => (
                            <span
                              key={i}
                              className="k-badge k-badge-critical"
                            >
                              {gap}
                            </span>
                          ))}
                          {resumeAnalysis.skillGaps.length > 3 && (
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
                              +{resumeAnalysis.skillGaps.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/50 p-2.5 border border-slate-800 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>All core prerequisites present!</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                        Portfolio & Depth Gaps
                      </span>
                      {resumeAnalysis.projectGaps && resumeAnalysis.projectGaps.length > 0 ? (
                        <ul className="space-y-1">
                          {resumeAnalysis.projectGaps.slice(0, 2).map((gap: string, i: number) => (
                            <li key={i} className="text-[11px] text-cyan-200 flex items-start gap-1">
                              <span className="text-cyan-400 font-mono select-none mt-0.5">•</span>
                              <span className="line-clamp-1">{gap}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/50 p-2.5 border border-slate-800 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Portfolio aligns with target role</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 md:max-w-xl">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Connect Your Resume for Real ATS Evaluation
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Upload your resume to audit matches against <strong>{career.name}</strong> prerequisites. Identify narrative gaps, technical deficiencies, and establish an AI-driven study roadmap.
                </p>
              </div>

              <button
                onClick={onOpenResumeAudit}
                className="k-btn-primary text-xs shrink-0 whitespace-nowrap"
              >
                Scan My Resume Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Job Description Analyzer Card */}
      {onOpenJDAnalyzer && (
        <div className="k-card p-6 border-emerald-500/20 bg-slate-950/80">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  Job Description Analyzer & Skill Gap Bridging
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-1">
                Paste any external Job Description (JD) to parse required tech stacks, benchmark against your current profile, and generate a step-by-step gap bridging roadmap.
              </p>
            </div>

            <button
              onClick={onOpenJDAnalyzer}
              className="k-btn-primary text-xs shrink-0 whitespace-nowrap bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch JD Analyzer</span>
            </button>
          </div>
        </div>
      )}

      {/* AI HR Mock Interview Status Card */}
      {(() => {
        const passedCompetenciesCount = requiredSkills.filter(sk => sk.state.readinessScore !== null && sk.state.readinessScore >= 80).length;
        const isAIInterviewUnlocked = Boolean(isAdminLoggedIn);

        return (
          <div className="k-card p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border mt-0.5 ${
                    isAIInterviewUnlocked
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-100">AI Technical & Behavioral Mock Interview</h3>
                      <span className={`k-badge ${isAIInterviewUnlocked ? 'k-badge-strong' : 'k-badge-warning'}`}>
                        {isAIInterviewUnlocked ? 'Unlocked ✨' : 'Locked 🔒'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      AI Mock Interviewer is strictly locked for standard users. Exclusive 1-on-1 AI voice evaluation access is enabled for <strong className="text-emerald-400">Admin Account</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1 text-xs pl-12">
                  <span className="font-mono text-slate-400">
                    Access Permission Status:
                  </span>
                  <span className={`font-mono font-bold px-2.5 py-1 rounded border ${
                    isAIInterviewUnlocked ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-amber-400'
                  }`}>
                    {isAIInterviewUnlocked ? 'ADMIN UNLOCKED ✨' : 'LOCKED (ADMIN ACCESS REQUIRED) 🔒'}
                  </span>
                </div>
              </div>

              <div className="self-end md:self-center">
                {isAIInterviewUnlocked ? (
                  <button
                    onClick={onOpenAIInterview}
                    className="k-btn-primary text-xs"
                  >
                    <span>Launch AI Mock Interview</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onOpenAIInterview}
                    className="k-btn-secondary text-xs opacity-75"
                  >
                    <span>View Access Details 🔒</span>
                    <Bot className="w-4 h-4 text-amber-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dynamic Milestone Badges Tracker */}
      <Badges skillsState={skillsState} career={career} />

      {/* Main Grid: Required Skills list & Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Core Skill Evaluation Blocks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <h2 className="k-section-title">
              Core Competencies Evaluation
            </h2>
          </div>

          <div className="space-y-3">
            {requiredSkills.map(skill => {
              const weightPct = Math.round((career.weights[skill.id] || 0) * 100);
              const score = skill.state.readinessScore;
              const levelScores = skill.state.levelScores || {};
              
              let badgeText = 'Unassessed';
              let badgeClass = 'k-badge-warning';
              if (score !== null) {
                if (score >= 80) {
                  badgeText = 'Passed (≥80%)';
                  badgeClass = 'k-badge-strong';
                } else {
                  badgeText = 'Needs Focus (<80%)';
                  badgeClass = 'k-badge-warning';
                }
              }

              return (
                <div
                  key={skill.id}
                  id={`skill-row-${skill.id}`}
                  className="k-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
                >
                  <div className="space-y-2 md:max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-100 text-base">
                        {skill.name}
                      </h3>
                      <span className={`k-badge ${badgeClass}`}>
                        {badgeText}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Weight: {weightPct}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {skill.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {[1, 2, 3].map(lvl => (
                        <span
                          key={lvl}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            levelScores[lvl] !== undefined
                              ? levelScores[lvl] >= 80
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          L{lvl}: {levelScores[lvl] !== undefined ? `${levelScores[lvl]}%` : '—'}
                        </span>
                      ))}
                    </div>
                    
                    {score !== null && skill.state.weakConcepts.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[10px] font-mono text-rose-400/90 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded">
                          Weak concept: <strong>{skill.state.weakConcepts[0]}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-stretch md:self-auto justify-between border-t border-slate-800/80 md:border-t-0 pt-3 md:pt-0">
                    <div className="flex flex-col items-center justify-center px-4">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Score</span>
                      <span className={`text-2xl font-extrabold k-metric-value ${score !== null && score >= 80 ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {score !== null ? `${score}%` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {score !== null && (
                        <button
                          id={`view-roadmap-btn-${skill.id}`}
                          onClick={() => onViewRoadmap(skill.id)}
                          className="k-btn-secondary text-xs py-2 px-3"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Roadmap</span>
                        </button>
                      )}
                      <button
                        id={`assess-btn-${skill.id}`}
                        onClick={() => onStartAssessment(skill.id)}
                        className="k-btn-primary text-xs py-2 px-3.5"
                      >
                        <span>{score !== null ? 'Reassess' : 'Start Assessment'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Progress trend & audit log */}
        <div className="space-y-6">
          
          <div className="k-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="k-section-title text-xs uppercase tracking-wider text-slate-400 font-mono">
                Skill Progress Over Time
              </h3>
            </div>
            
            {attemptsChronological.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/40 p-4">
                <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 text-center font-sans max-w-xs leading-relaxed">
                  No evaluations recorded yet. Complete skill assessments to start plotting your progress.
                </p>
              </div>
            ) : (
              <div className="h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" opacity={0.6} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      stroke="#64748b" 
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', color: '#94a3b8' }}
                    />
                    
                    <Line 
                      name="Overall KRI"
                      type="monotone" 
                      dataKey="Overall KRI" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 1, fill: '#080c14' }}
                      activeDot={{ r: 5 }}
                    />

                    {requiredSkills.map((sk, idx) => {
                      const color = LINE_COLORS[idx % LINE_COLORS.length];
                      return (
                        <Line
                          key={sk.id}
                          name={sk.name}
                          type="monotone"
                          dataKey={sk.name}
                          stroke={color}
                          strokeWidth={1.5}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="k-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="k-section-title text-xs uppercase tracking-wider text-slate-400 font-mono">
                Evaluation Log
              </h3>
            </div>

            {attemptsChronological.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No evaluations logged yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {[...attemptsChronological].reverse().map((att, idx) => {
                  const s = allSkillsPool.find(skill => skill.id === att.skillId);
                  const dt = new Date(att.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={idx} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{s?.name || att.skillId}</p>
                        <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{dt}</span>
                      </div>
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        att.score >= 75 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                      }`}>
                        {att.score}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

