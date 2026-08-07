import { useState, useEffect } from 'react';
import { UserRole, CandidateRosterRecord, Career, UserLevelFeedback } from '../types';
import { CAREERS_PRESETS } from '../data/careers';
import { fetchAllCandidatesFromFirebase, fetchAllFeedbacksFromFirebase, syncUserStateToFirebase, UserFirebaseRecord } from '../lib/firebase';
import { 
  ShieldCheck, Users, Sliders, Eye, RefreshCw, Search, Filter, 
  BarChart3, CheckCircle2, AlertTriangle, Sparkles, User, Settings,
  Layers, Lock, Play, Database, KeyRound, LogOut, MessageSquare, Smile, HeartHandshake, ThumbsUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


interface AdminDashboardProps {
  currentUsername: string;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isAdminPreviewMode: boolean;
  onToggleAdminPreviewMode: (enabled: boolean) => void;
  onLaunchTestAssessment?: (skillId: string) => void;
  onExitAdminView?: () => void;
  onLaunchUserPreviewView?: () => void;
}

export default function AdminDashboard({
  currentUsername,
  userRole,
  onRoleChange,
  isAdminPreviewMode,
  onToggleAdminPreviewMode,
  onLaunchTestAssessment,
  onExitAdminView,
  onLaunchUserPreviewView
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'feedbacks' | 'weightings' | 'examiner' | 'analytics'>('roster');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRosterRecord | null>(null);

  // Firestore & API Database Candidates
  const [dbCandidates, setDbCandidates] = useState<CandidateRosterRecord[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);
  const [dbLoaded, setDbLoaded] = useState<boolean>(false);

  // Level Feedbacks State
  const [feedbacks, setFeedbacks] = useState<UserLevelFeedback[]>([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState<boolean>(false);
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<string>('ALL');

  const loadFeedbacks = async () => {
    setIsLoadingFeedbacks(true);
    try {
      const res = await fetch('/api/feedback/list');
      const data = await res.json();
      const fbFromDb = await fetchAllFeedbacksFromFirebase();
      const combined = [...(Array.isArray(data) ? data : []), ...(Array.isArray(fbFromDb) ? fbFromDb : [])];
      
      const map = new Map<string, UserLevelFeedback>();
      combined.forEach((item: any) => {
        if (item && item.id) {
          map.set(item.id, {
            id: item.id,
            username: item.username || 'candidate_user',
            skillId: item.skillId || 'general',
            skillName: item.skillName || 'Core Competency',
            level: item.level || 1,
            score: item.score || 0,
            ratingEmoji: item.ratingEmoji || '😊',
            ratingLabel: item.ratingLabel || 'Very Good',
            feedbackText: item.feedbackText || '',
            timestamp: item.timestamp || item.createdAt || Date.now()
          });
        }
      });
      setFeedbacks(Array.from(map.values()));
    } catch (e) {
      console.warn("Failed to load level feedbacks:", e);
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  // Weightings Editor state
  const [selectedCareerId, setSelectedCareerId] = useState<string>('software_engineer');
  const activeCareer = CAREERS_PRESETS.find(c => c.id === selectedCareerId) || CAREERS_PRESETS[0];
  const [careerWeights, setCareerWeights] = useState<Record<string, number>>(activeCareer.weights);

  // Examiner Test Generator state
  const [testSkill, setTestSkill] = useState<string>('sql');
  const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);
  const [generatedSample, setGeneratedSample] = useState<any[] | null>(null);

  const loadRealCandidatesFromFirestore = async () => {
    setIsLoadingDb(true);
    try {
      // 1. Fetch registered users from backend API
      let apiCandidates: CandidateRosterRecord[] = [];
      try {
        const res = await fetch('/api/admin/registered-users');
        if (res.ok) {
          const apiUsers = await res.json();
          if (Array.isArray(apiUsers)) {
            apiCandidates = apiUsers;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch API registered users:", err);
      }

      // 2. Fetch candidates from Firebase
      let firestoreCandidates: CandidateRosterRecord[] = [];
      try {
        const records = await fetchAllCandidatesFromFirebase();
        if (records && records.length > 0) {
          firestoreCandidates = records
            .filter((rec: UserFirebaseRecord) => {
              const uname = (rec.displayName || rec.email || rec.uid || '').toLowerCase().trim();
              return uname !== 'admin' && !uname.startsWith('admin@');
            })
            .map((rec: UserFirebaseRecord, index) => {
              const st = rec.userState || {};
              const username = rec.displayName || rec.email?.split('@')[0] || `candidate_${rec.uid.slice(0, 5)}`;

              let careerName = st.targetCareer?.name;
              if (!careerName && st.selectedCareerId) {
                const idMap: Record<string, string> = {
                  software_engineer: "Software Engineer",
                  data_analyst: "Data Analyst",
                  product_manager: "Product Manager",
                  cybersecurity_analyst: "Cybersecurity Analyst",
                  cloud_architect: "Cloud Architect",
                  devops_engineer: "DevOps Engineer"
                };
                careerName = idMap[st.selectedCareerId];
              }
              if (!careerName) {
                careerName = "Not Selected";
              }

              let readiness = 0;
              if (st.skills) {
                const keys = Object.keys(st.skills);
                const ratedKeys = keys.filter(k => typeof st.skills[k]?.masteryLevel === 'number' && st.skills[k].masteryLevel > 0);
                if (ratedKeys.length > 0) {
                  const sum = ratedKeys.reduce((acc, k) => acc + (st.skills[k]?.masteryLevel || 0), 0);
                  readiness = Math.round(sum / ratedKeys.length);
                }
              }

              const atsMatch = typeof rec.resumeAnalysis?.overallScore === 'number' ? rec.resumeAnalysis.overallScore : 0;
              const aptitude = typeof (st as any).aptitudeScore === 'number' ? (st as any).aptitudeScore : 0;

              let status: 'Qualified' | 'In Assessment' | 'Needs Upskilling' | 'Not Started' = 'Not Started';
              if (readiness >= 80 && atsMatch >= 80) {
                status = 'Qualified';
              } else if (readiness > 0 || atsMatch > 0 || aptitude > 0) {
                status = 'In Assessment';
              } else {
                status = 'Not Started';
              }

              return {
                id: rec.uid || `cand_real_${index}`,
                username,
                targetCareer: careerName,
                readinessScore: readiness,
                atsScore: atsMatch,
                aptitudeScore: aptitude,
                lastActive: rec.updatedAt ? new Date(rec.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
                status
              };
            });
        }
      } catch (err) {
        console.warn("Failed to fetch Firebase candidates:", err);
      }

      // 3. Merge candidate records strictly by username (lowercase) - EXCLUDE ADMIN ACCOUNT
      const map = new Map<string, CandidateRosterRecord>();
      [...apiCandidates, ...firestoreCandidates].forEach(c => {
        if (c && c.username && c.username.toLowerCase().trim() !== 'admin') {
          map.set(c.username.toLowerCase().trim(), c);
        }
      });

      const finalRoster = Array.from(map.values());
      setDbCandidates(finalRoster);
      setDbLoaded(true);
    } catch (e) {
      console.warn('Error loading real candidates:', e);
      setDbCandidates([]);
      setDbLoaded(true);
    } finally {
      setIsLoadingDb(false);
    }
  };



  useEffect(() => {
    loadRealCandidatesFromFirestore();
  }, []);

  const filteredRoster = dbCandidates.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.targetCareer.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleCareerChange = (id: string) => {
    setSelectedCareerId(id);
    const found = CAREERS_PRESETS.find(c => c.id === id);
    if (found) {
      setCareerWeights({ ...found.weights });
    }
  };

  const handleWeightChange = (skillId: string, val: number) => {
    setCareerWeights(prev => ({
      ...prev,
      [skillId]: val
    }));
  };

  const totalWeight: number = Number(Object.values(careerWeights).reduce((a: number, b: number) => a + (Number(b) || 0), 0));

  const handleTestGenerateQuestions = async () => {
    setIsGeneratingTest(true);
    setGeneratedSample(null);

    try {
      const res = await fetch('/api/assessment/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: testSkill,
          skillName: testSkill.replace(/_/g, ' ').toUpperCase(),
          careerName: activeCareer.name,
          existingQuestionTexts: []
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedSample(data.questions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Admin RBAC Header & Mode Control */}
      <div className="k-card p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-emerald-500/30 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  KRÜSt Platform RBAC System
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-500/10 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">
                  {userRole.toUpperCase()} ROLE
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 mt-1">
                Admin System Portal
              </h1>
            </div>
          </div>

          {/* Role Selector & Admin Preview Mode Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Database Sync Button */}
            <button
              onClick={loadRealCandidatesFromFirestore}
              disabled={isLoadingDb}
              className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Fetch live records from Firestore Database"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isLoadingDb ? 'Syncing DB...' : 'Refresh DB'}</span>
            </button>

            {/* Launch Candidate Feature Preview */}
            {onLaunchUserPreviewView && (
              <button
                onClick={onLaunchUserPreviewView}
                className="px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Candidate Feature Preview</span>
              </button>
            )}

            {/* Exit Admin System */}
            {onExitAdminView && (
              <button
                onClick={onExitAdminView}
                className="px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Admin</span>
              </button>
            )}
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-slate-800 gap-2 pt-2">
          {[
            { id: 'roster', label: 'Candidate Roster', icon: Users },
            { id: 'feedbacks', label: 'User Feedbacks & Ratings', icon: MessageSquare },
            { id: 'weightings', label: 'Career Weightings Editor', icon: Sliders },
            { id: 'examiner', label: 'Question Examiner & AI Test', icon: Sparkles },
            { id: 'analytics', label: 'System Analytics', icon: BarChart3 }
          ].map(tab => {

            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400 bg-slate-950/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CANDIDATE ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/90 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-slate-100 flex items-center gap-2">
                  <span>Firebase Firestore Real Database</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">CONNECTED</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Collection: <code className="text-purple-300">/users</code> | Total Collected Documents: <strong className="text-emerald-400">{dbCandidates.length}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadRealCandidatesFromFirestore}
                disabled={isLoadingDb}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin' : ''}`} />
                <span>Sync Real DB</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates by username or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="text-xs font-mono text-slate-400">
              Showing <strong className="text-emerald-400">{filteredRoster.length}</strong> Real Candidate Profiles
            </div>
          </div>

          <div className="k-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-4">Candidate Username</th>
                    <th className="p-4">Target Career</th>
                    <th className="p-4">KRI Readiness Score</th>
                    <th className="p-4">ATS Match</th>
                    <th className="p-4">Aptitude Score</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 space-y-3">
                        <Database className="w-8 h-8 text-slate-600 mx-auto" />
                        <div className="font-bold text-slate-300 text-sm">No Candidate Records in Firestore Database</div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          As users perform skill assessments or save candidate profiles, live records are written to Firestore collection <code className="text-emerald-400 font-bold">/users</code>. You can also click "Seed Sample Candidate Docs" above to add real test records.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map(cand => (
                      <tr key={cand.id} className="border-b border-slate-900 hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 font-bold text-slate-100 flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-400" />
                          <span>{cand.username}</span>
                        </td>
                        <td className="p-4 text-slate-300">{cand.targetCareer}</td>
                        <td className="p-4">
                          <span className="font-bold text-emerald-400">{cand.readinessScore}%</span>
                        </td>
                        <td className="p-4 font-bold text-sky-400">{cand.atsScore}%</td>
                        <td className="p-4 font-bold text-purple-400">{cand.aptitudeScore}%</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cand.status === 'Qualified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            cand.status === 'In Assessment' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {cand.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedCandidate(cand)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-200 cursor-pointer"
                          >
                            Inspect Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER LEVEL FEEDBACKS & RATINGS */}
      {activeTab === 'feedbacks' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-4 bg-slate-900/90 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-mono">User Level Assessment Feedbacks</h3>
                <p className="text-xs text-slate-400">Post-level candidate ratings and direct experience comments</p>
              </div>
            </div>

            <button
              onClick={loadFeedbacks}
              disabled={isLoadingFeedbacks}
              className="k-btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoadingFeedbacks ? 'animate-spin' : ''}`} />
              <span>Refresh Feedbacks</span>
            </button>
          </div>

          {/* Rating Breakdown Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { key: 'ALL', emoji: '💬', label: 'All Feedbacks', count: feedbacks.length, color: 'border-slate-800 bg-slate-900 text-slate-200' },
              { key: '🤩', emoji: '🤩', label: 'Excellent', count: feedbacks.filter(f => f.ratingEmoji === '🤩').length, color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
              { key: '😊', emoji: '😊', label: 'Very Good', count: feedbacks.filter(f => f.ratingEmoji === '😊').length, color: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
              { key: '😐', emoji: '😐', label: 'Good', count: feedbacks.filter(f => f.ratingEmoji === '😐').length, color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
              { key: '🙁', emoji: '🙁', label: 'Bad', count: feedbacks.filter(f => f.ratingEmoji === '🙁').length, color: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
              { key: '😡', emoji: '😡', label: 'Very Bad', count: feedbacks.filter(f => f.ratingEmoji === '😡').length, color: 'border-rose-500/30 bg-rose-500/10 text-rose-300' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFeedbackRatingFilter(item.key)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${item.color} ${
                  feedbackRatingFilter === item.key ? 'ring-2 ring-emerald-400 font-bold scale-102' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="font-mono text-sm font-extrabold">{item.count}</span>
                </div>
                <span className="text-[10px] font-mono uppercase block mt-1">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Feedback List Container */}
          <div className="k-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Candidate Feedback Entries ({feedbacks.filter(f => {
                  const matchesFilter = feedbackRatingFilter === 'ALL' || f.ratingEmoji === feedbackRatingFilter;
                  const matchesSearch = !searchQuery || f.username.toLowerCase().includes(searchQuery.toLowerCase()) || f.skillName.toLowerCase().includes(searchQuery.toLowerCase()) || f.feedbackText.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesFilter && matchesSearch;
                }).length})
              </span>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter candidate or skill..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {feedbacks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs font-mono">
                No user level feedbacks recorded yet. Candidates will rate assessments upon completing each level.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbacks
                  .filter(f => {
                    const matchesFilter = feedbackRatingFilter === 'ALL' || f.ratingEmoji === feedbackRatingFilter;
                    const matchesSearch = !searchQuery || f.username.toLowerCase().includes(searchQuery.toLowerCase()) || f.skillName.toLowerCase().includes(searchQuery.toLowerCase()) || f.feedbackText.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesFilter && matchesSearch;
                  })
                  .map((item) => {
                    let badgeBg = 'bg-slate-900 border-slate-800 text-slate-300';
                    if (item.ratingEmoji === '🤩') badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
                    else if (item.ratingEmoji === '😊') badgeBg = 'bg-sky-500/10 border-sky-500/30 text-sky-400';
                    else if (item.ratingEmoji === '😐') badgeBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
                    else if (item.ratingEmoji === '🙁' || item.ratingEmoji === '😡') badgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';

                    return (
                      <div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 shadow-md">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-850 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                              {item.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-200 font-mono">{item.username}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {item.skillName} • <strong className="text-slate-300">Level {item.level}</strong>
                              </p>
                            </div>
                          </div>

                          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-mono text-xs font-bold ${badgeBg}`}>
                            <span className="text-base leading-none">{item.ratingEmoji}</span>
                            <span>{item.ratingLabel}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                            <span>Level Score: <strong className="text-emerald-400">{item.score}%</strong></span>
                            <span>{new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {item.feedbackText ? (
                            <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg text-xs text-slate-300 italic leading-relaxed">
                              "{item.feedbackText}"
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">No additional text comment provided.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CAREER WEIGHTINGS EDITOR */}
      {activeTab === 'weightings' && (

        <div className="space-y-6">
          <div className="k-card p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest font-mono">
                  Role Skill Weightings Engine
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust skill contribution weights used in calculating the KRÜSt Readiness Index (KRI). Weights must sum to 1.0 (100%).
                </p>
              </div>

              {/* Career Selector */}
              <select
                value={selectedCareerId}
                onChange={e => handleCareerChange(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded-xl p-2.5 focus:outline-none focus:border-emerald-500/50"
              >
                {CAREERS_PRESETS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">Skill Field</span>
                <span className={`text-xs font-mono font-bold ${Math.abs(totalWeight - 1.0) < 0.01 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Total Weight: {Math.round(totalWeight * 100)}%
                </span>
              </div>

              {Object.entries(careerWeights).map(([skId, weight]: [string, number]) => (
                <div key={skId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-200 font-bold uppercase">{skId.replace(/_/g, ' ')}</span>
                    <span className="text-emerald-400 font-bold">{Math.round((Number(weight) || 0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weight}
                    onChange={e => handleWeightChange(skId, parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button className="k-btn-primary py-2.5 px-6 text-xs font-bold cursor-pointer flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Save Role Weightings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUESTION EXAMINER & AI TEST */}
      {activeTab === 'examiner' && (
        <div className="space-y-6">
          <div className="k-card p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest font-mono">
                AI Question Examiner & Sandbox Generator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Test generate role-aware assessment questions using the 4-tier chain (Career → Skill → Concept → Real Application).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1 min-w-[200px]">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Select Skill to Test</label>
                <select
                  value={testSkill}
                  onChange={e => setTestSkill(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded-xl p-2.5"
                >
                  <option value="sql">SQL Databases</option>
                  <option value="python">Python Programming</option>
                  <option value="javascript">JavaScript / TypeScript</option>
                  <option value="aptitude_general">General Aptitude</option>
                  <option value="cybersecurity">Cybersecurity Threat Modeling</option>
                </select>
              </div>

              <button
                onClick={handleTestGenerateQuestions}
                disabled={isGeneratingTest}
                className="mt-5 k-btn-primary py-2.5 px-6 text-xs font-bold cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingTest ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
                <span>Trigger AI Question Generation</span>
              </button>

              {onLaunchTestAssessment && (
                <button
                  onClick={() => onLaunchTestAssessment(testSkill)}
                  className="mt-5 px-4 py-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold hover:bg-amber-500/30 cursor-pointer flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Launch Assessment in Preview Mode</span>
                </button>
              )}
            </div>

            {/* Generated Output Preview */}
            {generatedSample && generatedSample.length > 0 && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                  Generated Question Sample Output ({generatedSample.length} items)
                </span>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {generatedSample.slice(0, 3).map((q, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>Topic: {q.topic}</span>
                        <span className="text-emerald-400 font-bold">{q.difficulty?.toUpperCase()}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200">{q.questionText}</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                        {q.options?.map((opt: string, oIdx: number) => (
                          <div key={oIdx} className={oIdx === q.correctIndex ? 'text-emerald-400 font-bold' : ''}>
                            {String.fromCharCode(65 + oIdx)}. {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="k-card p-5 bg-slate-900 border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase">Avg Candidate Readiness</span>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">76.2%</div>
            </div>
            <div className="k-card p-5 bg-slate-900 border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase">Avg ATS Resume Alignment</span>
              <div className="text-2xl font-extrabold text-sky-400 font-mono">80.0%</div>
            </div>
            <div className="k-card p-5 bg-slate-900 border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase">Aptitude Completion Rate</span>
              <div className="text-2xl font-extrabold text-purple-400 font-mono">84.5%</div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Inspect Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="k-card max-w-xl w-full p-6 space-y-4 bg-slate-900 border-emerald-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">{selectedCandidate.username} Profile</h3>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white cursor-pointer font-mono text-xs">Close</button>
            </div>

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <p><strong>Target Role:</strong> {selectedCandidate.targetCareer}</p>
              <p><strong>KRÜSt Readiness Index:</strong> <span className="text-emerald-400 font-bold">{selectedCandidate.readinessScore}%</span></p>
              <p><strong>ATS Match Score:</strong> <span className="text-sky-400 font-bold">{selectedCandidate.atsScore}%</span></p>
              <p><strong>Aptitude Benchmark:</strong> <span className="text-purple-400 font-bold">{selectedCandidate.aptitudeScore}%</span></p>
              <p><strong>Last Active:</strong> {selectedCandidate.lastActive}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedCandidate(null)} className="k-btn-primary py-2 px-5 text-xs font-bold cursor-pointer">
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
