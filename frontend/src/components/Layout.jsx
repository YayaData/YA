import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  GraduationCap, 
  ClipboardList,
  AlertTriangle,
  Phone,
  Calendar,
  BarChart3,
  UserCog,
  LogOut,
  Menu,
  X,
  Shield,
  AlertCircle,
  History
} from 'lucide-react';
import { Button } from './ui/button';

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'qp', 'staff'] },
    { path: '/policies', label: 'Policies', icon: FileText, roles: ['admin', 'qp', 'staff'] },
    { path: '/staff', label: 'Staff', icon: Users, roles: ['admin', 'qp'] },
    { path: '/training', label: 'Training', icon: GraduationCap, roles: ['admin', 'qp'] },
    { path: '/supervision', label: 'QP Supervision', icon: ClipboardList, roles: ['admin', 'qp'] },
    { path: '/incidents', label: 'Incidents', icon: AlertTriangle, roles: ['admin', 'qp', 'staff'] },
    { path: '/emergency', label: 'Emergency Logs', icon: Phone, roles: ['admin', 'qp', 'staff'] },
    { path: '/oncall', label: 'On-Call', icon: Calendar, roles: ['admin', 'qp', 'staff'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'qp'] },
    { path: '/audit', label: 'Audit Trail', icon: History, roles: ['admin'] },
    { path: '/users', label: 'User Management', icon: UserCog, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => hasRole(item.roles));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NON-PHI Warning Banner */}
      <div className="bg-amber-500 text-amber-950 py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>NON-PHI MODE — Do not enter Protected Health Information</span>
        <AlertCircle className="h-4 w-4" />
      </div>

      <div className="flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          mt-10 lg:mt-0
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">AnchorPoint</h1>
                  <p className="text-xs text-slate-400">Compliance Toolkit</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User info & logout */}
            <div className="p-4 border-t border-slate-700">
              <div className="mb-3 px-4">
                <p className="font-medium text-sm">{user?.fullName}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="bg-white border-b border-slate-200 px-4 py-3 lg:px-6">
            <div className="flex items-center justify-between">
              <button 
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              <div className="flex items-center gap-4 ml-auto">
                <span className="text-sm text-slate-500">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
