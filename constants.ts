import { User, Task, Project, Holiday } from './types';

// HARDCODED TOKEN (Sesuai Request)
export const TELEGRAM_BOT_TOKEN = "7487202251:AAFV12Rqez9tkYFZ6kGYyvfm6Vfk70Cl_iY";

export const USERS: User[] = [
  { id: 'u1', name: 'Admin Utama', username: 'admin', email: 'admin@daniswara.co.id', phone: '6281234567890', role: 'Admin', department: 'General', initial: 'A', tasksActive: 1, tasksDone: 0 },
  { id: 'u2', name: 'Irvan', username: 'irvan', email: 'irvan@daniswara.co.id', phone: '6281234567891', role: 'Manager', department: 'Busdev', initial: 'I', tasksActive: 0, tasksDone: 0 },
  { id: 'u3', name: 'Muklis', username: 'muklis', email: 'muklis@daniswara.co.id', phone: '6281234567892', role: 'Manager', department: 'Keuangan', initial: 'M', tasksActive: 0, tasksDone: 0 },
  { id: 'u4', name: 'Oman', username: 'oman', email: 'oman@daniswara.co.id', phone: '6281234567893', role: 'Staff', department: 'Operasi', initial: 'O', tasksActive: 0, tasksDone: 0 },
  { id: 'u5', name: 'Yoga', username: 'yoga', email: 'yoga@daniswara.co.id', phone: '6281234567894', role: 'Manager', department: 'Operasi', initial: 'Y', tasksActive: 0, tasksDone: 0 },
];

// NOTE: Arrays dikosongkan untuk mencegah auto-seeding otomatis yang tidak diinginkan.
// Data seeding manual sekarang dihandle langsung di App.tsx
export const PROJECTS: Project[] = []; 
export const TASKS: Task[] = [];

export const DEPARTMENTS = ['General', 'Busdev', 'Operasi', 'Keuangan'];

export const HOLIDAYS: Holiday[] = [
  { date: '2025-12-25', name: 'Hari Raya Natal' },
  { date: '2025-12-26', name: 'Cuti Bersama Natal' },
  { date: '2026-01-01', name: 'Tahun Baru 2026' }
];