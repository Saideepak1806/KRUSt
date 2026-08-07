import * as pdfParseModule from 'pdf-parse';

async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string }> {
  let mod: any = pdfParseModule;
  if (mod?.default) mod = mod.default;

  // 1. Check if PDFParse class exists on the module
  const PDFParseClass = mod?.PDFParse || (pdfParseModule as any)?.PDFParse;
  if (typeof PDFParseClass === 'function') {
    try {
      const instance = new PDFParseClass({ data: buffer });
      const result = await instance.getText();
      if (instance && typeof instance.destroy === 'function') {
        await instance.destroy();
      }
      const text = typeof result === 'string' ? result : (result?.text || "");
      if (text) return { text };
    } catch (e: any) {
      console.warn("[PDF Parse] PDFParse class extraction attempt:", e?.message || e);
    }
  }

  // 2. Fallback check if mod itself or require('pdf-parse') is a direct function
  let fn: any = typeof mod === 'function' ? mod : null;
  if (!fn) {
    try {
      const loaded = require('pdf-parse');
      if (typeof loaded === 'function') fn = loaded;
      else if (typeof loaded?.default === 'function') fn = loaded.default;
      else if (typeof loaded?.PDFParse === 'function') {
        const inst = new loaded.PDFParse({ data: buffer });
        const res = await inst.getText();
        if (inst && typeof inst.destroy === 'function') await inst.destroy();
        return { text: typeof res === 'string' ? res : (res?.text || "") };
      }
    } catch {
      // ignore fallback error
    }
  }

  if (typeof fn === 'function') {
    const res = await fn(buffer);
    return { text: typeof res === 'string' ? res : (res?.text || "") };
  }

  throw new Error(`pdf-parse module could not extract text from PDF buffer.`);
}

/**
 * KRÜSt Core Skill Normalization & Evidence Matching Engine
 *
 * Provides deterministic, bulletproof normalization, alias mapping,
 * full-resume evidence extraction, and classification (STRONG MATCH, MATCH, PARTIAL MATCH, MISSING).
 * Enforces negative guards against dangerous false positives (e.g. Java vs JavaScript, Git vs GitHub, C vs C++/C#).
 */

export type MatchStatus = 'strong_match' | 'match' | 'partial_match' | 'missing';

export interface EvidenceDetail {
  skillName: string;
  canonicalName: string;
  status: MatchStatus;
  category: 'Required Skill' | 'Preferred Skill' | 'Tool/Tech' | 'Domain';
  evidenceSnippet: string;
  notes: string;
  krustReadinessScore: number | null;
  matchType: 'EXACT' | 'ALIAS' | 'CONTEXT' | 'PARTIAL' | 'NONE';
}

export interface SkillTraceItem {
  requiredSkill: string;
  normalizedJdSkill: string;
  matchedResumeSnippet: string;
  detectedResumeSkill: string;
  matchType: 'EXACT' | 'ALIAS' | 'CONTEXT' | 'PARTIAL' | 'NONE';
  finalStatus: 'STRONG MATCH' | 'MATCH' | 'PARTIAL MATCH' | 'MISSING';
  notes: string;
}

export interface DebugTrace {
  resumeCharCount: number;
  jdCharCount: number;
  extractedResumeTextSample: string;
  extractedJdSkillsRaw: string[];
  normalizedJdSkills: string[];
  detectedResumeSkills: string[];
  normalizationMap: Array<{ raw: string; normalized: string }>;
  skillTraces: SkillTraceItem[];
  calculatedScoreComponents: {
    technicalSkillsMatch: number;
    experienceAlignment: number;
    toolMatch: number;
    qualificationAlignment: number;
    roleCompetencyMatch: number;
    finalJobMatchScore: number;
  };
}

