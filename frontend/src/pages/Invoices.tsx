import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Search, Download, CheckCircle, AlertTriangle, Clock, Trash2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL, authHeaders } from '../lib/api';

export default function Invoices() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sendingId, setSendingId] = useState<number | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () =>
      fetch(`${API_URL}/invoices`, { headers: authHeaders(token) }).then((r) => {
        if (!r.ok) throw new Error('Kunne ikke hente fakturaer');
        return r.json();
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`${API_URL}/invoices/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`${API_URL}/invoices/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const sendEmailMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`${API_URL}/email/send-invoice/${id}`, {
        method: 'POST',
        headers: authHeaders(token),
      }).then((r) => {
        if (!r.ok) throw new Error('Kunne ikke sende e-mail');
        return r.json();
      }),
    onSuccess: () => {
      setSendingId(null);
      alert('Faktura sendt!');
    },
    onError: (err: any) => {
      setSendingId(null);
      alert(err.message);
    },
  });

  const filtered = invoices.filter((inv: any) => {
    const matchesSearch =
      inv.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'overdue' &&
        inv.status === 'unpaid' &&
        new Date(inv.due_date) < new Date()) ||
      inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <div className="text-center py-12">Henter fakturaer...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fakturaer</h1>
        <Link to="/create" className="btn-primary">+ Opret faktura</Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Søg efter kunde eller fakturanummer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-auto">
          <option value="all">Alle</option>
          <option value="unpaid">Ubetalte</option>
          <option value="paid">Betalte</option>
          <option value="overdue">Forfaldne</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p>Ingen fakturaer fundet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Nr.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Kunde</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Beløb</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Forfalder</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Handling</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv: any) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{inv.invoice_number}</td>
                    <td className="py-3 px-4">{inv.customer_name}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {Number(inv.total).toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK
                    </td>
                    <td className="py-3 px-4 text-center"><StatusCell status={inv.status} dueDate={inv.due_date} /></td>
                    <td className="py-3 px-4 text-right text-gray-500">{new Date(inv.due_date).toLocaleDateString('da-DK')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSendingId(inv.id); sendEmailMutation.mutate(inv.id); }}
                          disabled={sendEmailMutation.isPending && sendingId === inv.id}
                          className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600"
                          title="Send faktura via e-mail"
                        ><Send size={16} /></button>
                        <a href={`${API_URL}/pdf/generate/${inv.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500" title="Download PDF">
                          <Download size={16} />
                        </a>
                        {inv.status === 'unpaid' && (
                          <button onClick={() => statusMutation.mutate({ id: inv.id, status: 'paid' })} className="p-1.5 rounded-md hover:bg-green-100 text-green-600" title="Marker som betalt">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {inv.status === 'paid' && (
                          <button onClick={() => statusMutation.mutate({ id: inv.id, status: 'unpaid' })} className="p-1.5 rounded-md hover:bg-yellow-100 text-yellow-600" title="Marker som ubetalt">
                            <Clock size={16} />
                          </button>
                        )}
                        <button onClick={() => { if (confirm('Slet faktura?')) deleteMutation.mutate(inv.id); }} className="p-1.5 rounded-md hover:bg-red-100 text-red-600" title="Slet">
                          <Trash2 size={16} />
                        </button>
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

function StatusCell({ status, dueDate }: { status: string; dueDate: string }) {
  const isLate = status === 'unpaid' && new Date(dueDate) < new Date();
  if (status === 'paid')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={12} /> Betalt</span>;
  if (isLate)
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700"><AlertTriangle size={12} /> Forfalden</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock size={12} /> Afventer</span>;
}
