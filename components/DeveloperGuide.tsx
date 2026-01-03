import React from 'react';
import { Terminal, Database, Server, Cloud, QrCode, Lock } from 'lucide-react';

const CodeBlock = ({ title, code, lang = 'sql' }: { title: string, code: string, lang?: string }) => (
  <div className="mb-8 rounded-xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
    <div className="px-4 py-3 bg-black/40 border-b border-white/5 flex justify-between items-center">
      <div className="flex items-center gap-2">
         <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
         <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
         <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
         <span className="font-mono text-xs font-bold text-slate-300 ml-2">{title}</span>
      </div>
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{lang}</span>
    </div>
    <div className="p-5 overflow-x-auto bg-black/20">
      <pre className="font-mono text-xs sm:text-sm leading-relaxed text-blue-200">
        <code>{code}</code>
      </pre>
    </div>
  </div>
);

const GOOGLE_AUTH_CODE = `// File: backend/auth.js
// 1. Install dependencies: npm install google-auth-library express-session
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const session = require('express-session');

const app = express();
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

// Middleware untuk session
app.use(session({
  secret: 'rahsia_sekolah_123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set 'true' jika menggunakan HTTPS
}));

app.use(express.json());

// API Endpoint: Verifikasi Token dari Frontend
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;

  try {
    // 2. Semak token menggunakan Google API Library
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, 
    });
    
    // 3. Dapatkan maklumat pengguna (payload)
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const domain = payload['hd']; // Hosted Domain (e.g., moe-dl.edu.my)

    // Validasi Organisasi (Optional: Hadkan kepada moe-dl.edu.my)
    if (domain !== 'moe-dl.edu.my') {
       return res.status(403).json({ message: 'Domain emel tidak dibenarkan.' });
    }

    // 4. Simpan dalam sesi server
    req.session.user = {
       id: userid,
       email: email,
       name: name
    };

    console.log('User logged in:', email);

    // 5. Hantar respon berjaya ke frontend
    res.status(200).json({ 
       message: 'Log masuk berjaya', 
       user: req.session.user 
    });

  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ message: 'Token tidak sah' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
`;

const SQL_SCRIPT = `-- 1. Users Table (Admin/Teachers)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'TEACHER', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Books Table (Main Metadata)
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    author VARCHAR(100),
    year_published INT,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    stock_qty INT DEFAULT 0,
    damaged_qty INT DEFAULT 0,
    lost_qty INT DEFAULT 0,
    rack_location VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Book Instances (Standard Barcode Schema)
CREATE TABLE book_instances (
    id SERIAL PRIMARY KEY,
    book_id INT REFERENCES books(id) ON DELETE CASCADE,
    copy_number INT NOT NULL, -- 1..N
    barcode_value VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'BK045-001'
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    class_name VARCHAR(50),
    form_level INT,
    gender VARCHAR(10), 
    year INT DEFAULT 2024,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Loans Table
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    book_instance_id INT REFERENCES book_instances(id), -- Specific copy
    student_id INT REFERENCES students(id),
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    fine_amount DECIMAL(10, 2) DEFAULT 0.00
);

-- 6. Confiscation Records
CREATE TABLE confiscation_records (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    book_instance_id INT REFERENCES book_instances(id),
    loan_id INT REFERENCES loans(id),
    date_confiscated DATE NOT NULL,
    fee_amount DECIMAL(10, 2) DEFAULT 2.00,
    fee_status VARCHAR(20) DEFAULT 'UNPAID', -- PAID/UNPAID
    note TEXT,
    created_by VARCHAR(50)
);`;

const BARCODE_SERVICE_CODE = `// File: backend/services/barcode.js
// Dependencies: npm install express bwip-js pdfkit body-parser
const express = require('express');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Utility: generate barcode PNG buffer (Code128)
async function generateBarcodePng(value) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid:        'code128',    // Barcode type
      text:        value,        // Text to encode
      scale:       3,            // 1-5 -> adjust for DPI/size
      height:      10,           // bar height in mm (approx)
      includetext: true,
      textxalign:  'center',
      textsize:    12
    }, function (err, png) {
      if (err) reject(err);
      else resolve(png);
    });
  });
}

// Endpoint: Generate PDF with N barcodes for a book
app.post('/books/:id/generate-barcodes', async (req, res) => {
  try {
    const bookId = req.params.id;
    const { copies } = req.body; // e.g., 113
    
    if (!copies || copies <= 0) return res.status(400).send('copies required');

    // Create barcode values BK{bookId}-{copyNumber padded to 3}
    // Note: In production, fetch 'bookId' (integer) from DB
    const barcodes = [];
    for (let i = 1; i <= copies; i++) {
      const pad = String(i).padStart(3, '0');
      // Format: BK045-001
      barcodes.push(\`BK\${String(bookId).padStart(3,'0')}-\${pad}\`);
    }

    // Generate barcode images (buffers)
    const pngBuffers = [];
    for (const code of barcodes) {
      const png = await generateBarcodePng(code);
      pngBuffers.push({ code, png });
    }

    // Create PDF (A4 portrait)
    const doc = new PDFDocument({ size: 'A4', margin: 36 }); 
    res.setHeader('Content-disposition', \`attachment; filename=barcodes_book_\${bookId}.pdf\`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Layout Calculation (3 Cols x 8 Rows)
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
    const cols = 3;
    const rows = 8;
    const cellWidth = pageWidth / cols;
    const cellHeight = pageHeight / rows;

    let idx = 0;
    for (let p = 0; p < pngBuffers.length; p++) {
      // Check for new page
      if (idx > 0 && idx % (cols * rows) === 0) doc.addPage();

      const col = idx % cols;
      const row = Math.floor(idx / cols) % rows;
      
      const x = doc.page.margins.left + col * cellWidth + 10;
      const y = doc.page.margins.top + row * cellHeight + 10;

      // Draw barcode image
      const img = pngBuffers[p].png;
      const maxImgWidth = cellWidth - 20;
      const maxImgHeight = cellHeight - 30;
      
      doc.image(img, x, y, { 
          fit: [maxImgWidth, maxImgHeight], 
          align: 'center', 
          valign: 'center' 
      });

      idx++;
    }

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error: ' + err.message);
  }
});`;

