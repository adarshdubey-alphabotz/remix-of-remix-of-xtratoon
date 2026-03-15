import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, Zap, Bug, Star, Lightbulb } from 'lucide-react';
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const getBadgeConfig = (type: BadgeType) => {
    const configs: Record<BadgeType, { icon: React.ReactNode; label: string; bgColor: string; textColor: string }> = {
      'NEW': { icon: <Star className="w-3.5 h-3.5" />, label: 'NEW', bgColor: 'bg-blue-600/20 border border-blue-600/40', textColor: 'text-blue-400' },
      'FIX': { icon: <Bug className="w-3.5 h-3.5" />, label: 'FIX', bgColor: 'bg-yellow-600/20 border border-yellow-600/40', textColor: 'text-yellow-400' },
      'FEATURE': { icon: <Zap className="w-3.5 h-3.5" />, label: 'FEATURE', bgColor: 'bg-purple-600/20 border border-purple-600/40', textColor: 'text-purple-400' },
      'IMPROVEMENT': { icon: <Lightbulb className="w-3.5 h-3.5" />, label: 'IMPROVEMENT', bgColor: 'bg-green-600/20 border border-green-600/40', textColor: 'text-green-400' },
    };
    return configs[type];
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <DynamicMeta title="Updates & Changelog — Komixora" description="Latest updates, features, and improvements to Komixora platform" />
      
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/20 to-transparent border-b border-purple-600/20 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-8 md:pt-24 md:pb-8">
          <Link to="/" className="inline-block mb-4 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            ← Back to Home
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Changelog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Stay updated with the latest features, improvements, and fixes to Komixora. Built by passionate developers for manga and webtoon fans.
            </p>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {announcements.map((announcement, idx) => {
            const isExpanded = expandedIndex === idx;
            const badge = getBadgeConfig(announcement.type);
            const dateObj = new Date(announcement.date);
            const isRecent = (new Date().getTime() - dateObj.getTime()) < 7 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={idx}
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="group border border-muted-foreground/20 hover:border-purple-600/40 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/10 cursor-pointer bg-card/50 backdrop-blur-sm"
              >
                {/* Card Header */}
                <div className="p-4 md:p-6 flex items-start gap-4 hover:bg-accent/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${badge.bgColor}`}>
                        {badge.icon}
                        <span className={badge.textColor}>{badge.label}</span>
                      </div>
                      <span className="font-mono text-sm font-black text-purple-400">{announcement.version}</span>
                      {isRecent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/30 text-red-400 border border-red-600/40">
                          LATEST
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight group-hover:text-purple-400 transition-colors">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className={`flex-shrink-0 mt-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="border-t border-muted-foreground/10 bg-gradient-to-b from-accent/5 to-transparent p-4 md:p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {announcement.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                          <p className="text-foreground leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 p-6 rounded-xl border border-muted-foreground/10 bg-muted/20 text-center text-sm text-muted-foreground">
          <p>More updates coming soon. Follow our <Link to="/" className="text-primary hover:underline font-medium">blog</Link> for detailed release notes.</p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
