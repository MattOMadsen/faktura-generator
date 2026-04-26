import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import Customers from './pages/Customers';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-6 max-w-6xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/create" element={<CreateInvoice />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
