import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { User, UserRole } from '../types';
import { UserPlus, Shield, Lock, Trash2, Mail, RefreshCw, X, BadgeCheck } from 'lucide-react';

export default function AdminManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.ADMIN
  });
  const [error, setError] = useState('');
  
  const currentUser = JSON.parse(localStorage.getItem('spbt_current_user') || '{}');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(db.getUsers());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const defaultPassword = "Spbt@1234"; // Default temporary password

      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        passwordHash: defaultPassword,
        role: formData.role,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        createdAt: new Date().toISOString()
      };
      
      db.saveUser(newUser, currentUser.email);
      alert(`Pengguna berjaya dicipta.\nKata laluan sementara: ${defaultPassword}`);
      loadUsers();
      setShowModal(false);
      setFormData({ name: '', email: '', role: UserRole.ADMIN });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Adakah anda pasti mahu memadam pengguna ini?")) {
      try {
        db.deleteUser(id, currentUser.email);
        loadUsers();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
      switch(role) {
          case UserRole.SUPER_ADMIN: 
            return <span className="px-2 py-1 rounded text-xs font-bold border bg-purple-500/20 text-purple-300 border-purple-500/30">Pentadbir Utama</span>;
          case UserRole.ADMIN: 
            return <span className="px-2 py-1 rounded text-xs font-bold border bg-blue-500/20 text-blue-300 border-blue-500/30">Admin</span>;
          case UserRole.TEACHER: 
            return <span className="px-2 py-1 rounded text-xs font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Guru</span>;
          case UserRole.PREFECT: 
            return <span className="px-2 py-1 rounded text-xs font-bold border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Pengawas</span>;
          default: return null;
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-white drop-shadow-lg">Pengurusan Pengguna</h2>
           <p className="text-slate-400 text-sm">Urus akaun pentadbir, guru, dan pengawas.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-500 hover:to-cyan-500 shadow-lg"
        >
          <UserPlus size={18} className="mr-2" /> Tambah Pengguna
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-300">Nama</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Emel</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Peranan</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-300 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {users.map(user => (
                    <tr key={user.id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                        <td className="px-6 py-4 text-slate-400">{user.email}</td>
                        <td className="px-6 py-4">
                            {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4">
                             {user.status === 'LOCKED' ? (
                                 <span className="flex items-center text-red-400 font-bold">
                                     <Lock size={14} className="mr-1" /> Dikunci
                                 </span>
                             ) : (
                                <span className="text-emerald-400">Aktif</span>
                             )}
                        </td>
                        <td className="px-6 py-4 text-right">
                           {user.role !== UserRole.SUPER_ADMIN && (
                               <button onClick={() => handleDelete(user.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                                   <Trash2 size={16} />
                               </button>
                           )}
                           {user.status === 'LOCKED' && (
                               <button className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg" title="Buka Kunci">
                                   <RefreshCw size={16} />
                               </button>
                           )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="glass-panel bg-[#0f172a]/90 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                   <h3 className="text-xl font-bold text-white flex items-center">
                     <Shield className="mr-2 text-blue-400" /> Cipta Pengguna Baru
                   </h3>
                   <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                   {error && (
                       <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs">
                           {error}
                       </div>
                   )}

                   <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Nama Penuh</label>
                      <input required type="text" className="w-full glass-input rounded-xl px-4 py-3" 
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Emel Rasmi</label>
                      <input required type="email" className="w-full glass-input rounded-xl px-4 py-3" 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                   </div>
                   
                   <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Peranan (Role)</label>
                      <select 
                        className="w-full glass-input rounded-xl px-4 py-3 appearance-none"
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                      >
                         <option value={UserRole.ADMIN} className="bg-slate-800">Admin</option>
                         <option value={UserRole.TEACHER} className="bg-slate-800">Guru</option>
                         <option value={UserRole.PREFECT} className="bg-slate-800">Pengawas SPBT</option>
                      </select>
                   </div>

                   <div className="pt-4">
                       <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition">
                          Cipta Akaun
                       </button>
                       <p className="text-xs text-center text-slate-500 mt-3">
                         Kata laluan sementara (Spbt@1234) akan dijana secara automatik.
                       </p>
                   </div>
                </form>
            </div>
         </div>
      )}
    </div>
  );
}