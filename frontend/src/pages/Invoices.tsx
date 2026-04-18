import { useEffect, useState } from 'react';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    // Hent fakturaer fra backend
    fetch('http://localhost:5000/api/invoices')
      .then((res) => res.json())
      .then((data) => setInvoices(data));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary">Mine Fakturaer</h1>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Fakturanummer</th>
            <th className="py-2 px-4 border">Kunde</th>
            <th className="py-2 px-4 border">Beløb</th>
            <th className="py-2 px-4 border">Status</th>
            <th className="py-2 px-4 border">Forfaldsdato</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="py-2 px-4 border">{invoice.id}</td>
              <td className="py-2 px-4 border">{invoice.customerName}</td>
              <td className="py-2 px-4 border">{invoice.amount * 1.25} DKK</td>
              <td className="py-2 px-4 border">{invoice.status}</td>
              <td className="py-2 px-4 border">{invoice.dueDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Invoices;