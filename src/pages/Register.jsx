import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabaseAuth } from "@/lib/supabaseAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [directorate, setDirectorate] = useState("Economic Management");
  const [subRole, setSubRole] = useState("Researcher");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // Link flow state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await supabaseAuth.register({ 
        email, 
        password, 
        full_name: fullName,
        role: 'staff', 
        portal_role: 'staff',
        directorate: directorate, 
        sub_role: subRole
      });
      
      // SUCCESS: Switch to "Check Email" view
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || "Institutional registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: LINK CONFIRMATION VIEW ---
  if (isSubmitted) {
    return (
      <AuthLayout 
        icon={Mail} 
        title="Check Your Email" 
        subtitle="Verification link sent"
      >
        <div className="text-center space-y-6 main-anim">
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-500/10 rounded-full animate-bounce">
              <CheckCircle2 className="text-emerald-500 w-12 h-12" />
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            We have sent a sovereign verification link to <strong>{email}</strong>. 
            Please click the link to confirm your work email.
          </p>
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-left">
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-2">Note on Access</p>
            <p className="text-xs text-slate-400 italic">
              Once verified, your account will enter the <strong>Administrative Approval Queue</strong>. 
              KIPPRA ICT will activate your workstation shortly.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/login'}>
            Return to Gateway
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // --- STANDARD REGISTRATION FORM ---
  return (
    <AuthLayout
      icon={UserPlus}
      title="Staff Onboarding"
      subtitle="Register your institutional identity"
      footer={<>Already registered? <Link to="/login" className="text-primary font-bold hover:underline">Login</Link></>}
    >
       {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Directorate</Label>
            <select className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={directorate} onChange={(e) => setDirectorate(e.target.value)}>
              <option>Economic Management</option>
              <option>Integrated Development</option>
              <option>Corporate Services</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Designation</Label>
            <select className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={subRole} onChange={(e) => setSubRole(e.target.value)}>
              <option>Researcher</option>
              <option>Economist</option>
              <option>Director</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Work Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Security Key (Password)</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full h-12 font-bold" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : "Initiate Onboarding"}
        </Button>
      </form>
    </AuthLayout>
  );
}