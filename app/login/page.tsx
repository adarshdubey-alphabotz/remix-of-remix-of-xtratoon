import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const LoginPageComponent = dynamic(() => import('@/pages/LoginPage'), { ssr: false });

export const metadata: Metadata = {
  title: 'Login — Komixora',
  description: 'Sign in to your Komixora account to access your library and community features.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return <LoginPageComponent />;
}
