import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import DynamicMeta from '@/components/DynamicMeta';

type BadgeType = 'NEW' | 'FIX' | 'FEATURE' | 'IMPROVEMENT';

interface Announcement {
  version: string;
  date: string;
  title: string;
  type: BadgeType;
  items: string[];
}

const announcements: Announcement[] = [
  {
    version: 'v2.3',
    date: '2026-03-15',
    title: 'Email Verification & Content Management Updates',
    type: 'FEATURE',
    items: [
      'Added one-click email verification links in verification emails',
      'Improved code extraction from email bodies (regex-based parsing)',
      'Extended verification code expiry to 2 minutes',
      'Reduced countdown timer from 30 to 10 seconds for faster verification',
      'Added clipboard paste support for manual code entry',
      'Created comprehensive Announcements/Changelog page',
    ]
  },
  {
    version: 'v2.2',
    date: '2026-03-14',
    title: 'Manga Management Enhancement',
    type: 'FEATURE',
    items: [
      'Added manga edit page for creators to update series details after upload',
      'Implemented custom slug system with auto-generation and manual override',
      'Fixed chapter number input field to stay empty on load',
      'Added real-time slug validation and uniqueness checking',
      'Creators and admins can now edit: title, description, cover, genres, status, language, NSFW flag',
    ]
  },
  {
    version: 'v2.1',
    date: '2026-03-10',
    title: 'Publisher Dashboard Improvements',
    type: 'IMPROVEMENT',
    items: [
      'Enhanced Creator Studio with better manga listing',
      'Added chapter management interface',
      'Improved earnings tracking visualization',
      'Added scheduled content management',
      'Enhanced analytics dashboard for creators',
    ]
  },
  {
    version: 'v2.0',
    date: '2026-03-01',
    title: 'Major Platform Upgrade - Webtoon Alternative Launch',
    type: 'NEW',
    items: [
      'Launched Webtoon Alternative interface with comic scrolling',
      'Added chapter-based reading system for series',
      'Implemented scheduled content publication system',
      'Added creator revenue sharing and earnings dashboard',
      'Introduced community features: comments and ratings',
      'Created publisher dashboard for content creators',
    ]
  },
  {
    version: 'v1.5',
    date: '2026-02-20',
    title: 'Creator Tools & Publishing System',
    type: 'FEATURE',
    items: [
      'Added full manga/manhwa publishing system',
      'Creators can upload chapter pages with scheduled publishing',
      'Implemented approval workflow for published content',
      'Added creator profile pages with portfolio viewing',
      'Introduced series rating and review system',
    ]
  },
  {
    version: 'v1.4',
    date: '2026-02-10',
    title: 'Search & Discovery Enhancements',
    type: 'IMPROVEMENT',
    items: [
      'Improved manga search with advanced filters',
      'Added genre-based discovery pages',
      'Implemented trending content algorithm',
      'Added bookmarking system for users',
      'Enhanced mobile search interface',
    ]
  },
  {
    version: 'v1.3',
    date: '2026-01-25',
    title: 'Community Features',
    type: 'FEATURE',
    items: [
      'Added community comments section for chapters',
      'Implemented user rating system (1-5 stars)',
      'Added user profiles with reading history',
      'Created follower system for creators',
      'Added social sharing capabilities',
    ]
  },
  {
    version: 'v1.2',
    date: '2026-01-15',
    title: 'Authentication & Security Fixes',
    type: 'FIX',
    items: [
      'Implemented email verification system',
      'Added password strength requirements',
      'Enhanced session security with refresh tokens',
      'Added CSRF protection',
      'Implemented rate limiting on auth endpoints',
    ]
  },
  {
    version: 'v1.1',
    date: '2026-01-05',
    title: 'UI/UX Polish & Mobile Optimization',
    type: 'IMPROVEMENT',
    items: [
      'Redesigned navigation for mobile devices',
      'Improved responsive layout for tablets',
      'Added dark mode theme support',
      'Enhanced typography and spacing',
      'Fixed various mobile rendering issues',
    ]
  },
  {
    version: 'v1.0',
    date: '2026-01-01',
    title: 'Komixora Platform Launch',
    type: 'NEW',
    items: [
      'Initial platform launch with manga/manhwa browsing',
      'Search and filter functionality',
      'User authentication and profiles',
      'Reading history tracking',
      'Basic ratings system',
    ]
  },
];

const getBadgeColor = (type: BadgeType): string => {
  switch (type) {
    case 'NEW': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'FIX': return 'bg-red-100 text-red-800 border-red-300';
    case 'FEATURE': return 'bg-green-100 text-green-800 border-green-300';
    case 'IMPROVEMENT': return 'bg-purple-100 text-purple-800 border-purple-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const AnnouncementsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <DynamicMeta 
        title="Announcements & Changelog — Komixora" 
        description="Stay updated with the latest Komixora platform updates, new features, and improvements."
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="w-6 h-6 text-primary" />
            <span className="text-sm font-semibold text-primary">Updates</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-3">What's New</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Stay updated with the latest features, improvements, and fixes to the Komixora platform.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {announcements.map((announcement, idx) => (
            <div
              key={idx}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="p-6 sm:p-8">
                {/* Version and Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-primary">{announcement.version}</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getBadgeColor(announcement.type)}`}>
                      {announcement.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={announcement.date}>
                      {new Date(announcement.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                  {announcement.title}
                </h2>

                {/* Items List */}
                <ul className="space-y-2 mb-6">
                  {announcement.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex gap-3 text-foreground/80">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Read More Link */}
                <div className="pt-4 border-t border-border/50">
                  <button className="flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-16 p-6 bg-muted/50 border border-border rounded-2xl text-center">
          <p className="text-muted-foreground mb-2">
            Follow us on social media for real-time updates
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(announcements[0].date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
