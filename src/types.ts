export type Difficulty = 'easy' | 'medium' | 'hard';

export type AptitudeCategory = 'QUANTITATIVE' | 'LOGICAL' | 'VERBAL' | 'DATA_INTERPRETATION' | 'SYSTEM_ABSTRACT';

export interface AptitudeQuestion extends Question {
  aptitudeCategory: AptitudeCategory;
  dataSnippet?: {
    type: 'table' | 'chart' | 'pseudocode' | 'passage';
    title?: string;
    content: string; // JSON table string, markdown, or code
  };
}

export interface AptitudeAttemptDetail extends QuestionAnswerDetail {
  category: AptitudeCategory;
  timeSpentSeconds?: number;
}

export interface AptitudeAttempt {
  id: string;
  timestamp: number;
  careerId: string | null;
  level: number;
  overallScore: number;
  categoryScores: Record<AptitudeCategory, number>;
  correctCount: number;
  totalCount: number;
  totalTimeSeconds: number;
  details: AptitudeAttemptDetail[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  score?: number;
}

export interface Question {
  id: string;
  skillId: string;
  topic: string;
  difficulty: Difficulty;
  questionType?: 'THEORY' | 'CONCEPTUAL' | 'SCENARIO' | 'DEBUGGING' | 'PROBLEM_SOLVING' | 'DECISION_MAKING' | 'OUTPUT_ANALYSIS' | 'PRACTICAL' | string;
  interviewCategory?: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tags: string[];
}

export interface Career {
  id: string;
  name: string;
  description: string;
  skillIds: string[];
  weights: Record<string, number>; // weights for KRI calculation, e.g. { "sql": 0.4, "python": 0.4, "excel": 0.2 }
  domainIcon?: string;
  roleType?: 'job' | 'internship';
}

export interface JobOpening {
  id: string;
  company: string;
  title: string;
  location: string;
  salaryOrStipend: string;
  type: 'internship' | 'job';
  postedDate: string;
  applyUrl: string;
  source: string;
  tags: string[];
  region?: 'india' | 'global';
}

export interface QuestionAnswerDetail {
  questionId: string;
  topic: string;
  selectedIndex: number;
  correct: boolean;
  difficulty: Difficulty;
}

export interface Attempt {
  id: string;
  timestamp: number;
  skillId: string;
  score: number; // 0-100 overall average
  correctCount: number;
  totalCount: number;
  details: QuestionAnswerDetail[];
  levelScores?: Record<number, number>; // level 1, 2, 3 scores
}

export interface UserSkillState {
  skillId: string;
  readinessScore: number | null; // null means not assessed yet (average of level scores)
  levelScores?: Record<number, number>; // { 1: score1, 2: score2, 3: score3 }
  weakConcepts: string[];
  strongConcepts: string[];
  history: Attempt[];
}

export interface RoadmapItem {
  skillId: string;
  priority: 'high' | 'medium' | 'low';
  topics: string[];
  practiceRecommendations: string[];
  externalResources: { name: string; url: string }[];
  milestones: { id: string; text: string; completed: boolean }[];
}

export interface UserState {
  selectedCareerId: string | null;
  skills: Record<string, UserSkillState>; // skillId -> state
  customCareers: Career[];
  completedMilestones: string[]; // list of completed milestone IDs
  customSkills?: Skill[];
  customQuestions?: Question[];
  customRoadmaps?: RoadmapItem[];
}

export interface ExtractedJDInfo {
  jobRole: string;
  seniority?: 'Internship' | 'Entry Level' | 'Mid Level' | 'Senior' | 'Lead' | 'Unknown';
  requiredSkills: string[];
  preferredSkills: string[];
  tools: string[];
  technologies: string[];
  frameworks?: string[];
  experienceExpectations: string;
  responsibilities: string[];
  qualifications: string[];
  domainKnowledge: string[];
  softSkills?: string[];
  technicalSkills?: string[];
  importantKeywords: string[];
  expectedResponsibilities?: string[];
  requiredCompetencies?: string[];
}

export interface JobMatchBreakdown {
  technicalSkillsMatch: number;
  experienceAlignment: number;
  toolMatch: number;
  qualificationAlignment: number;
  roleCompetencyMatch: number;
  krustVerifiedReadiness: number;
}

export interface EvidenceItem {
  skillName: string;
  score: string | number;
  source: string;
}

export interface ThreeMetrics {
  careerReadinessKRI: number;
  jobMatchScore: number;
  jdAssessmentReadiness: number | null;
}

export interface SkillMatchComparison {
  requirement: string;
  category: 'Required Skill' | 'Preferred Skill' | 'Tool/Tech' | 'Domain';
  resumeClaim: string;
  krustReadinessScore: number | null;
  status: 'strong_match' | 'partial_match' | 'missing';
  notes: string;
}

export interface ProfileAnalysisDetails {
  skillsEvidence: string[];
  projectsEvaluation: string;
  experienceReview: string;
  educationCertifications: string;
  technicalExposure: string;
  careerAlignmentNotes: string;
  missingInformation: string[];
  resumeStructureRating: string;
  strengths: string[];
  weaknesses: string[];
}

export interface JDAnalysisResult {
  id: string;
  timestamp: number;
  analysisMode: 'mode1_profile_only' | 'mode2_jd_match';
  careerId?: string;
  rawJobDescription: string;
  extractedInfo: ExtractedJDInfo;
  jobMatchScore: number;
  matchBreakdown: JobMatchBreakdown;
  matchedRequirements: string[];
  partialMatches: string[];
  missingRequirements: string[];
  strongEvidence: EvidenceItem[];
  weakEvidence: EvidenceItem[];
  matchedSkills: string[];
  missingSkills: string[];
  missingKeywords: string[];
  strongMatches: string[];
  weakMatches: string[];
  experienceGaps: string[];
  resumeAlignment: string;
  suggestedImprovements: string[];
  comparisonTable: SkillMatchComparison[];
  atsDecision?: 'SELECTED' | 'BORDERLINE' | 'REJECTED';
  atsStatus?: string;
  atsRejectionReason?: string;
  grammarAndFormattingIssues?: string[];
  threeMetrics: ThreeMetrics;
  profileAnalysis?: ProfileAnalysisDetails;
  debugTrace?: any;
}

export interface GapBridgingModule {
  skillName: string;
  priority: 'high' | 'medium' | 'low';
  keyConcepts: string[];
  portfolioProjectIdea: {
    title: string;
    description: string;
    expectedDeliverable: string;
  };
  practiceChallenge: {
    title: string;
    problemStatement: string;
    hint: string;
  };
  recommendedResumeBullet: string;
}

export interface GapBridgingPlan {
  id: string;
  timestamp: number;
  jobRole: string;
  sprintDuration: string;
  summary: string;
  modules: GapBridgingModule[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

export interface JDAssessmentQuestion {
  id: string;
  type: 'scenario_mcq' | 'case_study' | 'coding_runner';
  title: string;
  category: string;
  questionText: string;
  contextSnippet?: {
    type: 'table' | 'code' | 'passage';
    title?: string;
    content: string;
  };
  options?: string[];
  correctIndex?: number;
  problemStatement?: string;
  starterCode?: string;
  language?: string;
  testCases?: TestCase[];
  rubric?: string[];
  explanation?: string;
}

export interface JDAssessmentBlueprint {
  blueprintId: string;
  timestamp: number;
  jobRole: string;
  title: string;
  description: string;
  totalQuestions: number;
  estimatedMinutes: number;
  targetCompetencies: string[];
  questions: JDAssessmentQuestion[];
}

export type UserRole = 'candidate' | 'interviewer' | 'recruiter' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  role: UserRole;
  department?: string;
  permissions: {
    canEditWeightings: boolean;
    canViewAllCandidates: boolean;
    canTriggerQuestionGen: boolean;
    canAccessTestMode: boolean;
  };
}

export interface CandidateRosterRecord {
  id: string;
  username: string;
  targetCareer: string;
  readinessScore: number;
  atsScore: number;
  aptitudeScore: number;
  lastActive: string;
  status: 'Qualified' | 'In Assessment' | 'Needs Upskilling' | 'Not Started';
}

export type FeedbackEmojiRating = 'VERY_BAD' | 'BAD' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT';

export interface UserLevelFeedback {
  id: string;
  username: string;
  skillId: string;
  skillName: string;
  level: number;
  score: number;
  ratingEmoji: string; // '😡' | '🙁' | '😐' | '😊' | '🤩'
  ratingLabel: string; // 'Very Bad' | 'Bad' | 'Good' | 'Very Good' | 'Excellent'
  feedbackText: string;
  timestamp: number;
}


