import { useState, FormEvent } from "react";
import { LogIn, UserPlus, AlertCircle, Cpu } from "lucide-react";
import { motion } from "motion/react";

interface AuthProps {
  onAuthSuccess: (username: string, token: string, userState: any, roadmap: any[] | null, resumeAnalysis: any | null, isAdmin?: boolean) => void;
  onContinueAsGuest: () => void;
}

export default function Auth({ onAuthSuccess, onContinueAsGuest }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Direct client check for admin credentials
    if (cleanUser.toLowerCase() === 'admin' && password === 'admin123') {
      setIsLoading(false);
      onAuthSuccess('admin', 'admin_token', null, null, null, true);
      return;
    }

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanUser,
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
        data.user.resumeAnalysis,
        data.user.isAdmin || data.user.username === 'admin'
      );
    } catch (err: any) {
      if (cleanUser.toLowerCase() === 'admin' && password === 'admin123') {
        onAuthSuccess('admin', 'admin_token', null, null, null, true);
        return;
      }
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
            KRÜSt
          </h1>
          <p className="text-xs text-emerald-400 font-mono font-bold tracking-wide uppercase">
            Know. Reassess. Upgrade. Succeed.
          </p>
        </div>

        {/* Standard Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-lg text-xs flex items-start gap-2.5 mb-5 animate-shake">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] leading-relaxed">{error}</p>
            </div>
          </div>
        )}

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
            className="w-full k-btn-primary text-xs py-2.5 mt-6"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></span>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Access Profile Portal</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Establish New Account</span>
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
