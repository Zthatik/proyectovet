import { Menu, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export function Header({ title, onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b bg-card/95 backdrop-blur px-4 h-14 lg:px-6">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-md hover:bg-muted"
      >
        <Menu size={20} />
      </button>

      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button className="relative p-2 rounded-md hover:bg-muted">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
