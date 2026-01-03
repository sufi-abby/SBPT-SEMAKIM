
export enum BookCategory {
  BAHASA = 'BAHASA',
  SAINS_MATEMATIK = 'SAINS & MATEMATIK',
  SAINS_SOSIAL = 'SAINS SOSIAL',
  TEKNIK_VOKASIONAL = 'TEKNIK VOKASIONAL',
  OTHER = 'LAIN-LAIN'
}

export interface Book {
  id: string;
  title: string;
  category: BookCategory;
  author: string;
  year: number;
  isbn: string;
  stock: number;
  damaged: number;
  lost: number;
  location: string;
  imageUrl?: string;
  price: number; // Added for compensation calculation
  createdAt: string;
}

export enum LoanStatus {
  ACTIVE = 'Dipinjam',
  RETURNED = 'Dipulangkan',
  OVERDUE = 'Lewat',
  LOST = 'Hilang', // Status for lost books during loan
  CONFISCATED = 'Dirampas' // Status for disciplinary confiscation
}

export enum ReturnCondition {
  GOOD = 'Baik',
  DAMAGED = 'Rosak',
  LOST = 'Hilang'
}

export interface Borrower {
  id: string;
  name: string;
  type: 'STUDENT' | 'TEACHER';
  identifier: string; // IC or Student ID
  class?: string;
}

export interface Student {
  id: string;
  student_id: string; // Unique ID (IC or School ID)
  name: string;
  class_name: string;
  form_level: number;
  gender: 'L' | 'P';
  year: number;
  note?: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  bookId: string;
  borrowerId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: LoanStatus;
  returnCondition?: ReturnCondition;
  notes?: string;
  fine?: number;
}

// --- Confiscation Types ---
export interface Confiscation {
  id: string;
  studentId: string;
  bookId: string;
  loanId: string;
  dateConfiscated: string;
  feeAmount: number; // Default 2.00
  isPaid: boolean;
  notes?: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

// --- Auth & Admin Types ---

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  PREFECT = 'PREFECT'
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // In a real app, never store plain text. Here we simulate hash.
  role: UserRole;
  status: 'ACTIVE' | 'LOCKED' | 'INACTIVE';
  failedLoginAttempts: number;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}