import { AptitudeCategory } from '../types';

export interface AptitudeCategoryMeta {
  id: AptitudeCategory;
  name: string;
  shortLabel: string;
  description: string;
  iconName: string;
}

export const APTITUDE_TAXONOMY: Record<AptitudeCategory, AptitudeCategoryMeta> = {
  QUANTITATIVE: {
    id: 'QUANTITATIVE',
    name: 'Quantitative Ability',
    shortLabel: 'Quant',
    description: 'Percentages, ratios, statistics, algebra, speed & distance, combinatorics, and numeric problem-solving.',
    iconName: 'Calculator'
  },
  LOGICAL: {
    id: 'LOGICAL',
    name: 'Logical Reasoning',
    shortLabel: 'Logical',
    description: 'Deductive puzzles, series completion, syllogisms, condition evaluation, and pattern detection.',
    iconName: 'Puzzle'
  },
  VERBAL: {
    id: 'VERBAL',
    name: 'Verbal Comprehension',
    shortLabel: 'Verbal',
    description: 'Critical reading, passage interpretation, error analysis, and logical inferences from textual specs.',
    iconName: 'MessageSquareText'
  },
  DATA_INTERPRETATION: {
    id: 'DATA_INTERPRETATION',
    name: 'Data Interpretation',
    shortLabel: 'Data & Charts',
    description: 'Extracting key insights, growth trends, and statistical ratios from tabular datasets and graphs.',
    iconName: 'BarChart2'
  },
  SYSTEM_ABSTRACT: {
    id: 'SYSTEM_ABSTRACT',
    name: 'System & Abstract Reasoning',
    shortLabel: 'Algorithmic Flow',
    description: 'Flowchart logic, state transitions, pseudocode tracing, matrix patterns, and algorithmic reasoning.',
    iconName: 'Workflow'
  }
};

// Role-weighted aptitude distribution per career (Must sum to 1.0)
export const CAREER_APTITUDE_WEIGHTS: Record<string, Record<AptitudeCategory, number>> = {
  software_engineer: {
    LOGICAL: 0.35,
    SYSTEM_ABSTRACT: 0.30,
    QUANTITATIVE: 0.20,
    DATA_INTERPRETATION: 0.10,
    VERBAL: 0.05
  },
  software_engineer_intern: {
    LOGICAL: 0.35,
    SYSTEM_ABSTRACT: 0.30,
    QUANTITATIVE: 0.20,
    DATA_INTERPRETATION: 0.10,
    VERBAL: 0.05
  },
  data_analyst: {
    DATA_INTERPRETATION: 0.35,
    QUANTITATIVE: 0.30,
    LOGICAL: 0.20,
    VERBAL: 0.10,
    SYSTEM_ABSTRACT: 0.05
  },
  data_analyst_intern: {
    DATA_INTERPRETATION: 0.35,
    QUANTITATIVE: 0.30,
    LOGICAL: 0.20,
    VERBAL: 0.10,
    SYSTEM_ABSTRACT: 0.05
  },
  data_scientist: {
    QUANTITATIVE: 0.35,
    DATA_INTERPRETATION: 0.30,
    LOGICAL: 0.20,
    SYSTEM_ABSTRACT: 0.10,
    VERBAL: 0.05
  },
  product_manager: {
    VERBAL: 0.30,
    DATA_INTERPRETATION: 0.30,
    LOGICAL: 0.25,
    QUANTITATIVE: 0.10,
    SYSTEM_ABSTRACT: 0.05
  },
  cybersecurity_analyst: {
    SYSTEM_ABSTRACT: 0.35,
    LOGICAL: 0.35,
    QUANTITATIVE: 0.15,
    VERBAL: 0.10,
    DATA_INTERPRETATION: 0.05
  },
  finance: {
    QUANTITATIVE: 0.40,
    DATA_INTERPRETATION: 0.35,
    LOGICAL: 0.15,
    VERBAL: 0.05,
    SYSTEM_ABSTRACT: 0.05
  },
  default: {
    QUANTITATIVE: 0.20,
    LOGICAL: 0.20,
    VERBAL: 0.20,
    DATA_INTERPRETATION: 0.20,
    SYSTEM_ABSTRACT: 0.20
  }
};
