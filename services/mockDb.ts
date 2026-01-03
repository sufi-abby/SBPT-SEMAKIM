
import { Book, Borrower, Loan, AuditLog, BookCategory, LoanStatus, Student, User, UserRole, Confiscation } from '../types';

// Initial Seed Data
const INITIAL_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'Bahasa Melayu Tingkatan 5',
    category: BookCategory.BAHASA,
    author: 'Dewan Bahasa & Pustaka',
    year: 2021,
    isbn: '978-983-49-2856-1',
    stock: 150,
    damaged: 2,
    lost: 1,
    location: 'Rak A-01',
    price: 15.50,
    createdAt: new Date().toISOString()
  },
  {
    id: 'b2',
    title: 'Biology Form 4 (DLP)',
    category: BookCategory.SAINS_MATEMATIK,
    author: 'Gan Wan Yeat',
    year: 2020,
    isbn: '978-967-123-456-7',
    stock: 80,
    damaged: 0,
    lost: 0,
    location: 'Rak S-03',
    price: 28.90,
    createdAt: new Date().toISOString()
  },
  {
    id: 'b3',
    title: 'Sejarah Tingkatan 3',
    category: BookCategory.SAINS_SOSIAL,
    author: 'Dr. Azharudin',
    year: 2019,
    isbn: '978-983-49-0000-0',
    stock: 200,
    damaged: 5,
    lost: 2,
    location: 'Rak H-02',
    price: 12.00,
    createdAt: new Date().toISOString()
  },
  {
    id: 'b4',
    title: 'Asas Sains Komputer Tingkatan 1',
    category: BookCategory.TEKNIK_VOKASIONAL,
    author: 'KPM',
    year: 2017,
    isbn: '978-983-49-1111-1',
    stock: 60,
    damaged: 0,
    lost: 0,
    location: 'Rak T-01',
    price: 10.50,
    createdAt: new Date().toISOString()
  },
  {
    id: 'b5',
    title: 'Reka Bentuk & Teknologi Tingkatan 2',
    category: BookCategory.TEKNIK_VOKASIONAL,
    author: 'KPM',
    year: 2018,
    isbn: '978-983-49-2222-2',
    stock: 120,
    damaged: 3,
    lost: 1,
    location: 'Rak T-02',
    price: 8.90,
    createdAt: new Date().toISOString()
  },
  {
    id: 'b6',
    title: 'Geografi Tingkatan 2',
    category: BookCategory.SAINS_SOSIAL,
    author: 'KPM',
    year: 2018,
    isbn: '978-983-49-3333-3',
    stock: 100,
    damaged: 1,
    lost: 0,
    location: 'Rak G-01',
    price: 11.50,
    createdAt: new Date().toISOString()
  },
  {
    id: 'b7',
    title: 'Matematik Tingkatan 4',
    category: BookCategory.SAINS_MATEMATIK,
    author: 'KPM',
    year: 2020,
    isbn: '978-983-49-4444-4',
    stock: 180,
    damaged: 4,
    lost: 2,
    location: 'Rak M-01',
    price: 14.00,
    createdAt: new Date().toISOString()
  },
  {
    id: 'b8',
    title: 'English Form 5',
    category: BookCategory.BAHASA,
    author: 'KPM',
    year: 2021,
    isbn: '978-983-49-5555-5',
    stock: 140,
    damaged: 2,
    lost: 1,
    location: 'Rak E-01',
    price: 16.50,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_BORROWERS: Borrower[] = [
  { id: 'u1', name: 'Ali Bin Abu', type: 'STUDENT', identifier: '051212-10-1234', class: '5 Bestari' },
  { id: 'u2', name: 'Cikgu Siti', type: 'TEACHER', identifier: '850101-01-5555' }
];

const INITIAL_STUDENTS: Student[] = [
  { id: 's1', student_id: 'S001', name: 'Ahmad Albab', class_name: '5 Bestari', form_level: 5, gender: 'L', year: 2024, createdAt: new Date().toISOString() },
  { id: 's2', student_id: 'S002', name: 'Siti Aminah', class_name: '4 Amanah', form_level: 4, gender: 'P', year: 2024, createdAt: new Date().toISOString() },
];

const INITIAL_LOANS: Loan[] = [
  {
    id: 'l1',
    bookId: 'b1',
    borrowerId: 'u1',
    borrowDate: '2023-01-15',
    dueDate: '2023-11-30',
    status: LoanStatus.ACTIVE
  }
];

const SUPER_ADMIN_EMAIL = "g-68461230@moe-dl.edu.my";
const MASTER_KEY = "Q1lah3bat4EVER"; // Used as initial password

// Helper to manage LocalStorage
class MockDB {
  private get<T>(key: string, initial: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : initial;
  }

  private set(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- AUTH & USERS ---
  
  getUsers(): User[] { 
    let users = this.get<User[]>('spbt_users', []);
    
    // Ensure Super Admin exists
    const superAdminExists = users.find(u => u.email === SUPER_ADMIN_EMAIL);
    if (!superAdminExists) {
      const superAdmin: User = {
        id: 'super_admin_01',
        email: SUPER_ADMIN_EMAIL,
        name: 'Pentadbir Utama',
        role: UserRole.SUPER_ADMIN,
        passwordHash: MASTER_KEY, // Simple simulation
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        createdAt: new Date().toISOString()
      };
      users.push(superAdmin);
      this.set('spbt_users', users);
    }
    return users; 
  }

  saveUser(user: User, currentUserEmail?: string) {
    const users = this.getUsers();
    
    // Validation
    if (user.role === UserRole.SUPER_ADMIN) {
       // Check if trying to create a SECOND super admin
       const existingSuper = users.find(u => u.role === UserRole.SUPER_ADMIN && u.id !== user.id);
       if (existingSuper) {
         throw new Error("Hanya satu Pentadbir Utama dibenarkan.");
       }
    }

    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      // Check email uniqueness
      if (users.find(u => u.email === user.email)) {
        throw new Error("Emel ini telah digunakan.");
      }
      users.push(user);
    }
    this.set('spbt_users', users);
    this.log('USER_MGMT', `User saved: ${user.email} by ${currentUserEmail || 'System'}`);
  }

  deleteUser(id: string, currentUserEmail: string) {
    const users = this.getUsers();
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return;
    if (userToDelete.role === UserRole.SUPER_ADMIN) {
      throw new Error("Akaun Pentadbir Utama tidak boleh dipadam.");
    }
    
    const newUsers = users.filter(u => u.id !== id);
    this.set('spbt_users', newUsers);
    this.log('USER_MGMT', `User deleted: ${userToDelete.email} by ${currentUserEmail}`);
  }

  login(email: string, password: string): User {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) throw new Error("Emel atau kata laluan salah.");

    const user = users[userIndex];

    if (user.status === 'LOCKED') {
      throw new Error("Akaun dikunci. Sila hubungi Pentadbir Utama.");
    }

    if (user.passwordHash !== password) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.status = 'LOCKED';
        this.log('SECURITY', `Account locked due to 5 failed attempts: ${email}`);
      }
      users[userIndex] = user;
      this.set('spbt_users', users);
      throw new Error(`Katalaluan salah. Cubaan: ${user.failedLoginAttempts}/5`);
    }

    // Success
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date().toISOString();
    users[userIndex] = user;
    this.set('spbt_users', users);
    
    this.log('LOGIN', `User logged in: ${email}`);
    return user;
  }

  // --- BOOKS ---
  getBooks(): Book[] { return this.get('spbt_books', INITIAL_BOOKS); }
  
  saveBook(book: Book) {
    const books = this.getBooks();
    const index = books.findIndex(b => b.id === book.id);
    if (index >= 0) books[index] = book;
    else books.push(book);
    this.set('spbt_books', books);
    this.log('UPDATE_BOOK', `Updated/Added book: ${book.title}`);
  }

  // Bulk Import for Books
  saveBooksBulk(newBooks: Book[], strategy: 'UPDATE' | 'SKIP'): { added: number, updated: number, skipped: number } {
    const currentBooks = this.getBooks();
    let added = 0;
    let updated = 0;
    let skipped = 0;

    newBooks.forEach(newBook => {
      // Logic: Duplicate based on Title + Author (normalized)
      const existingIndex = currentBooks.findIndex(b => 
        b.title.toLowerCase().trim() === newBook.title.toLowerCase().trim() &&
        b.author.toLowerCase().trim() === newBook.author.toLowerCase().trim()
      );

      if (existingIndex >= 0) {
        if (strategy === 'UPDATE') {
          // Update specific fields: Stock, Price, Location, Year
          currentBooks[existingIndex] = {
            ...currentBooks[existingIndex],
            stock: newBook.stock,
            price: newBook.price,
            location: newBook.location,
            author: newBook.author,
            category: newBook.category || currentBooks[existingIndex].category
            // Keep existing ID, Damage, Lost, CreatedAt
          };
          updated++;
        } else {
          skipped++;
        }
      } else {
        // New Book
        // Since ISBN might not be in import, generate a placeholder if missing
        if (!newBook.isbn) {
           newBook.isbn = `NO-ISBN-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        }
        currentBooks.push(newBook);
        added++;
      }
    });

    this.set('spbt_books', currentBooks);
    this.log('BULK_IMPORT_BOOKS', `Import Books: Added ${added}, Updated ${updated}, Skipped ${skipped}`);
    return { added, updated, skipped };
  }

  deleteBook(id: string) {
    const books = this.getBooks().filter(b => b.id !== id);
    this.set('spbt_books', books);
    this.log('DELETE_BOOK', `Deleted book ID: ${id}`);
  }

  // --- BORROWERS ---
  getBorrowers(): Borrower[] { return this.get('spbt_borrowers', INITIAL_BORROWERS); }
  addBorrower(borrower: Borrower) {
    const list = this.getBorrowers();
    list.push(borrower);
    this.set('spbt_borrowers', list);
  }

  // --- STUDENTS ---
  getStudents(): Student[] { return this.get('spbt_students', INITIAL_STUDENTS); }
  
  saveStudent(student: Student) {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === student.id || s.student_id === student.student_id);
    if (index >= 0) {
        students[index] = { ...students[index], ...student };
    } else {
        students.push(student);
    }
    this.set('spbt_students', students);
    this.log('UPDATE_STUDENT', `Updated student: ${student.name}`);
  }

  saveStudentsBulk(newStudents: Student[]) {
    const currentStudents = this.getStudents();
    newStudents.forEach(newS => {
        const index = currentStudents.findIndex(curr => curr.student_id === newS.student_id);
        if (index >= 0) {
            currentStudents[index] = { ...currentStudents[index], ...newS };
        } else {
            currentStudents.push(newS);
        }
    });
    this.set('spbt_students', currentStudents);
    this.log('BULK_IMPORT', `Imported ${newStudents.length} students`);
  }

  deleteStudent(id: string) {
    const list = this.getStudents().filter(s => s.id !== id);
    this.set('spbt_students', list);
    this.log('DELETE_STUDENT', `Deleted student ID: ${id}`);
  }

  // --- LOANS ---
  getLoans(): Loan[] { return this.get('spbt_loans', INITIAL_LOANS); }
  
  saveLoan(loan: Loan) {
    const loans = this.getLoans();
    const index = loans.findIndex(l => l.id === loan.id);
    if (index >= 0) loans[index] = loan;
    else loans.push(loan);
    this.set('spbt_loans', loans);
    this.log('LOAN_TRANSACTION', `Loan record updated for Loan ID: ${loan.id} - Status: ${loan.status}`);
  }

  // Helper: Find active loan by Book ID (simulated barcode lookup)
  findActiveLoanByBook(bookId: string): Loan | undefined {
      const loans = this.getLoans();
      // Look for ACTIVE or CONFISCATED (sometimes we want to find confiscated ones to pay)
      return loans.find(l => l.bookId === bookId && (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.CONFISCATED));
  }

  // --- CONFISCATIONS ---
  getConfiscations(): Confiscation[] { return this.get('spbt_confiscations', []); }

  saveConfiscation(record: Confiscation) {
    const list = this.getConfiscations();
    const index = list.findIndex(c => c.id === record.id);
    if (index >= 0) list[index] = record;
    else list.push(record);
    this.set('spbt_confiscations', list);
    
    // Also update the linked loan status
    const loans = this.getLoans();
    const loanIndex = loans.findIndex(l => l.id === record.loanId);
    if (loanIndex >= 0) {
        if (!record.isPaid) {
            loans[loanIndex].status = LoanStatus.CONFISCATED;
        } else {
            // If paid, revert to active (student gets book back)
            loans[loanIndex].status = LoanStatus.ACTIVE; 
        }
        this.set('spbt_loans', loans);
    }

    this.log('CONFISCATION', `Confiscation Record: Book ${record.bookId} - Paid: ${record.isPaid}`);
  }

  deleteConfiscation(id: string) {
      const list = this.getConfiscations();
      const rec = list.find(r => r.id === id);
      if (rec) {
         // Revert loan status if deleting confiscation?
         // For safety, let's just delete the record. User should manually fix loan if needed.
         const newList = list.filter(r => r.id !== id);
         this.set('spbt_confiscations', newList);
         this.log('CONFISCATION_DELETE', `Deleted confiscation ID ${id}`);
      }
  }

  // --- AUDIT ---
  getLogs(): AuditLog[] { return this.get('spbt_logs', []); }
  log(action: string, details: string) {
    const logs = this.getLogs();
    const currentUser = JSON.parse(localStorage.getItem('spbt_current_user') || '{}');
    logs.unshift({
      id: Date.now().toString(),
      action,
      details,
      timestamp: new Date().toISOString(),
      user: currentUser.email || 'System'
    });
    this.set('spbt_logs', logs.slice(0, 100)); // Keep last 100
  }

  // --- UTILS ---
  resetData() {
    localStorage.clear();
    window.location.reload();
  }
}

export const db = new MockDB();
