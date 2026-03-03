import React from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { Feather, ArrowLeft } from 'lucide-react';

const Login = () => {
  const { loginCustomer, currentUser } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      navigate('/shop');
    }
  }, [currentUser, navigate]);

  const handleLogin = async () => {
    await loginCustomer();
  };

  return (
    <div className="min-h-screen bg-native-sand bg-fabric-texture flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full relative shadow-card rounded-[3rem] text-center p-12 border border-native-black/5 animate-in fade-in zoom-in duration-500">
         <div className="flex justify-center mb-8">
             <div className="bg-native-sand/50 p-6 rounded-full border border-native-black/5 shadow-inner">
                <Feather size={48} className="text-native-clay drop-shadow-sm" />
             </div>
         </div>
         
         <h1 className="font-display text-4xl md:text-5xl text-native-black mb-3 uppercase drop-shadow-sm">Join The Tribe</h1>
         <p className="font-sans text-native-earth/60 text-lg mb-12 leading-relaxed">Sign in to track your bounties and save your favorites.</p>
         
         <button 
           onClick={handleLogin}
           className="w-full bg-white text-native-black border border-native-black/10 font-tribal uppercase tracking-[0.2em] font-bold py-5 px-8 hover:bg-native-black hover:text-white transition-all shadow-ink rounded-full flex items-center justify-center gap-4 group"
         >
           <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 group-hover:brightness-110 transition-all" alt="Google" />
           Sign in with Google
         </button>
         
         <div className="mt-10 pt-8 border-t border-native-black/5">
             <button onClick={() => navigate('/')} className="flex items-center justify-center gap-2 text-native-earth/60 hover:text-native-clay font-tribal uppercase text-[10px] tracking-[0.3em] font-bold transition-colors">
                 <ArrowLeft size={14} /> Return Home
             </button>
         </div>
      </div>
    </div>
  );
};

export default Login;