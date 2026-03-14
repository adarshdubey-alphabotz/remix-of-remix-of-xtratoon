import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const SignupPageComponent = dynamic(() => import('@/pages/SignupPage'), { ssr: false });

export const metadata: Metadata = {
  title: 'Sign Up — Komixora',
  description: 'Create a free Komixora account to access your personal library and join the community.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignupPage() {
  return <SignupPageComponent />;
}
