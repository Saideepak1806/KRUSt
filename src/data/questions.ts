import { Question } from '../types';

export const QUESTIONS_BANK: Question[] = [
  // ==================== SQL DATABASES ====================
  {
    id: 'sql_e1',
    skillId: 'sql',
    topic: 'Basic Queries',
    difficulty: 'easy',
    questionText: 'Which SQL keyword is used to retrieve unique values from a column?',
    options: ['UNIQUE', 'DISTINCT', 'DIFFERENT', 'GROUP BY'],
    correctIndex: 1,
    explanation: 'The DISTINCT keyword in SQL is used combined with the SELECT statement to eliminate all the duplicate records and fetch only unique records.',
    tags: ['SELECT', 'syntax', 'duplicates']
  },
  {
    id: 'sql_e2',
    skillId: 'sql',
    topic: 'Filtering',
    difficulty: 'easy',
    questionText: 'How do you select all columns from a table named "Customers" where the "City" is "London"?',
    options: [
      'SELECT City="London" FROM Customers;',
      'SELECT * FROM Customers WHERE City IS "London";',
      'SELECT * FROM Customers WHERE City="London";',
      'SELECT ALL FROM Customers WHERE City LIKE "London";'
    ],
    correctIndex: 2,
    explanation: 'The asterisk (*) represents all columns, and the WHERE clause is used to filter records. City="London" is the correct conditional expression.',
    tags: ['filtering', 'WHERE', 'syntax']
  },
  {
    id: 'sql_m1',
    skillId: 'sql',
    topic: 'Joins',
    difficulty: 'medium',
    questionText: 'What is the primary difference between a LEFT JOIN and an INNER JOIN?',
    options: [
      'LEFT JOIN returns only non-matching records, while INNER JOIN returns matching records.',
      'LEFT JOIN returns all records from the left table and matched records from the right table. INNER JOIN returns only matched records from both.',
      'INNER JOIN returns all rows from the left table regardless of matches.',
      'There is no performance difference; they are semantic synonyms.'
    ],
    correctIndex: 1,
    explanation: 'LEFT JOIN fetches all records from the left table and matching rows from the right. If no match, NULL values appear for the right table columns. INNER JOIN returns rows only when there is a match in both tables.',
    tags: ['joins', 'relational-design']
  },
  {
    id: 'sql_m2',
    skillId: 'sql',
    topic: 'Aggregations',
    difficulty: 'medium',
    questionText: 'You want to count the number of orders for each customer. Which aggregate and grouping sequence is correct?',
    options: [
      'SELECT COUNT(OrderID) FROM Orders GROUP BY CustomerID;',
      'SELECT COUNT(OrderID), CustomerID FROM Orders WHERE COUNT(OrderID) > 1;',
      'SELECT CustomerID, COUNT(OrderID) FROM Orders GROUP BY CustomerID;',
      'SELECT CustomerID, COUNT(OrderID) FROM Orders ORDER BY CustomerID;'
    ],
    correctIndex: 2,
    explanation: 'To list CustomerID alongside their order count, select CustomerID, COUNT(OrderID) and group by CustomerID to partition the aggregation.',
    tags: ['aggregation', 'GROUP BY', 'COUNT']
  },
  {
    id: 'sql_h1',
    skillId: 'sql',
    topic: 'Window Functions',
    difficulty: 'hard',
    questionText: 'Which window function should be used to assign a unique sequential integer to rows within a partition, starting at 1, without skipping numbers on duplicate values?',
    options: ['RANK()', 'DENSE_RANK()', 'ROW_NUMBER()', 'LEAD()'],
    correctIndex: 2,
    explanation: 'ROW_NUMBER() assigns a unique, sequential number to each row, starting at 1. RANK() and DENSE_RANK() assign the same rank to identical values, with RANK() leaving gaps.',
    tags: ['window-functions', 'analytics', 'ranking']
  },
  {
    id: 'sql_h2',
    skillId: 'sql',
    topic: 'Query Optimization',
    difficulty: 'hard',
    questionText: 'In a heavily read-optimized database with millions of rows, why might a composite index on (LastName, FirstName) not speed up a query filtering solely on (FirstName)?',
    options: [
      'B-Tree composite indexes can only be read from right to left.',
      'Indexes do not work on string columns (VARCHAR).',
      'The database query planner cannot utilize the index unless the leftmost prefix (LastName) is included in the query filters.',
      'A single index cannot accommodate two separate column structures.'
    ],
    correctIndex: 2,
    explanation: 'A composite index on (A, B) is structured primarily by A first, then B. A query filtering only on B violates the leftmost prefix rule, forcing the database engine to perform a full-table scan instead of a quick index seek.',
    tags: ['indexing', 'optimization', 'query-planner']
  },

  // ==================== PYTHON PROGRAMMING ====================
  {
    id: 'python_e1',
    skillId: 'python',
    topic: 'Data Types',
    difficulty: 'easy',
    questionText: 'Which of the following data structures in Python is mutable and defined using square brackets []?',
    options: ['Tuple', 'Set', 'Dictionary', 'List'],
    correctIndex: 3,
    explanation: 'Lists are mutable, ordered collections of values defined using square brackets []. Tuples are immutable (), sets use {}, and dicts use key-value pairs in {}.',
    tags: ['lists', 'mutability', 'syntax']
  },
  {
    id: 'python_e2',
    skillId: 'python',
    topic: 'Loops',
    difficulty: 'easy',
    questionText: 'What is the output of the following code snippet? \n`for i in range(1, 4): print(i, end="")`',
    options: ['1234', '123', '0123', '234'],
    correctIndex: 1,
    explanation: 'The range(1, 4) function generates integers starting from 1 up to but not including 4, which yields 1, 2, and 3.',
    tags: ['loops', 'range', 'syntax']
  },
  {
    id: 'python_m1',
    skillId: 'python',
    topic: 'List Comprehensions',
    difficulty: 'medium',
    questionText: 'What is the result of this list comprehension? \n`[x**2 for x in range(5) if x % 2 == 0]`',
    options: ['[0, 4, 16]', '[4, 16]', '[1, 9]', '[0, 1, 4, 9, 16]'],
    correctIndex: 0,
    explanation: 'range(5) is [0, 1, 2, 3, 4]. The condition "if x % 2 == 0" filters for even numbers: 0, 2, 4. Their squares (x**2) are 0, 4, 16.',
    tags: ['list-comprehension', 'filtering', 'operators']
  },
  {
    id: 'python_m2',
    skillId: 'python',
    topic: 'Dictionaries',
    difficulty: 'medium',
    questionText: 'What happens when you attempt to retrieve a non-existent key from a Python dict like `my_dict["missing_key"]`?',
    options: [
      'It returns None.',
      'It raises a KeyNotFoundException.',
      'It raises a KeyError.',
      'It automatically initializes the key with an empty string.'
    ],
    correctIndex: 2,
    explanation: 'Accessing a missing key via bracket notation raises a KeyError. To handle missing keys safely, one should use the .get("missing_key", default) method.',
    tags: ['dictionaries', 'exceptions', 'robustness']
  },
  {
    id: 'python_h1',
    skillId: 'python',
    topic: 'Memory Management & Copying',
    difficulty: 'hard',
    questionText: 'What is the primary difference between `copy.copy()` and `copy.deepcopy()` in Python?',
    options: [
      'copy() duplicates variables, deepcopy() compiles them to bytecode.',
      'copy() creates a shallow copy where nested objects are still references to the original. deepcopy() recursively duplicates nested structures, decoupling them completely.',
      'copy() is for lists only, deepcopy() is for dictionaries and classes.',
      'There is no functional difference; deepcopy() is just an alias for legacy backward compatibility.'
    ],
    correctIndex: 1,
    explanation: 'A shallow copy constructs a new compound object but inserts references to the objects found in the original. A deep copy constructs a new compound object and recursively inserts copies of the objects found in the original.',
    tags: ['memory', 'objects', 'copying']
  },
  {
    id: 'python_h2',
    skillId: 'python',
    topic: 'Decorators & Closures',
    difficulty: 'hard',
    questionText: 'In Python, what is a decorator structurally?',
    options: [
      'A design pattern used to format print statements.',
      'A function that takes another function as an argument, extends its behavior without modifying it, and returns a new function.',
      'A metadata attribute written at the top of a file to declare global constants.',
      'A class method used to automatically delete unused variables from local scopes.'
    ],
    correctIndex: 1,
    explanation: 'A decorator is a callable that takes a function as input, defines a nested wrapper function that adds some cross-cutting behavior, and returns this wrapper, utilizing closures.',
    tags: ['decorators', 'functional-programming', 'closures']
  },

  // ==================== STATISTICS & PROBABILITY ====================
  {
    id: 'stats_e1',
    skillId: 'statistics',
    topic: 'Central Tendency',
    difficulty: 'easy',
    questionText: 'Which statistical metric is highly sensitive to extreme outliers in a dataset?',
    options: ['Median', 'Mode', 'Mean', 'Interquartile Range (IQR)'],
    correctIndex: 2,
    explanation: 'The Mean sums all values and divides by count. Thus, a single massive or tiny value (outlier) directly skews the aggregate sum, whereas the Median (middle value) remains stable.',
    tags: ['mean', 'outliers', 'averages']
  },
  {
    id: 'stats_e2',
    skillId: 'statistics',
    topic: 'Probability Basics',
    difficulty: 'easy',
    questionText: 'If you roll a standard fair 6-sided die, what is the probability of rolling an even number?',
    options: ['1/3', '1/2', '2/3', '1/6'],
    correctIndex: 1,
    explanation: 'The even numbers on a 6-sided die are 2, 4, and 6 (3 outcomes). Total possible outcomes = 6. Probability = 3/6 = 1/2.',
    tags: ['probability', 'die', 'basics']
  },
  {
    id: 'stats_m1',
    skillId: 'statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'medium',
    questionText: 'What is the correct interpretation of a p-value of 0.03 in a statistical hypothesis test with a significance level (alpha) of 0.05?',
    options: [
      'There is a 3% chance that the null hypothesis is true.',
      'There is a 97% chance that the alternative hypothesis is true.',
      'The probability of observing the data (or more extreme) under the assumption that the null hypothesis is true is 3%. We reject the null hypothesis.',
      'The test is statistically inconclusive because the p-value is greater than zero.'
    ],
    correctIndex: 2,
    explanation: 'A p-value is the probability of obtaining test results at least as extreme as the observed results, assuming the null hypothesis is correct. Since 0.03 < 0.05, we reject the null hypothesis.',
    tags: ['p-value', 'hypothesis-testing', 'significance']
  },
  {
    id: 'stats_m2',
    skillId: 'statistics',
    topic: 'Distributions',
    difficulty: 'medium',
    questionText: 'In a standard normal distribution, approximately what percentage of data falls within one standard deviation of the mean?',
    options: ['50%', '68%', '95%', '99.7%'],
    correctIndex: 1,
    explanation: 'According to the Empirical Rule (68-95-99.7 rule) for normal distributions, roughly 68% of the data falls within +/- 1 standard deviation of the mean.',
    tags: ['normal-distribution', 'empirical-rule', 'variance']
  },
  {
    id: 'stats_h1',
    skillId: 'statistics',
    topic: 'Bayes Theorem',
    difficulty: 'hard',
    questionText: 'A rare disease affects 1 in 10,000 people. A diagnostic test has a 99% true positive rate (sensitivity) and a 99% true negative rate (specificity). If a random person tests positive, what is the approximate probability they actually have the disease?',
    options: ['99%', '50%', '1%', '10%'],
    correctIndex: 2, // ~0.98%
    explanation: 'Using Bayes Theorem: P(D|+) = [P(+|D)*P(D)] / [P(+|D)*P(D) + P(+|no D)*P(no D)]. P(D) = 0.0001, P(+|D) = 0.99, P(+|no D) = 0.01, P(no D) = 0.9999. P(D|+) = (0.99 * 0.0001) / ((0.99 * 0.0001) + (0.01 * 0.9999)) = 0.000099 / (0.000099 + 0.009999) = 0.000099 / 0.010098 ≈ 0.0098 (approx 1%). This is the base-rate fallacy.',
    tags: ['bayes-theorem', 'conditional-probability', 'inference']
  },
  {
    id: 'stats_h2',
    skillId: 'statistics',
    topic: 'Type I and II Errors',
    difficulty: 'hard',
    questionText: 'In hypothesis testing, if you decrease the significance level (alpha) from 0.05 to 0.01, how does this affect Type I and Type II error rates?',
    options: [
      'Both Type I and Type II error rates will decrease.',
      'Type I error rate decreases, while Type II error rate increases.',
      'Type I error rate increases, while Type II error rate decreases.',
      'It has no effect on Type II error rates, which depend solely on sample size.'
    ],
    correctIndex: 1,
    explanation: 'Decreasing alpha makes it harder to reject the null hypothesis. This reduces the chance of falsely rejecting a true null (Type I error decreases) but increases the chance of failing to reject a false null (Type II error increases, statistical power decreases).',
    tags: ['errors', 'power', 'methodology']
  },

  // ==================== EXCEL & SPREADSHEETS ====================
  {
    id: 'excel_e1',
    skillId: 'excel',
    topic: 'Basic Formulas',
    difficulty: 'easy',
    questionText: 'Which Excel function is used to find the largest value in a range of cells?',
    options: ['LARGE()', 'MAX()', 'HIGH()', 'UPPER()'],
    correctIndex: 1,
    explanation: 'MAX() returns the largest value from a selected numerical array or range.',
    tags: ['formulas', 'basics']
  },
  {
    id: 'excel_e2',
    skillId: 'excel',
    topic: 'Cell Referencing',
    difficulty: 'easy',
    questionText: 'What is the absolute cell reference for cell G5, which prevents row and column changes when copy-pasted?',
    options: ['G5', '$G5', 'G$5', '$G$5'],
    correctIndex: 3,
    explanation: 'A dollar sign ($) before both column and row characters ($G$5) locks the reference, creating an absolute cell reference.',
    tags: ['referencing', 'absolute-locks']
  },
  {
    id: 'excel_m1',
    skillId: 'excel',
    topic: 'Data Retrieval',
    difficulty: 'medium',
    questionText: 'What is a key structural advantage of using INDEX-MATCH over VLOOKUP in Excel?',
    options: [
      'INDEX-MATCH works with text while VLOOKUP only works with numbers.',
      'INDEX-MATCH can perform lookups from right-to-left, whereas VLOOKUP can only search in the leftmost column and look to the right.',
      'VLOOKUP runs significantly faster on small tables of less than 10 rows.',
      'INDEX-MATCH automatically formats cell fonts based on source styles.'
    ],
    correctIndex: 1,
    explanation: 'VLOOKUP is restricted to scanning the first column of the specified range and retrieving columns to the right. INDEX-MATCH decouples the lookup column from the return column, allowing leftward lookups, and does not break when columns are inserted.',
    tags: ['vlookup', 'index-match', 'lookups']
  },
  {
    id: 'excel_m2',
    skillId: 'excel',
    topic: 'Logical Functions',
    difficulty: 'medium',
    questionText: 'To check if cell B2 is greater than 100 AND cell C2 is equal to "Yes", which nested formula structure is correct?',
    options: [
      '=IF(B2>100 AND C2="Yes", "Pass", "Fail")',
      '=AND(IF(B2>100), IF(C2="Yes"))',
      '=IF(AND(B2>100, C2="Yes"), "Pass", "Fail")',
      '=IF(OR(B2>100, C2="Yes"), "Pass", "Fail")'
    ],
    correctIndex: 2,
    explanation: 'The logical AND function in Excel takes multiple conditions as arguments, like AND(cond1, cond2), and returns TRUE only if all are met. Nesting this inside IF handles the logical branch.',
    tags: ['logical', 'AND', 'IF']
  },
  {
    id: 'excel_h1',
    skillId: 'excel',
    topic: 'Array Formulas',
    difficulty: 'hard',
    questionText: 'In Excel 365 or newer, which dynamic array function can be used to filter a dataset based on criteria and sort the results dynamically in a single formula?',
    options: [
      '=VLOOKUP(SORT(FILTER(...)))',
      '=SORT(FILTER(array, include, [if_empty]), [sort_index], [sort_order])',
      '=FILTER(SORT(array, criteria))',
      '=INDEX(MATCH(SORT(array)))'
    ],
    correctIndex: 1,
    explanation: 'Excel 365 introduced dynamic array formulas. Nesting =SORT() outside =FILTER() allows you to filter rows based on condition blocks, and then sort those active spill arrays instantly.',
    tags: ['dynamic-arrays', 'sorting', 'filtering']
  },

  // ==================== HTML & CSS LAYOUTS ====================
  {
    id: 'htmlcss_e1',
    skillId: 'html_css',
    topic: 'Semantic Markup',
    difficulty: 'easy',
    questionText: 'Which HTML5 element represents self-contained, independent content that could be distributed or syndicated?',
    options: ['<section>', '<div>', '<article>', '<aside>'],
    correctIndex: 2,
    explanation: 'An <article> represents a complete, self-contained composition in a document, page, application, or site, which is independently distributable (e.g., blog posts, news stories).',
    tags: ['elements', 'accessibility', 'structure']
  },
  {
    id: 'htmlcss_e2',
    skillId: 'html_css',
    topic: 'CSS Flexbox',
    difficulty: 'easy',
    questionText: 'In Flexbox, which CSS property controls the distribution of extra space along the main axis of a flex container?',
    options: ['align-items', 'justify-content', 'flex-direction', 'gap'],
    correctIndex: 1,
    explanation: 'justify-content distributes space and aligns items along the main axis (typically horizontal, unless flex-direction: column is used).',
    tags: ['flexbox', 'alignment']
  },
  {
    id: 'htmlcss_m1',
    skillId: 'html_css',
    topic: 'CSS Grid',
    difficulty: 'medium',
    questionText: 'What is the effect of setting a grid container property to `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`?',
    options: [
      'It creates a fixed set of columns, each exactly 200px wide.',
      'It creates a responsive grid of columns at least 200px wide. If there is extra space, columns expand equally; if space shrinks, column count decreases dynamically without media queries.',
      'It limits columns to exactly 1fr width and overflows if the screen size is under 200px.',
      'It centers content and wraps items using absolute coordinates.'
    ],
    correctIndex: 1,
    explanation: 'This is the gold standard for responsive grids without media queries. auto-fit creates as many columns of at least 200px as can fit, and expands columns to fill any remaining space via 1fr.',
    tags: ['grid', 'responsive', 'minmax']
  },
  {
    id: 'htmlcss_h1',
    skillId: 'html_css',
    topic: 'CSS Specificity',
    difficulty: 'hard',
    questionText: 'Which CSS selector has the highest specificity weight?',
    options: [
      'div.container ul.list li.item',
      '#main-content p',
      '.header .nav-item:hover',
      'body section main div p'
    ],
    correctIndex: 1,
    explanation: 'Specificity is calculated using a hierarchy: Inline styles (1000) > ID selectors (100) > Class/Attribute/Pseudo-class (10) > Elements (1). Here, "#main-content p" contains an ID (100) and an element (1) = 101, which dwarfs the class and element combinations.',
    tags: ['specificity', 'selectors', 'rules']
  },

  // ==================== JAVASCRIPT & TYPESCRIPT ====================
  {
    id: 'jsts_e1',
    skillId: 'js_ts',
    topic: 'Asynchronous Code',
    difficulty: 'easy',
    questionText: 'Which JavaScript operator/keyword is used to wait for a Promise to resolve inside a function declared with "async"?',
    options: ['wait', 'defer', 'await', 'hold'],
    correctIndex: 2,
    explanation: 'The await keyword is used inside an async function to pause execution until a Promise resolves or rejects.',
    tags: ['promises', 'async-await']
  },
  {
    id: 'jsts_m1',
    skillId: 'js_ts',
    topic: 'Event Loop',
    difficulty: 'medium',
    questionText: 'Given the following code, what is the order of console logs? \n`console.log("A"); setTimeout(() => console.log("B"), 0); Promise.resolve().then(() => console.log("C")); console.log("D");`',
    options: ['A, B, C, D', 'A, D, B, C', 'A, D, C, B', 'A, C, D, B'],
    correctIndex: 2,
    explanation: '"A" and "D" are synchronous and run first. Promises are microtasks and run immediately after the current script executes, before macrotasks like setTimeout. Thus "C" runs next, followed by "B" from the task queue.',
    tags: ['event-loop', 'microtasks', 'concurrency']
  },
  {
    id: 'jsts_h1',
    skillId: 'js_ts',
    topic: 'TypeScript Generics',
    difficulty: 'hard',
    questionText: 'How do you declare a TypeScript generic constraint that ensures a type parameter "T" possesses a property "length" of type number?',
    options: [
      'interface T { length: number; }',
      'function log<T extends { length: number }>(arg: T): T',
      'type Lengthy<T> = T & { length: number }',
      'function log<T>(arg: T: number): T'
    ],
    correctIndex: 1,
    explanation: 'The "extends" keyword in generic type parameter declarations restricts the types that can be passed in. `<T extends { length: number }>` guarantees that whatever type T is bound to, it must have a numerical "length" property.',
    tags: ['typescript', 'generics', 'type-safety']
  },

  // ==================== CYBERSECURITY ====================
  {
    id: 'cyber_e1',
    skillId: 'cyber_threat',
    topic: 'Encryption',
    difficulty: 'easy',
    questionText: 'What is the fundamental difference between symmetric and asymmetric encryption?',
    options: [
      'Symmetric encryption only encrypts text; asymmetric encrypts files.',
      'Symmetric uses the same key for encryption and decryption; asymmetric uses a public/private key pair.',
      'Symmetric is software-based; asymmetric requires dedicated hardware.',
      'Symmetric is deprecated and insecure, while asymmetric is modern.'
    ],
    correctIndex: 1,
    explanation: 'Symmetric cryptography relies on a single shared secret key. Asymmetric (Public Key) cryptography relies on mathematically linked public-private key pairs.',
    tags: ['cryptography', 'security-keys']
  },
  {
    id: 'cyber_m1',
    skillId: 'cyber_threat',
    topic: 'Vulnerabilities',
    difficulty: 'medium',
    questionText: 'Which security vulnerability occurs when an attacker inputs malicious SQL statements into a form, gaining unauthorized database access?',
    options: ['Cross-Site Scripting (XSS)', 'Cross-Site Request Forgery (CSRF)', 'SQL Injection (SQLi)', 'Buffer Overflow'],
    correctIndex: 2,
    explanation: 'SQL Injection (SQLi) happens when untrusted user input is directly concatenated into SQL queries, enabling attackers to manipulate backend query statements.',
    tags: ['SQLi', 'vulnerabilities', 'mitigation']
  },
  {
    id: 'cyber_h1',
    skillId: 'cyber_threat',
    topic: 'Authentication Protocols',
    difficulty: 'hard',
    questionText: 'How does a JSON Web Token (JWT) prevent client-side tampering of its payload data?',
    options: [
      'JWT encrypts the entire payload using AES, rendering it unreadable by clients.',
      'The payload is hashed with a secret or private key, producing a signature appended to the token. If the payload is modified, the signature validation fails.',
      'JWTs are stored strictly on server RAM and only reference keys are sent to clients.',
      'JWT uses browser-level sandboxing that locks the cookie from modification.'
    ],
    correctIndex: 1,
    explanation: 'A JWT contains three parts: Header, Payload, and Signature. The signature is created by hashing the encoded header and payload with a secret server-side key. If a user tampers with the payload, the reconstructed signature will not match.',
    tags: ['JWT', 'tokens', 'tampering']
  },

  // ==================== CLOUD ARCHITECTURE ====================
  {
    id: 'cloud_e1',
    skillId: 'cloud_arch',
    topic: 'Cloud Fundamentals',
    difficulty: 'easy',
    questionText: 'Which acronym represents a cloud service model where the cloud provider manages infrastructure, servers, and middleware, letting you deploy just your application code?',
    options: ['IaaS', 'PaaS', 'SaaS', 'Serverless'],
    correctIndex: 1,
    explanation: 'Platform as a Service (PaaS) provides a platform allowing customers to develop, run, and manage applications without the complexity of building and maintaining infrastructure.',
    tags: ['iaas-paas', 'terminology']
  },
  {
    id: 'cloud_m1',
    skillId: 'cloud_arch',
    topic: 'Containers',
    difficulty: 'medium',
    questionText: 'What is the primary advantage of Docker containerization over traditional Virtual Machines?',
    options: [
      'Containers encrypt application code compiled within them.',
      'Containers share the host OS kernel instead of running full guest operating systems, making them lightweight, fast to boot, and highly resource-efficient.',
      'Containers can only run Python applications, making them safer.',
      'Containers bypass standard networking restrictions completely.'
    ],
    correctIndex: 1,
    explanation: 'Virtual Machines run a full guest OS on top of a hypervisor. Docker containers isolate user space but share the host operating system kernel, meaning significantly less memory footprint and cold-start latency.',
    tags: ['docker', 'virtualization', 'scaling']
  },
  {
    id: 'cloud_h1',
    skillId: 'cloud_arch',
    topic: 'Highly Available Systems',
    difficulty: 'hard',
    questionText: 'In cloud architecture, how does a Multi-Region Active-Active database setup differ from an Active-Passive (Read-Replica) setup under write stress?',
    options: [
      'Active-Active disables all transaction locks to gain speed.',
      'Active-Passive handles writes across all nodes globally, resolving conflicts using consensus algorithms.',
      'Active-Active allows writes to any node globally and syncs data bi-directionally, introducing conflict resolution challenges. Active-Passive directs all writes to a single primary node, replicating to passive nodes.',
      'Active-Passive is faster because it does not use SQL.'
    ],
    correctIndex: 2,
    explanation: 'Active-Active setups accept write operations at multiple geographically separated databases and sync writes bi-directionally, requiring active consensus or conflict resolution (e.g., CRDTs). Active-Passive allows writes only on a single master node, which guarantees consistency but makes the master a single bottleneck.',
    tags: ['multi-region', 'replication', 'consistency']
  },

  // ==================== PRODUCT STRATEGY ====================
  {
    id: 'product_e1',
    skillId: 'product_strategy',
    topic: 'User Research',
    difficulty: 'easy',
    questionText: 'What is a "User Persona" in product development?',
    options: [
      'The legal identity of a user stored in databases.',
      'A fictional character created to represent a target user type based on research, capturing goals, pain points, and behaviors.',
      'An actor hired to test mobile application builds.',
      'The administrative profile used to bypass access rules.'
    ],
    correctIndex: 1,
    explanation: 'A user persona is an archetype of a user, synthesized from user research, helping product and engineering teams maintain empathy and design features aligned with user realities.',
    tags: ['personas', 'design-thinking']
  },
  {
    id: 'product_m1',
    skillId: 'product_strategy',
    topic: 'Prioritization',
    difficulty: 'medium',
    questionText: 'In the MoSCoW prioritization framework, what do the letters stand for?',
    options: [
      'Metric, Outcome, Schedule, Cost, Width',
      'Must have, Should have, Could have, Won\'t have',
      'Main features, Optional tasks, Supporting systems, Core logs',
      'Management, Operations, Sales, Customers, Workflows'
    ],
    correctIndex: 1,
    explanation: 'MoSCoW stands for: Must have, Should have, Could have, and Won\'t have (this time). It aligns stakeholders on what is critical versus nice-to-have.',
    tags: ['frameworks', 'scope']
  },

  // ==================== PM AGILE ====================
  {
    id: 'pm_e1',
    skillId: 'pm_agile',
    topic: 'Agile Ceremonies',
    difficulty: 'easy',
    questionText: 'Which agile meeting is held at the end of a sprint to analyze what went well, what failed, and establish concrete process improvements?',
    options: ['Sprint Planning', 'Daily Standup', 'Sprint Retrospective', 'Product Backlog Refinement'],
    correctIndex: 2,
    explanation: 'The Retrospective (Retro) is a dedicated meeting at the end of a sprint focused on team operations, communication, and continuous self-improvement.',
    tags: ['scrum', 'retrospective']
  },
  {
    id: 'pm_m1',
    skillId: 'pm_agile',
    topic: 'Kanban vs Scrum',
    difficulty: 'medium',
    questionText: 'What is a core differentiator of the Kanban methodology compared to Scrum?',
    options: [
      'Kanban requires dedicated daily standup calls, while Scrum bans them.',
      'Scrum uses time-boxed iterations (sprints) and committed backlogs; Kanban is continuous and limits Work in Progress (WIP) to optimize flow.',
      'Kanban does not allow software developers to edit databases.',
      'Scrum relies on offline spreadsheets while Kanban requires physical whiteboard stickers.'
    ],
    correctIndex: 1,
    explanation: 'Scrum is built around rigid iterations (sprints, usually 2 weeks) and predefined roles/deliverables. Kanban is a visual flow system focused on limiting WIP on a continuous board.',
    tags: ['kanban', 'scrum', 'wip']
  },

  // ==================== SEO & GROWTH MARKETING ====================
  {
    id: 'seo_e1',
    skillId: 'seo_marketing',
    topic: 'Crawling',
    difficulty: 'easy',
    questionText: 'Which file is placed at the root of a website to instruct search engine crawlers which pages they can or cannot scan?',
    options: ['sitemap.xml', 'index.html', 'robots.txt', 'meta.json'],
    correctIndex: 2,
    explanation: 'The robots.txt file provides rules for search spiders/crawlers, advising them on which directories or paths to exclude from indexing.',
    tags: ['crawling', 'robots']
  },

  // ==================== FINANCIAL MODELING ====================
  {
    id: 'finance_e1',
    skillId: 'finance_modeling',
    topic: 'Valuation',
    difficulty: 'easy',
    questionText: 'What does the acronym DCF stand for in financial modeling?',
    options: ['Debt Capital Flow', 'Discounted Cash Flow', 'Direct Cost Funding', 'Dividends and Cash Foreclosures'],
    correctIndex: 1,
    explanation: 'Discounted Cash Flow (DCF) is a valuation method used to estimate the value of an investment based on its expected future cash flows, discounted to present value.',
    tags: ['dcf', 'valuation']
  },

  // ==================== CODING TEST ====================
  {
    id: 'coding_e1',
    skillId: 'coding_test',
    topic: 'Basic Recursion',
    difficulty: 'easy',
    questionText: 'What is the base case of a recursive function, and why is it required?',
    options: [
      'The initial input size passed to the call stack.',
      'The termination condition that stops recursion to prevent a stack overflow.',
      'The primary loop condition used to calculate factorials.',
      'The declaration of the function inside the main execution file.'
    ],
    correctIndex: 1,
    explanation: 'A recursive function must have a base case to terminate execution. Without it, the function would call itself indefinitely, exhausting stack memory and causing a Stack Overflow error.',
    tags: ['recursion', 'call stack', 'basics']
  },
  {
    id: 'coding_e2',
    skillId: 'coding_test',
    topic: 'Variable Reference',
    difficulty: 'easy',
    questionText: 'In JavaScript, what will `console.log([] == ![])` output?',
    options: ['true', 'false', 'TypeError', 'undefined'],
    correctIndex: 0,
    explanation: 'In JavaScript, the abstract equality comparison converts types. First, `![]` coerces to boolean `false`. Then, `[] == false` is compared. The array `[]` is coerced to a primitive string `""`, and `"" == false` evaluates to `0 == 0`, which is `true`.',
    tags: ['coercion', 'syntax', 'javascript']
  },
  {
    id: 'coding_m1',
    skillId: 'coding_test',
    topic: 'Time Complexity',
    difficulty: 'medium',
    questionText: 'What is the average time complexity of searching for a value in a balanced Binary Search Tree (BST)?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 1,
    explanation: 'In a balanced Binary Search Tree, searching divides the search space in half with each step, yielding an average time complexity of O(log n).',
    tags: ['bst', 'search', 'algorithms']
  },
  {
    id: 'coding_m2',
    skillId: 'coding_test',
    topic: 'Array Operations',
    difficulty: 'medium',
    questionText: 'You are implementing a sliding window maximum queue. Which data structure provides an optimal O(1) amortized insertion and O(1) extraction from both ends?',
    options: ['Singly Linked List', 'Min-Heap', 'Double-ended Queue (Deque)', 'Hash Map'],
    correctIndex: 2,
    explanation: 'A double-ended queue (deque) allows adding and removing elements from both the front and the back in O(1) constant time, making it perfect for sliding window algorithms.',
    tags: ['deque', 'sliding-window', 'data-structures']
  },
  {
    id: 'coding_h1',
    skillId: 'coding_test',
    topic: 'Dynamic Programming',
    difficulty: 'hard',
    questionText: 'Which design technique solves optimization problems by breaking them into overlapping subproblems, solving each subproblem once, and caching their results?',
    options: [
      'Divide and Conquer',
      'Dynamic Programming (Memoization/Tabulation)',
      'Greedy Algorithms',
      'Backtracking Search'
    ],
    correctIndex: 1,
    explanation: 'Dynamic Programming works by storing solutions to overlapping subproblems (using memoization or tabulation) so they are computed only once, optimizing time complexity at the cost of space.',
    tags: ['dynamic-programming', 'optimization', 'memoization']
  },
  {
    id: 'coding_h2',
    skillId: 'coding_test',
    topic: 'Graph Traversals',
    difficulty: 'hard',
    questionText: 'In a graph containing cycle paths, how does Depth-First Search (DFS) prevent infinite traversal loops?',
    options: [
      'By limiting recursion depth to the total edge count.',
      'By using a queue to process adjacent nodes horizontally first.',
      'By maintaining a state collection of "visited" node identifiers.',
      'By converting the graph into an acyclic matrix on every iteration.'
    ],
    correctIndex: 2,
    explanation: 'To avoid cycling infinitely in loops, DFS keeps track of visited nodes using a set or array, skipping nodes that have already been visited.',
    tags: ['dfs', 'graphs', 'cycles']
  }
];
