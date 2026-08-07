import { Career, Skill } from '../types';

export const SKILLS_POOL: Skill[] = [
  {
    id: 'sql',
    name: 'SQL Databases',
    description: 'Relational database querying, optimization, schema design, and table joins.',
    category: 'Data & Database'
  },
  {
    id: 'python',
    name: 'Python Programming',
    description: 'Syntax, data structures, algorithms, object-oriented concepts, and core libraries.',
    category: 'Software Engineering'
  },
  {
    id: 'statistics',
    name: 'Statistics & Probability',
    description: 'Hypothesis testing, distributions, regression models, and statistical analysis.',
    category: 'Data & Analytics'
  },
  {
    id: 'excel',
    name: 'Excel & Spreadsheets',
    description: 'Advanced lookup formulas, pivot tables, data cleaning, and spreadsheet analysis.',
    category: 'Business & Tools'
  },
  {
    id: 'html_css',
    name: 'HTML & CSS Layouts',
    description: 'Semantic markup, flexbox, grid, responsive design, and CSS variables.',
    category: 'Frontend & UI/UX'
  },
  {
    id: 'js_ts',
    name: 'JavaScript & TypeScript',
    description: 'Asynchronous actions, closures, DOM manipulation, type-safety, and interfaces.',
    category: 'Frontend & UI/UX'
  },
  {
    id: 'cyber_threat',
    name: 'Threat Modeling & Security',
    description: 'Identifying security threats, encryption principles, OWASP Top 10, and vulnerability mitigation.',
    category: 'Cybersecurity'
  },
  {
    id: 'cloud_arch',
    name: 'Cloud Architecture & Infrastructure',
    description: 'Cloud services (compute, storage, IAM), docker containers, networking, and CI/CD basics.',
    category: 'DevOps & Systems'
  },
  {
    id: 'product_strategy',
    name: 'Product Vision & Strategy',
    description: 'User personas, market research, feature prioritization, roadmapping, and key metrics.',
    category: 'Product Management'
  },
  {
    id: 'pm_agile',
    name: 'Agile & Project Management',
    description: 'Scrum, Kanban, sprint planning, tracking velocity, and team collaboration frameworks.',
    category: 'Product Management'
  },
  {
    id: 'seo_marketing',
    name: 'SEO & Growth Marketing',
    description: 'Search engine optimization, content strategy, keyword research, and conversion tracking.',
    category: 'Marketing'
  },
  {
    id: 'finance_modeling',
    name: 'Financial Modeling',
    description: 'Discounted cash flow (DCF), financial statements, valuation metrics, and scenario analysis.',
    category: 'Finance'
  },
  {
    id: 'coding_test',
    name: 'Coding Test',
    description: 'Practical programming logic, code tracing, time complexity analysis, recursion, and debugging patterns.',
    category: 'Software Engineering'
  },
  {
    id: 'aptitude_general',
    name: 'General & Analytical Aptitude',
    description: 'Quantitative ability, logical reasoning, verbal comprehension, data interpretation, and system abstract logic.',
    category: 'Aptitude & Problem Solving'
  }
];

