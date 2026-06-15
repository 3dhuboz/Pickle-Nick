import React from 'react';
import { SignIn, useUser } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NickLogo from '../components/brand/NickLogo';

const Login = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/shop');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#120d0b] px-5 py-32 text-[#f5f0e6]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(244,197,109,0.16),transparent_32%),linear-gradient(135deg,rgba(244,197,109,0.08)_1px,transparent_1px),#120d0b] bg-[auto,28px_28px,auto]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
        <div>
          <NickLogo size="lg" />
          <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
            Pantry Access
          </p>
          <h1 className="mt-4 font-display text-[4.1rem] leading-[0.9] text-[#f4c56d] drop-shadow-[0_8px_26px_rgba(0,0,0,0.65)] sm:text-7xl">
            Sign In
          </h1>
          <p className="mt-8 max-w-xl font-sans text-xl font-semibold leading-relaxed text-[#f5f0e6]/76">
            Track your jars, keep the basket close, and come back to Nick's counter without losing the trail.
          </p>
        </div>

        <div className="border border-[#f4c56d]/18 bg-[#0b0807]/88 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.42)] md:p-9">
          <div className="mb-7 text-center">
            <NickLogo size="md" className="justify-center" showName labelClassName="text-2xl leading-none text-left" />
          </div>
          <SignIn
            routing="hash"
            signUpUrl="/login"
            fallbackRedirectUrl="/shop"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none border-0 p-0 bg-transparent text-[#f5f0e6]',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'w-full border border-[#f4c56d]/22 bg-transparent font-tribal uppercase tracking-[0.18em] font-bold py-4 px-6 text-[#f5f0e6] hover:bg-[#f4c56d] hover:text-[#120d0b] transition',
                formFieldLabel: 'font-tribal uppercase tracking-[0.18em] text-[#f4c56d]/76 text-xs',
                formFieldInput: 'border border-[#f4c56d]/18 bg-[#120d0b] text-[#f5f0e6] rounded-none',
                formButtonPrimary: 'bg-[#bc4b35] hover:bg-[#a63d2b] font-tribal uppercase tracking-[0.2em] rounded-none text-sm',
                footerActionLink: 'text-[#f4c56d]',
              },
            }}
          />

          <div className="mt-9 border-t border-[#f4c56d]/14 pt-7 text-center">
            <button
              onClick={() => navigate('/')}
              className="mx-auto inline-flex items-center justify-center gap-2 font-tribal text-xs font-bold uppercase tracking-[0.24em] text-[#f4c56d]/72 transition hover:text-[#f4c56d]"
            >
              <ArrowLeft size={14} /> Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
