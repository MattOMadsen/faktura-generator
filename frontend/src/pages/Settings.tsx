import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL, authHeaders } from '../lib/api';

export default function Settings() {
  const queryClient = useQueryClient();
  const { token, user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch(`${API_URL}/settings/company`, { headers: authHeaders(token) }).then((r) => r.json()),
  });

  const [form, setForm] = useState({
    company_name: '', company_address: '', company_cvr: '', company_email: '', company_phone: '',
    bank_name: '', reg_number: '', account_number: '', payment_terms: '14', vat_rate: '25',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        company_name: settings.company_name || '', company_address: settings.company_address || '', company_cvr: settings.company_cvr || '',
        company_email: settings.company_email || '', company_phone: settings.company_phone || '',
        bank_name: settings.bank_name || '', reg_number: settings.reg_number || '', account_number: settings.account_number || '',
        payment_terms: String(settings.payment_terms || 14), vat_rate: String(settings.vat_rate || 25),
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => fetch(`${API_URL}/settings/company`, {
      method: 'PUT', headers: authHeaders(token),
      body: JSON.stringify({ ...form, payment_terms: Number(form.payment_terms), vat_rate: Number(form.vat_rate) }),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const upgradeMutation = useMutation({
    mutationFn: () => fetch(`${API_URL}/stripe/create-checkout-session`, {
      method: 'POST', headers: authHeaders(token),
    }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  if (isLoading) return <div className="text-center py-12">Henter indstillinger...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Indstillinger</h1>

      {/* Abonnement */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Abonnement</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${user?.plan === 'pro' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {user?.plan === 'pro' ? <><CheckCircle size={14} className="inline mr-1" /> Pro</> : 'Free'}
          </span>
          {user?.plan !== 'pro' && (
            <button onClick={() => upgradeMutation.mutate()} disabled={upgradeMutation.isPending} className="btn-primary text-sm">
              <CreditCard size={14} /> {upgradeMutation.isPending ? 'Henter...' : 'Opgrader til Pro (49 DKK/md)'}
            </button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-semibold mb-2">Free</div>
            <ul className="space-y-1 text-gray-500">
              <li>5 fakturaer/md</li>
              <li>Standard PDF</li>
              <li>Kunde-database</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="font-semibold text-green-800 mb-2">Pro</div>
            <ul className="space-y-1 text-green-700">
              <li>Ubegrænsede fakturaer</li>
              <li>Egen branding på PDF</li>
              <li>Automatiske rykkere</li>
              <li>Momsrapporter</li>
              <li>E-mail afsendelse</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Firmaoplysninger</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="label">Firmanavn</label><input className="input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">Adresse</label><input className="input" value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })} /></div>
              <div><label className="label">CVR-nummer</label><input className="input" value={form.company_cvr} onChange={(e) => setForm({ ...form, company_cvr: e.target.value })} /></div>
              <div><label className="label">Telefon</label><input className="input" value={form.company_phone} onChange={(e) => setForm({ ...form, company_phone: e.target.value })} /></div>
              <div><label className="label">E-mail</label><input type="email" className="input" value={form.company_email} onChange={(e) => setForm({ ...form, company_email: e.target.value })} /></div>
            </div>

            <hr className="border-gray-100 my-4" />

            <h3 className="font-medium text-gray-700">Bankoplysninger</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3"><label className="label">Bank</label><input className="input" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
              <div><label className="label">Reg. nr.</label><input className="input" value={form.reg_number} onChange={(e) => setForm({ ...form, reg_number: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">Konto nr.</label><input className="input" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></div>
            </div>

            <hr className="border-gray-100 my-4" />

            <h3 className="font-medium text-gray-700">Standardværdier</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Standard betalingsbetingelser (dage)</label><select className="input" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}><option value="7">7 dage</option><option value="14">14 dage</option><option value="30">30 dage</option><option value="60">60 dage</option></select></div>
              <div><label className="label">Standard momssats (%)</label><input type="number" className="input" value={form.vat_rate} onChange={(e) => setForm({ ...form, vat_rate: e.target.value })} /></div>
            </div>
          </div>

          <div className="mt-6">
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary"><Save size={16} /> {saveMutation.isPending ? 'Gemmer...' : 'Gem indstillinger'}</button>
            {saveMutation.isSuccess && <span className="ml-3 text-sm text-green-600">Gemt!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
