import {
  LayoutDashboard,
  PawPrint,
  Calendar,
  FileText,
  FlaskConical,
  Package,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { signOut } from '../../lib/auth-client';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  PawPrint,
  Calendar,
  FileText,
  FlaskConical,
  Package,
  Receipt,
  BarChart3,
  Settings,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  navItems: NavItem[];
  currentPath: string;
  userName: string;
  userRole: string;
  isOpen: boolean;
  collapsed?: boolean;
  animated?: boolean;
  onClose: () => void;
}

export function Sidebar({
  navItems,
  currentPath,
  userName,
  userRole,
  isOpen,
  collapsed = false,
  animated = false,
  onClose,
}: SidebarProps) {
  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    veterinario: 'Veterinario',
    recepcionista: 'Recepcionista',
    cliente: 'Cliente',
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          role="presentation"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Navegación principal"
        className={cn(
          'fixed top-0 left-0 z-50 h-full flex flex-col lg:static lg:z-auto lg:translate-x-0',
          animated && 'transition-all duration-200',
          'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
          collapsed ? 'lg:w-16' : 'lg:w-64',
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center border-b border-sidebar-border shrink-0',
          collapsed ? 'justify-center p-4' : 'justify-between p-4'
        )}>
          <div className={cn('flex items-center gap-3', collapsed && 'lg:justify-center')}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand text-brand-foreground shrink-0">
              <PawPrint size={18} />
            </div>
            {!collapsed && <span className="font-bold text-lg whitespace-nowrap">Alma Veterinaria</span>}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/10 transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Menú principal" className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive =
              currentPath === item.href ||
              (item.href !== '/dashboard' && currentPath.startsWith(item.href));

            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-white/20 text-sidebar-foreground font-semibold'
                    : 'text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground'
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && item.label}
              </a>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-2 border-t border-sidebar-border">
          <div className={cn(
            'flex items-center px-2 py-2 mb-1',
            collapsed ? 'justify-center' : 'gap-3'
          )}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-brand text-brand-foreground shrink-0"
              title={collapsed ? userName : undefined}>
              {userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-sidebar-foreground/70">
                  {roleLabels[userRole] || userRole}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={cn(
              'flex items-center w-full rounded-lg text-sm text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground transition-colors',
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && 'Cerrar sesion'}
          </button>
        </div>
      </aside>
    </>
  );
}
