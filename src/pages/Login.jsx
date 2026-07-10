import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabaseAuth } from "@/lib/supabaseAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkUserAuth } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // --- SEAMLESS VERIFICATION HANDSHAKE ---
  useEffect(() => {
    const isVerified = searchParams.get("verified") === "true";
    const authError = searchParams.get("error");

    if (isVerified) {
      setSuccessMsg(lang === 'sw' 
        ? "Barua pepe imethibitishwa! Subiri idhini ya msimamizi." 
        : "Email verified successfully! Your account is now in the administrative approval queue.");
    }

    if (authError === "pending_approval") {
      setError(lang === 'sw' 
        ? "Idhini bado inashughulikiwa na KIPPRA ICT." 
        : "Institutional access pending. KIPPRA ICT is currently reviewing your profile.");
    }
  }, [searchParams, lang]);

  /**
   * CENTRALIZED ROUTING LOGIC
   * Uses the sovereign adapter to determine the correct workstation
   */
  const performSovereignRedirect = async () => {
    const targetRoute = await supabaseAuth.resolvePostLoginRoute();
    
    if (targetRoute.includes('error=pending_approval')) {
      await supabaseAuth.logout(null); // Absolute Session Kill
      setError(lang === 'sw' 
        ? "Akaunti yako bado haijaidhinishwa na Msimamizi Mkuu." 
        : "Access Denied: Your institutional identity has not been activated yet.");
      setLoading(false);
    } else {
      await checkUserAuth(); // Sync AuthContext
      
      // Check if user originally wanted a specific deep-link
      const next = searchParams.get("next");
      navigate(next && next !== "null" ? next : targetRoute);
      
      toast({
        title: lang === 'sw' ? "Uthibitisho Umefaulu" : "Authentication Successful",
        description: lang === 'sw' ? "Karibu kwenye kituo chako cha kazi." : "Welcome to your digital workstation.",
      });
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    await supabaseAuth.loginViaEmailPassword(email, password);
    await checkUserAuth();

    const fallbackPath = await supabaseAuth.resolvePostLoginRoute();
    const nextParam = searchParams.get("next");

    // 1. Determine destination with robust validation
    let finalDestination = "/";
    if (nextParam && nextParam !== "null" && nextParam !== "undefined" && nextParam.trim() !== "") {
      finalDestination = decodeURIComponent(nextParam);
    } else {
      finalDestination = fallbackPath || "/"; // ensure fallback is never null/undefined
    }

    // 2. Final guard: if destination is invalid, go home
    if (!finalDestination || finalDestination === "null" || finalDestination === "undefined" || finalDestination.trim() === "") {
      finalDestination = "/";
    }

    // 3. Ensure it starts with '/'
    if (!finalDestination.startsWith('/')) {
      finalDestination = '/' + finalDestination;
    }

    toast({
      title: lang === 'sw' ? "Uthibitisho Umefaulu" : "Authentication Successful",
      description: lang === 'sw' ? "Lango limefunguliwa." : "The Sovereign Gateway has been unlocked.",
    });

    navigate(finalDestination);

  } catch (err) {
    console.error("Gateway Redirection Error:", err);
    setError(err.message || "Credential verification failed.");
    setLoading(false);
  }
};
  return (
    <AuthLayout
      icon={ShieldCheck}
      title={lang === 'sw' ? "Lango la Kitaifa" : "Sovereign Gateway"}
      subtitle={lang === 'sw' ? "Mfumo wa Ujasusi wa KIPPRA" : "KIPPRA Intelligence System Access"}
      footer={
        <>
          {lang === 'sw' ? "Huna akaunti?" : "New to the Institute?"}{" "}
          <Link to="/register" className="text-primary font-black hover:underline">
            {lang === 'sw' ? "Anza Onboarding" : "Initiate Onboarding"}
          </Link>
        </>
      }
    >
      {/* Dynamic Feedback UI */}
      <div className="space-y-4 mb-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-bold">{error}</p>
          </div>
        )}
        
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm border border-emerald-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-bold">{successMsg}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
            {lang === 'sw' ? "Barua Pepe ya Idara" : "Departmental Email"}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="email"
              placeholder="officer@kippra.or.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-white/[0.03] border-white/10 rounded-xl focus:ring-primary"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
              {lang === 'sw' ? "Tokeni ya Siri" : "Security Token"}
            </Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-white/[0.03] border-white/10 rounded-xl focus:ring-primary"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-14 font-black text-lg bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-900/20 rounded-xl transition-all active:scale-[0.98]" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{lang === 'sw' ? "Inakagua..." : "Authenticating..."}</span>
            </div>
          ) : (
            lang === 'sw' ? "INGIA" : "AUTHENTICATE"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}