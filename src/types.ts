export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Question {
  id: string;
  skillId: string;
  topic: string;
  difficulty: Difficulty;
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
  score: number; // 0-100
  correctCount: number;
  totalCount: number;
  details: QuestionAnswerDetail[];
}

export interface UserSkillState {
  skillId: string;
  readinessScore: number | null; // null means not assessed yet
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
