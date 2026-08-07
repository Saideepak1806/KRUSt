import { useState, useEffect, useCallback, useRef } from 'react';
import { Skill, Question, Attempt, QuestionAnswerDetail, UserSkillState, Career } from '../types';
import { QUESTIONS_BANK } from '../data/questions';
import { shuffleQuestionOptions } from '../utils/shuffle';
import { ChevronRight, CheckCircle2, XCircle, Award, BookOpen, Layers, RotateCcw, Loader2, ArrowRight, ShieldAlert, Cpu, MessageSquare, Send, HeartHandshake, Lock, Unlock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CodingTestAssessment from './CodingTestAssessment';
import AptitudeAssessment from './AptitudeAssessment';
import { syncFeedbackToFirebase } from '../lib/firebase';


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

  if (skill.id === 'aptitude_general') {
    return (
      <AptitudeAssessment
        skill={skill}
        skillState={skillState}
        career={career}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );
  }

  const [activeLevel, setActiveLevel] = useState<number>(1);
  const [levelQuestions, setLevelQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);

  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isSubmittingNext, setIsSubmittingNext] = useState<boolean>(false);

  // Store user answers per level: level -> array of details
  const [levelAnswerDetails, setLevelAnswerDetails] = useState<Record<number, QuestionAnswerDetail[]>>({});
  
  // Store level scores: level -> score %
  const [levelScores, setLevelScores] = useState<Record<number, number>>(
    skillState?.levelScores || {}
  );

  const [levelCompletedModal, setLevelCompletedModal] = useState<boolean>(false);

  // Level Feedback State
  const [selectedRating, setSelectedRating] = useState<{ emoji: string; label: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  const EMOJI_OPTIONS = [
    { emoji: '😡', label: 'Very Bad' },
    { emoji: '🙁', label: 'Bad' },
    { emoji: '😐', label: 'Good' },
    { emoji: '😊', label: 'Very Good' },
    { emoji: '🤩', label: 'Excellent' }
  ];

  const handleSendLevelFeedback = async () => {
    if (!selectedRating) return;
    setIsSubmittingFeedback(true);
    const payload = {
      username: localStorage.getItem('krust_username') || 'candidate_user',
      skillId: skill.id,
      skillName: skill.name,
      level: activeLevel,
      score: levelScores[activeLevel] || 0,
      ratingEmoji: selectedRating.emoji,
      ratingLabel: selectedRating.label,
      feedbackText: feedbackText.trim()
    };

    try {
      await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      syncFeedbackToFirebase({ ...payload, id: `fb_${Date.now()}` }).catch(() => {});
      setFeedbackSubmitted(true);
    } catch (e) {
      console.warn("Feedback submit handled gracefully:", e);
      setFeedbackSubmitted(true);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const resetFeedbackState = () => {
    setSelectedRating(null);
    setFeedbackText('');
    setFeedbackSubmitted(false);
  };


  // Client-side question cache for zero-latency (<5ms) level transitions
  const questionsCacheRef = useRef<Record<number, Question[]>>({});

  // Background question pre-fetcher: prepares next level in advance while candidate is attempting current level
  const prefetchLevelQuestions = useCallback((nextLvl: number) => {
    if (nextLvl > 3 || (questionsCacheRef.current[nextLvl] && questionsCacheRef.current[nextLvl].length > 0)) {
      return;
    }

    fetch('/api/assessment/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skillId: skill.id,
        skillName: skill.name,
        level: nextLvl
      })
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          questionsCacheRef.current[nextLvl] = data.slice(0, 10);
        }
      })
      .catch(err => {
        console.warn(`Background pre-fetch for Level ${nextLvl} handled gracefully:`, err);
      });
  }, [skill.id, skill.name]);

  // Level Lock Rule:
  // Level 1 = Unlocked by default
  // Level 2 = Unlocked ONLY when Level 1 is completed (levelScores[1] !== undefined)
  // Level 3 = Unlocked ONLY when Level 2 is completed (levelScores[2] !== undefined)
  const isLevelUnlocked = (lvl: number) => {
    if (lvl === 1) return true;
    return levelScores[lvl - 1] !== undefined || activeLevel >= lvl;
  };

  // Fetch 10 scenario questions for the current level (with instant cache load & background prefetch)
  const loadQuestionsForLevel = async (lvl: number) => {
    setIsLoadingQuestions(true);
    setCurrentQIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);
    setIsSubmittingNext(false);

    // Instant load if level was prefetched in background
    if (questionsCacheRef.current[lvl] && questionsCacheRef.current[lvl].length > 0) {
      setLevelQuestions(questionsCacheRef.current[lvl]);
      setIsLoadingQuestions(false);

      // Trigger background prefetch for the next level while candidate works on current level
      if (lvl < 3) {
        prefetchLevelQuestions(lvl + 1);
      }
      return;
    }

    try {
      const res = await fetch('/api/assessment/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: skill.id,
          skillName: skill.name,
          level: lvl
        })
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const sliced = data.slice(0, 10);
        questionsCacheRef.current[lvl] = sliced;
        setLevelQuestions(sliced);
      } else {
        const fallback = QUESTIONS_BANK.filter(q => q.skillId === skill.id);
        const fallbackQs = fallback.length > 0 ? fallback.slice(0, 10) : generateLocalFallbackQuestions(skill.id, skill.name, lvl);
        questionsCacheRef.current[lvl] = fallbackQs;
        setLevelQuestions(fallbackQs);
      }
    } catch (err) {
      console.warn("Failed loading level questions, using local fallback:", err);
      const fallbackQs = generateLocalFallbackQuestions(skill.id, skill.name, lvl);
      questionsCacheRef.current[lvl] = fallbackQs;
      setLevelQuestions(fallbackQs);
    } finally {
      setIsLoadingQuestions(false);
      // Automatically trigger background prefetch for next level
      if (lvl < 3) {
        prefetchLevelQuestions(lvl + 1);
      }
    }
  };

  useEffect(() => {
    loadQuestionsForLevel(activeLevel);
  }, [skill.id, activeLevel]);

  const generateLocalFallbackQuestions = (sId: string, sName: string, lvl: number): Question[] => {
    const diff = lvl === 1 ? 'easy' : lvl === 2 ? 'medium' : 'hard';

    if (lvl === 1) {
      const l1Raw: Question[] = [
        {
          id: `${sId}_fb_l1_1`,
          skillId: sId,
          topic: "Code Output Prediction",
          difficulty: "easy",
          questionType: "OUTPUT_ANALYSIS",
          interviewCategory: "Core Syntax & Mechanics",
          questionText: `What is the console output of the following code snippet?\n\`\`\`ts\nlet total = 0;\n[1, 2, 3, 4].forEach(n => {\n  if (n % 2 === 0) total += n;\n});\nconsole.log(total);\n\`\`\``,
          options: ["6", "10", "4", "0"],
          correctIndex: 0,
          explanation: "Only 2 and 4 are even. 2 + 4 = 6.",
          tags: [sId, "l1", "code_output"]
        },
        {
          id: `${sId}_fb_l1_2`,
          skillId: sId,
          topic: "Scope & Closure Invariants",
          difficulty: "easy",
          questionType: "DEBUGGING",
          interviewCategory: "Variables & Scope",
          questionText: `What value will be logged by each timeout call?\n\`\`\`ts\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 50);\n}\n\`\`\``,
          options: ["3 three times (3, 3, 3)", "0, 1, 2 in order", "0 three times (0, 0, 0)", "Throws a ReferenceError"],
          correctIndex: 0,
          explanation: "`var` is function-scoped. By the time the callbacks fire after 50ms, `i` has mutated to 3.",
          tags: [sId, "l1", "scope"]
        },
        {
          id: `${sId}_fb_l1_3`,
          skillId: sId,
          topic: "Collection Transformation",
          difficulty: "easy",
          questionType: "PROBLEM_SOLVING",
          interviewCategory: "Data Structures & Operations",
          questionText: `You have an array of records \`[{ id: 1, active: true }, { id: 2, active: false }]\`. Which expression extracts only active record IDs as \`[1]\`?`,
          options: [
            "`records.filter(r => r.active).map(r => r.id)`",
            "`records.map(r => r.active ? r.id : null)`",
            "`records.reduce((acc, r) => acc + r.id, 0)`",
            "`records.find(r => r.active).id`"
          ],
          correctIndex: 0,
          explanation: "`filter` keeps active objects, and `map` transforms them to their `id` values.",
          tags: [sId, "l1", "arrays"]
        },
        {
          id: `${sId}_fb_l1_4`,
          skillId: sId,
          topic: "Type Checking & Equality",
          difficulty: "easy",
          questionType: "CONCEPTUAL",
          interviewCategory: "Type Safety",
          questionText: `In JavaScript/TypeScript runtime evaluation, what do \`typeof null\` and \`null == undefined\` evaluate to?`,
          options: ["'object' and true", "'null' and false", "'undefined' and true", "'object' and false"],
          correctIndex: 0,
          explanation: "`typeof null` returns 'object' due to historical implementation, and abstract equality (`==`) coerces `null` and `undefined` to true.",
          tags: [sId, "l1", "types"]
        },
        {
          id: `${sId}_fb_l1_5`,
          skillId: sId,
          topic: "Error Handling Execution Flow",
          difficulty: "easy",
          questionType: "DEBUGGING",
          interviewCategory: "Control Flow",
          questionText: `In what exact sequence will logs print?\n\`\`\`ts\ntry {\n  throw new Error('err');\n} catch (e) {\n  console.log('catch');\n} finally {\n  console.log('finally');\n}\n\`\`\``,
          options: ["'catch' then 'finally'", "'finally' then 'catch'", "Only 'catch'", "Only 'finally'"],
          correctIndex: 0,
          explanation: "The `catch` block processes the thrown exception first, followed guaranteed by the `finally` block.",
          tags: [sId, "l1", "exceptions"]
        },
        {
          id: `${sId}_fb_l1_6`,
          skillId: sId,
          topic: "Logical Short-Circuiting",
          difficulty: "easy",
          questionType: "CONCEPTUAL",
          interviewCategory: "Core Operators",
          questionText: `Given \`const config = false || 'fallback_mode';\`, what value does \`config\` contain?`,
          options: ["'fallback_mode'", "false", "true", "undefined"],
          correctIndex: 0,
          explanation: "The logical OR (`||`) operator evaluates the left operand. Since `false` is falsy, it evaluates and returns the right operand ('fallback_mode').",
          tags: [sId, "l1", "operators"]
        },
        {
          id: `${sId}_fb_l1_7`,
          skillId: sId,
          topic: "Object Structure Protection",
          difficulty: "easy",
          questionType: "CONCEPTUAL",
          interviewCategory: "Object Immutability",
          questionText: `Which method prevents adding new properties to an object and prevents existing properties from being deleted, but permits modifying existing writable property values?`,
          options: ["`Object.seal()`", "`Object.freeze()`", "`Object.preventExtensions()`", "`const` variable keyword"],
          correctIndex: 0,
          explanation: "`Object.seal()` prevents adding/deleting properties while allowing modifications to existing writable properties. `Object.freeze()` prevents modifications as well.",
          tags: [sId, "l1", "objects"]
        },
        {
          id: `${sId}_fb_l1_8`,
          skillId: sId,
          topic: "Async Promise Microtask Queue",
          difficulty: "easy",
          questionType: "OUTPUT_ANALYSIS",
          interviewCategory: "Asynchronous Mechanics",
          questionText: `What order will these statements print to the console?\n\`\`\`ts\nconsole.log('Start');\nPromise.resolve().then(() => console.log('Promise'));\nconsole.log('End');\n\`\`\``,
          options: ["'Start', 'End', 'Promise'", "'Start', 'Promise', 'End'", "'Promise', 'Start', 'End'", "'End', 'Start', 'Promise'"],
          correctIndex: 0,
          explanation: "Synchronous statements ('Start', 'End') run first. Resolved promise callbacks are queued as microtasks and execute immediately after current synchronous script completion.",
          tags: [sId, "l1", "async"]
        },
        {
          id: `${sId}_fb_l1_9`,
          skillId: sId,
          topic: "Data Structure Efficiency",
          difficulty: "easy",
          questionType: "DECISION_MAKING",
          interviewCategory: "Algorithmics",
          questionText: `Which data structure allows checking if a unique item exists in O(1) average time complexity?`,
          options: ["Set / Hash Table", "Array", "Linked List", "Binary Search Tree"],
          correctIndex: 0,
          explanation: "Hash-based sets provide O(1) average lookup time, whereas standard array `.includes()` requires O(N) linear scanning.",
          tags: [sId, "l1", "data_structures"]
        },
        {
          id: `${sId}_fb_l1_10`,
          skillId: sId,
          topic: "Defensive Validation",
          difficulty: "easy",
          questionType: "PROBLEM_SOLVING",
          interviewCategory: "Input Sanitization",
          questionText: `Which condition safely checks if a dynamic input \`value\` is a non-empty string without throwing runtime exceptions?`,
          options: [
            "`typeof value === 'string' && value.trim().length > 0`",
            "`value.length > 0`",
            "`String(value) !== null`",
            "`Boolean(value.trim())`"
          ],
          correctIndex: 0,
          explanation: "Checking `typeof value === 'string'` first ensures that calling `.trim()` won't throw a TypeError if `value` is null, undefined, or a number.",
          tags: [sId, "l1", "validation"]
        }
      ];
      return l1Raw.map(q => shuffleQuestionOptions(q));
    }

    if (lvl === 2) {
      const l2Raw: Question[] = [
        {
          id: `${sId}_fb_l2_1`,
          skillId: sId,
          topic: "Async Race Condition Prevention",
          difficulty: "medium",
          questionType: "DEBUGGING",
          interviewCategory: "Async State Synchronization",
          questionText: `In an autocomplete search field, rapid typing triggers multiple HTTP requests. If Request 1 (sent first) takes 800ms and Request 2 (sent second) takes 200ms, how do you prevent Request 1's late response from overwriting state?`,
          options: [
            "Use an AbortController or a request sequence ID to cancel or ignore stale responses",
            "Set a fixed setTimeout delay of 1000ms after every API call",
            "Force all API calls to run synchronously on the main thread",
            "Increase server memory capacity"
          ],
          correctIndex: 0,
          explanation: "AbortControllers cancel in-flight requests on new inputs, and request sequence IDs ensure late-arriving responses are discarded if they belong to an older request.",
          tags: [sId, "l2", "race_conditions"]
        },
        {
          id: `${sId}_fb_l2_2`,
          skillId: sId,
          topic: "Memory Leak Diagnostics",
          difficulty: "medium",
          questionType: "DEBUGGING",
          interviewCategory: "Memory Management",
          questionText: `Identify the root cause of the memory leak in this component handler:\n\`\`\`ts\nfunction attachHandler() {\n  const heavyBuffer = new Array(1000000).fill('data');\n  window.addEventListener('resize', () => {\n    console.log(heavyBuffer.length);\n  });\n}\n\`\`\``,
          options: [
            "The event listener retains a closure reference to `heavyBuffer` and is never removed from `window`",
            "Array length calculation consumes excessive CPU cycles",
            "window.addEventListener cannot handle large arrays",
            "`heavyBuffer` needs to be declared as global `var`"
          ],
          correctIndex: 0,
          explanation: "Persistent global event listeners keep closure references alive indefinitely, preventing garbage collection of objects closed over by the handler.",
          tags: [sId, "l2", "memory_leak"]
        },
        {
          id: `${sId}_fb_l2_3`,
          skillId: sId,
          topic: "Immutable State Updates",
          difficulty: "medium",
          questionType: "DEBUGGING",
          interviewCategory: "State Mutation Bugs",
          questionText: `Why does this state update fail to trigger a UI re-render?\n\`\`\`ts\nconst [state, setState] = useState({ score: 10 });\nstate.score = 20;\nsetState(state);\n\`\`\``,
          options: [
            "Object reference identity did not change (`Object.is(oldState, newState)` is true), so re-render is skipped",
            "useState requires score to be wrapped in a Promise",
            "setState is synchronous and blocks the render tree",
            "The object must be frozen before calling setState"
          ],
          correctIndex: 0,
          explanation: "UI frameworks perform identity checks (`Object.is`). Mutating an existing object in place retains the same reference address, so the state updater assumes no change occurred.",
          tags: [sId, "l2", "react_state"]
        },
        {
          id: `${sId}_fb_l2_4`,
          skillId: sId,
          topic: "Middleware Execution Flow",
          difficulty: "medium",
          questionType: "PROBLEM_SOLVING",
          interviewCategory: "API Pipeline Architecture",
          questionText: `In an API middleware pipeline \`app.use(authCheck, handler)\`, what happens if \`authCheck\` fails to invoke \`next()\` or send an HTTP response?`,
          options: [
            "The client HTTP request hangs until it hits a socket timeout",
            "The pipeline automatically bypasses authCheck and calls handler",
            "The runtime throws a fatal uncaught exception",
            "An HTTP 500 error is returned automatically"
          ],
          correctIndex: 0,
          explanation: "Express/Node middleware must either pass control downstream via `next()` or terminate the cycle with `res.send()`. Omitting both leaves the TCP connection open indefinitely.",
          tags: [sId, "l2", "middleware"]
        },
        {
          id: `${sId}_fb_l2_5`,
          skillId: sId,
          topic: "SQL / Query Performance",
          difficulty: "medium",
          questionType: "PROBLEM_SOLVING",
          interviewCategory: "Database Optimization",
          questionText: `An API endpoint queries 100 orders, then executes 1 individual SQL query per order to fetch user details (101 total queries). What is this bottleneck, and how is it resolved?`,
          options: [
            "N+1 Query Problem; fix by using a single `JOIN` or batch `WHERE IN (...)` query",
            "Deadlock vulnerability; fix by adding mutex locks",
            "Memory leak; fix by allocating more heap memory",
            "Race condition; fix by reducing TCP pool size"
          ],
          correctIndex: 0,
          explanation: "Executing a database query inside an iteration loop creates N+1 query overhead. Joining tables or fetching keys with `IN` reduces database round-trips from N+1 down to 1.",
          tags: [sId, "l2", "sql"]
        },
        {
          id: `${sId}_fb_l2_6`,
          skillId: sId,
          topic: "Debounce vs Throttle",
          difficulty: "medium",
          questionType: "DECISION_MAKING",
          interviewCategory: "Rate Limiting & UX",
          questionText: `You need an input handler that waits until the user pauses typing for 300ms before firing a search API call. Which rate-limiting strategy is appropriate?`,
          options: ["Debouncing", "Throttling", "Polling", "Memoization"],
          correctIndex: 0,
          explanation: "Debouncing resets the delay timer on each event, executing only after inactivity. Throttling enforces a fixed maximum execution frequency during continuous triggers.",
          tags: [sId, "l2", "debounce"]
        },
        {
          id: `${sId}_fb_l2_7`,
          skillId: sId,
          topic: "Caching & Invalidation",
          difficulty: "medium",
          questionType: "DECISION_MAKING",
          interviewCategory: "Performance Caching",
          questionText: `Which HTTP Cache-Control directive delivers instant responses from browser cache while asynchronously updating the cached item from the network in the background?`,
          options: [
            "`Cache-Control: max-age=0, stale-while-revalidate=60`",
            "`Cache-Control: no-store`",
            "`Cache-Control: private, immutable`",
            "`Cache-Control: must-revalidate`"
          ],
          correctIndex: 0,
          explanation: "`stale-while-revalidate` serves cached content instantly to eliminate latency while fetching fresh content in the background for subsequent requests.",
          tags: [sId, "l2", "caching"]
        },
        {
          id: `${sId}_fb_l2_8`,
          skillId: sId,
          topic: "Refactoring Impure Logic",
          difficulty: "medium",
          questionType: "DEBUGGING",
          interviewCategory: "Functional Principles",
          questionText: `Why is this function considered impure and difficult to unit test?\n\`\`\`ts\nfunction calcPrice(price: number) {\n  return price * (1 + window.TAX_RATE);\n}\n\`\`\``,
          options: [
            "It relies on global mutable state (`window.TAX_RATE`) rather than explicit parameters",
            "It returns a number instead of an object",
            "It lacks a try/catch wrapper",
            "It uses multiplication instead of addition"
          ],
          correctIndex: 0,
          explanation: "Pure functions depend exclusively on their explicit input parameters and produce zero side effects. Reading global window variables makes testing dependent on ambient state.",
          tags: [sId, "l2", "pure_functions"]
        },
        {
          id: `${sId}_fb_l2_9`,
          skillId: sId,
          topic: "Input Sanitization & XSS",
          difficulty: "medium",
          questionType: "DECISION_MAKING",
          interviewCategory: "Security Engineering",
          questionText: `Which approach effectively prevents Cross-Site Scripting (XSS) when displaying user-generated string content in modern web interfaces?`,
          options: [
            "Using textContent / escaping HTML entities rather than direct innerHTML injection",
            "Encoding strings into Base64 before rendering",
            "Wrapping user strings in a try/catch block",
            "Storing user content in local storage"
          ],
          correctIndex: 0,
          explanation: "Setting textContent or escaping HTML characters treats input strictly as text nodes, preventing the browser's DOM parser from executing embedded `<script>` tags.",
          tags: [sId, "l2", "security"]
        },
        {
          id: `${sId}_fb_l2_10`,
          skillId: sId,
          topic: "Circuit Breaker Resilience",
          difficulty: "medium",
          questionType: "DECISION_MAKING",
          interviewCategory: "System Reliability",
          questionText: `When integrating a third-party payment gateway that experiences sudden intermittent outages, what is the best architectural pattern to prevent cascading API timeouts?`,
          options: [
            "Implement a Circuit Breaker with a fallback response and rate-limiting",
            "Retry the failed HTTP request synchronously in an infinite loop",
            "Crash the microservice process immediately to force container restart",
            "Increase HTTP connection timeout to 120 seconds"
          ],
          correctIndex: 0,
          explanation: "A Circuit Breaker trips 'OPEN' when error thresholds are exceeded, instantly returning fallback responses without hammering down downstream services during outages.",
          tags: [sId, "l2", "circuit_breaker"]
        }
      ];
      return l2Raw.map(q => shuffleQuestionOptions(q));
    }

    // Level 3 (Hard / Advanced Architecture)
    const l3Raw: Question[] = [
      {
        id: `${sId}_fb_l3_1`,
        skillId: sId,
        topic: "Event Loop Queue Starvation",
        difficulty: "hard",
        questionType: "OUTPUT_ANALYSIS",
        interviewCategory: "Concurrency & Runtime Engine",
        questionText: `What happens to the event loop if a recursive microtask loop is executed?\n\`\`\`ts\nfunction blockLoop() {\n  Promise.resolve().then(blockLoop);\n}\nblockLoop();\n\`\`\``,
        options: [
          "Microtasks exhaust the microtask queue continuously, starving I/O polling, timers, and rendering completely",
          "It throws a RangeError: Maximum call stack size exceeded",
          "Node.js automatically delegates the loop to a background worker thread",
          "The process exits cleanly with code 0"
        ],
        correctIndex: 0,
        explanation: "Microtasks are drained completely before the event loop advances to the next phase (macrotasks/I/O). Infinite microtask recursion starves timers and I/O handlers without throwing stack overflow errors.",
        tags: [sId, "l3", "event_loop"]
      },
      {
        id: `${sId}_fb_l3_2`,
        skillId: sId,
        topic: "Distributed Locking Mechanics",
        difficulty: "hard",
        questionType: "DECISION_MAKING",
        interviewCategory: "Distributed Systems",
        questionText: `When implementing a distributed lock across multiple Redis nodes (e.g. Redlock), why is relying strictly on system wall-clock time dangerous?`,
        options: [
          "System clock drift (NTP jumps) between nodes can cause locks to expire prematurely, leading to dual-master concurrent writes",
          "Redis operations are purely synchronous and ignore timestamps",
          "Wall-clock time increases CPU memory overhead",
          "Distributed locks require client-side WebSockets"
        ],
        correctIndex: 0,
        explanation: "Unsynchronized clocks across nodes cause lock expiration timers to drift, allowing Node B to acquire a lock that Node A still considers valid.",
        tags: [sId, "l3", "distributed_locks"]
      },
      {
        id: `${sId}_fb_l3_3`,
        skillId: sId,
        topic: "Circuit Breaker State Machine",
        difficulty: "hard",
        questionType: "CONCEPTUAL",
        interviewCategory: "Resilience Engineering",
        questionText: `In a production Circuit Breaker state machine, what condition triggers the transition from 'OPEN' state to 'HALF-OPEN' state?`,
        options: [
          "An elapsed reset timeout period allowing a limited probe request to test downstream service recovery",
          "Reaching a 100% success rate during peak traffic",
          "A manual container process restart",
          "Receiving an HTTP 500 internal server error"
        ],
        correctIndex: 0,
        explanation: "After remaining OPEN for a configured sleep window, the breaker enters HALF-OPEN to send trial requests. Success transitions it back to CLOSED; failure trips it back to OPEN.",
        tags: [sId, "l3", "resilience"]
      },
      {
        id: `${sId}_fb_l3_4`,
        skillId: sId,
        topic: "Garbage Collection & Memory Tuning",
        difficulty: "hard",
        questionType: "PROBLEM_SOLVING",
        interviewCategory: "V8 Engine Performance",
        questionText: `A high-throughput API experiences periodic 500ms 'Stop-the-World' garbage collection pauses during heavy traffic. Which architectural change directly reduces GC pressure?`,
        options: [
          "Reusing object buffers via object pooling and avoiding short-lived object allocations inside hot execution loops",
          "Allocating large global arrays on every incoming request",
          "Disabling V8 garbage collection flags",
          "Increasing CPU clock speeds"
        ],
        correctIndex: 0,
        explanation: "Reducing allocation velocity in hot loops minimizes young-generation garbage creation, decreasing Scavenge and Mark-Sweep GC pause frequency.",
        tags: [sId, "l3", "gc_tuning"]
      },
      {
        id: `${sId}_fb_l3_5`,
        skillId: sId,
        topic: "Zero-Downtime Migration Pattern",
        difficulty: "hard",
        questionType: "DECISION_MAKING",
        interviewCategory: "Database Architecture",
        questionText: `To rename a database column \`user_fullname\` to \`full_name\` on a live table with millions of active users without downtime, which sequence is required?`,
        options: [
          "Expand-Contract pattern: add `full_name`, dual-write both columns in app, backfill historical data, switch reads to `full_name`, drop `user_fullname`",
          "Lock the database table for 1 hour during peak usage and execute `ALTER TABLE RENAME COLUMN`",
          "Export DB table to CSV, alter schema offline, and re-import",
          "Drop `user_fullname` and recreate `full_name` instantly"
        ],
        correctIndex: 0,
        explanation: "The Expand-Contract pattern guarantees backward compatibility between old and new application deployments during rolling releases.",
        tags: [sId, "l3", "migrations"]
      },
      {
        id: `${sId}_fb_l3_6`,
        skillId: sId,
        topic: "Rate Limiting Algorithms",
        difficulty: "hard",
        questionType: "DECISION_MAKING",
        interviewCategory: "Traffic Management",
        questionText: `Which rate-limiting algorithm permits bursty traffic up to a maximum bucket capacity while continuously replenishing tokens at a smooth background rate?`,
        options: ["Token Bucket / Leaky Bucket", "Fixed Window Counter", "Sliding Window Log", "Exponential Backoff"],
        correctIndex: 0,
        explanation: "Token Bucket handles bursty traffic smoothly by consuming pre-replenished tokens from a bucket up to capacity.",
        tags: [sId, "l3", "token_bucket"]
      },
      {
        id: `${sId}_fb_l3_7`,
        skillId: sId,
        topic: "Database Deadlock Prevention",
        difficulty: "hard",
        questionType: "DEBUGGING",
        interviewCategory: "Database Concurrency",
        questionText: `Transaction 1 locks Row A then attempts to lock Row B. Concurrently, Transaction 2 locks Row B then attempts to lock Row A. What occurs, and how is it systematically prevented?`,
        options: [
          "A deadlock occurs; fix by enforcing a strict, deterministic lock acquisition ordering across all transactions",
          "A memory leak occurs; fix by allocating more RAM",
          "An N+1 query issue occurs; fix with composite indexes",
          "A race condition occurs; fix by disabling transactions"
        ],
        correctIndex: 0,
        explanation: "Deadlocks happen when two transactions wait on resources locked by each other. Enforcing identical key access order (e.g. sorting keys alphabetically before locking) eliminates deadlocks.",
        tags: [sId, "l3", "deadlocks"]
      },
      {
        id: `${sId}_fb_l3_8`,
        skillId: sId,
        topic: "Heap Snapshot Retainers",
        difficulty: "hard",
        questionType: "DEBUGGING",
        interviewCategory: "Profiling & Diagnostics",
        questionText: `When analyzing V8 heap snapshots in Chrome DevTools to locate an un-collected object, what does the 'Retainers' tree display?`,
        options: [
          "The hierarchy of reference paths holding the object in memory and preventing garbage collection",
          "The CPU instruction execution history",
          "The total network payload bytes consumed",
          "The list of pending promises"
        ],
        correctIndex: 0,
        explanation: "The Retainer graph traces roots (e.g., window, global scope) down to the object, highlighting the exact reference keeping it alive in memory.",
        tags: [sId, "l3", "heap_snapshot"]
      },
      {
        id: `${sId}_fb_l3_9`,
        skillId: sId,
        topic: "Distributed Consensus (Raft)",
        difficulty: "hard",
        questionType: "CONCEPTUAL",
        interviewCategory: "Distributed Systems",
        questionText: `In the Raft consensus protocol, what condition must a Leader node fulfill before committing an entry to the cluster state machine?`,
        options: [
          "The entry must be replicated on a majority (quorum) of cluster nodes",
          "100% of follower nodes must confirm receipt",
          "The leader must wait for a 10-second timer to elapse",
          "An external coordinator must sign the transaction"
        ],
        correctIndex: 0,
        explanation: "Quorum consensus requires majority replication (`(N/2) + 1` nodes) to guarantee state consistency across partition failovers.",
        tags: [sId, "l3", "raft_consensus"]
      },
      {
        id: `${sId}_fb_l3_10`,
        skillId: sId,
        topic: "Thundering Herd Mitigation",
        difficulty: "hard",
        questionType: "DECISION_MAKING",
        interviewCategory: "High Concurrency Architecture",
        questionText: `When a hot cache key expires, 50,000 concurrent requests simultaneously miss cache and query the backend database (Cache Stampede / Thundering Herd). How is this prevented?`,
        options: [
          "Use Request Collapsing (Singleflight / Mutex) and add randomized jitter to cache TTL expiration times",
          "Increase database connection timeout limits to 300s",
          "Disable server caching entirely",
          "Return HTTP 500 error codes to 90% of requests"
        ],
        correctIndex: 0,
        explanation: "Singleflight coalesces duplicate concurrent key requests so only 1 request queries the DB while others await its result, and TTL jitter prevents synchronized key expirations.",
        tags: [sId, "l3", "thundering_herd"]
      }
    ];
    return l3Raw.map(q => shuffleQuestionOptions(q));
  };

  const currentQ = levelQuestions[currentQIndex];

  const handleSubmitAnswer = useCallback(() => {
    if (selectedOptionIndex === null || isAnswerSubmitted || isSubmittingNext) return;
    setIsAnswerSubmitted(true);
  }, [selectedOptionIndex, isAnswerSubmitted, isSubmittingNext]);

  const handleNextQuestion = useCallback(() => {
    if (selectedOptionIndex === null || !currentQ || isSubmittingNext) return;
    setIsSubmittingNext(true);

    const isCorrect = selectedOptionIndex === currentQ.correctIndex;

    const detail: QuestionAnswerDetail = {
      questionId: currentQ.id,
      topic: currentQ.topic,
      selectedIndex: selectedOptionIndex,
      correct: isCorrect,
      difficulty: currentQ.difficulty
    };

    const currentLevelDetails = [...(levelAnswerDetails[activeLevel] || []), detail];
    const updatedLevelDetails = {
      ...levelAnswerDetails,
      [activeLevel]: currentLevelDetails
    };
    setLevelAnswerDetails(updatedLevelDetails);

    if (currentQIndex < levelQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
      setIsSubmittingNext(false);
    } else {
      // Level 10 questions complete! Calculate Level Score
      const correctCount = currentLevelDetails.filter(d => d.correct).length;
      const totalCount = currentLevelDetails.length;
      const levelScore = Math.round((correctCount / totalCount) * 100);

      const updatedScores = {
        ...levelScores,
        [activeLevel]: levelScore
      };
      setLevelScores(updatedScores);
      setLevelCompletedModal(true);
      setIsSubmittingNext(false);
    }
  }, [selectedOptionIndex, currentQ, isSubmittingNext, activeLevel, levelAnswerDetails, currentQIndex, levelQuestions.length, levelScores]);

  // Keyboard shortcut listener for option selection (1-4, A-D, and Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoadingQuestions || levelCompletedModal || !currentQ) return;

      const key = e.key.toUpperCase();
      if (!isAnswerSubmitted) {
        if (['1', 'A'].includes(key) && currentQ.options[0]) setSelectedOptionIndex(0);
        else if (['2', 'B'].includes(key) && currentQ.options[1]) setSelectedOptionIndex(1);
        else if (['3', 'C'].includes(key) && currentQ.options[2]) setSelectedOptionIndex(2);
        else if (['4', 'D'].includes(key) && currentQ.options[3]) setSelectedOptionIndex(3);
        else if (e.key === 'Enter' && selectedOptionIndex !== null) {
          e.preventDefault();
          handleSubmitAnswer();
        }
      } else {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoadingQuestions, levelCompletedModal, currentQ, isAnswerSubmitted, selectedOptionIndex, handleSubmitAnswer, handleNextQuestion]);

  const handleFinishAssessment = () => {
    // Combine all 3 levels scores (or completed levels)
    const completedScores = Object.values(levelScores) as number[];
    const overallAvgScore = completedScores.length > 0
      ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
      : 0;

    const allDetails: QuestionAnswerDetail[] = (Object.values(levelAnswerDetails) as QuestionAnswerDetail[][]).flat();
    const correctTotal = allDetails.filter(d => d.correct).length;

    const attempt: Attempt = {
      id: `attempt_${Date.now()}`,
      timestamp: Date.now(),
      skillId: skill.id,
      score: overallAvgScore,
      correctCount: correctTotal,
      totalCount: allDetails.length || 30,
      details: allDetails,
      levelScores: levelScores
    };

    onComplete(attempt);
  };

  const totalInLevel = levelQuestions.length || 10;
  const progressPct = ((currentQIndex + 1) / totalInLevel) * 100;

  // Calculate current average across completed levels
  const completedLevelValues = Object.values(levelScores) as number[];
  const currentOverallAvg = completedLevelValues.length > 0
    ? Math.round(completedLevelValues.reduce((a, b) => a + b, 0) / completedLevelValues.length)
    : null;

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={onCancel}
            className="k-btn-ghost text-xs px-0 hover:bg-transparent mb-1"
          >
            ← QUIT ASSESSMENT
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">{skill.name} Evaluation</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                3 Progressive Levels (10 Scenarios per Level) • Passing Threshold: ≥80% Score
              </p>
            </div>
          </div>
        </div>

        {/* Current Average Badge */}
        {currentOverallAvg !== null && (
          <div className="k-card p-3 flex items-center gap-3 shrink-0">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Competency Score</span>
              <span className={`text-lg font-extrabold k-metric-value ${
                currentOverallAvg >= 80 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {currentOverallAvg}%
              </span>
            </div>
            <span className={`k-badge ${currentOverallAvg >= 80 ? 'k-badge-strong' : 'k-badge-warning'}`}>
              {currentOverallAvg >= 80 ? 'Passed (≥80%)' : 'Needs ≥80%'}
            </span>
          </div>
        )}
      </div>

      {/* 3 Level Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { lvl: 1, name: "Level 1: Foundational Mechanics", desc: "Core Logic & Syntax • Easy" },
          { lvl: 2, name: "Level 2: Intermediate Applied", desc: "Debugging, Errors & Tradeoffs • Medium" },
          { lvl: 3, name: "Level 3: Advanced Architecture", desc: "System Design & Theory • Hard" }
        ].map((item) => {
          const isCurrent = activeLevel === item.lvl;
          const score = levelScores[item.lvl];
          const unlocked = isLevelUnlocked(item.lvl);
          const isPrefetched = !!(questionsCacheRef.current[item.lvl] && questionsCacheRef.current[item.lvl].length > 0);

          return (
            <button
              key={item.lvl}
              disabled={!unlocked}
              onClick={() => {
                if (unlocked && activeLevel !== item.lvl && !levelCompletedModal) {
                  setActiveLevel(item.lvl);
                }
              }}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                !unlocked
                  ? 'bg-slate-950/80 border-slate-900 opacity-60 cursor-not-allowed'
                  : isCurrent
                  ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/10 cursor-pointer'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`k-badge ${
                  isCurrent ? 'k-badge-strong' : unlocked ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-900 text-slate-500 border-slate-850'
                }`}>
                  Level {item.lvl}
                </span>

                {!unlocked ? (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                ) : score !== undefined ? (
                  <span className={`k-badge ${score >= 80 ? 'k-badge-strong' : 'k-badge-warning'}`}>
                    Score: {score}%
                  </span>
                ) : isPrefetched ? (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <Zap className="w-2.5 h-2.5" /> Ready
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">In Progress</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-100 mt-2.5 flex items-center justify-between">
                <span>{item.name}</span>
                {!unlocked && <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-1" />}
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                {!unlocked ? `Complete Level ${item.lvl - 1} first to unlock` : item.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Level Completed Modal */}
      {levelCompletedModal ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="k-card p-8 max-w-xl mx-auto text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-100">Level {activeLevel} Evaluation Complete</h3>
            <p className="text-xs text-slate-400">
              You scored <strong className="text-emerald-400 font-mono text-base">{levelScores[activeLevel]}%</strong> in Level {activeLevel} ({skill.name}).
            </p>
          </div>

          {/* Level Scores Summary Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-left">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Level Evaluation Breakdown</span>
            <div className="space-y-2">
              {[1, 2, 3].map((lvl) => (
                <div key={lvl} className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-mono">Level {lvl} Score:</span>
                  <span className="font-mono font-bold text-slate-100 k-metric-value">
                    {levelScores[lvl] !== undefined ? `${levelScores[lvl]}%` : 'Pending'}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-400 font-mono">Competency Aggregate:</span>
                <span className="font-mono font-extrabold text-emerald-400 text-sm k-metric-value">
                  {currentOverallAvg !== null ? `${currentOverallAvg}%` : 'Calculating...'}
                </span>
              </div>
            </div>
          </div>

          {/* Post-Level Feedback Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Level {activeLevel} Candidate Feedback
              </span>
              {feedbackSubmitted && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  Submitted ✨
                </span>
              )}
            </div>

            {!feedbackSubmitted ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">How was your assessment experience for Level {activeLevel}?</p>
                
                {/* 5 Emojis Rating */}
                <div className="grid grid-cols-5 gap-1.5">
                  {EMOJI_OPTIONS.map((item) => {
                    const isSel = selectedRating?.emoji === item.emoji;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setSelectedRating(item)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSel
                            ? 'bg-emerald-500/20 border-emerald-400 scale-105'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="text-[9px] font-mono font-semibold text-slate-300 leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Textbox */}
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share feedback on level clarity or difficulty..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />

                <button
                  disabled={!selectedRating || isSubmittingFeedback}
                  onClick={handleSendLevelFeedback}
                  className="w-full k-btn-secondary text-xs py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSubmittingFeedback ? 'Saving Feedback...' : 'Submit Level Feedback'}</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center space-y-1">
                <p className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  Thank you! Feedback saved for Admin review.
                </p>
              </div>
            )}
          </div>

          {/* Buttons for next step */}
          <div className="space-y-3 pt-2">
            {activeLevel < 3 ? (
              <button
                onClick={() => {
                  setLevelCompletedModal(false);
                  resetFeedbackState();
                  const nextLvl = activeLevel + 1;
                  setActiveLevel(nextLvl);
                }}
                className="w-full k-btn-primary text-xs py-3"
              >
                <span>Proceed to Level {activeLevel + 1} Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishAssessment}
                className="w-full k-btn-primary text-xs py-3"
              >
                <span>Finish & Save Core Competency Score</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                setLevelCompletedModal(false);
                resetFeedbackState();
                loadQuestionsForLevel(activeLevel);
              }}
              className="w-full k-btn-secondary text-xs py-2.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Re-evaluate Level {activeLevel}</span>
            </button>
          </div>

        </motion.div>
      ) : isLoadingQuestions ? (
        <div className="k-card p-16 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Fetching Level {activeLevel} Evaluation Scenarios for {skill.name}...</p>
        </div>
      ) : currentQ ? (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="k-card p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <span className="font-mono text-slate-300 font-bold">
                Level {activeLevel} • Question {currentQIndex + 1} of {totalInLevel}
              </span>
              
              <div className="flex flex-wrap items-center gap-2">
                {currentQ.questionType && (
                  <span className="k-badge k-badge-moderate">
                    {currentQ.questionType}
                  </span>
                )}
                {currentQ.interviewCategory && (
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                    {currentQ.interviewCategory}
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-400">
                  Topic: <strong className="text-slate-200">{currentQ.topic}</strong>
                </span>
              </div>
            </div>
            
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <motion.div 
                className="bg-emerald-500 h-full rounded-full"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Question Box */}
          <motion.div 
            key={currentQ.id || currentQIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="k-card p-6 md:p-8 space-y-6 relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="k-badge k-badge-strong">
                  <Cpu className="w-3.5 h-3.5" />
                  Competency Scenario
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  (Keys 1-4 or A-D to select, Enter to confirm)
                </span>
              </div>

              <p className="text-slate-100 text-base md:text-lg font-medium leading-relaxed font-sans">
                "{currentQ.questionText}"
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, index) => {
                const isSelected = selectedOptionIndex === index;
                const isCorrect = currentQ.correctIndex === index;
                const letter = optionLetters[index] || (index + 1);
                
                let btnStyle = 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900';
                
                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
                  } else if (isSelected) {
                    btnStyle = 'border-rose-500/50 bg-rose-500/10 text-rose-300';
                  } else {
                    btnStyle = 'border-slate-900 bg-slate-950/20 text-slate-600 pointer-events-none';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
                }

                return (
                  <button
                    key={index}
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedOptionIndex(index)}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between gap-3 ${btnStyle} ${!isAnswerSubmitted ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {letter}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </div>
                    
                    {isAnswerSubmitted ? (
                      isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      ) : null
                    ) : (
                      <div className={`w-4 h-4 rounded-full border shrink-0 transition-all ${
                        isSelected ? 'border-emerald-400 bg-emerald-500/30' : 'border-slate-700'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {isAnswerSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-2"
                >
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-bold">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    TECHNICAL INTERVIEW ANALYSIS & EXPLANATION
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed font-sans">
                    {currentQ.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-500">
                Press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Enter ↵</kbd> to {!isAnswerSubmitted ? 'confirm selection' : 'advance'}
              </span>

              {!isAnswerSubmitted ? (
                <button
                  disabled={selectedOptionIndex === null}
                  onClick={handleSubmitAnswer}
                  className="k-btn-primary text-xs"
                >
                  <span>Submit Answer</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled={isSubmittingNext}
                  onClick={handleNextQuestion}
                  className="k-btn-primary text-xs"
                >
                  <span>{currentQIndex === totalInLevel - 1 ? `Finish Level ${activeLevel}` : 'Next Question'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </motion.div>
        </div>
      ) : null}

    </div>
  );
}

