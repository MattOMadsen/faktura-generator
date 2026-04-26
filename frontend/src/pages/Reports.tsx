import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, TrendingUp, FileText, Calculator } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL, authHeaders } from '../lib/api';

export default function Reports() {
  const { token } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const { data, isLoading } = useQuery({
    queryKey: ['reports', year],
    queryFn: () =>
      fetch(`${API_URL}/reports/vat?year=${year}`, { headers: authHeaders(token) }).then((r) => {
        if (!r.ok) throw new Error('Kunne ikke hente rapport');
        return r.json();
      }),
  });

  if (isLoading) return <div className="text-center py-12">Henter rapport...</div>;

  const quarters = data?.quarters || [];
  const yearly = data?.yearly || {};

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rapporter</h1>
        <div className="flex items-center gap-3">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="input">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <a
            href={`${API_URL}/reports/vat/export?year=${year}`}
            download
            className="btn-outline"
          >
            <Download size={16} /> CSV
          </a>
        </div>
      </div>

      {/* Årsoversigt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total omsætning</div>
              <div className="text-xl font-bold">
                {Number(yearly.total_amount || 0).toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-secondary">
              <Calculator size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total moms</div>
              <div className="text-xl font-bold">
                {Number(yearly.total_vat || 0).toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gray-100 text-gray-600">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Fakturaer</div>
              <div className="text-xl font-bold">{yearly.invoice_count || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Kvartalsopdeling */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          Kvartalsoversigt {year}
        </h2>

        {quarters.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Ingen data for dette år</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Kvartal</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Fakturaer</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Subtotal</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Moms</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {quarters.map((q: any) => (
                  <tr key={q.quarter} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">Q{q.quarter}</td>
                    <td className="py-3 px-4 text-right">{q.invoice_count}</td>
                    <td className="py-3 px-4 text-right">
                      {Number(q.total_subtotal).toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK
                    </td>
                    <td className="py-3 px-4 text-right">
                      {Number(q.total_vat).toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {Number(q.total_amount).toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tip til Skat */}
      <div className="card mt-6 bg-blue-50 border-blue-100">
        <h3 className="font-medium text-blue-900 mb-2">Tip til momsopgørelse</h3>
        <p className="text-sm text-blue-700">
          Download CSV-filen ovenfor og importer den i dit regnskabsprogram (fx Dinero, e-conomic).
          Filen indeholder alle fakturaer for {year} med subtotal, moms og total.
        </p>
      </div>
    </div>
  );
}
