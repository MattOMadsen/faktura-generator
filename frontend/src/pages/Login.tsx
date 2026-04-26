import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, UserPlus } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white mb-3">
              <LogIn size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRegister ? 'Opret konto' : 'Log ind'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isRegister ? 'Opret din gratis konto i dag' : 'Velkommen tilbage'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="label">Navn</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Dit navn"
                />
              </div>
            )}
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="din@email.dk"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Adgangskode</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              {isRegister ? (
                <><UserPlus size={18} /> Opret konto</>
              ) : (
                <><LogIn size={18} /> Log ind</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {isRegister ? (
              <>
                Har du allerede en konto?{' '}
                <button onClick={() => setIsRegister(false)} className="text-primary font-medium hover:underline">
                  Log ind
                </button>
              </>
            ) : (
              <>
                Har du ikke en konto?{' '}
                <button onClick={() => setIsRegister(true)} className="text-primary font-medium hover:underline">
                  Opret gratis konto
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
