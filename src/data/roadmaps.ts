import { RoadmapItem } from '../types';

export const ROADMAPS_POOL: Record<string, Omit<RoadmapItem, 'skillId'>> = {
  sql: {
    priority: 'high',
    topics: [
      'Inner, Left, Right, and Full Joins',
      'Aggregation functions (SUM, AVG, COUNT, HAVING)',
      'Subqueries, CTEs (Common Table Expressions)',
      'Window functions (ROW_NUMBER, RANK, DENSE_RANK)',
      'Index design and query planner analysis'
    ],
    practiceRecommendations: [
      'Solve 15 SQL query challenges on LeetCode/HackerRank.',
      'Construct a localized Postgres schema with tables linked by foreign keys.',
      'Use EXPLAIN ANALYZE on queries to inspect scan costs.'
    ],
    externalResources: [
      { name: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com/' },
      { name: 'LeetCode Database Problems', url: 'https://leetcode.com/problemset/database/' },
      { name: 'SQLBolt (Interactive)', url: 'https://sqlbolt.com/' }
    ],
    milestones: [
      { id: 'sql_m1', text: 'Write a query utilizing multi-table LEFT JOINs with SUM aggregations', completed: false },
      { id: 'sql_m2', text: 'Solve 3 medium-level window function questions', completed: false },
      { id: 'sql_m3', text: 'Write an EXPLAIN command and index columns to optimize scans', completed: false }
    ]
  },
  python: {
    priority: 'high',
    topics: [
      'Data Structures (Lists, Dicts, Sets, Tuples)',
      'List & Dict Comprehensions',
      'File I/O, Error & Exception Handling',
      'Object-Oriented Programming (OOP) Classes',
      'Decorators, Iterators, and Closures'
    ],
    practiceRecommendations: [
      'Write a Python script to parse a custom JSON log file and extract aggregates.',
      'Refactor a script to use object inheritance and class properties.',
      'Create a custom caching decorator that stores arguments and output values.'
    ],
    externalResources: [
      { name: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/' },
      { name: 'Real Python Tutorials', url: 'https://realpython.com/' },
      { name: 'Exercism Python Track', url: 'https://exercism.org/tracks/python' }
    ],
    milestones: [
      { id: 'py_m1', text: 'Create a fully functional class hierarchy utilizing property getters/setters', completed: false },
      { id: 'py_m2', text: 'Implement a decorator that logs function execution latency', completed: false },
      { id: 'py_m3', text: 'Write a script to aggregate data from multiple local files safely', completed: false }
    ]
  },
  statistics: {
    priority: 'medium',
    topics: [
      'Measures of central tendency (Mean, Median, Mode)',
      'Standard deviation, variance, and normal distributions',
      'Hypothesis testing, p-value calculations, alpha limits',
      'Type I and Type II errors, and statistical power',
      'Bayes Theorem and conditional probability'
    ],
    practiceRecommendations: [
      'Write a Python script to compute the p-value of an A/B split-test.',
      'Calculate conditional probabilities using real-world medical test scenarios.',
      'Map standard deviation buckets on a sample dataset in Excel.'
    ],
    externalResources: [
      { name: 'Khan Academy Statistics', url: 'https://www.khanacademy.org/math/statistics-probability' },
      { name: 'StatQuest with Josh Starmer', url: 'https://statquest.org/' },
      { name: 'OpenIntro Statistics', url: 'https://www.openintro.org/book/os/' }
    ],
    milestones: [
      { id: 'stats_m1', text: 'Perform a full T-test hypothesis verification on a sample dataset', completed: false },
      { id: 'stats_m2', text: 'Derive conditional probabilities using Bayes Theorem with proof', completed: false },
      { id: 'stats_m3', text: 'Analyze and define alpha thresholds to limit Type I errors', completed: false }
    ]
  },
  excel: {
    priority: 'medium',
    topics: [
      'Relative & Absolute locks ($A$1)',
      'Data retrieval (INDEX-MATCH, VLOOKUP, XLOOKUP)',
      'Logical nesting (IF, AND, OR, SUMIFS)',
      'Pivot table construction & source grouping',
      'Dynamic array formulas (FILTER, SORT, UNIQUE)'
    ],
    practiceRecommendations: [
      'Create a dashboard from sales records using Pivot tables and custom slicers.',
      'Rebuild a VLOOKUP calculation using modern, safe INDEX-MATCH.',
      'Build an automated monthly expense sheet using nested dynamic SUMIFS.'
    ],
    externalResources: [
      { name: 'ExcelJet Formulas Guide', url: 'https://exceljet.net/' },
      { name: 'Microsoft Excel Support', url: 'https://support.microsoft.com/en-us/excel' },
      { name: 'Chandoo Advanced Excel', url: 'https://chandoo.org/' }
    ],
    milestones: [
      { id: 'excel_m1', text: 'Create a Pivot table that filters customer orders by month', completed: false },
      { id: 'excel_m2', text: 'Implement a non-breaking INDEX-MATCH lookup across multiple tabs', completed: false },
      { id: 'excel_m3', text: 'Structure a sheet utilizing dynamic array SORT(FILTER()) spills', completed: false }
    ]
  },
  html_css: {
    priority: 'high',
    topics: [
      'HTML5 semantic elements (<article>, <section>)',
      'Flexbox alignment and space distributions',
      'CSS Grid responsive minmax and repeat structures',
      'CSS specificity rules and cascading priorities',
      'Media queries and mobile-first responsive boundaries'
    ],
    practiceRecommendations: [
      'Code a fully responsive grid system without using media queries.',
      'Re-create a pricing page template purely in HTML and CSS.',
      'Audit an existing layout to ensure semantic elements are fully compliant.'
    ],
    externalResources: [
      { name: 'MDN Web Docs: CSS', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
      { name: 'CSS-Tricks Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/' },
      { name: 'CSS-Tricks Grid Guide', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/' }
    ],
    milestones: [
      { id: 'htmlcss_m1', text: 'Build a responsive card layout utilizing auto-fit CSS Grid', completed: false },
      { id: 'htmlcss_m2', text: 'Structure an entire site header using flexbox spacing', completed: false },
      { id: 'htmlcss_m3', text: 'Ensure the page is accessible with a perfect semantic layout', completed: false }
    ]
  },
  js_ts: {
    priority: 'high',
    topics: [
      'Asynchronous flow, Promises, and async-await',
      'Closures, lexical scoping, and memory lifecycles',
      'Event loop queues: Microtasks versus Macrotasks',
      'TypeScript Interfaces, Types, and generic restrictions',
      'Module systems and bundling boundaries'
    ],
    practiceRecommendations: [
      'Create a custom promise wrapper around an old callback structure.',
      'Write a generic TypeScript class with structural constraints (extends).',
      'Build a simple fetch proxy that caches requests in a local closure.'
    ],
    externalResources: [
      { name: 'Eloquent JavaScript', url: 'https://eloquentjavascript.net/' },
      { name: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/' },
      { name: 'JavaScript Info', url: 'https://javascript.info/' }
    ],
    milestones: [
      { id: 'jsts_m1', text: 'Implement a custom debounce function using closures', completed: false },
      { id: 'jsts_m2', text: 'Write a TypeScript generic API client with strictly typed return objects', completed: false },
      { id: 'jsts_m3', text: 'Build an asynchronous chain handler utilizing Promise.all()', completed: false }
    ]
  },
  cyber_threat: {
    priority: 'high',
    topics: [
      'OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF)',
      'Symmetric vs Asymmetric encryption principles',
      'JWT structures, signature validation, and cookies',
      'Threat modeling methodologies (STRIDE)',
      'Secure credential handling and API key hashing'
    ],
    practiceRecommendations: [
      'Perform a threat modeling exercise on a simple bank app architecture.',
      'Manually split and verify a JWT header, payload, and signature.',
      'Refactor an input form to use parameterized SQL queries safely.'
    ],
    externalResources: [
      { name: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
      { name: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security' },
      { name: 'Cryptohack (Interactive Cryptography)', url: 'https://cryptohack.org/' }
    ],
    milestones: [
      { id: 'cyber_m1', text: 'Create an architecture threat model diagram using STRIDE limits', completed: false },
      { id: 'cyber_m2', text: 'Audit a backend form to ensure full protection against SQL Injection', completed: false },
      { id: 'cyber_m3', text: 'Implement a secure signature verify algorithm using cryptographic hashes', completed: false }
    ]
  },
  cloud_arch: {
    priority: 'medium',
    topics: [
      'IaaS, PaaS, and SaaS cloud models',
      'Docker container creation and host resource sharing',
      'Multi-region replication: Active-Active versus Active-Passive',
      'VPC networking, subnets, and firewalls',
      'IAM policy structures and the principle of least privilege'
    ],
    practiceRecommendations: [
      'Write a Dockerfile to package a simple node app into a container.',
      'Map out a highly available architecture on AWS or GCP.',
      'Draft a strict IAM policy allowing read-only access to a single file bucket.'
    ],
    externalResources: [
      { name: 'AWS Architecture Center', url: 'https://aws.amazon.com/architecture/' },
      { name: 'GCP Architecture Framework', url: 'https://cloud.google.com/architecture/framework' },
      { name: 'Docker Documentation', url: 'https://docs.docker.com/' }
    ],
    milestones: [
      { id: 'cloud_m1', text: 'Write and build a lightweight multi-stage Docker container', completed: false },
      { id: 'cloud_m2', text: 'Design a high-availability cloud cluster across 3 availability zones', completed: false },
      { id: 'cloud_m3', text: 'Draft a strict IAM policy with zero redundant wildcard rules', completed: false }
    ]
  },
  product_strategy: {
    priority: 'medium',
    topics: [
      'User Personas and research synthesis',
      'Product market fit indicators',
      'MoSCoW and RICE feature prioritization models',
      'Product roadmapping structures and tracking progress',
      'Core SaaS metrics (Churn, LTV, CAC, ARPU)'
    ],
    practiceRecommendations: [
      'Draft a 1-page PRD (Product Requirements Document) for a new tracking tool.',
      'Score 10 feature ideas using a standard RICE prioritization matrix.',
      'Design a comprehensive set of growth personas for a tutoring service.'
    ],
    externalResources: [
      { name: 'Product School Resources', url: 'https://productschool.com/resources' },
      { name: 'Mind the Product Blog', url: 'https://www.mindtheproduct.com/' },
      { name: 'SVPG (Silicon Valley Product Group)', url: 'https://www.svpg.com/' }
    ],
    milestones: [
      { id: 'prod_m1', text: 'Author a complete, high-fidelity Product Requirements Document', completed: false },
      { id: 'prod_m2', text: 'Build a dynamic RICE scoring model to prioritize a product backlog', completed: false },
      { id: 'prod_m3', text: 'Establish and track 5 core KPIs for a SaaS business model', completed: false }
    ]
  }
};
