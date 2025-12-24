import React from 'react';

export type Tab = 'dashboard' | 'schedule' | 'tasklist' | 'team' | 'settings';

export type Role = 'Admin' | 'Manager' | 'Spv' | 'Staff';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string; 
  phone?: string; // WhatsApp
  telegramChatId?: string; // New Field for Telegram Bot
  password?: string;
  role: Role;
  department: Department;
  initial: string;
  tasksActive: number;
  tasksDone: number;
}

export type Department = 'General' | 'Busdev' | 'Operasi' | 'Keuangan';

export type TaskStatus = 'Active' | 'Done' | 'Overdue';

export type TaskProgress = 'Not Started' | 'Start' | 'Draft' | 'Revisi' | 'Finish';

export interface FileAttachment {
  name: string;
  url: string; // Base64 or URL
  uploadedAt: Date;
}

// New Interface for History
export interface TaskHistory {
  status: TaskProgress;
  date: Date;
  updatedBy: string;
}

export interface Project {
  id: string;
  title: string;
  department: Department;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'Completed';
}

export interface Task {
  id: string;
  projectId: string; 
  title: string;
  department: Department;
  status: TaskStatus;
  progress: TaskProgress;
  progressDate: Date;     
  startDate: Date;        
  endDate: Date;          
  createdAt: Date;        
  assignees: string[];
  attachment?: FileAttachment | null; // Allow null for Firestore delete
  history?: TaskHistory[]; // New Field to track S, D, R, F timestamps
}

// RENAMED to avoid conflict with window.Notification
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'success';
  relatedTaskId?: string;
  targetDepartment?: Department;
  targetUserIds?: string[]; 
  readBy: string[];
}

export interface Holiday {
  date: string; 
  name: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  onClick?: () => void; 
  trend?: 'up' | 'down' | 'neutral';
}