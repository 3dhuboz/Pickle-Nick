import React from 'react';
import { SignIn, useUser } from '@clerk/react';
import { Link, Navigate } from 'react-router-dom';
import NickLogo from '../../components/brand/NickLogo';

const AdminLogin = () => {
  const { user, isLoaded } = useUser();

  if (isLoaded && user) {
    const isAdmin = (user.publicMetadata as any)?.role === 'admin';
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#120d0b] px-5 py-20 text-[#f5f0e6]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,rgba(244,197,109,0.16),transparent_32%),linear-gradient(135deg,rgba(244,197,109,0.08)_1px,transparent_1px),#120d0b] bg-[auto,28px_28px,auto]" />
      <div className="relative w-full max-w-md border border-[#f4c56d]/18 bg-[#0b0807]/90 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
        <div className="mb-8 text-center">
          <NickLogo size="lg" className="mb-6 justify-center" />
          <p className="font-tribal text-xs font-bold uppercase tracking-[0.28em] text-native-clay">
            Pickle Keeper
          </p>
          <h1 className="mt-3 font-display text-5xl leading-none text-[#f4c56d]">Ledger Access</h1>
        </div>

        <SignIn
          routing="hash"
          signUpUrl="/admin/login"
          fallbackRedirectUrl="/admin/dashboard"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border-0 p-0 bg-transparent text-[#f5f0e6]',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: 'border border-[#f4c56d]/22 bg-transparent text-[#f5f0e6] hover:bg-[#f4c56d] hover:text-[#120d0b] transition font-tribal uppercase tracking-[0.18em]',
              formFieldLabel: 'font-tribal uppercase tracking-[0.18em] text-[#f4c56d]/76 text-xs',
              formFieldInput: 'border border-[#f4c56d]/18 bg-[#120d0b] text-[#f5f0e6] rounded-none',
              formButtonPrimary: 'bg-[#bc4b35] hover:bg-[#a63d2b] font-tribal uppercase tracking-[0.2em] rounded-none text-sm',
              footerAction: 'hidden',
            },
          }}
        />

        <div className="mt-8 border-t border-[#f4c56d]/14 pt-6 text-center">
          <Link to="/" className="font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d]/72 transition hover:text-[#f4c56d]">
            Return to the shop
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
