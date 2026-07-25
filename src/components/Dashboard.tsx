import { useState, useEffect } from 'react';
import { Career, UserSkillState, Attempt, Skill } from '../types';
import { SKILLS_POOL } from '../data/careers';
import { 
  Trophy, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, 
  BookOpen, Calendar, ChevronRight, Award, GraduationCap, RotateCcw,
  Sparkles, ExternalLink, Loader2, Globe, Building2, MapPin
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
  customSkills?: Skill[];
}

export default function Dashboard({ 
  career, 
  skillsState, 
  onStartAssessment, 
  onViewRoadmap, 
  onBackToCareers,
  resumeAnalysis,
  onOpenResumeAudit,
  customSkills
}: DashboardProps) {
  
  const allSkillsPool = [...SKILLS_POOL, ...(customSkills || [])];
  const IconComponent = getDomainIconComponent(career.domainIcon || getDomainIconName(career.name));

  const [trends, setTrends] = useState<any>(null);
  const [trendType, setTrendType] = useState<'job' | 'internship'>(career.roleType || 'job');
  const [isLoadingTrends, setIsLoadingTrends] = useState<boolean>(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  useEffect(() => {
    if (career.roleType) {
      setTrendType(career.roleType);
    }
  }, [career.id, career.roleType]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingTrends(true);
    setTrendsError(null);
    
    fetch('/api/career/trends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        careerName: career.name,
        careerDescription: career.description,
        trendType: trendType
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch industry trends');
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          setTrends(data);
          setIsLoadingTrends(false);
        }
      })
      .catch(err => {
        console.error('Error loading trends:', err);
        if (isMounted) {
          setTrendsError(err.message || 'Error loading trends');
          setIsLoadingTrends(false);
        }
      });
      
    return () => {
      isMounted = false;
    };
  }, [career.id, career.name, trendType]);

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
  // If a skill is not assessed yet, its score is 0.
  let weightedSum = 0;
  let totalWeight = 0;
  requiredSkills.forEach(skill => {
    const weight = career.weights[skill.id] || 0;
    const score = skill.state.readinessScore || 0;
    weightedSum += score * weight;
    totalWeight += weight;
  });

  const kri = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // Career Status
  let careerStatus = 'Not Ready';
  let statusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (kri >= 80) {
    careerStatus = 'Career Ready';
    statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (kri >= 45) {
    careerStatus = 'Progressing';
    statusColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
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
    // Recommend the weak skill with the lowest score
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

  // History timeline extraction for trend line (Sort attempts by timestamp)
  const allAttempts: { timestamp: number; scoreAtTime: number }[] = [];
  
  // To construct a chronological overall KRI timeline:
  // Let's gather all attempts from all required skills.
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

  // Compute rolling weighted KRI for each attempt timestamp
  const runningScores: Record<string, number> = {};
  const kriTrendPoints: { date: string; value: number }[] = [];

  attemptsChronological.forEach(att => {
    runningScores[att.skillId] = att.score;
    // Calculate current KRI with available scores
    let wSum = 0;
    let tW = 0;
    career.skillIds.forEach(sid => {
      const w = career.weights[sid] || 0;
      const s = runningScores[sid] || 0; // default to 0 if not assessed yet
      wSum += s * w;
      tW += w;
    });
    const currentKri = tW > 0 ? Math.round(wSum / tW) : 0;
    const formattedDate = new Date(att.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    kriTrendPoints.push({
      date: formattedDate,
      value: currentKri
    });
  });

  // If empty, add a default start point
  if (kriTrendPoints.length === 0) {
    kriTrendPoints.push({ date: 'Start', value: 0 });
  }

  // Generate chart data for Recharts, including overall KRI and individual skill progress over time
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
        // If this skill has a recorded score at or before this timestamp, use it. Otherwise, use 0.
        dataPoint[sk.name] = runningScoresForChart[sk.id] !== undefined ? runningScoresForChart[sk.id] : 0;
      });

      // Calculate aggregate weighted KRI
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
    // Single baseline starting point
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
    '#3b82f6', // blue-500
    '#a855f7', // purple-500
    '#f59e0b', // amber-500
    '#f43f5e', // rose-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#e11d48'  // deep-rose
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
                <span className="font-mono font-bold animate-pulse" style={{ color: item.color }}>{item.value}%</span>
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
      {/* Back Button & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            id="back-to-careers-btn"
            onClick={onBackToCareers}
            className="text-xs text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition-colors mb-2 cursor-pointer"
          >
            ← BACK TO PATHS
          </button>
          <div className="flex items-center gap-2">
            <IconComponent className="w-6 h-6 text-emerald-400 shrink-0" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {career.name} Dashboard
            </h1>
            <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${statusColor}`}>
              {careerStatus}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">{career.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          {onOpenResumeAudit && (
            <button
              id="resume-audit-dashboard-btn"
              onClick={onOpenResumeAudit}
              className={`text-xs font-semibold py-2 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border ${
                resumeAnalysis 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border-transparent hover:shadow-lg hover:shadow-emerald-500/5'
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
            className="bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-semibold py-2 px-3.5 rounded-lg transition-all cursor-pointer"
          >
            Switch Career Path
          </button>
        </div>
      </div>

      {/* Hero Overview Grid (KRI Gauge, Stats Cards, Recommended Action) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Box 1: KRÜSt Readiness Index Gauge */}
        <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500/5 w-32 h-32 rounded-full blur-3xl"></div>
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">
            KRÜSt Readiness Index (KRI)
          </h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG Arc Progress Ring */}
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
              <span className="text-4xl font-extrabold text-white tracking-tight">{kri}%</span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Readiness</span>
            </div>
          </div>
          
          <p className="text-[11px] text-slate-400 max-w-xs mt-4">
            Weighted aggregate of all skill benchmarks. Reach <strong className="text-emerald-400">80% KRI</strong> to achieve full career readiness status.
          </p>
        </div>

        {/* Box 2: Skill Gaps breakdown & Next Recommendation */}
        <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Next Recommendation
            </h3>
            
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-start gap-3.5 mb-6">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300">Action Plan</h4>
                <p className="text-sm text-slate-200 mt-1">{nextActionText}</p>
                
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
                    className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 group cursor-pointer"
                  >
                    {nextActionType === 'assess' ? 'Launch Assessment' : 'View Roadmap & Recommendations'}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Gaps metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/60">
            <div className="text-center md:text-left">
              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">Strong Skills</span>
              <span className="text-lg font-extrabold text-emerald-400 mt-1 block">
                {strongSkills.length} <span className="text-xs text-slate-600 font-normal">/ {requiredSkills.length}</span>
              </span>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">Weak Skills</span>
              <span className="text-lg font-extrabold text-red-400 mt-1 block">
                {weakSkills.length} <span className="text-xs text-slate-600 font-normal">/ {requiredSkills.length}</span>
              </span>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">Missing Baseline</span>
              <span className="text-lg font-extrabold text-slate-400 mt-1 block">
                {missingSkills.length} <span className="text-xs text-slate-600 font-normal">/ {requiredSkills.length}</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Latest Industry Trends Section */}
      <div className="bg-slate-900/40 rounded-xl border border-slate-800/80 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-blue-500/5 w-40 h-40 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/60 pb-4 mb-5 gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span>Latest Industry Trends & Hiring Market</span>
              <span className="text-[10px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                Google Search Grounded
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-time, up-to-date market intelligence and emerging patterns fetched directly from web searches.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Job vs Internship Toggle */}
            <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center shrink-0">
              <button
                id="trend-tab-job"
                onClick={() => setTrendType('job')}
                disabled={isLoadingTrends}
                className={`py-1 px-3 rounded-md font-mono text-[10px] uppercase transition-all cursor-pointer ${
                  trendType === 'job'
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Full-time Job
              </button>
              <button
                id="trend-tab-internship"
                onClick={() => setTrendType('internship')}
                disabled={isLoadingTrends}
                className={`py-1 px-3 rounded-md font-mono text-[10px] uppercase transition-all cursor-pointer ${
                  trendType === 'internship'
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Internship
              </button>
            </div>

            {isLoadingTrends && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Scanning...</span>
              </div>
            )}
          </div>
        </div>

        {isLoadingTrends ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold text-slate-200">Retrieving real-time industry insights</p>
              <p className="text-xs text-slate-500 max-w-xs">Using Google Search grounding to synthesize market demand, average salary, and emerging tools...</p>
            </div>
          </div>
        ) : trendsError ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 border border-dashed border-red-500/20 rounded-xl bg-red-500/5 p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <p className="text-xs text-slate-400">Could not retrieve latest industry trends.</p>
            <button 
              onClick={() => {
                setIsLoadingTrends(true);
                setTrendsError(null);
                fetch('/api/career/trends', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ careerName: career.name, careerDescription: career.description, trendType: trendType })
                })
                  .then(res => res.json())
                  .then(data => { setTrends(data); setIsLoadingTrends(false); })
                  .catch(err => { setTrendsError(err.message); setIsLoadingTrends(false); });
              }}
              className="text-xs text-blue-400 hover:underline cursor-pointer font-semibold bg-slate-900 px-3 py-1.5 rounded border border-slate-800"
            >
              Retry
            </button>
          </div>
        ) : trends ? (
          <div className="space-y-6">
            {/* Top comparison summary row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 col-span-1 md:col-span-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                  Global & Regional Growth Rate comparison
                </span>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded inline-flex items-center gap-1.5 font-mono">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    {trends.growthRate || "Active Expansion"}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    High growth momentum driven by Global Capability Centers (GCCs) and remote initiatives.
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 col-span-1 flex flex-col justify-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                  Primary Market Focus
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {trends.marketDemand ? (trends.marketDemand.length > 85 ? trends.marketDemand.slice(0, 85) + "..." : trends.marketDemand) : "Stable, healthy market demand."}
                </p>
              </div>
            </div>

            {/* Main Side-by-Side Comparison: India vs Global */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
              {/* India-specific Trends Card */}
              <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-500/5 w-24 h-24 rounded-full blur-2xl"></div>
                
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🇮🇳</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Indian Market Trends</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Regional hiring analysis & hubs</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-semibold uppercase">
                    INR (₹) & USD ($)
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block mb-1 uppercase tracking-wider font-bold">COMPENSATION RANGE</span>
                    <div className="inline-flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-850 w-full">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {trends.indiaSalary || "₹8,00,000 - ₹20,00,000 / yr ($9,600 - $24,000 USD)"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block mb-1 uppercase tracking-wider font-bold">REGIONAL DEMAND & GCC ACTIVITY</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                      {trends.indiaDemand || "High localized demand in Bangalore, Delhi NCR, Hyderabad, Pune, and Mumbai with rapid expansion of GCCs."}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block mb-1.5 uppercase tracking-wider font-bold">TOP EMPLOYERS & HUBS IN INDIA</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(trends.indiaCompanies || ["Google India", "Amazon India", "Flipkart", "TCS", "Infosys", "PhonePe"]).map((company: string, idx: number) => (
                        <span 
                          key={idx}
                          className="text-[10px] font-medium bg-slate-950 border border-slate-800/80 text-slate-300 px-2 py-1 rounded"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Worldwide Trends Card */}
              <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500/5 w-24 h-24 rounded-full blur-2xl"></div>

                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌐</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Worldwide Market Trends</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Global distribution & standards</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-semibold uppercase">
                    USD ($) Focus
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block mb-1 uppercase tracking-wider font-bold">GLOBAL SALARY BENCHMARK</span>
                    <div className="inline-flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-850 w-full">
                      <span className="text-xs font-bold text-indigo-400 font-mono">
                        {trends.globalSalary || "$95,000 - $155,000 / yr"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block mb-1 uppercase tracking-wider font-bold">GLOBAL DEMAND OUTLOOK</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                      {trends.globalDemand || "Highly resilient market with massive investments in cloud scaling, automation, and core product architecture."}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block mb-1.5 uppercase tracking-wider font-bold">GLOBAL INDUSTRY LEADERS</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(trends.globalCompanies || ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix"]).map((company: string, idx: number) => (
                        <span 
                          key={idx}
                          className="text-[10px] font-medium bg-slate-950 border border-slate-800/80 text-indigo-200 px-2 py-1 rounded"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparative Synthesis Card */}
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4 font-sans">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">India vs Worldwide Comparative Analysis</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {trends.indiaVsGlobalComparison || "In India, technical roles are heavily concentrated in Global Capability Centers (GCCs) and massive domestic startup ecosystems, showing extremely high growth rates (+15% YoY). On a global scale, the emphasis is oriented toward fundamental product design, architectural choices, and localized security compliance."}
              </p>
            </div>

            {/* Bottom Row: Insights, Emerging Skills & References */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
              <div className="lg:col-span-2 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1.5">
                  Industry Insight Summary
                </span>
                <blockquote className="text-xs text-slate-300 border-l-2 border-blue-500/50 pl-3 italic leading-relaxed">
                  {trends.summary}
                </blockquote>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1.5">
                    Emerging Skills & Focus (2025/2026)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {trends.emergingSkills?.map((skill: string, idx: number) => (
                      <span 
                        key={idx}
                        className="text-[10px] font-mono bg-blue-500/5 border border-blue-500/15 text-blue-300 px-2 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grounded References / Sources */}
                {trends.sources && trends.sources.length > 0 && (
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/60 space-y-2">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1 font-bold font-mono">
                      <Globe className="w-3 h-3 text-blue-400/80" />
                      Verified Web Sources
                    </span>
                    <div className="space-y-1.5">
                      {trends.sources.slice(0, 3).map((source: { title: string; url: string }, idx: number) => (
                        <a 
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-[10px] text-slate-400 hover:text-blue-400 transition-colors flex items-center justify-between gap-2 bg-slate-900/50 hover:bg-slate-900 p-2 rounded border border-slate-800/40 cursor-pointer"
                        >
                          <span className="truncate font-medium">{source.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 font-sans">
            No trends loaded yet.
          </div>
        )}
      </div>

      {/* AI Resume Match & Gap Analysis Dashboard Integration Card */}
      {onOpenResumeAudit && (
        <div className="bg-slate-900/40 rounded-xl border border-slate-800/80 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500/5 w-40 h-40 rounded-full blur-3xl"></div>
          
          {resumeAnalysis ? (
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
              {/* Left Score Column */}
              <div className="flex flex-col justify-between md:border-r border-slate-800/80 md:pr-8 md:w-1/3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Dynamic ATS Score
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white tracking-tight">
                      {resumeAnalysis.atsScore}%
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Prerequisite Fit</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {resumeAnalysis.summary}
                  </p>
                </div>

                <div className="pt-4 md:pt-0">
                  <button
                    onClick={onOpenResumeAudit}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 group cursor-pointer"
                  >
                    View Full Resume Analysis & Adaptive Roadmap
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Center Gaps Column */}
              <div className="flex-1 space-y-4">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-emerald-400" />
                  Identified Gaps to Close
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Skill Gaps */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
                      Target Prerequisites Missing
                    </span>
                    {resumeAnalysis.skillGaps && resumeAnalysis.skillGaps.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {resumeAnalysis.skillGaps.slice(0, 4).map((gap: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono bg-red-500/5 border border-red-500/20 text-red-400 px-2.5 py-1 rounded"
                          >
                            {gap}
                          </span>
                        ))}
                        {resumeAnalysis.skillGaps.length > 4 && (
                          <span className="text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded">
                            +{resumeAnalysis.skillGaps.length - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/40 p-2.5 border border-slate-850 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>All core skills present in resume!</span>
                      </div>
                    )}
                  </div>

                  {/* Experience Gaps */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
                      Experiential & Narrative Gaps
                    </span>
                    {resumeAnalysis.experienceGaps && resumeAnalysis.experienceGaps.length > 0 ? (
                      <ul className="space-y-1.5">
                        {resumeAnalysis.experienceGaps.slice(0, 2).map((gap: string, i: number) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                            <span className="text-emerald-400 select-none font-mono mt-0.5">•</span>
                            <span className="line-clamp-1">{gap}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/40 p-2.5 border border-slate-850 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Work history aligns with role depth</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 md:max-w-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Connect Your Resume for Real ATS Evaluation
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Upload your professional resume (PDF, TXT, or markdown text) to audit matches against the <strong>{career.name}</strong> prerequisites. Identify narrative gaps, technical deficiencies, and establish a fully customized, AI-driven adaptive study roadmap.
                </p>
              </div>

              <button
                onClick={onOpenResumeAudit}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-5 rounded-lg text-xs cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              >
                Scan My Resume Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Milestone Badges Tracker */}
      <Badges skillsState={skillsState} career={career} />

      {/* Main Grid: Required Skills list & Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: Core Skill Assessment Blocks */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            Core Competencies & Evaluation
          </h2>

          <div className="space-y-3.5">
            {requiredSkills.map(skill => {
              const weightPct = Math.round((career.weights[skill.id] || 0) * 100);
              const score = skill.state.readinessScore;
              
              let badgeText = 'Unassessed';
              let badgeColor = 'text-slate-400 bg-slate-800 border-slate-700/60';
              if (score !== null) {
                if (score >= 75) {
                  badgeText = 'Strong';
                  badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                } else {
                  badgeText = 'Needs Focus';
                  badgeColor = 'text-red-400 bg-red-500/10 border-red-500/20';
                }
              }

              return (
                <div
                  key={skill.id}
                  id={`skill-row-${skill.id}`}
                  className="bg-slate-900/40 hover:bg-slate-900/80 p-5 rounded-xl border border-slate-800/80 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group"
                >
                  <div className="space-y-1 md:max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {skill.name}
                      </h4>
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
                        {badgeText}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Weight: {weightPct}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {skill.description}
                    </p>
                    
                    {score !== null && skill.state.weakConcepts.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-mono text-red-400/90 bg-red-500/5 border border-red-500/10 px-2 py-1 rounded">
                          Weak concept: <strong>{skill.state.weakConcepts[0]}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Score circle / Actions */}
                  <div className="flex items-center gap-4 self-stretch md:self-auto justify-between border-t border-slate-800/50 md:border-t-0 pt-3 md:pt-0">
                    <div className="flex flex-col items-center justify-center px-4">
                      <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block">Readiness</span>
                      <span className="text-2xl font-extrabold text-white">
                        {score !== null ? `${score}%` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {score !== null && (
                        <button
                          id={`view-roadmap-btn-${skill.id}`}
                          onClick={() => onViewRoadmap(skill.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Roadmap
                        </button>
                      )}
                      <button
                        id={`assess-btn-${skill.id}`}
                        onClick={() => onStartAssessment(skill.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
                      >
                        {score !== null ? 'Reassess' : 'Assess'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Progress trend & history list */}
        <div className="space-y-6">
          
          {/* Progress Trend Recharts Box */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Skill Readiness Progress over Time
            </h3>
            
            {attemptsChronological.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/20 p-4">
                <TrendingUp className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
                <p className="text-xs text-slate-500 text-center font-sans max-w-xs leading-relaxed">
                  No evaluations recorded yet. Complete skill assessments or solve real compiler challenges to start plotting your progress.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
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
                      
                      {/* Overall KRI Line (thick glowing emerald) */}
                      <Line 
                        name="Overall KRI"
                        type="monotone" 
                        dataKey="Overall KRI" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 3, strokeWidth: 1, fill: '#090d16' }}
                        activeDot={{ r: 5 }}
                      />

                      {/* Dynamic Skill Lines */}
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
              </div>
            )}
          </div>

          {/* Previous Attempts Audit Log */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Evaluation Log
            </h3>

            {attemptsChronological.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No evaluations logged yet.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar">
                {[...attemptsChronological].reverse().map((att, idx) => {
                  const s = allSkillsPool.find(skill => skill.id === att.skillId);
                  const dt = new Date(att.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={idx} className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{s?.name || att.skillId}</p>
                        <span className="text-[9px] text-slate-500 block mt-0.5">{dt}</span>
                      </div>
                      <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                        att.score >= 75 ? 'text-emerald-400 bg-emerald-500/5' : 'text-red-400 bg-red-500/5'
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
