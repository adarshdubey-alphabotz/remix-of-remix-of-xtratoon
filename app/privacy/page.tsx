import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const PrivacyPolicyComponent = dynamic(() => import('@/pages/PrivacyPolicy'), { ssr: true });

export const metadata: Metadata = {
  title: 'Privacy Policy — Komixora',
  description: 'Read Komixora privacy policy',
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return <PrivacyPolicyComponent />;
}
