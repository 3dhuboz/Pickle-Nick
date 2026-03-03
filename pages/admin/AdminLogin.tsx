import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Feather, Lock } from 'lucide-react';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginAdmin } = useStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '123') {
      loginAdmin();
      navigate('/admin/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-native-sand bg-fabric-texture flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full relative shadow-2xl border-4 border-native-black">
        {/* Decorative header strip */}
        <div className="h-4 bg-tribal opacity-60"></div>
        
        <div className="p-10">
          <div className="text-center mb-10">
            <div className="inline-flex justify-center items-center w-20 h-20 bg-native-black rounded-full mb-4 text-native-turquoise shadow-wampum">
                <Feather size={40} />
            </div>
            <h1 className="font-display text-4xl text-native-black mb-2 uppercase">Ledger Access</h1>
            <p className="font-tribal text-native-leather tracking-[0.2em] uppercase text-sm font-bold">For The Pickle Keeper Only</p>
          </div>
          
          {error && (
            <div className="bg-native-clay/10 text-native-clay p-4 mb-6 text-center border-l-4 border-native-clay font-bold font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <label className="block text-xs font-bold text-native-black mb-2 uppercase tracking-widest font-tribal">Identity</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-4 bg-native-sand border-b-2 border-native-black/20 focus:border-native-clay outline-none transition-colors font-sans font-medium text-lg placeholder-native-black/30"
                placeholder="USERNAME"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-native-black mb-2 uppercase tracking-widest font-tribal">Secret Phrase</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-4 bg-native-sand border-b-2 border-native-black/20 focus:border-native-clay outline-none transition-colors font-sans font-medium text-lg placeholder-native-black/30"
                placeholder="PASSWORD"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-native-black text-white font-display text-xl uppercase tracking-widest py-4 mt-4 hover:bg-native-clay transition-all shadow-lg flex items-center justify-center gap-2 group"
            >
              <Lock size={18} className="text-native-turquoise group-hover:text-white transition-colors" />
              Unlock Ledger
            </button>
          </form>
          
          <div className="mt-8 text-center pt-6 border-t border-native-black/10">
              <Link to="/" className="font-tribal text-sm text-native-earth/60 hover:text-native-clay uppercase tracking-wider transition-colors">
                  ← Return to The Shop
              </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;