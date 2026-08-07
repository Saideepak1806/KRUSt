import { analyzeSkillsAndEvidence, matchSkillAgainstResume, normalizeSkillName } from "../server/skillMatchingEngine.js";

console.log("=== RUNNING KRÜSt SKILL MATCHING TEST MATRIX ===");

let passed = 0;
let failed = 0;

function assertEqual(testName: string, actual: any, expected: any) {
  if (actual === expected) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}: Expected '${expected}', got '${actual}'`);
    failed++;
  }
}

// 1. Exact match
const r1 = matchSkillAgainstResume("Python", "I am a developer who codes in Python.");
assertEqual("Exact Match: Python ↔ Python", r1.status === 'strong_match' || r1.status === 'match', true);

// 2. Case variation
const r2 = matchSkillAgainstResume("Python", "experience with python programming language.");
assertEqual("Case Variation: python ↔ Python", r2.status === 'strong_match' || r2.status === 'match', true);

// 3. Alias: PowerBI
const r3 = matchSkillAgainstResume("Power BI", "Built interactive dashboards using PowerBI Desktop.");
assertEqual("Alias: PowerBI ↔ Power BI", r3.status === 'strong_match' || r3.status === 'match', true);

// 4. Abbreviation: AWS
const r4 = matchSkillAgainstResume("AWS", "Deployed applications on Amazon Web Services cloud platform.");
assertEqual("Abbreviation: AWS ↔ Amazon Web Services", r4.status === 'strong_match' || r4.status === 'match', true);

// 5. Context mention: Flask
const r5 = matchSkillAgainstResume("Flask", "Developed REST APIs using Python Flask and PostgreSQL.");
assertEqual("Context: Flask ↔ Python Flask", r5.status === 'strong_match' || r5.status === 'match', true);

// 6. Dangerous false matches: Java vs JavaScript
const r6 = matchSkillAgainstResume("Java", "Expert in JavaScript, React, and Node.js.");
assertEqual("Dangerous False Match: Java ↔ JavaScript", r6.status, 'missing');

// Dangerous false match: C vs C++
const r7 = matchSkillAgainstResume("C", "Experienced software developer using C++ and C#.");
assertEqual("Dangerous False Match: C ↔ C++", r7.status, 'missing');

// Dangerous false match: Git vs GitHub
const r8 = matchSkillAgainstResume("Git", "Maintained repositories on GitHub.");
assertEqual("Dangerous False Match: Git ↔ GitHub", r8.status === 'partial_match' || r8.status === 'missing', true);

// Dangerous false match: SQL vs NoSQL
const r9 = matchSkillAgainstResume("SQL", "Built document databases using NoSQL and MongoDB.");
assertEqual("Dangerous False Match: SQL ↔ NoSQL", r9.status, 'missing');

// Dangerous false match: React vs React Native
const r10 = matchSkillAgainstResume("React Native", "Developed web frontend applications using React.js.");
assertEqual("Dangerous False Match: React Native ↔ React", r10.status, 'missing');

// 7. Missing skill
const r11 = matchSkillAgainstResume("Kubernetes", "Software engineer with experience in Docker and AWS.");
assertEqual("Missing Skill: Kubernetes", r11.status, 'missing');

console.log(`\nTEST RESULTS: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL TESTS PASSED SUCCESSFULLY!");
}
