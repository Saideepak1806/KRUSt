import React from 'react';
import { Award, Trophy, Zap, ShieldCheck, Target, Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { UserSkillState, Career } from '../types';

interface BadgesProps {
  skillsState: Record<string, UserSkillState>;
  career: Career;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  glowColor: string;
  isEarned: boolean;
  progressText: string;
}

export default function Badges({ skillsState, career }: BadgesProps) {
  // Extract all attempts across all skills
  const attempts: any[] = [];
  Object.values(skillsState).forEach(sk => {
    if (sk.history) {
      sk.history.forEach(att => {
        attempts.push(att);
      });
    }
  });

  // 1. First Assessment Passed: At least one attempt with score >= 70%
  const hasFirstPassed = attempts.some(att => att.score >= 70);
  const firstPassedProgressText = hasFirstPassed 
    ? 'Earned' 
    : attempts.length > 0 
      ? `Best score: ${Math.max(...attempts.map(a => a.score), 0)}% / 70%`
      : 'No assessments completed yet';

  // 2. Skill Master: At least one skill readiness score >= 90%
  const hasSkillMaster = Object.values(skillsState).some(sk => sk.readinessScore !== null && sk.readinessScore >= 90);
  const bestReadinessScore = Object.values(skillsState).length > 0
    ? Math.max(...Object.values(skillsState).map(sk => sk.readinessScore || 0))
    : 0;
  const skillMasterProgressText = hasSkillMaster 
    ? 'Earned' 
    : bestReadinessScore > 0 
      ? `Best score: ${bestReadinessScore}% / 90%`
      : 'No assessed skills yet';

  // 3. Career Consistent: Complete 3 or more assessments
  const totalAssessments = attempts.length;
  const hasCareerConsistent = totalAssessments >= 3;
  const careerConsistentProgressText = hasCareerConsistent 
    ? 'Earned' 
    : `${totalAssessments} / 3 assessments completed`;

  // 4. Prerequisite Conqueror: All required skills for this career have been assessed at least once
  const requiredSkillIds = career.skillIds;
  const assessedRequiredSkillsCount = requiredSkillIds.filter(sid => {
    const state = skillsState[sid];
    return state && state.readinessScore !== null;
  }).length;
  const hasPrerequisiteConqueror = requiredSkillIds.length > 0 && assessedRequiredSkillsCount === requiredSkillIds.length;
  const prerequisiteConquerorProgressText = hasPrerequisiteConqueror 
    ? 'Earned' 
    : `${assessedRequiredSkillsCount} / ${requiredSkillIds.length} required skills assessed`;

  // 5. Interview Ready: Overall KRI >= 80%
  let weightedSum = 0;
  let totalWeight = 0;
  requiredSkillIds.forEach(sid => {
    const weight = career.weights[sid] || 0;
    const score = skillsState[sid]?.readinessScore || 0;
    weightedSum += score * weight;
    totalWeight += weight;
  });
  const currentKri = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const hasInterviewReady = currentKri >= 80;
  const interviewReadyProgressText = hasInterviewReady 
    ? 'Earned' 
    : `${currentKri}% / 80% KRI achieved`;

  // List of all badges
  const badges: BadgeDefinition[] = [
    {
      id: 'first_passed',
      name: 'First Assessment Passed',
      description: 'Completed your first competency assessment with a passing score of 70% or higher.',
      icon: Award,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      glowColor: 'shadow-amber-500/10',
      isEarned: hasFirstPassed,
      progressText: firstPassedProgressText,
    },
    {
      id: 'skill_master',
      name: 'Skill Master',
      description: 'Reached an elite score of 90% or above in any core capability.',
      icon: Trophy,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      glowColor: 'shadow-emerald-500/10',
      isEarned: hasSkillMaster,
      progressText: skillMasterProgressText,
    },
    {
      id: 'career_consistent',
      name: 'Career Consistent',
      description: 'Maintained a strong evaluation cadence by logging 3 or more assessments.',
      icon: Zap,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      glowColor: 'shadow-indigo-500/10',
      isEarned: hasCareerConsistent,
      progressText: careerConsistentProgressText,
    },
    {
      id: 'prereq_conqueror',
      name: 'Prerequisite Conqueror',
      description: 'Established a comprehensive competency baseline across all required career skills.',
      icon: Target,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      glowColor: 'shadow-cyan-500/10',
      isEarned: hasPrerequisiteConqueror,
      progressText: prerequisiteConquerorProgressText,
    },
    {
      id: 'interview_ready',
      name: 'Interview Ready',
      description: 'Achieved an overall KRÜSt Readiness Index of 80% or greater, qualifying for industry roles.',
      icon: ShieldCheck,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      glowColor: 'shadow-rose-500/10',
      isEarned: hasInterviewReady,
      progressText: interviewReadyProgressText,
    }
  ];

  const earnedCount = badges.filter(b => b.isEarned).length;

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-4">
        <div>
          <span className="text-[9px] font-mono text-emerald-400 tracking-wider uppercase block">
            ACHIEVEMENTS & MILESTONES
          </span>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
            <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
            Milestone Badges Tracker
          </h2>
          <p className="text-xs text-slate-400">
            Gain career confidence by proving your expertise and unlocking critical milestones.
          </p>
        </div>

        {/* Counter of earned badges */}
        <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-3">
          <div className="flex -space-x-1">
            {badges.map(b => {
              const Icon = b.icon;
              return (
                <div 
                  key={b.id} 
                  className={`w-6 h-6 rounded-full border border-slate-900 flex items-center justify-center text-[10px] ${
                    b.isEarned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/50 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              );
            })}
          </div>
          <div className="font-mono text-xs text-right">
            <span className="text-slate-500">Unlocked: </span>
            <span className="text-emerald-400 font-bold">{earnedCount}</span>
            <span className="text-slate-600">/{badges.length}</span>
          </div>
        </div>
      </div>

      {/* Badges list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {badges.map(b => {
          const Icon = b.icon;
          return (
            <div
              key={b.id}
              className={`p-4 rounded-xl border flex flex-col items-center text-center justify-between transition-all relative overflow-hidden group ${
                b.isEarned 
                  ? `${b.color} shadow-lg ${b.glowColor}` 
                  : 'bg-slate-950/20 border-slate-900/80 text-slate-500 opacity-60'
              }`}
            >
              {/* Glow effect on hover if earned */}
              {b.isEarned && (
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              )}

              <div className="space-y-3 flex flex-col items-center">
                {/* Badge Icon circle */}
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-transform ${
                  b.isEarned 
                    ? 'bg-slate-950 border-current group-hover:scale-110 duration-300 shadow-md' 
                    : 'bg-slate-900 border-slate-800'
                }`}>
                  {b.isEarned ? (
                    <Icon className="w-6 h-6 animate-pulse" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-700" />
                  )}
                </div>

                {/* Badge details */}
                <div className="space-y-1">
                  <h4 className={`text-xs font-bold leading-snug ${b.isEarned ? 'text-white' : 'text-slate-400'}`}>
                    {b.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-[150px]">
                    {b.description}
                  </p>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="w-full mt-4 pt-3 border-t border-slate-800/40 flex flex-col items-center">
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  b.isEarned 
                    ? 'text-emerald-400 bg-emerald-500/5' 
                    : 'text-slate-500 bg-slate-900/50'
                }`}>
                  {b.progressText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
