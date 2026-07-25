import { useState, useEffect } from 'react';
import { Skill, Question, Attempt, QuestionAnswerDetail, Difficulty, UserSkillState, Career } from '../types';
import { QUESTIONS_BANK } from '../data/questions';
import { HelpCircle, ChevronRight, CheckCircle2, XCircle, AlertCircle, Award, BookOpen, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CodingTestAssessment from './CodingTestAssessment';

interface AssessmentProps {
  skill: Skill;
  skillState: UserSkillState;
  onComplete: (attempt: Attempt) => void;
  onCancel: () => void;
  customQuestions?: Question[];
  career?: Career | null;
}

export default function Assessment({ 
  skill, 
  skillState, 
  onComplete, 
  onCancel,
  customQuestions = [],
  career = null
}: AssessmentProps) {
  if (skill.id === 'coding_test') {
    return (
      <CodingTestAssessment
        skill={skill}
        skillState={skillState}
        onComplete={onComplete}
        onCancel={onCancel}
        career={career}
      />
    );
  }
  const fullQuestionsBank = [...QUESTIONS_BANK, ...customQuestions];
  const skillTotalQuestions = fullQuestionsBank.filter(q => q.skillId === skill.id).length;
  const totalQuestionsToAsk = Math.min(10, skillTotalQuestions);

  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [questionsAnswered, setQuestionsAnswered] = useState<QuestionAnswerDetail[]>([]);
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [recentQuestionIds, setRecentQuestionIds] = useState<string[]>([]);
  
  // Track current session's asked question IDs to prevent repeats
  const [sessionQuestionIds, setSessionQuestionIds] = useState<string[]>([]);

  // 1. Core Selection Logic for Adaptive Question
  const selectAdaptiveQuestion = (
    currentDifficulty: Difficulty,
    lastCorrect: boolean | null,
    sessionAskedIds: string[],
    historyExcludes: string[]
  ): Question | null => {
    // Determine next target difficulty based on last answer
    let targetDifficulty: Difficulty = 'medium';
    if (lastCorrect !== null) {
      if (lastCorrect) {
        if (currentDifficulty === 'easy') targetDifficulty = 'medium';
        else if (currentDifficulty === 'medium') targetDifficulty = 'hard';
        else targetDifficulty = 'hard';
      } else {
        if (currentDifficulty === 'hard') targetDifficulty = 'medium';
        else if (currentDifficulty === 'medium') targetDifficulty = 'easy';
        else targetDifficulty = 'easy';
      }
    }

    const skillQuestions = fullQuestionsBank.filter(q => q.skillId === skill.id);

    // 1. Strictly exclude current session's questions under all circumstances
    let available = skillQuestions.filter(q => !sessionAskedIds.includes(q.id));
    if (available.length === 0) return null;

    // 2. Try to exclude questions previously answered in prior attempts
    const withoutHistory = available.filter(q => !historyExcludes.includes(q.id));
    if (withoutHistory.length > 0) {
      available = withoutHistory;
    }

    // 3. Filter by target difficulty AND weak concepts if they exist
    const weakConcepts = skillState?.weakConcepts || [];
    let candidates = available.filter(q => q.difficulty === targetDifficulty);
    
    if (weakConcepts.length > 0) {
      const weakMatch = candidates.filter(q => weakConcepts.includes(q.topic) || q.tags.some(t => weakConcepts.includes(t)));
      if (weakMatch.length > 0) {
        candidates = weakMatch;
      }
    }

    // 4. Fallback to adjacent difficulties
    if (candidates.length === 0) {
      const adjacentDifficulties: Difficulty[] = targetDifficulty === 'medium' 
        ? ['hard', 'easy'] 
        : targetDifficulty === 'hard' ? ['medium', 'easy'] : ['medium', 'hard'];
        
      for (const diff of adjacentDifficulties) {
        candidates = available.filter(q => q.difficulty === diff);
        if (weakConcepts.length > 0) {
          const weakMatch = candidates.filter(q => weakConcepts.includes(q.topic) || q.tags.some(t => weakConcepts.includes(t)));
          if (weakMatch.length > 0) {
            candidates = weakMatch;
            break;
          }
        }
        if (candidates.length > 0) break;
      }
    }

    // 5. Hard fallback
    if (candidates.length === 0) {
      candidates = available;
    }

    if (candidates.length === 0) return null;

    // Select a random question from the matching candidates
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  };

  // Get previously answered question IDs from all history to prevent duplicates across attempts
  const getPreviouslyAnsweredIds = (): string[] => {
    if (!skillState || !skillState.history) return [];
    const ids = new Set<string>();
    skillState.history.forEach(attempt => {
      if (attempt.details) {
        attempt.details.forEach(detail => {
          ids.add(detail.questionId);
        });
      }
    });
    return Array.from(ids);
  };

  // Initial Load of Question 1
  useEffect(() => {
    const historyExcludes = getPreviouslyAnsweredIds();
    const firstQ = selectAdaptiveQuestion('medium', null, [], historyExcludes);
    if (firstQ) {
      setCurrentQuestion(firstQ);
      setSessionQuestionIds([firstQ.id]);
    }
  }, [skill.id]);

  const handleSubmitAnswer = () => {
    if (selectedOptionIndex === null || !currentQuestion) return;
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (!currentQuestion || selectedOptionIndex === null) return;

    const isCorrect = selectedOptionIndex === currentQuestion.correctIndex;
    
    // Log details of the answered question
    const detail: QuestionAnswerDetail = {
      questionId: currentQuestion.id,
      topic: currentQuestion.topic,
      selectedIndex: selectedOptionIndex,
      correct: isCorrect,
      difficulty: currentQuestion.difficulty
    };

    const updatedAnswered = [...questionsAnswered, detail];
    setQuestionsAnswered(updatedAnswered);

    if (currentQuestionNumber < totalQuestionsToAsk) {
      // Choose next adaptive question
      const nextQIds = [...sessionQuestionIds, currentQuestion.id];
      const historyExcludes = getPreviouslyAnsweredIds();
      const nextQ = selectAdaptiveQuestion(currentQuestion.difficulty, isCorrect, nextQIds, historyExcludes);
      
      if (nextQ) {
        setCurrentQuestion(nextQ);
        setSessionQuestionIds([...nextQIds, nextQ.id]);
        setSelectedOptionIndex(null);
        setIsAnswerSubmitted(false);
        setCurrentQuestionNumber(currentQuestionNumber + 1);
      } else {
        // No more questions available, force early completion
        completeAssessment(updatedAnswered);
      }
    } else {
      // Assessment finished!
      completeAssessment(updatedAnswered);
    }
  };

  const completeAssessment = (finalAnswered: QuestionAnswerDetail[]) => {
    const correctCount = finalAnswered.filter(q => q.correct).length;
    const totalCount = finalAnswered.length;
    
    // Adaptive weighted score scaling:
    // We award points based on difficulty of questions answered correctly, with weights:
    // Easy: 70 max, Medium: 85 max, Hard: 100 max
    // Let's make the score mathematically sound:
    // score = (correctCount / totalCount) * 100
    // But we can add a slight adaptive bonus or just a clean ratio. Let's stick to percentage correct
    // because it's clear and transparent, but also show difficulty level indicators.
    const score = Math.round((correctCount / totalCount) * 100);

    const attempt: Attempt = {
      id: `attempt_${Date.now()}`,
      timestamp: Date.now(),
      skillId: skill.id,
      score,
      correctCount,
      totalCount,
      details: finalAnswered
    };

    onComplete(attempt);
  };

  if (!currentQuestion) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400 text-sm">No assessment questions available in the bank for {skill.name}.</p>
        <button onClick={onCancel} className="mt-4 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-mono">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const progressPct = (currentQuestionNumber / totalQuestionsToAsk) * 100;

  return (
    <div className="max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Assessment Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block">Active Evaluation</span>
          <h2 className="text-xl font-bold text-white">{skill.name} Assessment</h2>
        </div>
        <button
          id="quit-assessment-btn"
          onClick={() => {
            if (window.confirm("Are you sure you want to quit? Your progress in this assessment will be lost.")) {
              onCancel();
            }
          }}
          className="text-xs text-slate-400 hover:text-red-400 font-mono transition-colors cursor-pointer"
        >
          QUIT TEST ×
        </button>
      </div>

      {/* Progress Bar & Adaptive Difficulty Indicator */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 mb-6 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-slate-400">Question {currentQuestionNumber} of {totalQuestionsToAsk}</span>
          
          <span className="flex items-center gap-1">
            <span className="text-slate-500 font-mono">Difficulty:</span>
            <span className={`font-mono uppercase font-bold text-[10px] px-2 py-0.5 rounded border ${
              currentQuestion.difficulty === 'hard' 
                ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                : currentQuestion.difficulty === 'medium'
                ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            }`}>
              {currentQuestion.difficulty}
            </span>
          </span>
        </div>
        
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
          <motion.div 
            className="bg-emerald-500 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 md:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-emerald-500/2 w-48 h-48 rounded-full blur-3xl"></div>
        
        <div className="space-y-4">
          <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800/60 px-2.5 py-1 rounded">
            Topic: {currentQuestion.topic}
          </span>
          <p className="text-slate-100 text-base md:text-lg font-medium leading-relaxed">
            {currentQuestion.questionText}
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOptionIndex === index;
            const isCorrect = currentQuestion.correctIndex === index;
            
            let btnStyle = 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60';
            
            if (isAnswerSubmitted) {
              if (isCorrect) {
                btnStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
              } else if (isSelected) {
                btnStyle = 'border-red-500/40 bg-red-500/10 text-red-300';
              } else {
                btnStyle = 'border-slate-900 bg-slate-950/20 text-slate-500 pointer-events-none';
              }
            } else if (isSelected) {
              btnStyle = 'border-emerald-500 bg-emerald-500/5 text-emerald-400';
            }

            return (
              <button
                key={index}
                id={`option-${index}`}
                disabled={isAnswerSubmitted}
                onClick={() => setSelectedOptionIndex(index)}
                className={`w-full text-left p-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-between ${btnStyle} ${!isAnswerSubmitted ? 'cursor-pointer' : ''}`}
              >
                <span>{option}</span>
                
                {isAnswerSubmitted ? (
                  isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : isSelected ? (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  ) : null
                ) : (
                  <div className={`w-4 h-4 rounded-full border transition-all ${
                    isSelected ? 'border-emerald-400 bg-emerald-500/20' : 'border-slate-700'
                  }`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Block (Shown after submission) */}
        <AnimatePresence>
          {isAnswerSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-950 border border-slate-800 p-5 rounded-lg space-y-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                EXPLANATION & ANALYSIS
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {currentQuestion.explanation}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentQuestion.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Action */}
        <div className="flex justify-end pt-4 border-t border-slate-800/40">
          {!isAnswerSubmitted ? (
            <button
              id="submit-answer-btn"
              disabled={selectedOptionIndex === null}
              onClick={handleSubmitAnswer}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 text-xs font-bold py-2.5 px-6 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Submit Answer
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="next-question-btn"
              onClick={handleNextQuestion}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2.5 px-6 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {currentQuestionNumber === totalQuestionsToAsk ? 'Finish Evaluation' : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
