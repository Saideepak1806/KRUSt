import { useState, useEffect, useRef } from 'react';
import { Career } from '../types';
import { 
  Mic, MicOff, Volume2, VolumeX, Sparkles, Send, RotateCcw, 
  CheckCircle2, AlertTriangle, ArrowRight, Bot, User, 
  ShieldCheck, MessageSquare, Award, Loader2, Play, RefreshCw,
  HelpCircle, Settings, Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface AIInterviewProps {
  career: Career;
  level?: number;
  onBack: () => void;
  onPassNextLevel?: () => void;
}

type MicPermissionState = 'unrequested' | 'checking' | 'granted' | 'denied' | 'unsupported';
type InterviewStage = 'setup' | 'preparing' | 'ai_speaking' | 'your_turn' | 'listening' | 'processing' | 'evaluated';

export default function AIInterview({
  career,
  level = 1,
  onBack,
  onPassNextLevel
}: AIInterviewProps) {
  const [currentLevel, setCurrentLevel] = useState<number>(level);
  const [questionIndex, setQuestionIndex] = useState<number>(0); // 0, 1, 2 (3 questions per level)
  
  // Interview Lifecycle Stage & Status Text
  const [interviewStage, setInterviewStage] = useState<InterviewStage>('setup');
  const [micState, setMicState] = useState<MicPermissionState>('unrequested');
  const [micDeviceLabel, setMicDeviceLabel] = useState<string>('');

  const [greetingText, setGreetingText] = useState<string>('');
  const [questionText, setQuestionText] = useState<string>('');
  const [questionContext, setQuestionContext] = useState<string>('');
  const [isLoadingQuestion, setIsLoadingQuestion] = useState<boolean>(false);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);

  const [userAnswer, setUserAnswer] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [micError, setMicError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const shouldKeepRecordingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  // Track evaluations for current level's 3 questions
  const [levelEvaluations, setLevelEvaluations] = useState<any[]>([]);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);

  // Initialize Speech Synthesis Voice list
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices || []);
        } catch (e) {}
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  // Check initial mic permission status without triggering browser prompt
  useEffect(() => {
    const checkInitialPermission = async () => {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRec) {
        setSpeechSupported(false);
      }

      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (result.state === 'granted') {
            setMicState('granted');
          } else if (result.state === 'denied') {
            setMicState('denied');
          }
          result.onchange = () => {
            if (result.state === 'granted') setMicState('granted');
            if (result.state === 'denied') setMicState('denied');
          };
        } catch (e) {
          // Query not supported, will prompt explicitly
        }
      }
    };
    checkInitialPermission();
  }, []);

  // Explicit User Action: Request Microphone Permission & Test Audio Stream
  const handleEnableMicrophone = async () => {
    setMicState('checking');
    setMicError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicState('unsupported');
      setMicError('Your browser does not support audio recording. You can still participate by typing your answers.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tracks = stream.getAudioTracks();
      if (tracks.length > 0) {
        setMicDeviceLabel(tracks[0].label || 'Default Microphone');
      }
      
      // Clean up stream immediately after verification
      tracks.forEach(track => track.stop());

      // Initialize Speech Recognition instance
      setupSpeechRecognition();

      setMicState('granted');
      setMicError(null);
    } catch (err: any) {
      console.warn('Microphone permission request failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicState('denied');
        setMicError('Microphone permission was denied by the browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicState('unsupported');
        setMicError('No microphone hardware detected on your device.');
      } else {
        setMicState('denied');
        setMicError(`Unable to access microphone: ${err.message || 'Permission failed'}`);
      }
    }
  };

  // Speech Recognition (STT) Setup
  const setupSpeechRecognition = () => {
    try {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec && typeof SpeechRec === 'function') {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsRecording(true);
          setMicError(null);
          setInterviewStage('listening');
        };

        rec.onresult = (event: any) => {
          let interim = '';
          let finalStr = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalStr += transcript + ' ';
            } else {
              interim += transcript;
            }
          }

          if (finalStr.trim()) {
            setUserAnswer((prev) => {
              const cleanedPrev = prev.trim();
              const cleanedFinal = finalStr.trim();
              return cleanedPrev ? `${cleanedPrev} ${cleanedFinal}` : cleanedFinal;
            });
            setInterimTranscript('');
          } else if (interim) {
            setInterimTranscript(interim);
          }
        };

        rec.onerror = (event: any) => {
          console.warn('Speech recognition error event:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            shouldKeepRecordingRef.current = false;
            setIsRecording(false);
            setMicState('denied');
            setMicError('Microphone access was revoked or denied by the browser.');
            if (interviewStage === 'listening') {
              setInterviewStage('your_turn');
            }
          } else if (event.error === 'no-speech') {
            // Silence - keep recording if user intended to speak
          } else if (event.error === 'audio-capture') {
            setIsRecording(false);
            shouldKeepRecordingRef.current = false;
            setMicError('No audio capture device found. Check your microphone connection.');
          }
        };

        rec.onend = () => {
          // Do NOT restart if AI is speaking via TTS or if recording was explicitly stopped
          if (shouldKeepRecordingRef.current && !isSpeakingRef.current) {
            try {
              rec.start();
            } catch (e) {
              setIsRecording(false);
              shouldKeepRecordingRef.current = false;
              if (interviewStage === 'listening') setInterviewStage('your_turn');
            }
          } else {
            setIsRecording(false);
            setInterimTranscript('');
            if (interviewStage === 'listening') {
              setInterviewStage('your_turn');
            }
          }
        };

        recognitionRef.current = rec;
        setSpeechSupported(true);
      } else {
        setSpeechSupported(false);
      }
    } catch (err) {
      console.warn('SpeechRecognition init error:', err);
      setSpeechSupported(false);
    }
  };

  // Helper to select a clear voice
  const getPreferredVoice = (): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window) || !window.speechSynthesis) return null;
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Search for English voice options
    const match = voices.find(v => 
      v.lang === 'en-US' || 
      v.lang === 'en-GB' || 
      v.lang === 'en-IN' ||
      v.lang.startsWith('en')
    );

    return match || voices[0] || null;
  };

  // TTS Speech Synthesis with Strict STT Mutex
  const speakText = (text: string, onComplete?: () => void) => {
    if (isMuted) {
      setInterviewStage('your_turn');
      if (onComplete) onComplete();
      return;
    }

    try {
      if (!('speechSynthesis' in window) || !window.speechSynthesis) {
        setInterviewStage('your_turn');
        if (onComplete) onComplete();
        return;
      }

      // CRITICAL: Stop STT microphone immediately before TTS starts to prevent audio feedback loop
      shouldKeepRecordingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsRecording(false);

      window.speechSynthesis.cancel();

      const UtteranceClass = (window as any).SpeechSynthesisUtterance;
      if (!UtteranceClass || typeof UtteranceClass !== 'function') {
        setInterviewStage('your_turn');
        if (onComplete) onComplete();
        return;
      }

      const utterance = new UtteranceClass(text);
      const chosenVoice = getPreferredVoice();
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang || 'en-US';
      } else {
        utterance.lang = 'en-US';
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
        setInterviewStage('ai_speaking');
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setInterviewStage('your_turn');
        if (onComplete) onComplete();
      };

      utterance.onerror = (e) => {
        console.warn('TTS utterance error:', e);
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setInterviewStage('your_turn');
        if (onComplete) onComplete();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis speak error:', e);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setInterviewStage('your_turn');
      if (onComplete) onComplete();
    }
  };

  // Load question for specific level and question index
  const loadQuestion = async (lvl: number, qIdx: number, prevs: string[] = []) => {
    setIsLoadingQuestion(true);
    setInterviewStage('preparing');
    setEvaluation(null);
    setUserAnswer('');
    setInterimTranscript('');
    setMicError(null);

    // Ensure STT is stopped while loading
    shouldKeepRecordingRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsRecording(false);

    let greeting = '';
    let qText = '';
    let qContext = '';

    // First Question in Level 1: Opening Greeting + Tell me about yourself
    if (lvl === 1 && qIdx === 0) {
      greeting = `Welcome to your AI Mock Interview for the position of ${career.name}. I am your AI Lead Interviewer. Let's begin Level 1.`;
      qText = `Tell me about yourself, your background, and why you are interested in the ${career.name} role.`;
      qContext = `Level 1 • General Introduction & Background (Question 1 of 3)`;

      setGreetingText(greeting);
      setQuestionText(qText);
      setQuestionContext(qContext);
      setIsLoadingQuestion(false);

      const fullSpeech = `${greeting} First question: ${qText}`;
      speakText(fullSpeech);
      return;
    }

    // Technical AI question fetching
    setGreetingText('');
    try {
      const res = await fetch('/api/interview/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: career.name,
          level: lvl,
          questionIndex: qIdx,
          previousQuestions: prevs
        })
      });
      const data = await res.json();
      qText = data.questionText || `Walk me through how you solve high-priority technical tasks in ${career.name}.`;
      qContext = `Level ${lvl} • Technical Competency (Question ${qIdx + 1} of 3)`;

      setQuestionText(qText);
      setQuestionContext(data.context || qContext);
      setPreviousQuestions((prev) => [...prev, qText]);

      speakText(qText);
    } catch (err) {
      console.warn('Error fetching question:', err);
      qText = `Can you describe a real-world scenario where you resolved a complex technical challenge as a ${career.name}?`;
      qContext = `Level ${lvl} • Practical Assessment (Question ${qIdx + 1} of 3)`;
      setQuestionText(qText);
      setQuestionContext(qContext);
      speakText(qText);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Start the interview session once mic or setup is confirmed
  const handleStartInterview = () => {
    setQuestionIndex(0);
    setLevelEvaluations([]);
    loadQuestion(currentLevel, 0, []);
  };

  // Clean up on unmount or level change
  useEffect(() => {
    return () => {
      shouldKeepRecordingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      try {
        if ('speechSynthesis' in window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
    };
  }, []);

  const toggleMute = () => {
    if (!isMuted) {
      try {
        if ('speechSynthesis' in window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setIsMuted(true);
      if (interviewStage === 'ai_speaking') {
        setInterviewStage('your_turn');
      }
    } else {
      setIsMuted(false);
      const speech = greetingText ? `${greetingText} ${questionText}` : questionText;
      if (speech) speakText(speech);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // User clicked stop recording
      shouldKeepRecordingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsRecording(false);
      setInterimTranscript('');
      setInterviewStage('your_turn');
    } else {
      // User clicked start recording
      if (isSpeakingRef.current || interviewStage === 'ai_speaking') {
        // Stop TTS speaking first
        if ('speechSynthesis' in window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }

      setMicError(null);
      shouldKeepRecordingRef.current = true;

      if (!recognitionRef.current) {
        setupSpeechRecognition();
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
          setInterviewStage('listening');
        } catch (e) {
          console.warn('Failed starting mic, retrying stop/start:', e);
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              if (recognitionRef.current) {
                recognitionRef.current.start();
                setIsRecording(true);
                setInterviewStage('listening');
              }
            }, 150);
          } catch (err2) {
            setIsRecording(false);
            shouldKeepRecordingRef.current = false;
            setInterviewStage('your_turn');
          }
        }
      } else {
        setMicError('Speech recognition is not initialized. Try clicking "Enable Microphone" again or type your answer.');
      }
    }
  };

  // Submit Answer for AI Evaluation
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    // Stop STT and TTS immediately
    shouldKeepRecordingRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsRecording(false);

    try {
      if ('speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
    setIsSpeaking(false);
    isSpeakingRef.current = false;

    setIsEvaluating(true);
    setInterviewStage('processing');

    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: career.name,
          level: currentLevel,
          questionIndex,
          questionText,
          userAnswer: userAnswer.trim()
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Evaluation server error');
      }

      const data = await res.json();
      setEvaluation(data);
      setInterviewStage('evaluated');

      const newEvalItem = {
        level: currentLevel,
        questionIndex,
        questionText,
        userAnswer: userAnswer.trim(),
        evaluation: data,
        timestamp: Date.now()
      };

      setLevelEvaluations((prev) => [...prev, newEvalItem]);
      setInterviewHistory((prev) => [newEvalItem, ...prev]);

      if (data.passed && data.feedback && !isMuted) {
        speakText(`Good response! Question ${questionIndex + 1} passed with ${data.overallScore} percent score. ${data.feedback.slice(0, 100)}`);
      } else if (!data.passed && !isMuted) {
        speakText(`Evaluation complete for Question ${questionIndex + 1}. Review the mistake corrections to refine your response.`);
      }
    } catch (err: any) {
      console.error('Failed to evaluate answer:', err);
      setMicError(`Answer evaluation failed: ${err.message || 'Error processing response'}. You can retry submission.`);
      setInterviewStage('your_turn');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Move to Next Question in Level
  const handleNextQuestion = () => {
    if (questionIndex < 2) {
      const nextIdx = questionIndex + 1;
      setQuestionIndex(nextIdx);
      loadQuestion(currentLevel, nextIdx, previousQuestions);
    }
  };

  const levelBadges = [
    { lvl: 1, name: "Level 1: Intro & Core Fundamentals", diff: "3 Questions" },
    { lvl: 2, name: "Level 2: Advanced Production Scenarios", diff: "3 Questions" },
    { lvl: 3, name: "Level 3: System Architecture & Crisis", diff: "3 Questions" }
  ];

  const isLevelCompleted = levelEvaluations.length >= 3;
  const levelAvgScore = isLevelCompleted 
    ? Math.round(levelEvaluations.reduce((acc, curr) => acc + (curr.evaluation?.overallScore || 0), 0) / levelEvaluations.length)
    : 0;

  // Render Status Badge Text for Stage
  const getStageBadge = () => {
    switch (interviewStage) {
      case 'setup':
        return { label: 'Microphone Setup Required', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'preparing':
        return { label: 'Preparing Question...', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'ai_speaking':
        return { label: 'AI Speaking', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'your_turn':
        return { label: 'Your Turn', color: 'bg-teal-500/10 text-teal-300 border-teal-500/30' };
      case 'listening':
        return { label: 'Listening...', color: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' };
      case 'processing':
        return { label: 'Processing Answer...', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'evaluated':
        return { label: 'Answer Evaluated', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: 'Ready', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const stageBadge = getStageBadge();

  return (
    <div className="max-w-6xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={onBack}
            className="k-btn-ghost text-xs px-0 hover:bg-transparent mb-1 cursor-pointer"
          >
            ← BACK TO DASHBOARD
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">AI Voice Interview Simulator</h1>
                <span className={`k-badge ${stageBadge.color}`}>
                  {stageBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Role: <strong className="text-slate-200">{career.name}</strong> • Real-time STT Answer Capture & Voice Synthesis.
              </p>
            </div>
          </div>
        </div>

        {/* Mute TTS Control */}
        <button
          onClick={toggleMute}
          className={`k-btn-secondary text-xs cursor-pointer ${
            isMuted ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' : ''
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'AI Voice Muted' : 'AI Voice Active'}</span>
        </button>
      </div>

      {/* 3 Progressive Levels Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {levelBadges.map((badge) => {
          const isActive = currentLevel === badge.lvl;
          return (
            <button
              key={badge.lvl}
              onClick={() => {
                if (currentLevel !== badge.lvl) {
                  setCurrentLevel(badge.lvl);
                  if (micState === 'granted') {
                    loadQuestion(badge.lvl, 0, []);
                  } else {
                    setInterviewStage('setup');
                  }
                }
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isActive
                  ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`k-badge ${
                  isActive ? 'k-badge-strong' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  Level {badge.lvl}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{badge.diff}</span>
              </div>
              <p className="text-xs font-bold text-slate-100 mt-2.5 line-clamp-1">{badge.name}</p>
            </button>
          );
        })}
      </div>

      {/* SETUP / MICROPHONE PERMISSION SCREEN */}
      {micState !== 'granted' && interviewStage === 'setup' ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto space-y-6 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
            <Mic className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Microphone Setup Required</h2>
            <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Microphone access is required for the voice interview to capture your spoken answers accurately during questions.
            </p>
          </div>

          {/* Mic Device / Status Callout */}
          {micState === 'checking' && (
            <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-xl flex items-center justify-center gap-3 text-xs font-mono text-blue-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Requesting microphone permission from browser...</span>
            </div>
          )}

          {micState === 'denied' && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-left space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Microphone Permission Blocked or Denied</span>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                Your browser blocked microphone access. To enable it:
              </p>
              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside pl-1 font-mono">
                <li>Click the padlock or settings icon in your browser's address bar.</li>
                <li>Find <strong>Microphone</strong> in the permissions list and set it to <strong>Allow</strong>.</li>
                <li>Click the <strong>Retry Microphone Access</strong> button below.</li>
              </ol>
            </div>
          )}

          {micState === 'unsupported' && (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs font-mono">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Audio Input Unavailable</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {micError || 'Microphone recording API is not supported in this environment. You can still proceed using keyboard input.'}
              </p>
            </div>
          )}

          {/* Setup Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleEnableMicrophone}
              disabled={micState === 'checking'}
              className="k-btn-primary w-full sm:w-auto px-8 py-3.5 text-xs font-bold cursor-pointer flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4 text-slate-950" />
              <span>{micState === 'denied' ? 'Retry Microphone Access' : 'Enable Microphone'}</span>
            </button>

            <button
              onClick={() => {
                setMicState('granted'); // Allow proceed with text input
                handleStartInterview();
              }}
              className="k-btn-secondary w-full sm:w-auto px-6 py-3.5 text-xs font-bold cursor-pointer"
            >
              <span>Continue with Typing Mode</span>
            </button>
          </div>

          <p className="text-[11px] font-mono text-slate-500">
            Note: Your speech is processed locally in your browser for privacy.
          </p>
        </div>
      ) : (
        <>
          {/* Level Progress Bar */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400">
                LEVEL {currentLevel} PROGRESS:
              </span>
              <span className="text-xs font-mono text-slate-300">
                Question {questionIndex + 1} of 3
              </span>
            </div>

            {/* Mic Status Indicator in Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Mic className="w-3 h-3 text-emerald-400" />
                <span>{micDeviceLabel ? `Mic Ready: ${micDeviceLabel.slice(0, 20)}...` : 'Microphone Ready'}</span>
              </span>

              {[0, 1, 2].map((qIdx) => {
                const isDone = levelEvaluations.some(e => e.questionIndex === qIdx);
                const isCurrent = questionIndex === qIdx;
                return (
                  <div 
                    key={qIdx}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                      isCurrent 
                        ? 'bg-emerald-500 text-slate-950 border border-emerald-400' 
                        : isDone 
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}
                  >
                    <span>Q{qIdx + 1}</span>
                    {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Interactive Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Panel: AI Question & Candidate Answer */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* AI Avatar & Question Display */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 bg-emerald-500/5 w-60 h-60 rounded-full blur-3xl pointer-events-none" />

                {/* AI Avatar Bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 flex items-center justify-center">
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                          <Bot className="w-6 h-6 text-emerald-400" />
                        </div>
                      </div>
                      {isSpeaking && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        AI Lead Interviewer
                        {isSpeaking && (
                          <span className="text-[10px] font-mono text-emerald-400 animate-pulse flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Speaking Question...
                          </span>
                        )}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500">{questionContext}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => speakText(greetingText ? `${greetingText} ${questionText}` : questionText)}
                    disabled={isLoadingQuestion || !questionText || isSpeaking}
                    className="text-xs text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" /> Replay Question
                  </button>
                </div>

                {/* Question Content */}
                {isLoadingQuestion ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                    <p className="text-xs font-mono text-slate-400">Preparing Question {questionIndex + 1} for Level {currentLevel}...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {greetingText && (
                      <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">Opening Introduction</span>
                        <p className="text-xs text-emerald-200 leading-relaxed">
                          "{greetingText}"
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                        Question {questionIndex + 1} of 3
                      </span>
                      <p className="text-slate-100 text-base md:text-lg font-medium leading-relaxed font-sans">
                        "{questionText}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* User Answer Input Box & Audio Control Bar */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <label className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Your Response (Voice or Text)
                  </label>

                  {/* Mic Control Buttons */}
                  <div className="flex items-center gap-2">
                    {speechSupported && (
                      <button
                        onClick={toggleRecording}
                        disabled={isEvaluating || isLoadingQuestion}
                        className={`text-xs font-mono px-3.5 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                          isRecording
                            ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse shadow-lg shadow-red-500/10'
                            : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-400'
                        }`}
                      >
                        {isRecording ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                        <span className="font-bold">{isRecording ? 'Stop Recording' : 'Start Speaking'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mic Error Banner if any */}
                {micError && (
                  <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{micError}</span>
                    </div>
                    <button 
                      onClick={handleEnableMicrophone}
                      className="text-[11px] font-mono text-rose-200 underline font-bold hover:text-white shrink-0"
                    >
                      Retry Mic
                    </button>
                  </div>
                )}

                {/* Active Recording Visual State */}
                {isRecording && (
                  <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      <span className="text-xs font-mono text-red-300 font-bold">Listening... Speak clearly into your microphone</span>
                    </div>
                    {interimTranscript && (
                      <span className="text-[11px] font-mono text-slate-300 italic truncate max-w-xs">
                        "{interimTranscript}"
                      </span>
                    )}
                  </div>
                )}

                {/* Response Text Area */}
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={
                    isRecording 
                      ? "Listening to your voice... (Your spoken transcript will appear here live)" 
                      : "Click 'Start Speaking' to dictate your answer or type here directly..."
                  }
                  rows={5}
                  disabled={isEvaluating}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors leading-relaxed font-sans"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>{userAnswer.trim().split(/\s+/).filter(Boolean).length} words recorded</span>
                    {userAnswer.trim() && (
                      <button 
                        onClick={() => setUserAnswer('')}
                        className="text-slate-500 hover:text-slate-300 underline cursor-pointer"
                      >
                        Clear Text
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => loadQuestion(currentLevel, questionIndex, previousQuestions)}
                      disabled={isEvaluating || isLoadingQuestion}
                      className="k-btn-secondary text-xs py-2.5 px-4 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reload Question</span>
                    </button>

                    <button
                      onClick={handleSubmitAnswer}
                      disabled={isEvaluating || !userAnswer.trim() || isLoadingQuestion}
                      className="k-btn-primary text-xs py-2.5 px-6 cursor-pointer"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Evaluating Answer...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Answer (Q{questionIndex + 1})</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Panel: AI Live Evaluation & Feedback Dashboard */}
            <div className="lg:col-span-5 space-y-6">
              
              {evaluation ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 relative overflow-hidden"
                >
                  {/* Header Status */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      {evaluation.passed ? (
                        <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </span>
                      ) : (
                        <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <AlertTriangle className="w-5 h-5" />
                        </span>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {evaluation.passed ? `Question ${questionIndex + 1} Passed!` : 'Needs Re-assessment'}
                        </h3>
                        <p className="text-[10px] font-mono text-slate-500">
                          Passing Threshold: 70% Score
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full border font-mono ${
                      evaluation.passed
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {evaluation.overallScore}%
                    </span>
                  </div>

                  {/* Score Breakdown Bars */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">Communication Score</span>
                      <span className="text-xl font-extrabold text-white block">{evaluation.communicationScore}%</span>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${evaluation.communicationScore}%` }} />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">Technical Depth Score</span>
                      <span className="text-xl font-extrabold text-white block">{evaluation.technicalScore}%</span>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-400 h-full rounded-full" style={{ width: `${evaluation.technicalScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Constructive AI Feedback */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      AI Interviewer Feedback
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {evaluation.feedback}
                    </p>
                  </div>

                  {/* Specific Mistake Corrections */}
                  {evaluation.mistakeCorrections && evaluation.mistakeCorrections.length > 0 && (
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-2.5">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Mistake Corrections & Key Fixes
                      </span>
                      <ul className="space-y-2">
                        {evaluation.mistakeCorrections.map((correction: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-400 font-mono font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{correction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Navigation to Question 2 / 3 or Next Level */}
                  <div className="pt-2 space-y-3">
                    {questionIndex < 2 ? (
                      <button
                        onClick={handleNextQuestion}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                      >
                        <span>Proceed to Question {questionIndex + 2} of 3</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="space-y-3 border-t border-slate-800 pt-3">
                        <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center space-y-1">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                            Level {currentLevel} Completed!
                          </span>
                          <p className="text-sm font-extrabold text-white">
                            Level Average Score: {levelAvgScore}%
                          </p>
                        </div>

                        {currentLevel < 3 ? (
                          <button
                            onClick={() => {
                              const nextLvl = currentLevel + 1;
                              setCurrentLevel(nextLvl);
                              onPassNextLevel?.();
                              loadQuestion(nextLvl, 0, []);
                            }}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                          >
                            <span>Proceed to Level {currentLevel + 1} Assessment</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center text-xs font-bold text-emerald-300">
                            🎉 All 3 AI Voice Interview Levels Completed!
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </motion.div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 mx-auto flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Real-Time AI Evaluation Panel</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                      Submit your response to receive immediate scoring on communication style, technical accuracy, and tailored mistake corrections.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/60 text-left space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Pro Interview Tips:</span>
                    <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                      <li>Structure your response with clear context & outcome</li>
                      <li>Mention concrete tools, algorithms, or metrics</li>
                      <li>Speak or write with confidence & precision</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Past Practice Attempt History */}
              {interviewHistory.length > 0 && (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    Practice Attempts History ({interviewHistory.length})
                  </h4>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {interviewHistory.map((item, index) => (
                      <div key={index} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                        <div className="space-y-0.5 max-w-[200px]">
                          <span className="font-mono text-[10px] text-slate-500 block">Level {item.level} • Q{item.questionIndex + 1}</span>
                          <p className="text-slate-300 font-medium truncate">{item.questionText}</p>
                        </div>
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                          item.evaluation?.passed ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                        }`}>
                          {item.evaluation?.overallScore}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </>
      )}
    </div>
  );
}