export const CAREERS_PRESETS: Career[] = [
  {
    id: 'software_engineer',
    name: 'Software Engineer',
    description: 'Builds responsive web applications, secure backends, and modular server systems.',
    skillIds: ['js_ts', 'python', 'sql', 'html_css', 'coding_test', 'aptitude_general'],
    weights: {
      'js_ts': 0.25,
      'python': 0.25,
      'sql': 0.15,
      'html_css': 0.10,
      'coding_test': 0.15,
      'aptitude_general': 0.10
    },
    domainIcon: 'Code',
    roleType: 'job'
  },
  {
    id: 'software_engineer_intern',
    name: 'Software Engineering Intern',
    description: 'Targeted early-career & university co-op path focused on foundational algorithms, clean code, and Git collaboration.',
    skillIds: ['js_ts', 'python', 'coding_test', 'html_css', 'aptitude_general'],
    weights: {
      'js_ts': 0.30,
      'python': 0.30,
      'coding_test': 0.15,
      'html_css': 0.10,
      'aptitude_general': 0.15
    },
    domainIcon: 'GraduationCap',
    roleType: 'internship'
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    description: 'Translates numbers into business insights through querying, modeling, and dashboard reports.',
    skillIds: ['sql', 'excel', 'statistics', 'python', 'coding_test', 'aptitude_general'],
    weights: {
      'sql': 0.25,
      'excel': 0.20,
      'statistics': 0.20,
      'python': 0.10,
      'coding_test': 0.10,
      'aptitude_general': 0.15
    },
    domainIcon: 'Database',
    roleType: 'job'
  },
  {
    id: 'data_analyst_intern',
    name: 'Data & Analytics Intern',
    description: 'University & early-career track mastering SQL queries, Excel transformations, and baseline metrics reporting.',
    skillIds: ['sql', 'excel', 'statistics', 'aptitude_general'],
    weights: {
      'sql': 0.40,
      'excel': 0.25,
      'statistics': 0.20,
      'aptitude_general': 0.15
    },
    domainIcon: 'GraduationCap',
    roleType: 'internship'
  },
  {
    id: 'data_scientist',
    name: 'Data Scientist',
    description: 'Leverages advanced algorithms, statistical models, and programming to predict and analyze complex data.',
    skillIds: ['python', 'statistics', 'sql', 'excel', 'coding_test', 'aptitude_general'],
    weights: {
      'python': 0.25,
      'statistics': 0.25,
      'sql': 0.15,
      'excel': 0.10,
      'coding_test': 0.10,
      'aptitude_general': 0.15
    },
    domainIcon: 'Database',
    roleType: 'job'
  },
  {
    id: 'ui_ux_designer',
    name: 'UI/UX Designer & Developer',
    description: 'Blends gorgeous designs, intuitive user paths, and frontend layout implementations.',
    skillIds: ['html_css', 'js_ts', 'product_strategy', 'coding_test', 'aptitude_general'],
    weights: {
      'html_css': 0.35,
      'js_ts': 0.20,
      'product_strategy': 0.20,
      'coding_test': 0.15,
      'aptitude_general': 0.10
    },
    domainIcon: 'Palette',
    roleType: 'job'
  },
  {
    id: 'cybersecurity_analyst',
    name: 'Cybersecurity Analyst',
    description: 'Secures networks, identifies security threats, designs risk mitigation strategies, and monitors infrastructure.',
    skillIds: ['cyber_threat', 'cloud_arch', 'sql', 'aptitude_general'],
    weights: {
      'cyber_threat': 0.45,
      'cloud_arch': 0.25,
      'sql': 0.15,
      'aptitude_general': 0.15
    },
    domainIcon: 'Shield',
    roleType: 'job'
  },
  {
    id: 'product_manager',
    name: 'Product Manager',
    description: 'Defines product direction, aligns engineering schedules, tracks milestones, and prioritizes user features.',
    skillIds: ['product_strategy', 'pm_agile', 'excel', 'aptitude_general'],
    weights: {
      'product_strategy': 0.35,
      'pm_agile': 0.35,
      'excel': 0.15,
      'aptitude_general': 0.15
    },
    domainIcon: 'Briefcase',
    roleType: 'job'
  },
  {
    id: 'product_management_intern',
    name: 'Product & Strategy Intern',
    description: 'Early-career pathway learning agile sprints, user story drafting, feature prioritization, and market research.',
    skillIds: ['product_strategy', 'pm_agile', 'aptitude_general'],
    weights: {
      'product_strategy': 0.45,
      'pm_agile': 0.40,
      'aptitude_general': 0.15
    },
    domainIcon: 'GraduationCap',
    roleType: 'internship'
  },
  {
    id: 'cloud_engineer',
    name: 'Cloud Infrastructure Engineer',
    description: 'Architects scalable cloud architectures, manages CI/CD systems, and hardens virtual server infrastructure.',
    skillIds: ['cloud_arch', 'cyber_threat', 'js_ts', 'coding_test', 'aptitude_general'],
    weights: {
      'cloud_arch': 0.35,
      'cyber_threat': 0.25,
      'js_ts': 0.15,
      'coding_test': 0.15,
      'aptitude_general': 0.10
    },
    domainIcon: 'Server',
    roleType: 'job'
  },
  {
    id: 'finance',
    name: 'Financial Analyst',
    description: 'Performs quantitative analysis, structures financial models, and guides corporate investment decisions.',
    skillIds: ['finance_modeling', 'excel', 'aptitude_general'],
    weights: {
      'finance_modeling': 0.50,
      'excel': 0.35,
      'aptitude_general': 0.15
    },
    domainIcon: 'LineChart',
    roleType: 'job'
  },
  {
    id: 'marketing',
    name: 'Growth Marketer',
    description: 'Launches targeted SEO campaigns, analyzes site conversions, and manages customer acquisition channels.',
    skillIds: ['seo_marketing', 'excel', 'aptitude_general'],
    weights: {
      'seo_marketing': 0.50,
      'excel': 0.35,
      'aptitude_general': 0.15
    },
    domainIcon: 'LineChart',
    roleType: 'job'
  }
];
