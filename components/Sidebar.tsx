import React from 'react';
import { LayoutDashboard, CalendarDays, ListTodo, Users, Settings, LogOut, FileText, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Tab, Role } from '../types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  currentUserRole: Role;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed, currentUserRole, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'schedule', label: 'Schedule', icon: <CalendarDays size={20} /> },
    { id: 'tasklist', label: 'Tasks', icon: <ListTodo size={20} /> },
  ];

  if (currentUserRole === 'Admin') {
      menuItems.push({ id: 'team', label: 'Team', icon: <Users size={20} /> });
  }

  // --- DESKTOP SIDEBAR ---
  return (
    <>
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div 
          className={`hidden md:flex ${isCollapsed ? 'w-20' : 'w-64'} bg-[#0f172a] text-slate-300 flex-col h-screen fixed left-0 top-0 z-50 border-r border-slate-800 transition-all duration-300`}
      >
        {/* Brand */}
        <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} gap-3 transition-all`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
            <FileText size={18} />
          </div>
          {!isCollapsed && <h1 className="text-white font-bold text-lg tracking-wide whitespace-nowrap overflow-hidden">DANISWARA</h1>}
        </div>

        {/* Menu */}
        <div className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                  <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 ${
                      isActive 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                          : 'hover:bg-slate-800 text-slate-400'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                      title={isCollapsed ? item.label : ''}
                  >
                      <div className="shrink-0">{item.icon}</div>
                      {!isCollapsed && <span className="whitespace-nowrap overflow-hidden uppercase">{item.label}</span>}
                  </button>
              )
          })}
        </div>

        {/* Toggle Button */}
        <div className="px-3 pb-2">
          <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors"
          >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 space-y-1 mt-auto">
          <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-xs font-bold tracking-wider hover:bg-slate-800 text-slate-400 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Settings size={20} />
            {!isCollapsed && "SETTINGS"}
          </button>
          <button 
              onClick={onLogout}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-xs font-bold tracking-wider hover:bg-slate-800 text-slate-400 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {!isCollapsed && "LOGOUT"}
          </button>
        </div>
      </div>

      {/* --- MOBILE BOTTOM NAV (Visible only on Mobile) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-6 py-2 safe-area-pb">
        <div className="flex justify-between items-center">
            {menuItems.map((item) => {
               const isActive = activeTab === item.id;
               return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                  >
                    <div className={`${isActive ? 'bg-indigo-50 p-1.5 rounded-lg' : ''}`}>
                       {React.cloneElement(item.icon as React.ReactElement<any>, { size: 20 })}
                    </div>
                    <span className="text-[9px] font-bold">{item.label}</span>
                  </button>
               )
            })}
            
            {/* Mobile Settings/More Menu */}
            <button
               onClick={() => setActiveTab('settings')}
               className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
                <div className={`${activeTab === 'settings' ? 'bg-indigo-50 p-1.5 rounded-lg' : ''}`}>
                   <Settings size={20} />
                </div>
                <span className="text-[9px] font-bold">Set</span>
            </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;