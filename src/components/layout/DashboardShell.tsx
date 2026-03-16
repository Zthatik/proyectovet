import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        navItems={navItems}
        currentPath={currentPath}
        userName={userName}
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={pageTitle}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
