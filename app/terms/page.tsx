import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const TermsOfServiceComponent = dynamic(() => import('@/pages/TermsOfService'), { ssr: true });

export const metadata: Metadata = {
  title: 'Terms of Service — Komixora',
  description: 'Read Komixora terms of service',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return <TermsOfServiceComponent />;
}
