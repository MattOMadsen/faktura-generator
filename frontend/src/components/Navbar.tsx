import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, LayoutDashboard, Users, Settings, Menu, X, PlusCircle, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoices', label: 'Fakturaer', icon: FileText },
  { to: '/create', label: 'Opret', icon: PlusCircle },
  { to: '/customers', label: 'Kunder', icon: Users },
  { to: '/settings', label: 'Indstillinger', icon: Settings },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            <FileText size={22} />
            Faktura-Generator
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {user && navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-3 ml-2 pl-2 border-l border-white/20">
                <span className="text-sm text-white/80 flex items-center gap-1">
                  <User size={14} />
                  {user.email}
                </span>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <LogOut size={16} />
                  Log ud
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <User size={16} />
                Log ind
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {user && navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => { logout(); navigate('/login'); setMobileOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:bg-white/10 w-full"
              >
                <LogOut size={16} />
                Log ud
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:bg-white/10"
              >
                <User size={16} />
                Log ind
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
