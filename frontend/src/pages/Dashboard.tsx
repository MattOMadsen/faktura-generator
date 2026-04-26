import { useQuery } from '@tanstack/react-query';
import { FileText, Users, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL, authHeaders } from '../lib/api';

export default function Dashboard() {
  const { token } = useAuth();

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () =>
      fetch(`${API_URL}/invoices`, { headers: authHeaders(token) }).then((r) => {
        if (!r.ok) throw new Error('Kunne ikke hente fakturaer');
        return r.json();
      }),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () =>
      fetch(`${API_URL}/customers`, { headers: authHeaders(token) }).then((r) => {
        if (!r.ok) throw new Error('Kunne ikke hente kunder');
        return r.json();
      }),
  });

  const totalRevenue = invoices
    .filter((i: any) => i.status === 'paid')
    .reduce((s: number, i: any) => s + Number(i.total), 0);
  const outstanding = invoices
    .filter((i: any) => i.status === 'unpaid')
    .reduce((s: number, i: any) => s + Number(i.total), 0);
  const overdue = invoices.filter(
    (i: any) => i.status === 'unpaid' && new Date(i.due_date) < new Date()
  );
  const recentInvoices = invoices.slice(0, 5);

  const statCards = [
    { icon: FileText, label: 'Fakturaer', value: invoices.length, href: '/invoices', color: 'text-primary bg-green-50' },
    { icon: Users, label: 'Kunder', value: customers.length, href: '/customers', color: 'text-secondary bg-blue-50' },
    { icon: CheckCircle, label: 'Omsætning', value: `${totalRevenue.toLocaleString('da-DK')} DKK`, href: '/invoices', color: 'text-green-600 bg-green-50' },
    { icon: AlertTriangle, label: 'Restbeløb', value: `${outstanding.toLocaleString('da-DK')} DKK`, href: '/invoices', color: 'text-orange-500 bg-orange-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Link to={s.href} key={s.label} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <div className="text-sm text-gray-500">{s.label}</div>
                <div className="text-xl font-bold">{s.value}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {overdue.length > 0 && (
        <div className="card mb-6 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 text-orange-700 font-semibold mb-2">
            <AlertTriangle size={18} />
            {overdue.length} forfaldne faktura{overdue.length > 1 ? 'er' : ''}
          </div>
          <div className="text-sm text-orange-600">
            Total forfalden:{' '}
            <strong>
              {overdue.reduce((s: number, i: any) => s + Number(i.total), 0).toLocaleString('da-DK')} DKK
            </strong>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Seneste fakturaer</h2>
        <Link to="/create" className="btn-primary text-sm">
          + Opret faktura
        </Link>
      </div>

      <div className="card overflow-hidden">
        {recentInvoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p>Du har ingen fakturaer endnu</p>
            <Link to="/create" className="btn-primary mt-4 inline-flex">
              Opret din første faktura
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nr.</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Kunde</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Beløb</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Forfalder</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv: any) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium">{inv.invoice_number}</td>
                  <td className="py-3 px-4">{inv.customer_name}</td>
                  <td className="py-3 px-4 text-right font-medium">
                    {Number(inv.total).toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={inv.status} dueDate={inv.due_date} />
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500">
                    {new Date(inv.due_date).toLocaleDateString('da-DK')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, dueDate }: { status: string; dueDate: string }) {
  const isLate = status === 'unpaid' && new Date(dueDate) < new Date();
  if (status === 'paid')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle size={12} /> Betalt
      </span>
    );
  if (isLate)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        <AlertTriangle size={12} /> Forfalden
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <Clock size={12} /> Afventer
    </span>
  );
}
