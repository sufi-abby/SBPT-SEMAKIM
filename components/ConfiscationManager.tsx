import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDb';
import { Student, Loan, Book, Confiscation, LoanStatus } from '../types';
import { Search, Gavel, Scan, X, Save, AlertTriangle, Printer, Trash2, CheckCircle, FileText } from 'lucide-react';

export default function ConfiscationManager() {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  
  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [confiscations, setConfiscations] = useState<Confiscation[]>([]);
  
  // Create State
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [scanCode, setScanCode] = useState('');
  const [confiscateCart, setConfiscateCart] = useState<{ book: Book, loan: Loan, note: string }[]>([]);
  const [dateConfiscated, setDateConfiscated] = useState(new Date().toISOString().split('T')[0]);
  
  // Print State
  const [receiptData, setReceiptData] = useState<Confiscation | null>(null);

  // Scanner Ref
  const scannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStudents(db.getStudents());
    setBooks(db.getBooks());
    setConfiscations(db.getConfiscations());
  };

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = e.currentTarget.value.trim();
      if (!code) return;
      if (!selectedStudent) {
        alert("Sila pilih murid dahulu.");
        return;
      }

      // Logic: Find book -> check if borrowed by student -> add to cart
      const book = books.find(b => b.id === code || b.isbn === code);
      if (book) {
        // Find ACTIVE loan for this student and book
        const loans = db.getLoans();
        const activeLoan = loans.find(l => 
            l.bookId === book.id && 
            l.borrowerId === selectedStudent.id && 
            l.status === LoanStatus.ACTIVE
        );

        if (activeLoan) {
            // Check if already in cart
            if (confiscateCart.find(i => i.loan.id === activeLoan.id)) {
                alert("Buku ini sudah ada dalam senarai rampasan.");
            } else {
                setConfiscateCart([...confiscateCart, { book, loan: activeLoan, note: '' }]);
            }
        } else {
            alert("Buku ini tiada dalam rekod pinjaman aktif murid ini.");
        }
      } else {
        alert("Buku tidak dijumpai.");
      }
      setScanCode('');
    }
  };

  const handleSubmit = () => {
    if (confiscateCart.length === 0) return;
    
    confiscateCart.forEach(item => {
        const newRecord: Confiscation = {
            id: Date.now().toString() + Math.random().toString().slice(2,5),
            studentId: selectedStudent!.id,
            bookId: item.book.id,
            loanId: item.loan.id,
            dateConfiscated: dateConfiscated,
            feeAmount: 2.00, // Fixed RM2
            isPaid: false,
            notes: item.note,
            createdBy: 'Guru Disiplin' // Simulated
        };
        db.saveConfiscation(newRecord);
    });

    alert("Rampasan berjaya direkodkan.");
    setConfiscateCart([]);
    setSelectedStudent(null);
    setStudentSearch('');
    refreshData();
    setActiveTab('list');
  };

  const handlePayment = (record: Confiscation) => {
    if (confirm("Tandakan denda RM2.00 sebagai SELESAI DIBAYAR? Status buku akan kembali kepada 'Dipinjam'.")) {
        const updated = { ...record, isPaid: true };
        db.saveConfiscation(updated);
        refreshData();
    }
  };

  const handleDelete = (id: string) => {
      if(confirm("Padam rekod rampasan ini? Ini tidak akan memulangkan status buku secara automatik.")) {
          db.deleteConfiscation(id);
          refreshData();
      }
  }

  // Helper to get names
  const getBookName = (id: string) => books.find(b => b.id === id)?.title || id;
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;
  const getStudentClass = (id: string) => students.find(s => s.id === id)?.class_name || '-';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-white drop-shadow-lg flex items-center">
            <Gavel className="mr-3 text-red-400" /> Modul Rampasan Buku
        </h2>
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
            <button 
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'create' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                Rampasan Baru
            </button>
            <button 
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'list' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                Rekod Rampasan
            </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
           {/* Student Selection */}
           <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Maklumat Murid</h3>
              <div className="relative mb-4">
                 <input 
                   type="text" 
                   className="w-full glass-input rounded-xl px-10 py-3"
                   placeholder="Cari Murid..."
                   value={studentSearch}
                   onChange={e => setStudentSearch(e.target.value)}
                 />
                 <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                 
                 {studentSearch && !selectedStudent && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                        {students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map(s => (
                            <div 
                                key={s.id} 
                                onClick={() => { setSelectedStudent(s); setStudentSearch(''); }}
                                className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/5"
                            >
                                <p className="text-white font-medium">{s.name}</p>
                                <p className="text-xs text-slate-400">{s.class_name}</p>
                            </div>
                        ))}
                    </div>
                 )}
              </div>

              {selectedStudent ? (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl relative">
                      <h4 className="font-bold text-white">{selectedStudent.name}</h4>
                      <p className="text-red-200 text-sm">{selectedStudent.class_name}</p>
                      <button onClick={() => setSelectedStudent(null)} className="absolute top-2 right-2 text-red-300 hover:text-white"><X size={16}/></button>
                  </div>
              ) : (
                  <div className="text-slate-500 text-center py-8 text-sm border-2 border-dashed border-white/10 rounded-xl">
                      Pilih murid dahulu.
                  </div>
              )}

              <div className="mt-6">
                  <label className="text-xs text-slate-400 uppercase font-bold">Tarikh Rampasan</label>
                  <input type="date" className="w-full glass-input rounded-lg px-3 py-2 mt-1" value={dateConfiscated} onChange={e => setDateConfiscated(e.target.value)} />
              </div>
           </div>

           {/* Scanner & Cart */}
           <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col h-full">
               <div className="mb-6">
                  <div className="relative">
                      <input 
                        ref={scannerRef}
                        type="text" 
                        className="w-full bg-black/40 border-2 border-red-500/50 text-red-300 font-mono text-lg rounded-xl px-12 py-4 focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder-red-700/50"
                        placeholder="Imbas Kod Bar Buku..."
                        value={scanCode}
                        onChange={e => setScanCode(e.target.value)}
                        onKeyDown={handleScan}
                        disabled={!selectedStudent}
                      />
                      <Scan className="absolute left-4 top-5 text-red-500 animate-pulse" size={20} />
                  </div>
               </div>

               <div className="flex-1 bg-white/5 rounded-xl p-4 mb-4 overflow-y-auto min-h-[200px]">
                   {confiscateCart.length > 0 ? (
                       confiscateCart.map((item, idx) => (
                           <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-lg mb-2 border border-red-500/20">
                               <div>
                                   <p className="font-bold text-white">{item.book.title}</p>
                                   <p className="text-xs text-slate-400">Denda: RM 2.00</p>
                               </div>
                               <div className="flex items-center gap-3">
                                   <input 
                                     type="text" 
                                     placeholder="Catatan..." 
                                     className="bg-transparent border-b border-slate-600 text-xs text-white px-2 py-1 w-32 focus:border-red-500 outline-none"
                                     value={item.note}
                                     onChange={(e) => {
                                         const newCart = [...confiscateCart];
                                         newCart[idx].note = e.target.value;
                                         setConfiscateCart(newCart);
                                     }}
                                   />
                                   <button onClick={() => setConfiscateCart(confiscateCart.filter((_, i) => i !== idx))} className="text-red-400 hover:text-white">
                                       <X size={18} />
                                   </button>
                               </div>
                           </div>
                       ))
                   ) : (
                       <div className="text-center text-slate-500 py-10">Tiada buku diimbas.</div>
                   )}
               </div>

               <div className="flex justify-between items-center border-t border-white/10 pt-4">
                   <div>
                       <p className="text-slate-400 text-sm">Jumlah Denda</p>
                       <p className="text-2xl font-bold text-red-400">RM {(confiscateCart.length * 2).toFixed(2)}</p>
                   </div>
                   <button 
                     onClick={handleSubmit}
                     disabled={confiscateCart.length === 0}
                     className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       <Gavel size={18} className="mr-2" /> Sahkan Rampasan
                   </button>
               </div>
           </div>
        </div>
      )}

      {activeTab === 'list' && (
          <div className="glass-panel rounded-2xl overflow-hidden no-print">
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                              <th className="p-4 text-slate-300">Murid</th>
                              <th className="p-4 text-slate-300">Buku</th>
                              <th className="p-4 text-slate-300">Tarikh</th>
                              <th className="p-4 text-slate-300">Denda</th>
                              <th className="p-4 text-slate-300">Status</th>
                              <th className="p-4 text-slate-300 text-right">Aksi</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {confiscations.map(rec => (
                              <tr key={rec.id} className="hover:bg-white/5">
                                  <td className="p-4">
                                      <div className="font-medium text-white">{getStudentName(rec.studentId)}</div>
                                      <div className="text-xs text-slate-500">{getStudentClass(rec.studentId)}</div>
                                  </td>
                                  <td className="p-4 text-slate-300">{getBookName(rec.bookId)}</td>
                                  <td className="p-4 text-slate-400">{rec.dateConfiscated}</td>
                                  <td className="p-4 text-white font-mono">RM {rec.feeAmount.toFixed(2)}</td>
                                  <td className="p-4">
                                      {rec.isPaid ? (
                                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs font-bold border border-emerald-500/30">LUNAS</span>
                                      ) : (
                                          <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-bold border border-red-500/30">BELUM BAYAR</span>
                                      )}
                                  </td>
                                  <td className="p-4 text-right flex justify-end gap-2">
                                      <button onClick={() => { setReceiptData(rec); setTimeout(() => window.print(), 300); }} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg" title="Cetak Resit">
                                          <Printer size={16} />
                                      </button>
                                      {!rec.isPaid && (
                                          <button onClick={() => handlePayment(rec)} className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg" title="Bayar Denda">
                                              <CheckCircle size={16} />
                                          </button>
                                      )}
                                      <button onClick={() => handleDelete(rec.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg" title="Padam Rekod">
                                          <Trash2 size={16} />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {confiscations.length === 0 && (
                              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tiada rekod rampasan.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- RECEIPT TEMPLATE (Hidden unless printing) --- */}
      <div id="printable-area" className="hidden print:block bg-white text-black p-8 absolute top-0 left-0 w-full min-h-screen z-[9999]">
          {receiptData && (
              <div className="max-w-xl mx-auto border border-gray-300 p-8">
                  <div className="text-center mb-6 border-b pb-4">
                      <h1 className="text-2xl font-bold uppercase">Resit Rampasan Buku</h1>
                      <p className="text-sm text-gray-600">Unit SPBT Sekolah</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div>
                          <p className="font-bold">No. Resit:</p>
                          <p>RCP-{receiptData.id.slice(-6)}</p>
                      </div>
                      <div className="text-right">
                          <p className="font-bold">Tarikh:</p>
                          <p>{new Date().toLocaleDateString()}</p>
                      </div>
                      <div>
                          <p className="font-bold">Nama Murid:</p>
                          <p>{getStudentName(receiptData.studentId)}</p>
                      </div>
                      <div className="text-right">
                          <p className="font-bold">Kelas:</p>
                          <p>{getStudentClass(receiptData.studentId)}</p>
                      </div>
                  </div>

                  <table className="w-full text-sm mb-6 border-collapse border border-gray-300">
                      <thead>
                          <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-left">Perkara / Buku</th>
                              <th className="border border-gray-300 p-2 text-right">Amaun (RM)</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td className="border border-gray-300 p-2">
                                  <p className="font-bold">Denda Rampasan Buku</p>
                                  <p className="text-xs text-gray-600">{getBookName(receiptData.bookId)}</p>
                                  <p className="text-xs italic text-gray-500">{receiptData.notes}</p>
                              </td>
                              <td className="border border-gray-300 p-2 text-right align-top">
                                  {receiptData.feeAmount.toFixed(2)}
                              </td>
                          </tr>
                      </tbody>
                      <tfoot>
                          <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2 font-bold text-right">JUMLAH</td>
                              <td className="border border-gray-300 p-2 font-bold text-right">{receiptData.feeAmount.toFixed(2)}</td>
                          </tr>
                      </tfoot>
                  </table>

                  <div className="mt-12 flex justify-between text-xs">
                      <div className="text-center">
                          <p className="border-t border-black px-8 pt-2">Tandatangan Guru</p>
                          <p className="mt-1">({receiptData.createdBy})</p>
                      </div>
                      <div className="text-center">
                          <p className="border-t border-black px-8 pt-2">Tandatangan Murid</p>
                      </div>
                  </div>
                  
                  <div className="mt-8 text-center text-[10px] text-gray-400">
                      Resit ini adalah cetakan komputer.
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}