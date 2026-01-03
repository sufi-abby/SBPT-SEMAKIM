import React, { useState } from 'react';
import { db } from '../services/mockDb';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Simulating Google Sign-In Client Logic
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError('');

    // In a real app, this is where window.google.accounts.id.prompt() happens
    // For this demo, we simulate a network delay and a successful token exchange
    setTimeout(() => {
      try {
        // SIMULATION: We pretend Google returned a payload
        // We log the user in as the Default Super Admin for the demo
        const users = db.getUsers();
        // Default to the first super admin found or create a mock one
        const superAdmin = users.find(u => u.role === 'SUPER_ADMIN') || users[0];

        if (superAdmin) {
            // Update local storage to persist session
            localStorage.setItem('spbt_current_user', JSON.stringify(superAdmin));
            onLogin(superAdmin);
        } else {
            setError("Tiada pengguna didaftarkan. Sila hubungi IT.");
        }
      } catch (err) {
        setError("Gagal menyambung ke Google.");
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

       <div className="glass-panel p-8 sm:p-12 rounded-3xl w-full max-w-md relative z-10 flex flex-col items-center shadow-2xl border border-white/10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2 text-center">Selamat Datang</h1>
          <p className="text-slate-400 text-center mb-8">Sistem Pengurusan Buku Teks (SPBT)</p>

          {error && (
            <div className="w-full bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-6 text-red-200 text-sm text-center animate-pulse">
                {error}
            </div>
          )}

          {/* Google Button */}
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white text-slate-700 hover:bg-slate-50 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            ) : (
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 4.61c1.61 0 3.09.56 4.23 1.64l3.18-3.18C17.46 1.05 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
            )}
            {isLoading ? 'Sedang Mengesahkan...' : 'Log Masuk dengan Google'}
          </button>
       </div>
    </div>
  );
}