import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          Faktura-Generator
        </Link>
        <div className="space-x-4">
          <Link to="/" className="hover:text-accent">Dashboard</Link>
          <Link to="/invoices" className="hover:text-accent">Fakturaer</Link>
          <Link to="/create" className="hover:text-accent">Opret Faktura</Link>
          <Link to="/templates" className="hover:text-accent">Skabeloner</Link>
          <Link to="/customers" className="hover:text-accent">Kunder</Link>
          <Link to="/settings" className="hover:text-accent">Indstillinger</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;