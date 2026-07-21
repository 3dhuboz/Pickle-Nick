import React, { useEffect } from 'react';
import { SignIn, useUser } from '@clerk/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { NICK_LOGO_SRC } from '../components/brand/NickLogo';

const Login = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/shop');
  }, [user, navigate]);

  return (
    <div className="page-shell content-page">
      <main className="page-width content-layout" style={{ paddingTop: 64 }}>
        <section>
          <img className="page-hero__logo" src={NICK_LOGO_SRC} alt="Pickle Nick" />
          <h1 className="display" style={{ color: 'var(--cream)', fontSize: 58 }}>Welcome back.</h1>
          <p className="body-copy" style={{ maxWidth: 500, marginTop: 22 }}>
            Sign in to check orders, update your details, and get back to the current batch.
          </p>
          <div className="story-media" style={{ marginTop: 38, aspectRatio: '16 / 10' }}>
            <img src="/brand/pickle-nick-hand-bottles.jpg" alt="Nick holding Pickle Nick hot sauces" />
          </div>
        </section>

        <section style={{ borderTop: '1px solid var(--line-dark)', borderBottom: '1px solid var(--line-dark)', paddingBlock: 28 }}>
          <SignIn
            routing="hash"
            signUpUrl="/login"
            fallbackRedirectUrl="/shop"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none border-0 p-0 bg-transparent text-[#f2e8d3]',
                headerTitle: 'font-tribal text-[#fffaf0] text-3xl',
                headerSubtitle: 'font-sans text-[#f2e8d3]/60',
                socialButtonsBlockButton: 'w-full border border-[#f2e8d3]/20 bg-transparent font-sans font-semibold py-3.5 px-5 text-[#f2e8d3] hover:bg-[#f2e8d3]/5 transition rounded-full',
                formFieldLabel: 'font-sans text-[#dcae54] text-xs font-bold',
                formFieldInput: 'border-0 border-b border-[#f2e8d3]/30 bg-transparent text-[#f2e8d3] rounded-none px-0 focus:border-[#dcae54]',
                formButtonPrimary: 'bg-[#c74d35] hover:bg-[#d55b40] font-sans font-bold rounded-full text-sm py-3.5',
                footerActionLink: 'text-[#dcae54]',
              },
            }}
          />
          <Link className="back-link" to="/" style={{ marginTop: 28, marginBottom: 0 }}><ArrowLeft size={15} /> Return home</Link>
        </section>
      </main>
    </div>
  );
};

export default Login;
