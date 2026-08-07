import { Skill, RoadmapItem } from '../types';
import { ROADMAPS_POOL } from '../data/roadmaps';
import { 
  ArrowLeft, CheckSquare, Square, ExternalLink, Bookmark, Sparkles, 
  BookOpen, Compass, Award, Lightbulb, PlayCircle, Layers, GitBranch, ShieldCheck, ArrowRight, TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';

interface RoadmapViewProps {
  skill: Skill;
  completedMilestones: string[];
  onToggleMilestone: (milestoneId: string) => void;
  onBackToDashboard: () => void;
  customRoadmap?: RoadmapItem[] | null;
}

export default function RoadmapView({ 
  skill, 
  completedMilestones, 
  onToggleMilestone, 
  onBackToDashboard,
  customRoadmap
}: RoadmapViewProps) {
  
  const fallbackRoadmap: RoadmapItem = {
    skillId: skill.id,
    priority: 'high',
    topics: [
      `Foundations & Terminology of ${skill.name}`,
      `Practical Workflows & Implementation Standards`,
      `Advanced Optimization & Real-World Edge Cases`
    ],
    practiceRecommendations: [
      `Develop a dedicated sandbox project implementing ${skill.name} best practices.`,
      `Perform self-directed code reviews and test failure modes.`
    ],
    externalResources: [
      { name: `${skill.name} Reference Manuals & Guides`, url: 'https://developer.mozilla.org' },
      { name: 'FreeCodeCamp Interactive Pathways', url: 'https://www.freecodecamp.org' }
    ],
    milestones: [
      { id: `ms_${skill.id}_1`, text: `Review baseline core concepts for ${skill.name}`, completed: false },
      { id: `ms_${skill.id}_2`, text: `Build a hands-on exercise project using ${skill.name}`, completed: false },
      { id: `ms_${skill.id}_3`, text: `Score above 80% on KRuST evaluation assessment`, completed: false }
    ]
  };

  // Get roadmap data for the skill, prioritizing the AI custom parsed roadmap
  const rawRoadmap = customRoadmap?.find(item => item.skillId === skill.id) || ROADMAPS_POOL[skill.id] || fallbackRoadmap;

  if (!rawRoadmap) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <Compass className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-200">Roadmap Not Configured</h3>
        <p className="text-slate-400 text-xs mt-1">A growth roadmap is not currently defined in the configurations for {skill.name}.</p>
        <button
          onClick={onBackToDashboard}
          className="mt-6 k-btn-secondary text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Calculate completion percentage
  const totalMilestones = rawRoadmap.milestones.length;
  const completedCount = rawRoadmap.milestones.filter(m => completedMilestones.includes(m.id)).length;
  const completionPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

  // Milestone Hierarchy grouping
  const milestoneStages = [
    {
      stage: 'Stage 1: Core Fundamentals',
      desc: 'Prerequisite syntax, memory models & baseline concepts',
      badge: 'Prerequisite',
      color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      milestones: rawRoadmap.milestones.slice(0, Math.ceil(totalMilestones / 3))
    },
    {
      stage: 'Stage 2: Applied Competency',
      desc: 'Real-world problem solving, failure modes & edge-case handling',
      badge: 'Core Skills',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      milestones: rawRoadmap.milestones.slice(Math.ceil(totalMilestones / 3), Math.ceil((totalMilestones * 2) / 3))
    },
    {
      stage: 'Stage 3: Advanced Architecture',
      desc: 'Performance optimization, system design & interview mastery',
      badge: 'Mastery',
      color: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      milestones: rawRoadmap.milestones.slice(Math.ceil((totalMilestones * 2) / 3))
    }
  ].filter(s => s.milestones.length > 0);

  // Current gap analysis calculation
  const currentScore = skill.score || 0;
  const targetGap = Math.max(0, 80 - currentScore);

  return (
    <div className="max-w-6xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <button
            id="back-to-dashboard-btn"
            onClick={onBackToDashboard}
            className="k-btn-ghost text-xs px-0 hover:bg-transparent mb-1"
          >
            ← BACK TO DASHBOARD
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              {skill.name} Growth Roadmap
            </h1>
            <span className={`k-badge ${
              rawRoadmap.priority === 'high'
                ? 'k-badge-strong'
                : 'k-badge-moderate'
            }`}>
              {rawRoadmap.priority} Priority Pathway
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Structured milestone hierarchy, prerequisite dependency flows & skill gap bridges.
          </p>
        </div>
      </div>

      {/* Progress & Skill Gap Bridge Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Summary Card */}
        <div className="md:col-span-2 k-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
                Milestone Progress & Flow
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Check off learning targets as you progress from baseline mechanics to system architecture.
            </p>
          </div>
          
          <div className="flex items-center gap-4 self-stretch md:self-auto shrink-0">
            <div className="text-right">
              <span className="text-2xl font-extrabold text-slate-100 font-mono k-metric-value">{completionPct}%</span>
              <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Milestones Done</span>
            </div>
            <div className="w-28 bg-slate-950 h-2.5 rounded-full overflow-hidden shrink-0 border border-slate-800">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Skill Gap Bridge Card */}
        <div className="k-card p-5 border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Skill Gap Bridge
              </span>
              <span className="text-xs font-mono font-extrabold text-slate-200">
                Score: {currentScore}%
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1.5">
              {targetGap > 0 
                ? `Bridge the remaining ${targetGap}% gap to reach the ≥80% target competency threshold.`
                : 'Competency threshold achieved! Focus on Stage 3 Advanced Architecture.'
              }
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-500/20 text-[10px] font-mono text-emerald-300 flex items-center justify-between">
            <span>Target Threshold: ≥80%</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Roadmap content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columns 1 & 2: Milestone Hierarchy & Prerequisite Flows */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Milestone Hierarchy Stages */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 font-bold">
              <Layers className="w-4 h-4 text-emerald-400" />
              Structured Milestone Hierarchy & Prerequisites
            </h3>

            {milestoneStages.map((stageItem, stageIdx) => (
              <div key={stageIdx} className="k-card p-5 space-y-3 relative overflow-hidden">
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {stageItem.stage}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stageItem.desc}</p>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${stageItem.color}`}>
                    {stageItem.badge}
                  </span>
                </div>

                {/* Prerequisites Flow indicator */}
                {stageIdx > 0 && (
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlocked by completing prerequisite Stage {stageIdx} milestones</span>
                  </div>
                )}

                {/* Stage Milestones List */}
                <div className="space-y-2 pt-1">
                  {stageItem.milestones.map((milestone) => {
                    const isCompleted = completedMilestones.includes(milestone.id);
                    return (
                      <div
                        key={milestone.id}
                        id={`milestone-item-${milestone.id}`}
                        onClick={() => onToggleMilestone(milestone.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer flex gap-3 items-start select-none transition-all ${
                          isCompleted 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5 text-emerald-400">
                          {isCompleted ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </div>
                        <span className={isCompleted ? 'line-through text-slate-400' : 'text-slate-200 font-medium'}>
                          {milestone.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Section: Actionable Practice Recommendations */}
          <div className="k-card p-6 space-y-4">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 font-bold">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              Actionable Practice & Bridge Drills
            </h3>
            <ul className="space-y-3">
              {rawRoadmap.practiceRecommendations.map((rec, index) => (
                <li key={index} className="flex gap-3 text-xs text-slate-300 leading-relaxed bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                  <PlayCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Column 3: Curriculum Topics & Resources */}
        <div className="space-y-6">
          
          {/* Target Curriculum */}
          <div className="k-card p-5 space-y-4">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 font-bold">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Curriculum Core
            </h3>
            <ul className="space-y-3">
              {rawRoadmap.topics.map((topic, index) => (
                <li key={index} className="flex gap-3 text-xs text-slate-300 bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl">
                  <span className="text-emerald-400 font-mono font-bold shrink-0">{String(index + 1).padStart(2, '0')}.</span>
                  <span className="font-medium text-slate-200">{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* External resources */}
          <div className="k-card p-5 space-y-4">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 font-bold">
              <Bookmark className="w-4 h-4 text-emerald-400" />
              Verified Learning Resources
            </h3>
            
            <div className="space-y-2.5">
              {rawRoadmap.externalResources.map((res, index) => (
                <a
                  key={index}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-3 rounded-xl flex items-center justify-between text-xs font-medium text-slate-300 hover:text-emerald-400 transition-all cursor-pointer"
                >
                  <span className="line-clamp-1">{res.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                </a>
              ))}
            </div>
            
            <p className="text-[10px] text-slate-500 text-center leading-relaxed font-mono">
              *KRuST study pathways recommend curated open learning platforms.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

