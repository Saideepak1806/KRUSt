import { useState, FormEvent } from "react";
import { Compass, Sparkles, LogIn, UserPlus, AlertCircle, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "motion/react";
import { signInWithGoogle, fetchUserStateFromFirebase, syncUserStateToFirebase } from "../lib/firebase";

interface AuthProps {
  onAuthSuccess: (username: string, token: string, userState: any, roadmap: any[] | null, resumeAnalysis: any | null) => void;
  onContinueAsGuest: () => void;
}

export default function Auth({ onAuthSuccess, onContinueAsGuest }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (!user) {
        throw new Error("Google authentication did not return any user.");
      }
      
      const displayName = user.displayName || user.email || 'Google User';
      const uid = user.uid;
      
      // Fetch user's saved data from Firestore
      const record = await fetchUserStateFromFirebase(uid);
      
      if (record) {
        onAuthSuccess(
          displayName,
          uid, // Use uid as token
          record.userState,
          record.roadmap,
          record.resumeAnalysis
        );
      } else {
        // First time Google user: sync initial empty state
        const defaultState = {
          selectedCareerId: null,
          skills: {},
          customCareers: [],
          completedMilestones: [],
          customSkills: [],
          customQuestions: [],
          customRoadmaps: []
        };
        
        await syncUserStateToFirebase(uid, user.email, displayName, defaultState, null, null);
        
        onAuthSuccess(
          displayName,
          uid,
          defaultState,
          null,
          null
        );
      }
    } catch (err: any) {
      console.warn("Google authentication warning/error:", err);
      setError(err.message || "Failed to authenticate with Google. Verify config.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Success! Pass to parent App state
      onAuthSuccess(
        data.user.username,
        data.token,
        data.user.userState,
        data.user.roadmap,
        data.user.resumeAnalysis
      );
    } catch (err: any) {
      setError(err.message || "Unable to reach database server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-8 backdrop-blur-md relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 left-0 bg-emerald-500/5 w-32 h-32 rounded-full blur-3xl"></div>

        {/* Brand Logo & Intro */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="font-extrabold text-xl text-emerald-400 font-mono tracking-tight">K</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            KRÜSt Account Center
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to track progress, save custom roadmaps, and synchronize evaluation indexes.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-lg text-xs flex items-start gap-2.5 mb-5 animate-shake">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <button
          id="google-signin-btn"
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="w-full bg-white hover:bg-slate-100 text-slate-950 font-extrabold py-2.5 px-4 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLogin ? "Continue with Google" : "Sign up with Google"}
        </button>

        {/* Info Box about Domain Authorisation / Fallback */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3.5 mb-6 text-left">
          <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
            <span className="text-emerald-400 font-extrabold font-mono uppercase tracking-wider block mb-1">💡 Sandbox Info & Fallback:</span>
            Google authentication may be restricted inside dev sandbox iframes. If it does not proceed, please <strong>register or log in with Username & Password below</strong>—which works instantly with full local & cloud persistence!
          </p>
        </div>

        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/60"></div>
          </div>
          <span className="relative bg-slate-900 px-2.5 text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">or legacy access key</span>
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. dev_candidate"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
            />
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></span>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                Access Profile Portal
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Establish New Account
              </>
            )}
          </button>
        </form>

        {/* Switch Login/Register */}
        <div className="text-center mt-5 text-xs">
          <span className="text-slate-500">
            {isLogin ? "New to the platform?" : "Already have an account?"}{" "}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer hover:underline transition-all"
          >
            {isLogin ? "Register Account" : "Access Portal"}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/80"></div>
          </div>
          <span className="relative bg-slate-900/60 px-3 text-[10px] text-slate-500 font-mono">OR</span>
        </div>

        {/* Continue as guest */}
        <button
          onClick={onContinueAsGuest}
          className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Cpu className="w-4 h-4 text-emerald-400" />
          Continue with Offline Sandbox
        </button>
      </motion.div>
    </div>
  );
}
