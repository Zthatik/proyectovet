import { useState, useEffect } from 'react';
import { Users, Pencil, Trash2, Check, X } from 'lucide-react';

interface User { id: string; name: string; email: string; role: string; }

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  veterinario: 'bg-blue-100 text-blue-700',
  recepcionista: 'bg-cyan-100 text-cyan-700',
  cliente: 'bg-gray-100 text-gray-600',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrador', veterinario: 'Veterinario', recepcionista: 'Recepcionista', cliente: 'Cliente',
};

export function UserList({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  function startEdit(u: User) {
    setEditingId(u.id);
    setEditRole(u.role);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword('');
  }

  async function saveEdit(id: string) {
    await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: editRole, name: editName, email: editEmail, password: editPassword || undefined }),
    });
    setEditingId(null);
    fetchUsers();
  }

  async function deleteUser(id: string) {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Correo</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
            <th className="px-4 py-3 w-24" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                {editingId === u.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 w-full" />
                ) : (
                  <span className="font-medium">{u.name}</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {editingId === u.id ? (
                  <div className="space-y-1">
                    <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Correo" type="email"
                      className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 w-full" />
                    <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Nueva contraseña (opcional)" type="password"
                      className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 w-full" />
                  </div>
                ) : (
                  u.email
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === u.id ? (
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30">
                    <option value="admin">Administrador</option>
                    <option value="veterinario">Veterinario</option>
                    <option value="recepcionista">Recepcionista</option>
                    <option value="cliente">Cliente</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-100'}`}>
                    {roleLabels[u.role] || u.role}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === u.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => saveEdit(u.id)} className="p-1.5 rounded hover:bg-green-50 text-green-600">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(u)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {u.id !== currentUserId && (
                      <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
