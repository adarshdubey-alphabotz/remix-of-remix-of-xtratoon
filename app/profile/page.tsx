import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const ProfilePageComponent = dynamic(() => import('@/pages/ProfilePage'), { ssr: false });

export const metadata: Metadata = {
  title: 'My Profile — Komixora',
  description: 'Manage your Komixora profile',
  robots: {
    index: false,
    follow: true,
  },
};

export default function ProfilePage() {
  return <ProfilePageComponent />;
}
