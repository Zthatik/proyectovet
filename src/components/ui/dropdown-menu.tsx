import * as React from 'react';
import { cn } from '../../lib/utils';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenu.* components must be used within <DropdownMenu>');
  return ctx;
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

interface TriggerProps {
  onClick?: (e: React.MouseEvent) => void;
}

function DropdownMenuTrigger({ children }: { children: React.ReactElement<TriggerProps> }) {
  const { open, setOpen } = useDropdownMenuContext();
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e);
      setOpen(!open);
    },
    'aria-expanded': open,
    'aria-haspopup': 'menu',
  } as TriggerProps & React.AriaAttributes);
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
}

function DropdownMenuContent({ className, align = 'end', ...props }: DropdownMenuContentProps) {
  const { open } = useDropdownMenuContext();
  if (!open) return null;
  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 mt-1 min-w-[10rem] rounded-lg border bg-card p-1 text-card-foreground shadow-md',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuItem({ className, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDropdownMenuContext();
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        className
      )}
      {...props}
    />
  );
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
