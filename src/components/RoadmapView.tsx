import { Skill, RoadmapItem } from '../types';
import { ROADMAPS_POOL } from '../data/roadmaps';
import { 
  ArrowLeft, CheckSquare, Square, ExternalLink, Bookmark, Sparkles, 
  BookOpen, Compass, Award, Lightbulb, PlayCircle
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
  
  // Get roadmap data for the skill, prioritizing the AI custom parsed roadmap
  const rawRoadmap = customRoadmap?.find(item => item.skillId === skill.id) || ROADMAPS_POOL[skill.id];

  if (!rawRoadmap) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <Compass className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-200">Roadmap Not Configured</h3>
        <p className="text-slate-400 text-xs mt-1">A growth roadmap is not currently defined in the configurations for {skill.name}.</p>
        <button
          onClick={onBackToDashboard}
          className="mt-6 bg-slate-800 text-slate-200 px-4 py-2 rounded-lg text-xs font-mono"
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

  return (
    <div className="max-w-6xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            id="back-to-dashboard-btn"
            onClick={onBackToDashboard}
            className="text-xs text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition-colors mb-2 cursor-pointer"
          >
            ← BACK TO DASHBOARD
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {skill.name} Growth Roadmap
            </h1>
            <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
              rawRoadmap.priority === 'high'
                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
            }`}>
              {rawRoadmap.priority} Priority
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Focus on target topics and practice challenges to expand your baseline capability.
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">
            Milestone Progress
          </h3>
          <p className="text-sm text-slate-300">
            Complete active study milestones to ready yourself for your next assessment.
          </p>
        </div>
        
        <div className="flex items-center gap-4 self-stretch md:self-auto">
          <div className="text-right">
            <span className="text-2xl font-extrabold text-white">{completionPct}%</span>
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Completed</span>
          </div>
          <div className="w-32 bg-slate-950 h-2.5 rounded-full overflow-hidden shrink-0">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Roadmap content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columns 1 & 2: Core curriculum & practice */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Section 1: Target Topics */}
          <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-800/80">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Target Curriculum
            </h3>
            <ul className="space-y-3.5">
              {rawRoadmap.topics.map((topic, index) => (
                <li key={index} className="flex gap-3 text-sm text-slate-200">
                  <span className="text-emerald-400 font-mono font-bold select-none">{String(index + 1).padStart(2, '0')}.</span>
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Practice Recommendations */}
          <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-800/80">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              Actionable Practice
            </h3>
            <ul className="space-y-3.5">
              {rawRoadmap.practiceRecommendations.map((rec, index) => (
                <li key={index} className="flex gap-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg">
                  <PlayCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Column 3: Resources & Milestones */}
        <div className="space-y-6">
          
          {/* Milestones checklists */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Milestones
            </h3>
            
            <div className="space-y-3">
              {rawRoadmap.milestones.map(milestone => {
                const isCompleted = completedMilestones.includes(milestone.id);
                return (
                  <div
                    key={milestone.id}
                    id={`milestone-item-${milestone.id}`}
                    onClick={() => onToggleMilestone(milestone.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer flex gap-3 items-start select-none transition-all ${
                      isCompleted 
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5 text-emerald-400">
                      {isCompleted ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </div>
                    <span>{milestone.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* External resources */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-400" />
              External Resources
            </h3>
            
            <div className="space-y-2.5">
              {rawRoadmap.externalResources.map((res, index) => (
                <a
                  key={index}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer noreferrer"
                  className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700/80 p-3 rounded-lg flex items-center justify-between text-xs font-medium text-slate-300 hover:text-emerald-400 transition-all cursor-pointer"
                >
                  <span>{res.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
            
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              *KRÜSt evaluated study pathways recommend vetted free platforms. We do not host learning content.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
