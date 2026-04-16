import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  const { showToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Connects to unified v-backend auth
      const response = await authService.login(email, password);
      login(response);
      
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      const errMsg = err.message || 'Failed to sign in. Please check your credentials.';
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="glow-orb w-96 h-96 bg-primary-600/20 top-20 -left-20 animate-pulse-glow"></div>
      <div className="glow-orb w-80 h-80 bg-primary-400/15 bottom-20 -right-20 animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Welcome back</h1>
          <p className="text-gray-400 text-sm">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <button type="button" onClick={() => showToast('Please contact support to reset your password.', 'info')} className="text-sm text-primary-500 hover:text-primary-400 transition-colors">Forgot?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center py-2.5 px-4 text-white rounded-lg transition-colors font-semibold disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium inline-flex items-center">
            Sign up <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
