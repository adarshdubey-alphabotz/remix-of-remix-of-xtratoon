import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const DMCAPageComponent = dynamic(() => import('@/pages/DMCAPage'), { ssr: true });

export const metadata: Metadata = {
  title: 'DMCA — Komixora',
  description: 'DMCA notice and copyright information',
};

export default function DMCAPage() {
  return <DMCAPageComponent />;
}
