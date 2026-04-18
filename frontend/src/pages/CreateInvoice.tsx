import InvoiceForm from '../components/InvoiceForm';

const CreateInvoice = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary">Opret Ny Faktura</h1>
      <InvoiceForm />
    </div>
  );
};

export default CreateInvoice;