import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const PublisherDashboardComponent = dynamic(() => import('@/pages/PublisherDashboard'), { ssr: false });

export const metadata: Metadata = {
  title: 'Publisher Dashboard — Komixora',
  description: 'Manage your published works',
  robots: {
    index: false,
    follow: true,
  },
};

export default function DashboardPage() {
  return <PublisherDashboardComponent />;
}
