import React from 'react';
import { db } from '../services/mockDb';
import { Book, Loan, LoanStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { BookOpen, AlertTriangle, CheckCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
const GLASS_CARD = "glass-panel p-6 rounded-2xl relative overflow-hidden group hover:bg-white/10 transition-all duration-300";

export default function Dashboard() {
  const books = db.getBooks();
  const loans = db.getLoans();

  // Calculate Metrics
  const totalBooks = books.reduce((acc, b) => acc + b.stock, 0);
  const totalTitles = books.length;
  const activeLoans = loans.filter(l => l.status === LoanStatus.ACTIVE).length;
  const damagedBooks = books.reduce((acc, b) => acc + b.damaged, 0);
  const lostBooks = books.reduce((acc, b) => acc + b.lost, 0);

  // Chart Data: Books by Category
  const categoryData = books.reduce((acc: any, book) => {
    const existing = acc.find((a: any) => a.name === book.category);
    if (existing) existing.value += book.stock;
    else acc.push({ name: book.category, value: book.stock });
    return acc;
  }, []);

  // Chart Data: Loans Status
  const loanStatusData = [
    { name: 'Aktif', value: activeLoans },
    { name: 'Pulang', value: loans.filter(l => l.status === LoanStatus.RETURNED).length },
    { name: 'Lewat', value: loans.filter(l => l.status === LoanStatus.OVERDUE).length },
  ];

  const StatCard = ({ title, value, sub, icon: Icon, colorClass, gradient }: any) => (
    <div className={GLASS_CARD}>
      {/* Decorative gradient glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} opacity-10 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:opacity-20 transition-opacity`}></div>
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1 tracking-wide uppercase">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
          <p className="text-slate-400 text-xs mt-3 flex items-center">
             <span className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300 mr-2">{sub}</span>
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} shadow-lg shadow-indigo-500/20`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Jumlah Stok" 
          value={totalBooks} 
          sub={`${totalTitles} Judul`} 
          icon={BookOpen} 
          colorClass="from-blue-500 to-blue-600"
          gradient="bg-blue-500"
        />
        <StatCard 
          title="Dipinjam" 
          value={activeLoans} 
          sub="Pinjaman Aktif" 
          icon={TrendingUp} 
          colorClass="from-purple-500 to-purple-600"
          gradient="bg-purple-500"
        />
        <StatCard 
          title="Rosak" 
          value={damagedBooks} 
          sub="Perlu Lupus" 
          icon={AlertTriangle} 
          colorClass="from-orange-500 to-orange-600"
          gradient="bg-orange-500"
        />
        <StatCard 
          title="Hilang" 
          value={lostBooks} 
          sub="Denda Kutipan" 
          icon={AlertTriangle} 
          colorClass="from-red-500 to-pink-600"
          gradient="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
            Taburan Kategori Buku
          </h3>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis fontSize={12} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40}>
                   {
                      categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))
                    }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loan Status Chart */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
             <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
             Statistik Pinjaman
          </h3>
          <div className="h-72 w-full flex justify-center flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loanStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {loanStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Aktiviti Terkini</h3>
          <button className="text-xs text-blue-400 hover:text-blue-300">Lihat Semua</button>
        </div>
        <div className="divide-y divide-white/5">
          {db.getLogs().slice(0, 5).map(log => (
            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{log.action}</p>
                  <p className="text-xs text-slate-500">{log.details}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(log.timestamp).toLocaleTimeString('ms-MY', { hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          ))}
          {db.getLogs().length === 0 && (
            <div className="p-8 text-center text-slate-500">Tiada aktiviti direkodkan.</div>
          )}
        </div>
      </div>
    </div>
  );
}