export interface MatchingResult {
  extractedJdSkills: string[];
  matchedSkills: string[];
  partialSkills: string[];
  missingSkills: string[];
  evidenceDetails: EvidenceDetail[];
  strongEvidence: Array<{ skillName: string; score: string | number; source: string }>;
  weakEvidence: Array<{ skillName: string; score: string | number; source: string }>;
  comparisonTable: Array<{
    requirement: string;
    category: 'Required Skill' | 'Preferred Skill' | 'Tool/Tech' | 'Domain';
    resumeClaim: string;
    krustReadinessScore: number | null;
    status: 'strong_match' | 'partial_match' | 'missing';
    notes: string;
  }>;
  calculatedMatchScore: number;
  subFactors: {
    technicalSkillsMatch: number;
    experienceAlignment: number;
    toolMatch: number;
    qualificationAlignment: number;
    roleCompetencyMatch: number;
  };
  debugTrace: DebugTrace;
}

interface SkillRule {
  canonicalName: string;
  category?: 'Required Skill' | 'Preferred Skill' | 'Tool/Tech' | 'Domain';
  aliases: string[];
  positiveRegexes: RegExp[];
  negativeRegexes?: RegExp[];
  underlyingLangsOrFrameworks?: string[]; // Frameworks/techs that explicitly imply/prove this skill
  partialParentTechs?: string[]; // Broader parent tech that provides baseline partial match
}

