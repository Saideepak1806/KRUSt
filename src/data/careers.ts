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
  }
];

export const CAREERS_PRESETS: Career[] = [
  {
    id: 'software_engineer',
    name: 'Software Engineer',
    description: 'Builds responsive web applications, secure backends, and modular server systems.',
    skillIds: ['js_ts', 'python', 'sql', 'html_css', 'coding_test'],
    weights: {
      'js_ts': 0.30,
      'python': 0.30,
      'sql': 0.15,
      'html_css': 0.10,
      'coding_test': 0.15
    },
    domainIcon: 'Code',
    roleType: 'job'
  },
  {
    id: 'software_engineer_intern',
    name: 'Software Engineering Intern',
    description: 'Targeted early-career & university co-op path focused on foundational algorithms, clean code, and Git collaboration.',
    skillIds: ['js_ts', 'python', 'coding_test', 'html_css'],
    weights: {
      'js_ts': 0.35,
      'python': 0.35,
      'coding_test': 0.15,
      'html_css': 0.15
    },
    domainIcon: 'GraduationCap',
    roleType: 'internship'
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    description: 'Translates numbers into business insights through querying, modeling, and dashboard reports.',
    skillIds: ['sql', 'excel', 'statistics', 'python', 'coding_test'],
    weights: {
      'sql': 0.30,
      'excel': 0.20,
      'statistics': 0.20,
      'python': 0.15,
      'coding_test': 0.15
    },
    domainIcon: 'Database',
    roleType: 'job'
  },
  {
    id: 'data_analyst_intern',
    name: 'Data & Analytics Intern',
    description: 'University & early-career track mastering SQL queries, Excel transformations, and baseline metrics reporting.',
    skillIds: ['sql', 'excel', 'statistics'],
    weights: {
      'sql': 0.45,
      'excel': 0.35,
      'statistics': 0.20
    },
    domainIcon: 'GraduationCap',
    roleType: 'internship'
  },
  {
    id: 'data_scientist',
    name: 'Data Scientist',
    description: 'Leverages advanced algorithms, statistical models, and programming to predict and analyze complex data.',
    skillIds: ['python', 'statistics', 'sql', 'excel', 'coding_test'],
    weights: {
      'python': 0.30,
      'statistics': 0.30,
      'sql': 0.15,
      'excel': 0.10,
      'coding_test': 0.15
    },
    domainIcon: 'Database',
    roleType: 'job'
  },
  {
    id: 'ui_ux_designer',
    name: 'UI/UX Designer & Developer',
    description: 'Blends gorgeous designs, intuitive user paths, and frontend layout implementations.',
    skillIds: ['html_css', 'js_ts', 'product_strategy', 'coding_test'],
    weights: {
      'html_css': 0.40,
      'js_ts': 0.25,
      'product_strategy': 0.20,
      'coding_test': 0.15
    },
    domainIcon: 'Palette',
    roleType: 'job'
  },
  {
    id: 'cybersecurity_analyst',
    name: 'Cybersecurity Analyst',
    description: 'Secures networks, identifies security threats, designs risk mitigation strategies, and monitors infrastructure.',
    skillIds: ['cyber_threat', 'cloud_arch', 'sql'],
    weights: {
      'cyber_threat': 0.50,
      'cloud_arch': 0.30,
      'sql': 0.20
    },
    domainIcon: 'Shield',
    roleType: 'job'
  },
  {
    id: 'product_manager',
    name: 'Product Manager',
    description: 'Defines product direction, aligns engineering schedules, tracks milestones, and prioritizes user features.',
    skillIds: ['product_strategy', 'pm_agile', 'excel'],
    weights: {
      'product_strategy': 0.40,
      'pm_agile': 0.40,
      'excel': 0.20
    },
    domainIcon: 'Briefcase',
    roleType: 'job'
  },
  {
    id: 'product_management_intern',
    name: 'Product & Strategy Intern',
    description: 'Early-career pathway learning agile sprints, user story drafting, feature prioritization, and market research.',
    skillIds: ['product_strategy', 'pm_agile'],
    weights: {
      'product_strategy': 0.50,
      'pm_agile': 0.50
    },
    domainIcon: 'GraduationCap',
    roleType: 'internship'
  },
  {
    id: 'cloud_engineer',
    name: 'Cloud Infrastructure Engineer',
    description: 'Architects scalable cloud architectures, manages CI/CD systems, and hardens virtual server infrastructure.',
    skillIds: ['cloud_arch', 'cyber_threat', 'js_ts', 'coding_test'],
    weights: {
      'cloud_arch': 0.40,
      'cyber_threat': 0.25,
      'js_ts': 0.20,
      'coding_test': 0.15
    },
    domainIcon: 'Server',
    roleType: 'job'
  },
  {
    id: 'finance',
    name: 'Financial Analyst',
    description: 'Performs quantitative analysis, structures financial models, and guides corporate investment decisions.',
    skillIds: ['finance_modeling', 'excel'],
    weights: {
      'finance_modeling': 0.60,
      'excel': 0.40
    },
    domainIcon: 'LineChart',
    roleType: 'job'
  },
  {
    id: 'marketing',
    name: 'Growth Marketer',
    description: 'Launches targeted SEO campaigns, analyzes site conversions, and manages customer acquisition channels.',
    skillIds: ['seo_marketing', 'excel'],
    weights: {
      'seo_marketing': 0.60,
      'excel': 0.40
    },
    domainIcon: 'LineChart',
    roleType: 'job'
  }
];
