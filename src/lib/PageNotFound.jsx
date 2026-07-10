import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { ShieldAlert, Home, ChevronLeft } from 'lucide-react';

export default function PageNotFound() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const pageName = location.pathname.substring(1);

    // Supabase Auth Integration
    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await supabaseAuth.me();
                return { user, isAuthenticated: !!user };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#05070A] text-slate-200">
            <div className="max-w-md w-full main-anim">
                <div className="text-center space-y-6">
                    {/* 404 Executive Display */}
                    <div className="space-y-2">
                        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-900 opacity-50">
                            404
                        </h1>
                        <div className="h-1 w-20 bg-blue-500/50 mx-auto rounded-full"></div>
                    </div>
                    
                    {/* Message Context */}
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-white">
                            {lang === 'sw' ? 'Ukurasa Haijapatikana' : 'Page Not Found'}
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            {lang === 'sw' 
                                ? `Samahani, ukurasa wa "${pageName}" haupo katika mfumo huu wa kitaifa.` 
                                : `The system path "${pageName}" could not be resolved in the Sovereign Gateway.`}
                        </p>
                    </div>
                    
                    {/* Admin Intelligence Note */}
                    {isFetched && authData?.isAuthenticated && (authData.user?.role === 'super_admin' || authData.user?.role === 'admin') && (
                        <div className="mt-8 p-5 glass-card border-blue-500/30 text-left relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-10">
                                <ShieldAlert size={40} />
                             </div>
                             <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Developer Intelligence</p>
                             <p className="text-sm text-slate-300 leading-relaxed">
                                 The route <code className="text-blue-300">/{pageName}</code> is defined in the manifest but the UI component is missing. Please verify the <strong>AlphaEconomist</strong> build logs.
                             </p>
                        </div>
                    )}
                    
                    {/* Sovereign Navigation Actions */}
                    <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="flex items-center justify-center px-6 py-3 text-sm font-bold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            {lang === 'sw' ? 'Rudi' : 'Go Back'}
                        </button>
                        <button 
                            onClick={() => navigate('/')} 
                            className="flex items-center justify-center px-6 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            {lang === 'sw' ? 'Mwanzo' : 'Sovereign Home'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}