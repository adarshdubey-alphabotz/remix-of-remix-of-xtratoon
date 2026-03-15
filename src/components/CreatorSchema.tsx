import React from 'react';

interface CreatorSchemaProps {
  creatorName: string;
  username: string;
  profileImageUrl?: string;
  bio?: string;
  seriesCount: number;
  totalViews: number;
  followerCount: number;
  socialLinks?: Record<string, string>;
  createdDate?: string;
}

const CreatorSchema: React.FC<CreatorSchemaProps> = ({
  creatorName,
  username,
  profileImageUrl,
  bio,
  seriesCount,
  totalViews,
  followerCount,
  socialLinks,
  createdDate,
}) => {
  const sameAsLinks = [
    socialLinks?.website && socialLinks.website,
    socialLinks?.twitter && `https://twitter.com/${socialLinks.twitter}`,
    socialLinks?.instagram && `https://instagram.com/${socialLinks.instagram}`,
    socialLinks?.youtube && `https://youtube.com/@${socialLinks.youtube}`,
    socialLinks?.tiktok && `https://tiktok.com/@${socialLinks.tiktok}`,
    socialLinks?.telegram && `https://t.me/${socialLinks.telegram}`,
  ].filter(Boolean) as string[];

  const creatorSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': creatorName || username,
    'alternateName': username,
    'description': bio || `Creator of ${seriesCount} manga and manhwa series on Komixora`,
    'image': profileImageUrl,
    'url': `https://komixora.fun/publisher/${username}`,
    'sameAs': sameAsLinks,
    'jobTitle': 'Manga/Manhwa Creator',
    'worksFor': {
      '@type': 'Organization',
      'name': 'Komixora',
      'url': 'https://komixora.fun',
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://komixora.fun/publisher/${username}`,
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': followerCount > 0 ? Math.min(5, 3 + followerCount / 1000) : 4.5,
      'ratingCount': Math.max(followerCount, 1),
      'bestRating': 5,
      'worstRating': 1,
    },
    'knowsAbout': [
      'Manga Creation',
      'Manhwa',
      'Webtoon',
      'Comics',
      'Digital Art',
      'Storytelling',
    ],
    'interactionStatistic': [
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/WatchAction',
        'userInteractionCount': totalViews,
      },
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/FollowAction',
        'userInteractionCount': followerCount,
      },
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/CreateAction',
        'userInteractionCount': seriesCount,
      },
    ],
    ...(createdDate && { 'datePublished': createdDate }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(creatorSchema) }}
    />
  );
};

export default CreatorSchema;
