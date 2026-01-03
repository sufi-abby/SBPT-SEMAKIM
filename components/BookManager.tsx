import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDb';
import { Book, BookCategory } from '../types';
import { 
  Plus, Search, Edit2, Trash2, X, Download, Printer, QrCode, 
  Archive, AlertTriangle, Upload, FileSpreadsheet, CheckCircle, 
  Filter, ChevronLeft, ChevronRight, Layers 
} from 'lucide-react';
import * as XLSX from 'xlsx';

// --- Internal Helper Component: Barcode SVG ---
const BarcodeSVG: React.FC<{ value: string }> = ({ value }) => {
  const generateBars = (str: string) => {
    let bars = [];
    for(let i=0; i<40; i++) {
        const isBlack = (str.charCodeAt(i % str.length) + i) % 2 === 0;
        bars.push(
            <rect key={i} x={i * 2.5} y="0" width={isBlack ? 2 : 1} height="30" fill={isBlack ? "black" : "white"} />
        );
    }
    return bars;
  };

  return (
    <div className="flex flex-col items-center p-2 border border-dashed border-gray-300 bg-white m-1" style={{width: '180px'}}>
      <p className="text-[10px] font-bold text-center uppercase mb-1 trunc w-full overflow-hidden whitespace-nowrap text-black">SPBT Sekolah</p>
      <svg width="100" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
        {generateBars(value)}
      </svg>
      <p className="text-xs font-mono mt-1 text-black">{value}</p>
    </div>
  );
};

