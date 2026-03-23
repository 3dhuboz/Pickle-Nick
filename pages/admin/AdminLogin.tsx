import React from 'react';
import { SignIn } from '@clerk/react';
import { Link } from 'react-router-dom';

const AdminLogin = () => {
  return (
    <div className="min-h-screen bg-native-sand bg-fabric-texture flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl border-4 border-native-black">
          <div className="h-4 bg-tribal opacity-60"></div>
          <div className="p-10">
            <div className="text-center mb-8">
              <h1 className="font-display text-4xl text-native-black mb-2 uppercase">Ledger Access</h1>
              <p className="font-tribal text-native-leather tracking-[0.2em] uppercase text-sm font-bold">For The Pickle Keeper Only</p>
            </div>
            <SignIn
              routing="hash"
              signUpUrl="/admin/login"
              fallbackRedirectUrl="/admin/dashboard"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-0 p-0 bg-transparent',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'border border-native-black/20 hover:bg-native-sand transition-colors font-tribal uppercase tracking-wider',
                  formButtonPrimary: 'bg-native-black hover:bg-native-clay font-display uppercase tracking-widest',
                  footerAction: 'hidden',
                }
              }}
            />
            <div className="mt-8 text-center pt-6 border-t border-native-black/10">
              <Link to="/" className="font-tribal text-sm text-native-earth/60 hover:text-native-clay uppercase tracking-wider transition-colors">
                ← Return to The Shop
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