// Canonical Skill Registry with strict rules and negative guards
const SKILL_RULES: SkillRule[] = [
  {
    canonicalName: "JavaScript",
    aliases: ["JavaScript", "Javascript", "javascript", "JS", "ES6", "ES6+", "ECMAScript"],
    positiveRegexes: [/\b(javascript|js|es6\+?|ecmascript)\b/i],
    negativeRegexes: [/\bjava\b(?!\s*script)/i],
    underlyingLangsOrFrameworks: ["Node.js", "NodeJS", "React", "React.js", "ReactJS", "Vue", "Angular", "Express.js", "Next.js", "TypeScript"]
  },
  {
    canonicalName: "Java",
    aliases: ["Java", "J2EE", "Jakarta EE"],
    positiveRegexes: [/\b(java|j2ee|jakarta\s*ee)\b/i],
    negativeRegexes: [/\bjavascript\b|\bjs\b/i],
    underlyingLangsOrFrameworks: ["Spring", "Spring Boot", "Hibernate", "JVM"]
  },
  {
    canonicalName: "Python",
    aliases: ["Python", "python", "Py"],
    positiveRegexes: [/\b(python|py)\b/i],
    underlyingLangsOrFrameworks: ["Flask", "Django", "FastAPI", "Pandas", "NumPy", "PyTorch", "TensorFlow", "Scikit-Learn"]
  },
  {
    canonicalName: "Power BI",
    aliases: ["Power BI", "PowerBI", "Power-BI", "PowerBI Desktop", "DAX"],
    positiveRegexes: [/\b(power\s*bi|powerbi|dax)\b/i]
  },
  {
    canonicalName: "PostgreSQL",
    aliases: ["PostgreSQL", "Postgres", "Postgre SQL", "Postgre"],
    positiveRegexes: [/\b(postgresql|postgres|postgre\s*sql)\b/i]
  },
  {
    canonicalName: "Node.js",
    aliases: ["Node.js", "NodeJS", "Node JS", "Node"],
    positiveRegexes: [/\b(node\.?js|nodejs|node\s+js)\b/i, /\bnode\b(?!\s*red)/i],
    underlyingLangsOrFrameworks: ["Express.js", "NestJS"]
  },
  {
    canonicalName: "React",
    aliases: ["React", "React.js", "ReactJS", "React JS"],
    positiveRegexes: [/\b(react\.?js|reactjs|react)\b/i],
    negativeRegexes: [/\breact\s+native\b/i]
  },
  {
    canonicalName: "React Native",
    aliases: ["React Native", "ReactNative"],
    positiveRegexes: [/\b(react\s*native)\b/i]
  },
  {
    canonicalName: "Microsoft Excel",
    aliases: ["Microsoft Excel", "MS Excel", "Excel", "Excel Spreadsheets", "VLOOKUP"],
    positiveRegexes: [/\b(ms\s*excel|microsoft\s*excel|excel|vlookup)\b/i]
  },
  {
    canonicalName: "AWS",
    aliases: ["AWS", "Amazon Web Services", "Amazon Cloud", "EC2", "S3", "Lambda"],
    positiveRegexes: [/\b(aws|amazon\s+web\s+services|amazon\s+cloud|ec2|s3|aws\s+lambda)\b/i]
  },
  {
    canonicalName: "Git",
    aliases: ["Git", "Git Version Control"],
    positiveRegexes: [/\b(git|git\s+version\s+control|git\s+branch|git\s+commit)\b/i],
    negativeRegexes: [/\bgithub\b|\bgitlab\b|\bbitbucket\b/i]
  },
  {
    canonicalName: "GitHub",
    aliases: ["GitHub", "Github", "github"],
    positiveRegexes: [/\bgithub\b/i]
  },
  {
    canonicalName: "C",
    aliases: ["C", "C Language", "C Programming"],
    positiveRegexes: [/\b(c\s+programming|c\s+language|c\s+source|ansi\s+c)\b/i, /\bc(?!\+|\#|\/|\-|[a-z0-9_])/i],
    negativeRegexes: [/\bc\+\+|\bc#|\bc--|\bcss\b|\bobjective-c\b|\bc\/c\+\+\b/i]
  },
  {
    canonicalName: "C++",
    aliases: ["C++", "CPP", "Cplusplus"],
    positiveRegexes: [/\b(c\+\+|cpp|cplusplus)\b/i]
  },
  {
    canonicalName: "C#",
    aliases: ["C#", "CSharp", "C-Sharp", ".NET"],
    positiveRegexes: [/\b(c#|csharp|c-sharp|\.net)\b/i]
  },
  {
    canonicalName: "SQL",
    aliases: ["SQL", "Structured Query Language"],
    positiveRegexes: [/\bsql\b/i],
    negativeRegexes: [/\bnosql\b/i],
    underlyingLangsOrFrameworks: ["PostgreSQL", "MySQL", "SQL Server", "Oracle", "SQLite", "T-SQL", "PL/SQL"]
  },
  {
    canonicalName: "NoSQL",
    aliases: ["NoSQL", "Document Database"],
    positiveRegexes: [/\bnosql\b/i],
    negativeRegexes: [/\bsql\b(?!\s*server)/i],
    underlyingLangsOrFrameworks: ["MongoDB", "DynamoDB", "Cassandra", "Redis", "CouchDB"]
  },
  {
    canonicalName: "Docker",
    aliases: ["Docker", "Docker Containers"],
    positiveRegexes: [/\bdocker\b/i]
  },
  {
    canonicalName: "Kubernetes",
    aliases: ["Kubernetes", "K8s", "k8s"],
    positiveRegexes: [/\b(kubernetes|k8s)\b/i]
  },
  {
    canonicalName: "Google Cloud",
    aliases: ["GCP", "Google Cloud Platform", "Google Cloud"],
    positiveRegexes: [/\b(gcp|google\s+cloud(\s+platform)?)\b/i]
  },
  {
    canonicalName: "Azure",
    aliases: ["Azure", "Microsoft Azure"],
    positiveRegexes: [/\b(azure|microsoft\s+azure)\b/i]
  },
  {
    canonicalName: "TypeScript",
    aliases: ["TypeScript", "TS"],
    positiveRegexes: [/\b(typescript|ts)\b/i]
  },
  {
    canonicalName: "MongoDB",
    aliases: ["MongoDB", "Mongo"],
    positiveRegexes: [/\b(mongodb|mongo)\b/i]
  },
  {
    canonicalName: "ETL",
    aliases: ["ETL", "Extract Transform Load", "ETL Pipelines"],
    positiveRegexes: [/\b(etl|extract\s+transform\s+load)\b/i]
  },
  {
    canonicalName: "REST API",
    aliases: ["REST API", "RESTful API", "RESTful", "REST Services", "REST"],
    positiveRegexes: [/\b(restful?(\s+api|\s+services)?)\b/i]
  },
  {
    canonicalName: "Pandas",
    aliases: ["Pandas", "pandas"],
    positiveRegexes: [/\bpandas\b/i],
    partialParentTechs: ["Python"]
  },
  {
    canonicalName: "Flask",
    aliases: ["Flask", "flask"],
    positiveRegexes: [/\bflask\b/i],
    partialParentTechs: ["Python"]
  },
  {
    canonicalName: "Django",
    aliases: ["Django", "django"],
    positiveRegexes: [/\bdjango\b/i],
    partialParentTechs: ["Python"]
  },
  {
    canonicalName: "Tableau",
    aliases: ["Tableau", "Tableau Desktop"],
    positiveRegexes: [/\btableau\b/i]
  },
  {
    canonicalName: "Figma",
    aliases: ["Figma", "Figma UI"],
    positiveRegexes: [/\bfigma\b/i]
  },
  {
    canonicalName: "GraphQL",
    aliases: ["GraphQL", "graphql"],
    positiveRegexes: [/\bgraphql\b/i]
  },
  {
    canonicalName: "CI/CD",
    aliases: ["CI/CD", "CI-CD", "Continuous Integration", "Continuous Deployment"],
    positiveRegexes: [/\b(ci\s*\/\s*cd|ci-cd|continuous\s+integration)\b/i]
  },
  {
    canonicalName: "Machine Learning",
    aliases: ["Machine Learning", "ML"],
    positiveRegexes: [/\b(machine\s+learning|ml)\b/i],
    underlyingLangsOrFrameworks: ["Scikit-Learn", "PyTorch", "TensorFlow", "Keras"]
  },
  {
    canonicalName: "System Design",
    aliases: ["System Design", "Distributed Systems", "Architecture"],
    positiveRegexes: [/\b(system\s+design|distributed\s+systems|system\s+architecture)\b/i]
  },
  {
    canonicalName: "Data Modeling",
    aliases: ["Data Modeling", "Data Model", "Database Design"],
    positiveRegexes: [/\b(data\s+model(ing)?|database\s+design)\b/i]
  },
  {
    canonicalName: "Data Warehousing",
    aliases: ["Data Warehousing", "Data Warehouse", "Snowflake", "Redshift", "BigQuery"],
    positiveRegexes: [/\b(data\s+warehous(ing|e)|snowflake|redshift|bigquery)\b/i]
  }
];

/**
 * Extract text reliably from uploaded PDF or plain text fileData
 */
export async function extractResumeTextFromFile(
  fileData: string, 
  mimeType: string, 
  userResumeText: string
): Promise<string> {
  let extracted = userResumeText ? userResumeText.trim() : "";

  if (fileData) {
    try {
      const buffer = Buffer.from(fileData, 'base64');
      const isPdf = (mimeType && mimeType.includes('pdf')) || fileData.startsWith('JVBER') || buffer.slice(0, 5).toString('ascii') === '%PDF-';
      
      if (isPdf) {
        const pdfResult = await parsePdfBuffer(buffer);
        if (pdfResult && pdfResult.text && pdfResult.text.trim().length > 0) {
          const pdfTxt = pdfResult.text.trim();
          extracted = extracted ? `${pdfTxt}\n\n${extracted}` : pdfTxt;
        }
      } else {
        const txt = buffer.toString('utf-8').trim();
        if (txt && txt.length > 0) {
          extracted = extracted ? `${txt}\n\n${extracted}` : txt;
        }
      }
    } catch (err) {
      console.warn("[Resume Text Extraction] Warning extracting text from fileData:", err);
    }
  }

  return extracted;
}

/**
 * Scans resume text against all canonical skill rules and returns all detected skills.
 */
export function detectAllSkillsInResumeText(resumeText: string): string[] {
  if (!resumeText) return [];
  const detected = new Set<string>();

  for (const rule of SKILL_RULES) {
    const cleanedText = cleanSentenceForNegativeCheck(resumeText, rule.negativeRegexes);
    const hasMatch = rule.positiveRegexes.some(pr => pr.test(cleanedText));
    if (hasMatch) {
      detected.add(rule.canonicalName);
    } else if (rule.underlyingLangsOrFrameworks) {
      for (const sub of rule.underlyingLangsOrFrameworks) {
        const subEsc = sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`\\b${subEsc}\\b`, 'i').test(resumeText)) {
          detected.add(rule.canonicalName);
          break;
        }
      }
    }
  }

  return Array.from(detected);
}

/**
 * Normalizes a raw skill name into its canonical format if known,
 * or cleans punctuation/capitalization.
 */
export function normalizeSkillName(rawSkill: string): string {
  if (!rawSkill || typeof rawSkill !== 'string') return "";
  const cleaned = rawSkill.trim();
  if (!cleaned) return "";

  // Check known rules
  for (const rule of SKILL_RULES) {
    for (const alias of rule.aliases) {
      if (alias.toLowerCase() === cleaned.toLowerCase()) {
        return rule.canonicalName;
      }
    }
    for (const regex of rule.positiveRegexes) {
      if (regex.test(cleaned)) {
        if (rule.negativeRegexes && rule.negativeRegexes.some(nr => nr.test(cleaned))) {
          continue;
        }
        return rule.canonicalName;
      }
    }
  }

  // Fallback title-case cleaning
  return cleaned
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.length <= 3 && !['and', 'for', 'the', 'in', 'of', 'to'].includes(w.toLowerCase())
      ? w.toUpperCase() 
      : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join(' ');
}

/**
 * Split resume text into individual sentences and paragraphs
 */
function extractResumeSentences(resumeText: string): string[] {
  if (!resumeText) return [];
  return resumeText
    .split(/\r?\n+|(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 3);
}

const ACTION_KEYWORDS = [
  /\b(built|developed|implemented|created|designed|managed|engineered|architected|maintained|optimized|configured|deployed|integrated|led|executed|wrote|utilized|used|applied)\b/i,
  /\b(experience|project|years|months|pipeline|application|app|service|system|database|api|dashboard|model)\b/i,
  /\d+\+?\s*(years|yrs|months|projects|%|\$)/i
];

function cleanSentenceForNegativeCheck(sentence: string, negativeRegexes?: RegExp[]): string {
  if (!negativeRegexes) return sentence;
  let result = sentence;
  for (const nr of negativeRegexes) {
    result = result.replace(nr, '');
  }
  return result;
}

/**
 * Evaluate single required skill against the ENTIRE resume text.
 */
export function matchSkillAgainstResume(
  requiredSkill: string,
  resumeText: string,
  userSkillReadiness: Record<string, any> = {}
): EvidenceDetail {
  const canonicalName = normalizeSkillName(requiredSkill);
  const sentences = extractResumeSentences(resumeText);
  
  const rule = SKILL_RULES.find(r => r.canonicalName.toLowerCase() === canonicalName.toLowerCase());

  let matchedSentence = "";
  let isDirectMatch = false;
  let isStrongMatch = false;
  let isPartialMatch = false;
  let partialTechFound = "";
  let matchType: 'EXACT' | 'ALIAS' | 'CONTEXT' | 'PARTIAL' | 'NONE' = 'NONE';

  // 1. Direct Regex / Alias search in full resume text
  for (const sentence of sentences) {
    if (rule) {
      const cleaned = cleanSentenceForNegativeCheck(sentence, rule.negativeRegexes);
      
      // Check exact match on canonical name or raw skill
      const escapedRaw = requiredSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedCanonical = canonicalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const isExactInSentence = new RegExp(`\\b${escapedRaw}\\b`, 'i').test(cleaned) || new RegExp(`\\b${escapedCanonical}\\b`, 'i').test(cleaned);

      if (isExactInSentence) {
        matchedSentence = sentence;
        isDirectMatch = true;
        matchType = 'EXACT';
        if (ACTION_KEYWORDS.some(ak => ak.test(sentence))) {
          isStrongMatch = true;
        }
        break;
      }

      // Check alias match
      const hasAliasMatch = rule.positiveRegexes.some(pr => pr.test(cleaned));
      if (hasAliasMatch) {
        matchedSentence = sentence;
        isDirectMatch = true;
        matchType = 'ALIAS';
        if (ACTION_KEYWORDS.some(ak => ak.test(sentence))) {
          isStrongMatch = true;
        }
        break;
      }

      // Check context match via underlying framework or tool
      if (rule.underlyingLangsOrFrameworks) {
        for (const subTech of rule.underlyingLangsOrFrameworks) {
          const subEsc = subTech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (new RegExp(`\\b${subEsc}\\b`, 'i').test(sentence)) {
            matchedSentence = sentence;
            isDirectMatch = true;
            matchType = 'CONTEXT';
            if (ACTION_KEYWORDS.some(ak => ak.test(sentence))) {
              isStrongMatch = true;
            }
            break;
          }
        }
        if (isDirectMatch) break;
      }
    } else {
      const escaped = requiredSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const termRegex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (termRegex.test(sentence)) {
        matchedSentence = sentence;
        isDirectMatch = true;
        matchType = 'EXACT';
        if (ACTION_KEYWORDS.some(ak => ak.test(sentence))) {
          isStrongMatch = true;
        }
        break;
      }
    }
  }

  // 2. Whole text fallback check if not matched in sentences
  if (!isDirectMatch) {
    if (rule) {
      const wholeTextCleaned = cleanSentenceForNegativeCheck(resumeText, rule.negativeRegexes);
      
      const escapedRaw = requiredSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedCanonical = canonicalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escapedRaw}\\b`, 'i').test(wholeTextCleaned) || new RegExp(`\\b${escapedCanonical}\\b`, 'i').test(wholeTextCleaned)) {
        isDirectMatch = true;
        matchType = 'EXACT';
        matchedSentence = `Explicit evidence of ${canonicalName} found in candidate resume text.`;
      } else if (rule.positiveRegexes.some(pr => pr.test(wholeTextCleaned))) {
        isDirectMatch = true;
        matchType = 'ALIAS';
        matchedSentence = `Alias/variant evidence of ${canonicalName} found in candidate resume text.`;
      } else if (rule.underlyingLangsOrFrameworks) {
        for (const subTech of rule.underlyingLangsOrFrameworks) {
          const subEsc = subTech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (new RegExp(`\\b${subEsc}\\b`, 'i').test(resumeText)) {
            isDirectMatch = true;
            matchType = 'CONTEXT';
            matchedSentence = `Contextual evidence via ${subTech} found in candidate resume text.`;
            break;
          }
        }
      }
    } else {
      const escaped = requiredSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(resumeText)) {
        isDirectMatch = true;
        matchType = 'EXACT';
        matchedSentence = `Explicit evidence of ${canonicalName} found in candidate resume text.`;
      }
    }
  }

  // 3. Partial Match check
  if (!isDirectMatch && rule && rule.partialParentTechs) {
    for (const parentTech of rule.partialParentTechs) {
      const parentEsc = parentTech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parentRegex = new RegExp(`\\b${parentEsc}\\b`, 'i');
      const foundSentence = sentences.find(s => parentRegex.test(s));
      if (foundSentence || parentRegex.test(resumeText)) {
        isPartialMatch = true;
        matchType = 'PARTIAL';
        partialTechFound = parentTech;
        matchedSentence = foundSentence || `Related evidence found for parent technology '${parentTech}'.`;
        break;
      }
    }
  }

  // 4. Check KRÜSt verified readiness score
  let krustScore: number | null = null;
  const readinessEntry = Object.entries(userSkillReadiness).find(([id, data]: [string, any]) => {
    const sName = data?.name || id;
    return sName.toLowerCase().includes(canonicalName.toLowerCase()) || canonicalName.toLowerCase().includes(sName.toLowerCase());
  });
  if (readinessEntry) {
    const data = readinessEntry[1];
    if (typeof data?.score === 'number') krustScore = data.score;
    else if (typeof data?.readinessScore === 'number') krustScore = data.readinessScore;
  }

  let status: MatchStatus = 'missing';
  let evidenceSnippet = "NO EVIDENCE FOUND IN RESUME";
  let notes = `Skill '${canonicalName}' is required by Job Description but no evidence was found in resume.`;

  if (isDirectMatch) {
    if (isStrongMatch || (krustScore !== null && krustScore >= 70)) {
      status = 'strong_match';
      evidenceSnippet = matchedSentence;
      notes = `Clear practical evidence found in resume (${matchType}): "${matchedSentence}"`;
    } else {
      status = 'match';
      evidenceSnippet = matchedSentence;
      notes = `Skill explicitly mentioned in resume (${matchType}): "${matchedSentence}"`;
    }
  } else if (isPartialMatch) {
    status = 'partial_match';
    evidenceSnippet = `Partial evidence: Candidate has experience with baseline technology '${partialTechFound}'.`;
    notes = `Baseline technology '${partialTechFound}' demonstrated, but specific skill '${canonicalName}' is not explicitly proven.`;
  }

  return {
    skillName: requiredSkill,
    canonicalName,
    status,
    category: 'Required Skill',
    evidenceSnippet,
    notes,
    krustReadinessScore: krustScore,
    matchType
  };
}

/**
 * Main Engine: Evaluates Job Description required skills against Resume text.
 */
export function analyzeSkillsAndEvidence(
  jdRequiredSkills: string[],
  resumeText: string,
  userSkillReadiness: Record<string, any> = {}
): MatchingResult {
  const rawJdSkills = jdRequiredSkills || [];
  const normalizationMap: Array<{ raw: string; normalized: string }> = [];

  const normalizedJdSkills = Array.from(new Set(
    rawJdSkills.map(s => {
      const norm = normalizeSkillName(s);
      normalizationMap.push({ raw: s, normalized: norm });
      return norm;
    }).filter(Boolean)
  ));

  const detectedResumeSkills = detectAllSkillsInResumeText(resumeText);

  const evidenceDetails: EvidenceDetail[] = [];
  const skillTraces: SkillTraceItem[] = [];

  const matchedSkillsSet = new Set<string>();
  const partialSkillsSet = new Set<string>();
  const missingSkillsSet = new Set<string>();

  const strongEvidence: Array<{ skillName: string; score: string | number; source: string }> = [];
  const weakEvidence: Array<{ skillName: string; score: string | number; source: string }> = [];

  for (const sk of normalizedJdSkills) {
    const result = matchSkillAgainstResume(sk, resumeText, userSkillReadiness);
    evidenceDetails.push(result);

    let finalStatus: 'STRONG MATCH' | 'MATCH' | 'PARTIAL MATCH' | 'MISSING' = 'MISSING';

    if (result.status === 'strong_match') {
      finalStatus = 'STRONG MATCH';
      matchedSkillsSet.add(result.canonicalName);
      strongEvidence.push({
        skillName: result.canonicalName,
        score: result.krustReadinessScore !== null ? `${result.krustReadinessScore}%` : "Verified Match",
        source: result.evidenceSnippet
      });
    } else if (result.status === 'match') {
      finalStatus = 'MATCH';
      matchedSkillsSet.add(result.canonicalName);
      strongEvidence.push({
        skillName: result.canonicalName,
        score: result.krustReadinessScore !== null ? `${result.krustReadinessScore}%` : "Verified Match",
        source: result.evidenceSnippet
      });
    } else if (result.status === 'partial_match') {
      finalStatus = 'PARTIAL MATCH';
      partialSkillsSet.add(result.canonicalName);
      weakEvidence.push({
        skillName: result.canonicalName,
        score: "Partial Match",
        source: result.evidenceSnippet
      });
    } else {
      finalStatus = 'MISSING';
      missingSkillsSet.add(result.canonicalName);
      weakEvidence.push({
        skillName: result.canonicalName,
        score: "Missing Evidence",
        source: "No evidence found in resume"
      });
    }

    skillTraces.push({
      requiredSkill: sk,
      normalizedJdSkill: result.canonicalName,
      matchedResumeSnippet: result.evidenceSnippet,
      detectedResumeSkill: detectedResumeSkills.includes(result.canonicalName) ? result.canonicalName : "None",
      matchType: result.matchType,
      finalStatus,
      notes: result.notes
    });
  }

  const matchedSkills = Array.from(matchedSkillsSet);
  const partialSkills = Array.from(partialSkillsSet);
  const missingSkills = Array.from(missingSkillsSet);

  const totalSkillsCount = normalizedJdSkills.length;
  
  let skillCoveragePct = 0;
  if (totalSkillsCount > 0) {
    const points = (matchedSkills.length * 1.0) + (partialSkills.length * 0.5);
    skillCoveragePct = Math.round((points / totalSkillsCount) * 100);
  } else {
    skillCoveragePct = 100;
  }

  const resumeLength = (resumeText || "").trim().length;
  const expAlign = resumeLength > 1000 ? 75 : (resumeLength > 500 ? 55 : (resumeLength > 200 ? 35 : 15));
  const qualAlign = (resumeText && /\b(bachelor|master|degree|b\.?tech|b\.?s|m\.?s|phd|computer science|engineering)\b/i.test(resumeText)) ? 80 : 40;

  const techMatch = skillCoveragePct;
  const toolMatch = skillCoveragePct;
  const roleComp = skillCoveragePct;

  const rawScore = Math.round(0.40 * techMatch + 0.20 * expAlign + 0.15 * toolMatch + 0.15 * qualAlign + 0.10 * roleComp);

  let calculatedMatchScore = rawScore;
  if (totalSkillsCount > 0 && missingSkills.length > 0) {
    calculatedMatchScore = Math.min(rawScore, skillCoveragePct);
  }

  const comparisonTable = evidenceDetails.map(item => ({
    requirement: item.canonicalName,
    category: item.category,
    resumeClaim: item.evidenceSnippet,
    krustReadinessScore: item.krustReadinessScore,
    status: (item.status === 'match' ? 'strong_match' : item.status) as 'strong_match' | 'partial_match' | 'missing',
    notes: item.notes
  }));

  const debugTrace: DebugTrace = {
    resumeCharCount: (resumeText || "").length,
    jdCharCount: (jdRequiredSkills.join(" ")).length,
    extractedResumeTextSample: (resumeText || "").slice(0, 300),
    extractedJdSkillsRaw: rawJdSkills,
    normalizedJdSkills,
    detectedResumeSkills,
    normalizationMap,
    skillTraces,
    calculatedScoreComponents: {
      technicalSkillsMatch: techMatch,
      experienceAlignment: expAlign,
      toolMatch,
      qualificationAlignment: qualAlign,
      roleCompetencyMatch: roleComp,
      finalJobMatchScore: calculatedMatchScore
    }
  };

  return {
    extractedJdSkills: normalizedJdSkills,
    matchedSkills,
    partialSkills,
    missingSkills,
    evidenceDetails,
    strongEvidence,
    weakEvidence,
    comparisonTable,
    calculatedMatchScore,
    subFactors: {
      technicalSkillsMatch: techMatch,
      experienceAlignment: expAlign,
      toolMatch,
      qualificationAlignment: qualAlign,
      roleCompetencyMatch: roleComp
    },
    debugTrace
  };
}
