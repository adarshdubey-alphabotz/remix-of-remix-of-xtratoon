import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const CookiePolicyPageComponent = dynamic(() => import('@/pages/CookiePolicyPage'), { ssr: true });

export const metadata: Metadata = {
  title: 'Cookie Policy — Komixora',
  description: 'Komixora cookie policy',
};

export default function CookiePolicyPage() {
  return <CookiePolicyPageComponent />;
}
