import React, { useState, useRef } from 'react';
import { db } from '../services/mockDb';
import { Book } from '../types';
import { Printer, QrCode } from 'lucide-react';

const BarcodeSVG: React.FC<{ value: string }> = ({ value }) => {
  // Hash the value to generate a pseudo-random barcode pattern for visual demo
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

export default function BarcodeGenerator() {
  const books = db.getBooks();
  const [selectedBookId, setSelectedBookId] = useState('');
  const [qty, setQty] = useState(10); // How many labels to generate

  const selectedBook = books.find(b => b.id === selectedBookId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-white drop-shadow-md">Jana Kod Bar Buku</h2>
        <button 
          onClick={handlePrint}
          disabled={!selectedBook}
          className="flex items-center px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 disabled:opacity-50 transition-all shadow-lg backdrop-blur-md"
        >
          <Printer size={18} className="mr-2" /> Cetak PDF
        </button>
      </div>

      <div className="glass-panel p-8 rounded-2xl no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Pilih Buku</label>
            <div className="relative">
              <select 
                className="w-full glass-input rounded-xl px-4 py-3 appearance-none text-white cursor-pointer"
                value={selectedBookId}
                onChange={(e) => {
                  const b = books.find(book => book.id === e.target.value);
                  setSelectedBookId(e.target.value);
                  if(b) setQty(b.stock);
                }}
              >
                <option value="" className="bg-slate-800">-- Pilih Buku --</option>
                {books.map(b => (
                  <option key={b.id} value={b.id} className="bg-slate-800 text-white">{b.title} (ISBN: {b.isbn})</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bilangan Kod Bar</label>
            <input 
              type="number" 
              className="w-full glass-input rounded-xl px-4 py-3"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              min={1}
              max={500}
            />
          </div>
        </div>
      </div>

      {/* Preview Area / Print Area */}
      {selectedBook && (
        <div className="glass-panel p-1 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-slate-800/50 p-4 border-b border-white/10 flex items-center gap-2 text-slate-300 mb-0 no-print">
             <QrCode size={16} /> <span className="text-sm">Pratonton Cetakan (Kertas A4)</span>
          </div>
          <div id="printable-area" className="bg-white p-8 min-h-[500px] overflow-auto">
              <div className="text-center mb-6 hidden print:block text-black">
                  <h1 className="text-xl font-bold text-black">Senarai Kod Bar</h1>
                  <p className="text-black">{selectedBook.title} ({selectedBook.isbn})</p>
              </div>
              
              <div className="flex flex-wrap content-start">
                  {Array.from({ length: qty }).map((_, i) => {
                      // Unique ID format: ISBN-Sequence (e.g., 978123-001)
                      const uniqueId = `${selectedBook.isbn.slice(-4)}-${(i + 1).toString().padStart(3, '0')}`;
                      return <BarcodeSVG key={i} value={uniqueId} />;
                  })}
              </div>
          </div>
        </div>
      )}

      {!selectedBook && (
        <div className="glass-panel text-center py-20 rounded-2xl border border-white/10 border-dashed">
          <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
             <QrCode className="text-slate-500" size={32} />
          </div>
          <p className="text-slate-400">Sila pilih buku untuk menjana kod bar.</p>
        </div>
      )}
    </div>
  );
}