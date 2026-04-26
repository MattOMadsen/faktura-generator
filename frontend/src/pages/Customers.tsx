import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, Edit2, X, Check } from 'lucide-react';

const API = 'http://localhost:5000/api';

export default function Customers() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', address: '', cvr: '', ean: '', phone: '', notes: '' });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => fetch(`${API}/customers`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: () => fetch(`${API}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) => fetch(`${API}/customers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${API}/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  const resetForm = () => { setForm({ name: '', email: '', address: '', cvr: '', ean: '', phone: '', notes: '' }); setShowForm(false); setEditingId(null); };

  const startEdit = (c: any) => { setForm({ name: c.name, email: c.email, address: c.address || '', cvr: c.cvr || '', ean: c.ean || '', phone: c.phone || '', notes: c.notes || '' }); setEditingId(c.id); setShowForm(true); };

  if (isLoading) return <div className="text-center py-12">Henter kunder...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kunder</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={18} /> {showForm ? 'Annuller' : 'Ny kunde'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Rediger kunde' : 'Ny kunde'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Navn *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">E-mail *</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="sm:col-span-2"><label className="label">Adresse</label><input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><label className="label">CVR</label><input className="input" value={form.cvr} onChange={e => setForm({ ...form, cvr: e.target.value })} /></div>
            <div><label className="label">EAN</label><input className="input" value={form.ean} onChange={e => setForm({ ...form, ean: e.target.value })} /></div>
            <div><label className="label">Telefon</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">Noter</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => editingId ? updateMutation.mutate(editingId) : createMutation.mutate()}
              className="btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Check size={16} /> {editingId ? 'Gem' : 'Opret'}
            </button>
            <button onClick={resetForm} className="btn-outline"><X size={16} /> Annuller</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-50" />
            <p>Du har ingen kunder endnu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Navn</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">E-mail</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Adresse</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">CVR</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Handling</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{c.name}</td>
                    <td className="py-3 px-4">{c.email}</td>
                    <td className="py-3 px-4 text-gray-500">{c.address || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{c.cvr || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => startEdit(c)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"><Edit2 size={16} /></button>
                        <button onClick={() => { if (confirm('Slet kunde?')) deleteMutation.mutate(c.id); }} className="p-1.5 rounded-md hover:bg-red-100 text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
