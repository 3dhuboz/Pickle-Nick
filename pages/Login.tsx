import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/shop');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-native-sand bg-fabric-texture flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full relative shadow-card rounded-[3rem] text-center p-12 border border-native-black/5 animate-in fade-in zoom-in duration-500">
        <h1 className="font-display text-4xl md:text-5xl text-native-black mb-3 uppercase drop-shadow-sm">Join The Tribe</h1>
        <p className="font-sans text-native-earth/60 text-lg mb-8 leading-relaxed">Sign in to track your bounties and save your favorites.</p>

        <SignIn
          routing="hash"
          signUpUrl="/login"
          afterSignInUrl="/shop"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border-0 p-0 bg-transparent',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: 'w-full border border-native-black/10 font-tribal uppercase tracking-[0.2em] font-bold py-5 px-8 hover:bg-native-black hover:text-white transition-all shadow-ink rounded-full flex items-center justify-center gap-4',
              formButtonPrimary: 'bg-native-black hover:bg-native-clay font-display uppercase tracking-widest rounded-full',
            }
          }}
        />

        <div className="mt-10 pt-8 border-t border-native-black/5">
          <button onClick={() => navigate('/')} className="flex items-center justify-center gap-2 text-native-earth/60 hover:text-native-clay font-tribal uppercase text-[10px] tracking-[0.3em] font-bold transition-colors mx-auto">
            <ArrowLeft size={14} /> Return Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