export default function BookManager() {
  const [books, setBooks] = useState<Book[]>([]);
  
  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [showLowStock, setShowLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Edit/Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<Partial<Book>>({});

  // Barcode Printing State
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [printingBook, setPrintingBook] = useState<Book | null>(null);
  const [printQty, setPrintQty] = useState(1);

  // Dispose Modal State
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [disposeData, setDisposeData] = useState({
    bookId: '',
    bookTitle: '',
    currentStock: 0,
    quantity: 1,
    reason: 'Rosak', 
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importPreview, setImportPreview] = useState<Book[]>([]);
  const [importErrors, setImportErrors] = useState<{row: number, message: string}[]>([]);
  const [importStats, setImportStats] = useState({ added: 0, updated: 0, skipped: 0 });
  const [duplicateStrategy, setDuplicateStrategy] = useState<'UPDATE' | 'SKIP'>('SKIP');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = () => setBooks(db.getBooks());

  // --- Filtering Logic ---
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.isbn.includes(searchTerm);
    const matchesCategory = filterCategory === 'Semua' || b.category === filterCategory;
    const matchesStock = showLowStock ? b.stock < 10 : true;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // --- CRUD Operations ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.isbn) return alert("Sila isi maklumat wajib");

    const payload: Book = {
      id: editingBook ? editingBook.id : Date.now().toString(),
      title: formData.title!,
      category: formData.category || BookCategory.OTHER,
      author: formData.author || '',
      year: formData.year || new Date().getFullYear(),
      isbn: formData.isbn!,
      stock: Number(formData.stock) || 0,
      damaged: Number(formData.damaged) || 0,
      lost: Number(formData.lost) || 0,
      location: formData.location || '',
      price: Number(formData.price) || 0,
      createdAt: editingBook ? editingBook.createdAt : new Date().toISOString()
    };

    db.saveBook(payload);
    loadBooks();
    setShowModal(false);
    setFormData({});
    setEditingBook(null);
  };

  const openEdit = (book: Book) => {
    setEditingBook(book);
    setFormData(book);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Adakah anda pasti mahu memadam buku ini?")) {
      db.deleteBook(id);
      loadBooks();
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "spbt_books_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- Dispose Operations ---
  const openDispose = (book: Book) => {
    setDisposeData({
      bookId: book.id,
      bookTitle: book.title,
      currentStock: book.stock,
      quantity: 1,
      reason: 'Rosak',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowDisposeModal(true);
  };

  const handleDisposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const book = books.find(b => b.id === disposeData.bookId);
    if (!book) return;

    const qty = Number(disposeData.quantity);
    if (qty > book.stock) {
      alert("Kuantiti pelupusan melebihi stok semasa.");
      return;
    }

    let newStock = book.stock - qty;
    let newDamaged = book.damaged;
    let newLost = book.lost;

    // Logic updates based on reason
    if (disposeData.reason === 'Rosak') {
      newDamaged += qty;
    } else if (disposeData.reason === 'Hilang') {
      newLost += qty;
    } 
    // If 'Musnah' or 'Lupus', we just reduce stock

    const updatedBook: Book = {
      ...book,
      stock: newStock,
      damaged: newDamaged,
      lost: newLost
    };

    db.saveBook(updatedBook);
    db.log('DISPOSE_BOOK', `Pelupusan buku: ${book.title} (${qty} unit) - Sebab: ${disposeData.reason}`);
    
    loadBooks();
    setShowDisposeModal(false);
  };

  // --- Import Operations ---
  const handleDownloadTemplate = () => {
      const templateData = [
          { "Judul": "Bahasa Melayu Tingkatan 1", "Stok": 100, "Harga": 15.50, "Pengarang": "Dewan Bahasa", "Lokasi Rak": "A-01" },
          { "Judul": "Sains Tingkatan 2", "Stok": 80, "Harga": 12.00, "Pengarang": "Pustaka Jaya", "Lokasi Rak": "S-02" }
      ];
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template_Buku");
      XLSX.writeFile(wb, "Template_Import_Buku.xlsx");
  };

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
      validateAndPreviewImport(data);
    };
    reader.readAsBinaryString(file);
  };

  const validateAndPreviewImport = (rows: any[]) => {
      const validBooks: Book[] = [];
      const errors: {row: number, message: string}[] = [];

      rows.forEach((row, index) => {
          const rowNum = index + 2; 
          
          const title = row['Judul'] || row['Title'];
          const stock = row['Stok'] || row['Stock'];
          const price = row['Harga'] || row['Price'];
          const author = row['Pengarang'] || row['Author'];
          const location = row['Lokasi Rak'] || row['Location'] || row['Rak'];

          if (!title) {
              errors.push({ row: rowNum, message: "Kolum 'Judul' wajib diisi." });
              return;
          }
          if (stock === undefined || isNaN(Number(stock))) {
              errors.push({ row: rowNum, message: "Kolum 'Stok' mestilah nombor." });
              return;
          }
          if (price === undefined || isNaN(Number(price))) {
              errors.push({ row: rowNum, message: "Kolum 'Harga' mestilah nombor." });
              return;
          }
          if (!author) {
               errors.push({ row: rowNum, message: "Kolum 'Pengarang' wajib diisi." });
               return;
          }

          validBooks.push({
              id: `tmp_${Date.now()}_${index}`,
              title: String(title).trim(),
              category: BookCategory.OTHER, 
              author: String(author).trim(),
              year: new Date().getFullYear(),
              isbn: '', 
              stock: Number(stock),
              damaged: 0,
              lost: 0,
              location: String(location || ''),
              price: Number(price),
              createdAt: new Date().toISOString()
          });
      });

      setImportPreview(validBooks);
      setImportErrors(errors);
      setImportStep('preview');
  };

  const processImport = () => {
      const result = db.saveBooksBulk(importPreview, duplicateStrategy);
      setImportStats(result);
      loadBooks();
      setImportStep('result');
  };

  const closeImportModal = () => {
      setShowImportModal(false);
      setImportStep('upload');
      setImportPreview([]);
      setImportErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Barcode Operations ---
  const openBarcode = (book: Book) => {
    setPrintingBook(book);
    setPrintQty(book.stock || 10);
    setShowBarcodeModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper for Stock Badge
  const getStockBadge = (stock: number) => {
    if (stock <= 0) return <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-bold border border-red-500/30">Habis</span>;
    if (stock < 10) return <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">Rendah</span>;
    return <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded text-xs font-bold border border-emerald-500/30">Ada</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <h2 className="text-2xl font-bold text-white drop-shadow-lg">Pengurusan Data Buku</h2>
        <div className="flex gap-3 flex-wrap">
           <button onClick={() => setShowImportModal(true)} className="flex items-center px-4 py-2 bg-emerald-600/80 border border-emerald-500/30 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg backdrop-blur-md text-sm font-medium">
            <Upload size={16} className="mr-2" /> Import
           </button>
           <button onClick={handleExport} className="flex items-center px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all shadow-lg backdrop-blur-md text-sm font-medium">
            <Download size={16} className="mr-2" /> Eksport
          </button>
          <button 
            onClick={() => { setEditingBook(null); setFormData({}); setShowModal(true); }}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/30 transition-all text-sm font-medium"
          >
            <Plus size={16} className="mr-2" /> Tambah
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center no-print border border-white/10">
        <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari judul atau ISBN..." 
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-1 focus:ring-blue-500 outline-none"
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
             <div className="relative min-w-[180px]">
                 <Layers size={16} className="absolute left-3 top-3 text-slate-400" />
                 <select 
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-8 py-2.5 text-white appearance-none cursor-pointer focus:ring-1 focus:ring-blue-500 outline-none"
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                 >
                    <option className="bg-slate-900" value="Semua">Semua Kategori</option>
                    {Object.values(BookCategory).map(cat => (
                        <option key={cat} className="bg-slate-900" value={cat}>{cat}</option>
                    ))}
                 </select>
                 <div className="absolute right-3 top-3 text-slate-500 pointer-events-none">▼</div>
             </div>

             <button 
                onClick={() => { setShowLowStock(!showLowStock); setCurrentPage(1); }}
                className={`flex items-center px-4 py-2.5 rounded-xl border transition ${showLowStock ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5'}`}
             >
                <AlertTriangle size={16} className="mr-2" /> Stok Rendah
             </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden no-print border border-white/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-slate-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/3">Judul Buku</th>
                <th className="px-6 py-4 font-semibold">ISBN</th>
                <th className="px-6 py-4 font-semibold text-center">Stok</th>
                <th className="px-6 py-4 font-semibold">Lokasi</th>
                <th className="px-6 py-4 font-semibold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedBooks.length > 0 ? (
                paginatedBooks.map(book => (
                  <tr key={book.id} className="hover:bg-white/5 transition duration-200">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-base">{book.title}</div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">{book.category}</span>
                        <span>{book.year}</span>
                        <span className="text-slate-500">•</span>
                        <span>{book.author}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">{book.isbn}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg font-bold text-white">{book.stock}</span>
                        {getStockBadge(book.stock)}
                        {(book.damaged > 0 || book.lost > 0) && (
                           <span className="text-[10px] text-red-400 mt-1">Rosak: {book.damaged} | Hilang: {book.lost}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">{book.location}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button onClick={() => openBarcode(book)} className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors" title="Jana Kod Bar">
                          <QrCode size={16} />
                        </button>
                        <button onClick={() => openDispose(book)} className="p-2 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors" title="Lupus Buku">
                          <Archive size={16} />
                        </button>
                        <button onClick={() => openEdit(book)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Kemaskini">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(book.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Padam Rekod">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                        <Search size={40} className="mb-4 opacity-20" />
                        <p>Tiada buku dijumpai.</p>
                        <p className="text-xs mt-1">Cuba ubah tetapan carian atau penapis.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredBooks.length > 0 && (
            <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center bg-black/20">
                <div className="text-sm text-slate-400">
                    Menunjukkan <span className="text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="text-white font-bold">{Math.min(currentPage * itemsPerPage, filteredBooks.length)}</span> daripada <span className="text-white font-bold">{filteredBooks.length}</span> rekod
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                        // Simple logic to show first few pages or sliding window can be added
                        let p = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                            p = currentPage - 2 + i;
                        }
                        if (p > totalPages) return null;
                        
                        return (
                            <button
                                key={p}
                                onClick={() => goToPage(p)}
                                className={`w-8 h-8 rounded-lg text-sm font-bold transition ${currentPage === p ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                            >
                                {p}
                            </button>
                        );
                    })}
                     <button 
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="glass-panel bg-[#0f172a]/80 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-[#0f172a]/50 backdrop-blur-xl z-10">
              <h3 className="text-xl font-bold text-white">{editingBook ? 'Kemaskini Buku' : 'Tambah Buku Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Tajuk Buku</label>
                <input required type="text" className="w-full glass-input rounded-xl px-4 py-3" 
                  value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Masukkan tajuk buku..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kategori</label>
                <select className="w-full glass-input rounded-xl px-4 py-3 appearance-none"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as BookCategory})}>
                  {Object.values(BookCategory).map(c => <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ISBN</label>
                <input required type="text" className="w-full glass-input rounded-xl px-4 py-3" 
                  value={formData.isbn || ''} onChange={e => setFormData({...formData, isbn: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pengarang</label>
                <input type="text" className="w-full glass-input rounded-xl px-4 py-3" 
                  value={formData.author || ''} onChange={e => setFormData({...formData, author: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tahun Terbitan</label>
                <input type="number" className="w-full glass-input rounded-xl px-4 py-3" 
                  value={formData.year || ''} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Harga (RM)</label>
                <input type="number" step="0.01" className="w-full glass-input rounded-xl px-4 py-3" 
                  value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kuantiti Stok</label>
                <input type="number" className="w-full glass-input rounded-xl px-4 py-3" 
                  value={formData.stock || ''} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Lokasi Rak</label>
                <input type="text" className="w-full glass-input rounded-xl px-4 py-3" 
                  value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>

              <div className="col-span-2 pt-6 flex gap-3 justify-end border-t border-white/10 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-300 hover:bg-white/10 rounded-xl transition">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/20 transition transform hover:-translate-y-0.5">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in no-print">
              <div className="glass-panel bg-[#0f172a]/95 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
                  <div className="flex justify-between items-center p-6 border-b border-white/10">
                      <h3 className="text-xl font-bold text-white flex items-center">
                          <FileSpreadsheet className="mr-3 text-emerald-400" /> Import Data Buku (Pukal)
                      </h3>
                      <button onClick={closeImportModal} className="text-slate-400 hover:text-white"><X /></button>
                  </div>

                  <div className="p-8 overflow-y-auto flex-1">
                      {importStep === 'upload' && (
                          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                              <div className="p-5 bg-emerald-500/20 rounded-full mb-6">
                                  <Upload size={40} className="text-emerald-400" />
                              </div>
                              <h4 className="text-xl font-bold text-white mb-2">Muat Naik Fail Excel / CSV</h4>
                              <p className="text-slate-400 mb-8 text-center max-w-md">
                                  Format yang diterima: .xlsx, .xls, .csv. <br/>
                                  Pastikan fail mengandungi kolum: 
                                  <span className="text-emerald-300 font-mono text-xs mx-1">Judul</span>
                                  <span className="text-emerald-300 font-mono text-xs mx-1">Stok</span>
                                  <span className="text-emerald-300 font-mono text-xs mx-1">Harga</span>
                                  <span className="text-emerald-300 font-mono text-xs mx-1">Pengarang</span>
                                  <span className="text-emerald-300 font-mono text-xs mx-1">Lokasi Rak</span>
                              </p>
                              
                              <div className="flex gap-4">
                                  <button onClick={handleDownloadTemplate} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition flex items-center">
                                      <Download size={18} className="mr-2"/> Muat Turun Template
                                  </button>
                                  <label className="cursor-pointer px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition flex items-center">
                                      <Upload size={18} className="mr-2"/> Pilih Fail
                                      <input 
                                          type="file" 
                                          accept=".xlsx, .xls, .csv" 
                                          className="hidden" 
                                          ref={fileInputRef}
                                          onChange={handleFileUpload}
                                      />
                                  </label>
                              </div>
                          </div>
                      )}

                      {importStep === 'preview' && (
                          <div className="space-y-6">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <h4 className="text-lg font-bold text-white mb-1">Semakan Pra-Import</h4>
                                      <p className="text-sm text-slate-400">Sila semak data sebelum memproses.</p>
                                  </div>
                                  <div className="bg-slate-800 p-3 rounded-xl border border-white/10">
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Jika Rekod Wujud (Judul + Pengarang):</label>
                                      <div className="flex bg-black/40 p-1 rounded-lg">
                                          <button 
                                              onClick={() => setDuplicateStrategy('SKIP')}
                                              className={`flex-1 py-1 px-3 text-xs font-bold rounded-md transition ${duplicateStrategy === 'SKIP' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                          >
                                              ABAIKAN (Skip)
                                          </button>
                                          <button 
                                              onClick={() => setDuplicateStrategy('UPDATE')}
                                              className={`flex-1 py-1 px-3 text-xs font-bold rounded-md transition ${duplicateStrategy === 'UPDATE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                          >
                                              KEMASKINI (Update)
                                          </button>
                                      </div>
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                                      <p className="text-xs font-bold uppercase text-emerald-300 mb-1">Rekod Sah</p>
                                      <p className="text-3xl font-bold text-emerald-400">{importPreview.length}</p>
                                  </div>
                                  <div className={`border p-4 rounded-xl ${importErrors.length > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                                      <p className={`text-xs font-bold uppercase mb-1 ${importErrors.length > 0 ? 'text-red-300' : 'text-slate-400'}`}>Ralat</p>
                                      <p className={`text-3xl font-bold ${importErrors.length > 0 ? 'text-red-400' : 'text-slate-300'}`}>{importErrors.length}</p>
                                  </div>
                              </div>

                              {importErrors.length > 0 && (
                                  <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4 max-h-32 overflow-y-auto">
                                      <h5 className="text-sm font-bold text-red-300 mb-2 flex items-center"><AlertTriangle size={14} className="mr-2"/> Senarai Ralat</h5>
                                      <ul className="text-xs text-red-200 space-y-1 font-mono">
                                          {importErrors.map((err, i) => (
                                              <li key={i}>Baris {err.row}: {err.message}</li>
                                          ))}
                                      </ul>
                                  </div>
                              )}

                              <div className="border border-white/10 rounded-xl overflow-hidden">
                                  <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                                      <p className="text-xs font-bold text-slate-300">Pratonton Data (5 Terawal)</p>
                                  </div>
                                  <div className="overflow-x-auto">
                                      <table className="w-full text-xs text-left">
                                          <thead className="bg-black/20 text-slate-400">
                                              <tr>
                                                  <th className="p-3">Judul</th>
                                                  <th className="p-3">Pengarang</th>
                                                  <th className="p-3">Stok</th>
                                                  <th className="p-3">Harga</th>
                                                  <th className="p-3">Lokasi</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-white/5">
                                              {importPreview.slice(0, 5).map((row, i) => (
                                                  <tr key={i}>
                                                      <td className="p-3 font-medium text-white">{row.title}</td>
                                                      <td className="p-3 text-slate-300">{row.author}</td>
                                                      <td className="p-3 text-emerald-400 font-bold">{row.stock}</td>
                                                      <td className="p-3 text-slate-300">RM {row.price.toFixed(2)}</td>
                                                      <td className="p-3 text-slate-400 font-mono">{row.location}</td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          </div>
                      )}

                      {importStep === 'result' && (
                          <div className="flex flex-col items-center justify-center py-10 space-y-6">
                              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce-short">
                                  <CheckCircle size={40} className="text-white" />
                              </div>
                              <h4 className="text-2xl font-bold text-white">Import Selesai!</h4>
                              
                              <div className="grid grid-cols-3 gap-6 w-full max-w-lg">
                                  <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-xl text-center">
                                      <p className="text-xs text-emerald-300 uppercase font-bold mb-1">Ditambah</p>
                                      <p className="text-3xl font-bold text-white">{importStats.added}</p>
                                  </div>
                                  <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-xl text-center">
                                      <p className="text-xs text-blue-300 uppercase font-bold mb-1">Dikemaskini</p>
                                      <p className="text-3xl font-bold text-white">{importStats.updated}</p>
                                  </div>
                                  <div className="bg-slate-500/20 border border-slate-500/30 p-4 rounded-xl text-center">
                                      <p className="text-xs text-slate-300 uppercase font-bold mb-1">Diabaikan</p>
                                      <p className="text-3xl font-bold text-white">{importStats.skipped}</p>
                                  </div>
                              </div>
                              
                              <p className="text-slate-400 text-sm">Data telah disimpan ke dalam pangkalan data.</p>
                          </div>
                      )}
                  </div>

                  <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                      {importStep === 'result' ? (
                          <button onClick={closeImportModal} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">Tutup</button>
                      ) : (
                          <>
                              <button onClick={closeImportModal} className="px-5 py-2 text-slate-300 hover:bg-white/10 rounded-xl transition">Batal</button>
                              {importStep === 'preview' && importPreview.length > 0 && (
                                  <button onClick={processImport} className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-emerald-500/20">
                                      Proses Import
                                  </button>
                              )}
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Dispose Modal */}
      {showDisposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="glass-panel bg-[#0f172a]/90 rounded-2xl shadow-2xl w-full max-w-lg border border-white/20">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-orange-900/20">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Archive className="mr-3 text-orange-400" /> Lupus Buku
              </h3>
              <button onClick={() => setShowDisposeModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleDisposeSubmit} className="p-6 space-y-5">
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex gap-3">
                 <AlertTriangle className="text-orange-400 shrink-0" size={20} />
                 <div>
                    <h4 className="text-sm font-bold text-orange-300">{disposeData.bookTitle}</h4>
                    <p className="text-xs text-orange-200/70 mt-1">Stok Semasa: {disposeData.currentStock} naskhah</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sebab Pelupusan</label>
                  <select 
                    className="w-full glass-input rounded-xl px-4 py-3 appearance-none"
                    value={disposeData.reason}
                    onChange={e => setDisposeData({...disposeData, reason: e.target.value})}
                  >
                    <option value="Rosak" className="bg-slate-800">Rosak (Damaged)</option>
                    <option value="Hilang" className="bg-slate-800">Hilang (Lost)</option>
                    <option value="Musnah" className="bg-slate-800">Musnah / Hapus Kira</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tarikh</label>
                  <input 
                    type="date" 
                    className="w-full glass-input rounded-xl px-4 py-3"
                    value={disposeData.date}
                    onChange={e => setDisposeData({...disposeData, date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kuantiti</label>
                <input 
                  type="number" 
                  min="1"
                  max={disposeData.currentStock}
                  className="w-full glass-input rounded-xl px-4 py-3"
                  value={disposeData.quantity}
                  onChange={e => setDisposeData({...disposeData, quantity: parseInt(e.target.value)})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Catatan Tambahan</label>
                <textarea 
                  className="w-full glass-input rounded-xl px-4 py-3 h-20 resize-none"
                  value={disposeData.notes}
                  onChange={e => setDisposeData({...disposeData, notes: e.target.value})}
                  placeholder="No. rujukan surat kelulusan (jika ada)..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10 mt-2">
                <button type="button" onClick={() => setShowDisposeModal(false)} className="px-5 py-2.5 text-slate-300 hover:bg-white/10 rounded-xl transition">Batal</button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-500 hover:to-red-500 shadow-lg"
                >
                  Sahkan Pelupusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Print Modal */}
      {showBarcodeModal && printingBook && (
         <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
            <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl mt-10 mb-10 overflow-hidden">
                {/* Modal Header (No Print) */}
                <div className="p-4 bg-slate-900 flex justify-between items-center border-b border-slate-700 no-print">
                   <div className="flex items-center text-white gap-3">
                      <QrCode size={24} className="text-indigo-400"/>
                      <div>
                        <h3 className="text-lg font-bold">{printingBook.title}</h3>
                        <p className="text-xs text-slate-400 font-mono">{printingBook.isbn}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 uppercase font-bold">Kuantiti:</label>
                        <input 
                           type="number" 
                           min="1" 
                           max="500" 
                           value={printQty} 
                           onChange={(e) => setPrintQty(Number(e.target.value))}
                           className="bg-slate-800 text-white border border-slate-600 rounded-lg px-2 py-1 w-20 text-center"
                        />
                      </div>
                      <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center shadow-lg transition-all">
                        <Printer size={16} className="mr-2"/> Cetak
                      </button>
                      <button onClick={() => setShowBarcodeModal(false)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
                        <X size={20} />
                      </button>
                   </div>
                </div>

                {/* Printable Area */}
                <div id="printable-area" className="p-8 bg-white min-h-[600px] text-black">
                   <div className="hidden print:block text-center mb-8 border-b pb-4">
                      <h1 className="text-2xl font-bold uppercase tracking-wider">Sistem SPBT</h1>
                      <p className="text-lg">{printingBook.title}</p>
                      <p className="text-sm font-mono text-gray-600">ISBN: {printingBook.isbn}</p>
                   </div>

                   <div className="flex flex-wrap content-start">
                      {Array.from({ length: printQty }).map((_, i) => {
                          const padId = printingBook.id.padStart(3, '0').slice(-3);
                          const padSeq = (i + 1).toString().padStart(3, '0');
                          const uniqueId = `BK${padId}-${padSeq}`;
                          return <BarcodeSVG key={i} value={uniqueId} />;
                      })}
                   </div>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}