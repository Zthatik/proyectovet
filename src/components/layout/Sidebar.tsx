import {
  LayoutDashboard,
  PawPrint,
  Calendar,
  FileText,
  FlaskConical,
  Package,
  Receipt,
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
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto border-r',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: 'oklch(0.78 0.025 52)', borderColor: 'oklch(0.72 0.03 52)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid oklch(0.72 0.03 52)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'oklch(0.37 0.065 50)', color: 'white' }}>
              <PawPrint size={18} />
            </div>
            <span className="font-bold text-lg" style={{ color: 'oklch(0.22 0.04 50)' }}>Alma Veterinaria</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md"
            style={{ color: 'oklch(0.45 0.04 50)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive =
              currentPath === item.href ||
              (item.href !== '/dashboard' && currentPath.startsWith(item.href));

            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={isActive
                  ? { backgroundColor: 'oklch(0.37 0.065 50)', color: 'white' }
                  : { color: 'oklch(0.38 0.04 50)' }
                }
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'oklch(0.72 0.03 52)'; (e.currentTarget as HTMLElement).style.color = 'oklch(0.22 0.04 50)'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'oklch(0.38 0.04 50)'; } }}
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3" style={{ borderTop: '1px solid oklch(0.72 0.03 52)' }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'oklch(0.37 0.065 50)', color: 'white' }}>
              {userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'oklch(0.22 0.04 50)' }}>{userName}</p>
              <p className="text-xs" style={{ color: 'oklch(0.45 0.04 50)' }}>
                {roleLabels[userRole] || userRole}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm transition-colors"
            style={{ color: 'oklch(0.45 0.04 50)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'oklch(0.72 0.03 52)'; (e.currentTarget as HTMLElement).style.color = 'oklch(0.22 0.04 50)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'oklch(0.45 0.04 50)'; }}
          >
            <LogOut size={18} />
            Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  );
}
