import React from 'react';
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  Briefcase, 
  Trophy, 
  Scroll, 
  Sparkles, 
  FileCheck, 
  Building2,
  Code2,
  Compass
} from 'lucide-react';

export default function GraduateBackgroundPattern() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none aria-hidden" 
      aria-hidden="true"
    >
      {/* Tasteful 40% Background Spread of Compact Graduate & Career Doodles around Outer Margins */}
      
      {/* Top Left Outer Corner */}
      <div className="absolute top-4 left-4 text-emerald-600/12 dark:text-emerald-400/10 transform -rotate-12 transition-all">
        <GraduationCap className="w-16 h-16 sm:w-20 sm:h-20" />
      </div>

      <div className="absolute top-16 left-[18%] text-purple-600/10 dark:text-purple-400/08 transform rotate-12 hidden md:block">
        <Award className="w-14 h-14 sm:w-16 sm:h-16" />
      </div>

      {/* Top Right Outer Corner */}
      <div className="absolute top-4 right-4 text-blue-600/12 dark:text-blue-400/10 transform rotate-12 transition-all">
        <Scroll className="w-16 h-16 sm:w-20 sm:h-20" />
      </div>

      <div className="absolute top-16 right-[18%] text-amber-600/10 dark:text-amber-400/08 transform -rotate-6 hidden lg:block">
        <Trophy className="w-14 h-14 sm:w-16 sm:h-16" />
      </div>

      {/* Mid Left Outer Edge */}
      <div className="absolute top-1/3 left-2 text-teal-600/12 dark:text-teal-400/10 transform -rotate-6 hidden sm:block">
        <BookOpen className="w-16 h-16 sm:w-20 sm:h-20" />
      </div>

      <div className="absolute top-[42%] left-[12%] text-emerald-600/10 dark:text-emerald-400/08 transform rotate-12 hidden xl:block">
        <FileCheck className="w-12 h-12 sm:w-16 sm:h-16" />
      </div>

      {/* Mid Right Outer Edge */}
      <div className="absolute top-1/3 right-2 text-indigo-600/12 dark:text-indigo-400/10 transform rotate-12 hidden sm:block">
        <Briefcase className="w-16 h-16 sm:w-20 sm:h-20" />
      </div>

      <div className="absolute top-[42%] right-[12%] text-cyan-600/10 dark:text-cyan-400/08 transform -rotate-12 hidden xl:block">
        <Building2 className="w-12 h-12 sm:w-16 sm:h-16" />
      </div>

      {/* Lower Mid Outer Left & Right */}
      <div className="absolute bottom-[28%] left-4 text-amber-600/12 dark:text-amber-400/10 transform rotate-12 hidden md:block">
        <Award className="w-14 h-14 sm:w-18 sm:h-18" />
      </div>

      <div className="absolute bottom-[28%] right-4 text-emerald-600/12 dark:text-emerald-400/10 transform -rotate-12 hidden md:block">
        <GraduationCap className="w-14 h-14 sm:w-18 sm:h-18" />
      </div>

      {/* Bottom Left Outer Corner */}
      <div className="absolute bottom-4 left-4 text-blue-600/12 dark:text-blue-400/10 transform rotate-6 transition-all">
        <Building2 className="w-16 h-16 sm:w-20 sm:h-20" />
      </div>

      <div className="absolute bottom-16 left-[20%] text-purple-600/10 dark:text-purple-400/08 transform -rotate-6 hidden lg:block">
        <Sparkles className="w-12 h-12 sm:w-16 sm:h-16" />
      </div>

      {/* Bottom Right Outer Corner */}
      <div className="absolute bottom-4 right-4 text-emerald-600/12 dark:text-emerald-400/10 transform -rotate-12 transition-all">
        <Code2 className="w-16 h-16 sm:w-20 sm:h-20" />
      </div>

      <div className="absolute bottom-16 right-[20%] text-teal-600/10 dark:text-teal-400/08 transform rotate-12 hidden lg:block">
        <Compass className="w-12 h-12 sm:w-16 sm:h-16" />
      </div>
    </div>
  );
}
