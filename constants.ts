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

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'HRMS SYSTEM',
    department: 'Busdev',
    startDate: new Date('2025-11-01'),
    endDate: new Date('2025-12-31'),
    status: 'Active'
  },
  {
    id: 'p2',
    title: 'WEBSITE REDESIGN',
    department: 'Operasi',
    startDate: new Date('2025-12-01'),
    endDate: new Date('2026-01-31'),
    status: 'Active'
  }
];

export const TASKS: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Database Karyawan',
    department: 'Busdev',
    status: 'Active',
    progress: 'Start',
    progressDate: new Date('2025-12-01'),
    startDate: new Date('2025-12-01'),
    endDate: new Date('2025-12-10'),
    createdAt: new Date('2025-11-28'),
    assignees: ['u1'],
    history: [
        { status: 'Start', date: new Date('2025-12-01'), updatedBy: 'u1' }
    ]
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Fitur Absensi',
    department: 'Busdev',
    status: 'Active',
    progress: 'Draft',
    progressDate: new Date('2025-12-15'),
    startDate: new Date('2025-12-11'),
    endDate: new Date('2025-12-20'),
    createdAt: new Date('2025-11-29'),
    assignees: ['u2'],
    history: [
        { status: 'Start', date: new Date('2025-12-12'), updatedBy: 'u2' }, // Late start (Plan 11, Start 12)
        { status: 'Draft', date: new Date('2025-12-15'), updatedBy: 'u2' }
    ]
  },
  {
    id: 't3',
    projectId: 'p2',
    title: 'UI/UX Mockup',
    department: 'Operasi',
    status: 'Done',
    progress: 'Finish',
    progressDate: new Date('2025-12-14'),
    startDate: new Date('2025-12-05'),
    endDate: new Date('2025-12-15'),
    createdAt: new Date('2025-11-30'),
    assignees: ['u4'],
    history: [
        { status: 'Start', date: new Date('2025-12-05'), updatedBy: 'u4' },
        { status: 'Draft', date: new Date('2025-12-10'), updatedBy: 'u4' },
        { status: 'Revisi', date: new Date('2025-12-11'), updatedBy: 'u5' },
        { status: 'Finish', date: new Date('2025-12-14'), updatedBy: 'u4' }
    ]
  }
];

export const DEPARTMENTS = ['General', 'Busdev', 'Operasi', 'Keuangan'];

export const HOLIDAYS: Holiday[] = [
  { date: '2025-12-25', name: 'Hari Raya Natal' },
  { date: '2025-12-26', name: 'Cuti Bersama Natal' },
  { date: '2026-01-01', name: 'Tahun Baru 2026' }
];