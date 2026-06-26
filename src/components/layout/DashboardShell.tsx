import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'sonner';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface DashboardShellProps {
  navItems: NavItem[];
  currentPath: string;
  pageTitle: string;
  userName: string;
  userRole: string;
  children: React.ReactNode;
}

export function DashboardShell({
  navItems,
  currentPath,
  pageTitle,
  userName,
  userRole,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        navItems={navItems}
        currentPath={currentPath}
        userName={userName}
        userRole={userRole}
        isOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          title={pageTitle}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onSidebarCollapse={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
