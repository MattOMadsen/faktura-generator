import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

function authHeaders(token: string | null) {
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () =>
      fetch(`${API}/customers`, { headers: authHeaders(token) }).then((r) => r.json()),
  });

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCvr, setCustomerCvr] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('14');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 },
  ]);

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      fetch(`${API}/invoices`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/invoices');
    },
  });

  const addLine = () =>
    setLineItems([...lineItems, { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }]);
  const removeLine = (id: string) => setLineItems(lineItems.filter((l) => l.id !== id));
  const updateLine = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const vatTotal = subtotal * 0.25;
  const total = subtotal + vatTotal;

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const c = customers.find((x: any) => String(x.id) === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerEmail(c.email);
      setCustomerAddress(c.address || '');
      setCustomerCvr(c.cvr || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customer_id: customerId ? Number(customerId) : null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_address: customerAddress,
      customer_cvr: customerCvr,
      line_items: lineItems.map((l) => ({ ...l, line_total: l.quantity * l.unit_price })),
      subtotal,
      vat_total: vatTotal,
      total,
      due_date: dueDate,
      payment_terms: Number(paymentTerms),
      notes,
    };
    createMutation.mutate(payload);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Opret ny faktura</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Kunde */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Kundeoplysninger</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Vælg eksisterende kunde</label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="input"
                >
                  <option value="">-- Ny kunde --</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Navn *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">E-mail *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Adresse</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">CVR</label>
                  <input
                    type="text"
                    value={customerCvr}
                    onChange={(e) => setCustomerCvr(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fakturalinjer */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Fakturalinjer</h2>
            <div className="space-y-3">
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="label">Beskrivelse</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLine(item.id, 'description', e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Antal</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLine(item.id, 'quantity', Number(e.target.value))}
                      className="input"
                      required
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="label">Enhedspris (DKK)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLine(item.id, 'unit_price', Number(e.target.value))}
                      className="input"
                      required
                    />
                  </div>
                  <div className="sm:col-span-1 text-right font-medium text-gray-700 py-2.5">
                    {(item.quantity * item.unit_price).toLocaleString('da-DK', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    DKK
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeLine(item.id)}
                      className="p-2 rounded-md hover:bg-red-100 text-red-500"
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLine} className="btn-outline mt-4 text-sm">
              <Plus size={16} /> Tilføj linje
            </button>
          </div>

          {/* Noter */}
          <div className="card">
            <label className="label">Noter</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              rows={3}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Betalingsoplysninger</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Forfaldsdato *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Betalingsbetingelser (dage)</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="input"
                >
                  <option value="7">7 dage</option>
                  <option value="14">14 dage</option>
                  <option value="30">30 dage</option>
                  <option value="60">60 dage</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card bg-gray-50">
            <h2 className="text-lg font-semibold mb-4">Opsummering</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{subtotal.toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Moms (25%)</span>
                <span>{vatTotal.toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>{total.toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK</span>
              </div>
            </div>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary w-full mt-6">
              <FileText size={18} />
              {createMutation.isPending ? 'Opretter...' : 'Opret faktura'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
