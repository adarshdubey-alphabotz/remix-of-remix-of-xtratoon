import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Eye, BookOpen, Calendar } from 'lucide-react';
import { publishers, manhwaList, formatViews } from '@/data/mockData';
import ManhwaCard from '@/components/ManhwaCard';

const PublisherProfile: React.FC = () => {
  const { id } = useParams();
  const publisher = publishers.find(p => p.id === id);

  if (!publisher) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <p className="text-muted-foreground">Publisher not found</p>
    </div>
  );

  const works = manhwaList.filter(m => publisher.works.includes(m.id));

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Profile card */}
        <div className="glass-iridescent rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className={`w-24 h-24 rounded-full ${publisher.avatarGradient} flex-shrink-0 border-2 border-foreground/10`} />
            <div className="flex-1">
              <h1 className="text-display text-3xl sm:text-4xl mb-2">{publisher.username}</h1>
              <p className="text-sm text-muted-foreground mb-4">{publisher.bio}</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: <Users className="w-4 h-4" />, label: 'Followers', value: formatViews(publisher.followers) },
                  { icon: <BookOpen className="w-4 h-4" />, label: 'Works', value: publisher.works.length.toString() },
                  { icon: <Eye className="w-4 h-4" />, label: 'Total Views', value: formatViews(publisher.totalViews) },
                  { icon: <Calendar className="w-4 h-4" />, label: 'Joined', value: publisher.joinDate },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{s.icon}</span>
                    <span className="font-bold">{s.value}</span>
                    <span className="text-muted-foreground text-xs">{s.label}</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 px-6 py-2 border-2 border-foreground text-sm font-bold rounded-lg hover:bg-foreground hover:text-background transition-all">
                Follow
              </button>
            </div>
          </div>
        </div>

        {/* Works */}
        <h2 className="text-display text-xl mb-4">Published Works</h2>
        {works.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {works.map(m => <ManhwaCard key={m.id} manhwa={m} />)}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No published works yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublisherProfile;