const FRONTEND_BARCODE_CODE = `// Frontend Function (React)
async function downloadBarcodes(bookId, copies) {
  try {
    const resp = await fetch(\`/books/\${bookId}/generate-barcodes\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ copies })
    });
    
    if (!resp.ok) throw new Error('Gagal dapatkan PDF');
    
    // Create Blob from PDF response
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    
    // Trigger Download
    const a = document.createElement('a');
    a.href = url;
    a.download = \`barcodes_book_\${bookId}.pdf\`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Error: " + e.message);
  }
}`;

const BACKEND_STUDENT_CODE = `// app.js (Student Management)
// ... imports ...

app.post('/api/students/import', upload.single('file'), async (req, res) => {
    // ... Excel parsing logic ...
});
// ... other routes ...
`;

export default function DeveloperGuide() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
        <h1 className="text-3xl font-bold mb-4 flex items-center text-white relative z-10">
          <Terminal className="mr-3 text-blue-400" /> Developer Guide
        </h1>
        <p className="text-slate-300 text-lg relative z-10 max-w-2xl">
          Panduan teknikal komprehensif, skrip pangkalan data, dan API untuk sistem SPBT.
        </p>
      </div>

      {/* Google Auth Implementation (New Section) */}
      <div className="space-y-4">
        <div className="glass-panel p-6 rounded-2xl bg-slate-900/50 border-blue-500/30">
          <h2 className="text-xl font-bold text-white flex items-center mb-4">
             <Lock className="mr-2 text-blue-400" /> Implementasi Google Sign-In (OAuth 2.0)
          </h2>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
             Berikut adalah kod pelayan (Backend) menggunakan <strong>Node.js</strong> dan <strong>Express</strong> untuk mengesahkan token Google. 
             Fungsi ini memastikan hanya pengguna yang disahkan oleh Google boleh mengakses sistem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs text-slate-400">
             <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                <strong className="text-white block mb-1">Langkah 1: Google Cloud Console</strong>
                1. Buat projek baru di console.cloud.google.com.<br/>
                2. Pergi ke <em>APIs & Services {'>'} Credentials</em>.<br/>
                3. Cipta <strong>OAuth 2.0 Client ID</strong>.<br/>
                4. Salin <code>Client ID</code> ke dalam kod backend.
             </div>
             <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                <strong className="text-white block mb-1">Langkah 2: Frontend Integration</strong>
                Gunakan perpustakaan <code>@react-oauth/google</code> atau SDK rasmi Google Identity Services (GSI) untuk mendapatkan <code>idToken</code> daripada pengguna.
             </div>
          </div>

          <CodeBlock title="backend/auth.js" code={GOOGLE_AUTH_CODE} lang="javascript" />
        </div>
      </div>

      {/* SQL Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Database className="mr-2 text-blue-400" /> Database Schema (PostgreSQL)
        </h2>
        <p className="text-slate-400 text-sm">
          Dikemaskini untuk menyokong modul pengurusan stok, pinjaman, dan rekod pelajar.
        </p>
        <CodeBlock title="schema.sql" code={SQL_SCRIPT} lang="sql" />
      </div>

      {/* Barcode Service Section */}
      <div className="space-y-4">
        <div className="glass-panel p-6 rounded-2xl bg-indigo-900/10 border-indigo-500/30">
          <h2 className="text-xl font-bold text-white flex items-center mb-4">
            <QrCode className="mr-2 text-indigo-400" /> Advanced Barcode Generation (Node.js)
          </h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Implementasi backend untuk menjana <strong>Code128 Barcodes</strong> dalam format PDF standard (A4) menggunakan perpustakaan <code>bwip-js</code> dan <code>pdfkit</code>. 
            Format ID unik: <code>BK&#123;BookID&#125;-&#123;CopyNumber&#125;</code> (Contoh: <code>BK045-001</code>).
          </p>
          
          <h3 className="text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wider">Backend Controller</h3>
          <CodeBlock title="server.js (Barcode Route)" code={BARCODE_SERVICE_CODE} lang="javascript" />
          
          <h3 className="text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wider mt-6">Frontend Consumption</h3>
          <CodeBlock title="client.js" code={FRONTEND_BARCODE_CODE} lang="javascript" />
        </div>
      </div>

      {/* Legacy Backend Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Server className="mr-2 text-green-400" /> Student Management API
        </h2>
        <p className="text-slate-400 text-sm">
          Endpoint untuk pengimportan pukal data pelajar.
        </p>
        <CodeBlock title="students.js" code={BACKEND_STUDENT_CODE} lang="javascript" />
      </div>
    </div>
  );
}