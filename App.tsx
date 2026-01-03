import React, { useState, useEffect } from 'react';
import { BookOpen, LayoutDashboard, Users, Code, Menu, X, GraduationCap, Shield, Gavel, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import BookManager from './components/BookManager';
import LoanManager from './components/LoanManager';
import DeveloperGuide from './components/DeveloperGuide';
import StudentManager from './components/StudentManager';
import AdminManager from './components/AdminManager';
import ConfiscationManager from './components/ConfiscationManager';
import Login from './components/Login';
import { User, UserRole } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('spbt_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('spbt_current_user');
    setUser(null);
  };

  // --- Navigation Items Configuration ---
  const getNavItems = () => {
    const allItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'books', label: 'Pengurusan Buku', icon: BookOpen },
      { id: 'students', label: 'Murid', icon: GraduationCap },
      { id: 'loans', label: 'Pinjaman', icon: Users },
      { id: 'confiscation', label: 'Rampasan', icon: Gavel },
      { id: 'admins', label: 'Urus Pengguna', icon: Shield },
      { id: 'dev', label: 'Developer Guide', icon: Code },
    ];

    // Access Control Logic
    if (user?.role === UserRole.PREFECT) {
        // Prefects can only see Dashboard, Loans, Confiscations and Students (Read-only logic inside components can handle details)
        return allItems.filter(item => ['dashboard', 'loans', 'confiscation', 'students'].includes(item.id));
    }

    if (user?.role === UserRole.TEACHER) {
        // Teachers see everything except Admin mgmt (usually) and Dev guide
        return allItems.filter(item => item.id !== 'admins' && item.id !== 'dev');
    }

    // Admins and Super Admins see everything
    return allItems;
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'books': return <BookManager />;
      case 'students': return <StudentManager />;
      case 'loans': return <LoanManager />;
      case 'confiscation': return <ConfiscationManager />;
      case 'dev': return <DeveloperGuide />;
      case 'admins': return <AdminManager />;
      default: return <Dashboard />;
    }
  };

  // If not logged in, show Login Screen
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const navItems = getNavItems();

  // Reset current page if user role changes and they are on a forbidden page
  if (!navItems.find(i => i.id === currentPage)) {
      setCurrentPage('dashboard');
  }

  // --- Main App ---
  return (
    <div className="flex h-screen overflow-hidden relative font-sans text-slate-200">
      
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar - Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-4 left-4 z-50 w-72 rounded-2xl glass-panel transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:inset-y-0 lg:left-0 lg:m-4 lg:w-64 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-6 h-20 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
              <BookOpen className="text-white h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">SPBT<span className="text-blue-400 font-light">Pro</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setSidebarOpen(false);
              }}
              className={`flex items-center w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 group ${
                currentPage === item.id 
                  ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white shadow-lg shadow-blue-900/50 border border-white/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/5 border border-transparent'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 transition-transform group-hover:scale-110 ${currentPage === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-300'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/20 mb-3">
             <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center font-bold text-white shadow-md">
                   {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-white text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-blue-400 font-mono truncate">
                    {user.role === UserRole.SUPER_ADMIN ? 'Super Admin' : 
                     user.role === UserRole.PREFECT ? 'Pengawas' : user.role}
                  </p>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition" title="Log Keluar">
                    <LogOut size={16} />
                </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Glass Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-8 mt-4 mx-4 rounded-2xl glass-panel mb-4 lg:mb-0 lg:mx-0 lg:mt-4 lg:mr-4">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="mr-4 lg:hidden text-slate-300 hover:text-white p-2 hover:bg-white/10 rounded-lg transition"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {navItems.find(n => n.id === currentPage)?.label}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Sistem Pengurusan Buku Teks Digital</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-black/20 border border-white/10 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Sistem Aktif
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 lg:pt-2 pb-20 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}