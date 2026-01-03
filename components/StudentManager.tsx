import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDb';
import { Student } from '../types';
import { Download, Upload, Search, Trash2, Edit2, Plus, X, AlertTriangle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewData, setPreviewData] = useState<Student[]>([]);
  const [importErrors, setImportErrors] = useState<{row: number, message: string}[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = () => setStudents(db.getStudents());

  const handleDelete = (id: string) => {
    if (confirm('Padam rekod murid ini?')) {
      db.deleteStudent(id);
      loadStudents();
    }
  };

  // --- Export Functionality ---
  const handleExport = () => {
    const exportData = students.map((s, index) => ({
      'No': index + 1,
      'Nama Murid': s.name,
      'ID Murid': s.student_id,
      'Kelas': s.class_name,
      'Tingkatan': s.form_level,
      'Jantina': s.gender,
      'Tahun': s.year,
      'Catatan': s.note || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Murid");
    
    // Auto-width columns
    const wscols = [
      {wch: 5}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 20}
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, "Senarai_Murid_SPBT.xlsx");
  };

  // --- Import Functionality ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);
      
      validateAndPreview(data);
    };
    reader.readAsBinaryString(file);
  };

  const validateAndPreview = (rows: any[]) => {
    const validRows: Student[] = [];
    const errors: {row: number, message: string}[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +1 for header, +1 for 0-index
      
      // Mapping loose column names to strict structure
      const name = row['Nama Murid'] || row['Name'] || row['Nama'];
      const id = row['ID Murid'] || row['No KP'] || row['ID'];
      const className = row['Kelas'] || row['Class'];
      const form = row['Tingkatan'] || row['Level'];
      
      if (!name || !id) {
        errors.push({ row: rowNum, message: 'Nama atau ID Murid wajib diisi.' });
        return;
      }

      validRows.push({
        id: Date.now().toString() + index, // Temporary ID
        student_id: id.toString(),
        name: name.toString(),
        class_name: className ? className.toString() : '',
        form_level: parseInt(form) || 0,
        gender: (row['Jantina'] || row['Gender'] || 'L').toString().toUpperCase().substring(0,1) as 'L'|'P',
        year: parseInt(row['Tahun'] || row['Year']) || new Date().getFullYear(),
        note: row['Catatan'] || '',
        createdAt: new Date().toISOString()
      });
    });

    setPreviewData(validRows);
    setImportErrors(errors);
    setImportStep('preview');
  };

  const commitImport = () => {
    db.saveStudentsBulk(previewData);
    loadStudents();
    closeImportModal();
    alert(`Berjaya import ${previewData.length} rekod murid.`);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportStep('upload');
    setPreviewData([]);
    setImportErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.student_id.includes(searchTerm) ||
    s.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white drop-shadow-lg">Pengurusan Murid</h2>
        <div className="flex gap-3">
          <button onClick={() => setShowImportModal(true)} className="flex items-center px-4 py-2 bg-emerald-600/80 border border-emerald-500/30 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg backdrop-blur-md">
            <Upload size={18} className="mr-2" /> Import
          </button>
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-blue-600/80 border border-blue-500/30 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg backdrop-blur-md">
            <Download size={18} className="mr-2" /> Eksport
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-2 rounded-xl flex items-center w-full max-w-md">
        <div className="p-2 text-slate-400"><Search size={20} /></div>
        <input 
          type="text" 
          placeholder="Cari nama, ID, atau kelas..." 
          className="bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 flex-1 px-2 py-1 outline-none"
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Student List Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-300">ID Murid</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Nama</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Kelas</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Tingkatan</th>
                <th className="px-6 py-4 font-semibold text-slate-300 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-white/5 transition duration-200">
                    <td className="px-6 py-4 font-mono text-slate-400">{student.student_id}</td>
                    <td className="px-6 py-4 text-white font-medium">
                      {student.name}
                      <span className="block text-xs text-slate-500 mt-1">{student.gender === 'L' ? 'Lelaki' : 'Perempuan'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{student.class_name}</td>
                    <td className="px-6 py-4 text-slate-300">{student.form_level}</td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleDelete(student.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Tiada rekod murid.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel bg-[#0f172a]/90 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white flex items-center">
                <FileSpreadsheet className="mr-2 text-emerald-400" /> Import Data Murid
              </h3>
              <button onClick={closeImportModal} className="text-slate-400 hover:text-white"><X /></button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {importStep === 'upload' ? (
                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="p-4 bg-emerald-500/20 rounded-full mb-4">
                    <Upload size={32} className="text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">Muat Naik Fail Excel / CSV</h4>
                  <p className="text-sm text-slate-400 mb-6 text-center max-w-sm">
                    Sila pastikan fail mempunyai lajur: <br/> 
                    <code className="text-xs bg-black/30 px-1 py-0.5 rounded text-yellow-300">Nama Murid</code>, 
                    <code className="text-xs bg-black/30 px-1 py-0.5 rounded text-yellow-300">ID Murid</code>, 
                    <code className="text-xs bg-black/30 px-1 py-0.5 rounded text-yellow-300">Kelas</code>
                  </p>
                  
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload} 
                    ref={fileInputRef}
                    className="hidden" 
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition font-medium shadow-lg">
                    Pilih Fail
                  </label>
                  <a href="#" className="mt-4 text-xs text-blue-400 hover:underline">Muat turun templat contoh</a>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                      <p className="text-sm text-emerald-300">Rekod Sah</p>
                      <p className="text-2xl font-bold text-emerald-400">{previewData.length}</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                      <p className="text-sm text-red-300">Ralat / Tidak Lengkap</p>
                      <p className="text-2xl font-bold text-red-400">{importErrors.length}</p>
                    </div>
                  </div>

                  {/* Errors List */}
                  {importErrors.length > 0 && (
                    <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4 max-h-40 overflow-y-auto">
                      <h5 className="text-sm font-bold text-red-300 mb-2 flex items-center"><AlertTriangle size={14} className="mr-2"/> Senarai Ralat</h5>
                      <ul className="text-xs text-red-200 space-y-1">
                        {importErrors.map((err, i) => (
                          <li key={i}>Baris {err.row}: {err.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Valid Data Preview */}
                  <div>
                     <h5 className="text-sm font-bold text-slate-300 mb-2">Pratonton Data (5 Terawal)</h5>
                     <div className="overflow-x-auto rounded-xl border border-white/10">
                       <table className="w-full text-xs text-left">
                         <thead className="bg-white/10 text-slate-200">
                           <tr>
                             <th className="p-3">ID</th>
                             <th className="p-3">Nama</th>
                             <th className="p-3">Kelas</th>
                             <th className="p-3">Status</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                           {previewData.slice(0, 5).map((row, i) => {
                             const exists = students.some(s => s.student_id === row.student_id);
                             return (
                               <tr key={i}>
                                 <td className="p-3 font-mono">{row.student_id}</td>
                                 <td className="p-3">{row.name}</td>
                                 <td className="p-3">{row.class_name}</td>
                                 <td className="p-3">
                                   {exists ? 
                                     <span className="text-yellow-400">Kemaskini</span> : 
                                     <span className="text-emerald-400">Baru</span>
                                   }
                                 </td>
                               </tr>
                             )
                           })}
                         </tbody>
                       </table>
                     </div>
                     <p className="text-xs text-slate-500 mt-2 text-center">... dan {Math.max(0, previewData.length - 5)} rekod lain.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20">
              <button onClick={closeImportModal} className="px-5 py-2 text-slate-300 hover:bg-white/10 rounded-xl transition">Batal</button>
              {importStep === 'preview' && previewData.length > 0 && (
                <button 
                  onClick={commitImport}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 shadow-lg"
                >
                  Sahkan & Simpan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}