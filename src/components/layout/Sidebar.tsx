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
  onClose: () => void;
}

export function Sidebar({
  navItems,
  currentPath,
  userName,
  userRole,
  isOpen,
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
          'fixed top-0 left-0 z-50 h-full w-64 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand text-brand-foreground">
              <PawPrint size={18} />
            </div>
            <span className="font-bold text-lg">Alma Veterinaria</span>
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
        <nav aria-label="Menú principal" className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/20 text-sidebar-foreground font-semibold'
                    : 'text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground'
                )}
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-brand text-brand-foreground">
              {userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/70">
                {roleLabels[userRole] || userRole}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  );
}
