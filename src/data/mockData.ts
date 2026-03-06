export interface Manhwa {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publisherId: string;
  genres: string[];
  status: 'Ongoing' | 'Completed' | 'Hiatus';
  rating: number;
  views: number;
  likes: number;
  bookmarks: number;
  description: string;
  coverGradient: string;
  chapters: Chapter[];
  language: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  date: string;
  views: number;
}

export interface Publisher {
  id: string;
  username: string;
  email: string;
  bio: string;
  followers: number;
  totalViews: number;
  joinDate: string;
  works: string[];
  avatarGradient: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'reader' | 'publisher' | 'admin';
  library: string[];
}

export interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

export interface Submission {
  id: string;
  manhwaId: string;
  title: string;
  publisherUsername: string;
  submittedDate: string;
  fileName: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Report {
  id: string;
  targetType: 'manhwa' | 'publisher';
  targetName: string;
  reason: string;
  reportedBy: string;
  date: string;
}

const generateChapters = (count: number): Chapter[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `ch-${i + 1}`,
    number: i + 1,
    title: i === 0 ? 'The Beginning' : i === 1 ? 'Awakening' : i === 2 ? 'The Trial' : `Chapter ${i + 1}`,
    date: `2025-${String(Math.min(12, Math.floor(i / 3) + 1)).padStart(2, '0')}-${String(Math.min(28, (i % 28) + 1)).padStart(2, '0')}`,
    views: Math.floor(Math.random() * 50000) + 5000,
  }));

export const manhwaList: Manhwa[] = [
  {
    id: 'solo-ascension',
    title: 'Solo Ascension',
    author: 'Kim Seo-jun',
    publisher: 'NeonInk Studios',
    publisherId: 'pub-1',
    genres: ['Action', 'Fantasy', 'Adventure'],
    status: 'Ongoing',
    rating: 4.8,
    views: 2450000,
    likes: 189000,
    bookmarks: 95000,
    description: 'In a world where dungeons appear and hunters rise to fight monsters, one man — ranked the weakest — discovers a hidden power that changes everything. Follow Jin as he ascends from the shadows to become the most feared hunter alive.',
    coverGradient: 'gradient-cover-1',
    chapters: generateChapters(45),
    language: 'Korean',
  },
  {
    id: 'crimson-throne',
    title: 'Crimson Throne',
    author: 'Park Min-ji',
    publisher: 'NeonInk Studios',
    publisherId: 'pub-1',
    genres: ['Fantasy', 'Romance', 'Drama'],
    status: 'Ongoing',
    rating: 4.6,
    views: 1820000,
    likes: 145000,
    bookmarks: 72000,
    description: 'A princess exiled from her kingdom must navigate treacherous courts and forbidden alliances to reclaim her throne. But the price of power may be her own humanity.',
    coverGradient: 'gradient-cover-2',
    chapters: generateChapters(38),
    language: 'Korean',
  },
  {
    id: 'void-walker',
    title: 'Void Walker',
    author: 'Lee Hana',
    publisher: 'Phantom Press',
    publisherId: 'pub-2',
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    status: 'Ongoing',
    rating: 4.7,
    views: 1560000,
    likes: 120000,
    bookmarks: 61000,
    description: 'Between dimensions lies the Void — a space where reality bends. Agent Kira is the only one who can traverse it, but each crossing costs her memories. What happens when she forgets why she fights?',
    coverGradient: 'gradient-cover-3',
    chapters: generateChapters(52),
    language: 'English',
  },
  {
    id: 'moonlit-garden',
    title: 'The Moonlit Garden',
    author: 'Yuki Tanaka',
    publisher: 'Sakura Works',
    publisherId: 'pub-3',
    genres: ['Romance', 'Slice of Life', 'Drama'],
    status: 'Completed',
    rating: 4.9,
    views: 3200000,
    likes: 250000,
    bookmarks: 130000,
    description: 'Two strangers meet in a mystical garden that only appears under the full moon. As seasons pass, they discover that the garden is dying — and only their bond can save it.',
    coverGradient: 'gradient-cover-4',
    chapters: generateChapters(60),
    language: 'Japanese',
  },
  {
    id: 'steel-dynasty',
    title: 'Steel Dynasty',
    author: 'Chen Wei',
    publisher: 'Dragon Scroll',
    publisherId: 'pub-4',
    genres: ['Action', 'Historical', 'Drama'],
    status: 'Ongoing',
    rating: 4.5,
    views: 980000,
    likes: 78000,
    bookmarks: 42000,
    description: 'In an alternate ancient China where martial artists wield steel that responds to qi, a blacksmith\'s apprentice discovers he can forge weapons of impossible power.',
    coverGradient: 'gradient-cover-5',
    chapters: generateChapters(30),
    language: 'Chinese',
  },
  {
    id: 'neon-requiem',
    title: 'Neon Requiem',
    author: 'Alex Mercer',
    publisher: 'Phantom Press',
    publisherId: 'pub-2',
    genres: ['Sci-Fi', 'Thriller', 'Mystery'],
    status: 'Ongoing',
    rating: 4.4,
    views: 720000,
    likes: 56000,
    bookmarks: 31000,
    description: 'Neo-Tokyo, 2089. A detective with cybernetic eyes investigates a series of murders where the victims die smiling. The deeper she digs, the more she questions her own reality.',
    coverGradient: 'gradient-cover-6',
    chapters: generateChapters(25),
    language: 'English',
  },
  {
    id: 'demon-contract',
    title: 'Demon Contract',
    author: 'Kim Seo-jun',
    publisher: 'NeonInk Studios',
    publisherId: 'pub-1',
    genres: ['Fantasy', 'Horror', 'Action'],
    status: 'Hiatus',
    rating: 4.3,
    views: 650000,
    likes: 49000,
    bookmarks: 28000,
    description: 'When a desperate student signs a contract with a demon to save his sister, he discovers the fine print demands more than his soul — it demands everyone he loves.',
    coverGradient: 'gradient-cover-7',
    chapters: generateChapters(20),
    language: 'Korean',
  },
  {
    id: 'celestial-blade',
    title: 'Celestial Blade',
    author: 'Yuki Tanaka',
    publisher: 'Sakura Works',
    publisherId: 'pub-3',
    genres: ['Fantasy', 'Action', 'Adventure'],
    status: 'Ongoing',
    rating: 4.6,
    views: 1100000,
    likes: 88000,
    bookmarks: 52000,
    description: 'A celestial sword falls from the heavens into the hands of a village girl. Kingdoms wage war for its power, but the blade chooses its own master.',
    coverGradient: 'gradient-cover-8',
    chapters: generateChapters(35),
    language: 'Japanese',
  },
  {
    id: 'shadow-protocol',
    title: 'Shadow Protocol',
    author: 'Park Min-ji',
    publisher: 'Dragon Scroll',
    publisherId: 'pub-4',
    genres: ['Action', 'Thriller', 'Sci-Fi'],
    status: 'Completed',
    rating: 4.7,
    views: 1400000,
    likes: 110000,
    bookmarks: 65000,
    description: 'An elite black-ops agent uncovers a conspiracy that reaches the highest levels of government. With everyone hunting him, trust is a luxury he cannot afford.',
    coverGradient: 'gradient-cover-9',
    chapters: generateChapters(48),
    language: 'Korean',
  },
  {
    id: 'eternal-bloom',
    title: 'Eternal Bloom',
    author: 'Sakura Ito',
    publisher: 'Sakura Works',
    publisherId: 'pub-3',
    genres: ['Romance', 'Fantasy', 'Slice of Life'],
    status: 'Ongoing',
    rating: 4.8,
    views: 1900000,
    likes: 160000,
    bookmarks: 88000,
    description: 'A florist who can see the lifespan of flowers discovers she can also see the lifespan of humans. When she meets a man with only days left, she decides to change fate itself.',
    coverGradient: 'gradient-cover-10',
    chapters: generateChapters(42),
    language: 'Japanese',
  },
  {
    id: 'iron-academy',
    title: 'Iron Academy',
    author: 'Chen Wei',
    publisher: 'Dragon Scroll',
    publisherId: 'pub-4',
    genres: ['Action', 'School', 'Fantasy'],
    status: 'Ongoing',
    rating: 4.2,
    views: 540000,
    likes: 41000,
    bookmarks: 23000,
    description: 'The most ruthless academy in the world trains students to become weapons. But one student refuses to fight — and that makes him the most dangerous of all.',
    coverGradient: 'gradient-cover-3',
    chapters: generateChapters(18),
    language: 'Chinese',
  },
  {
    id: 'phantom-detective',
    title: 'Phantom Detective',
    author: 'Alex Mercer',
    publisher: 'Phantom Press',
    publisherId: 'pub-2',
    genres: ['Mystery', 'Thriller', 'Drama'],
    status: 'Completed',
    rating: 4.5,
    views: 870000,
    likes: 67000,
    bookmarks: 38000,
    description: 'A detective who died and came back can now see ghosts. They have stories to tell, crimes to solve, and vengeance to seek. But the living are even more dangerous.',
    coverGradient: 'gradient-cover-1',
    chapters: generateChapters(40),
    language: 'English',
  },
];

export const publishers: Publisher[] = [
  {
    id: 'pub-1',
    username: 'NeonInk Studios',
    email: 'test123@gmail.com',
    bio: 'Premium manhwa studio specializing in action and fantasy epics. Every panel is a masterpiece.',
    followers: 45000,
    totalViews: 4920000,
    joinDate: '2023-03-15',
    works: ['solo-ascension', 'crimson-throne', 'demon-contract'],
    avatarGradient: 'gradient-cover-1',
  },
  {
    id: 'pub-2',
    username: 'Phantom Press',
    email: 'phantom@press.com',
    bio: 'Pushing boundaries in sci-fi and thriller manhwa. Reality is overrated.',
    followers: 32000,
    totalViews: 2280000,
    joinDate: '2023-06-20',
    works: ['void-walker', 'neon-requiem', 'phantom-detective'],
    avatarGradient: 'gradient-cover-6',
  },
  {
    id: 'pub-3',
    username: 'Sakura Works',
    email: 'sakura@works.com',
    bio: 'Beautiful stories that touch the heart. Romance, fantasy, and everything in between.',
    followers: 58000,
    totalViews: 6200000,
    joinDate: '2022-11-01',
    works: ['moonlit-garden', 'celestial-blade', 'eternal-bloom'],
    avatarGradient: 'gradient-cover-4',
  },
  {
    id: 'pub-4',
    username: 'Dragon Scroll',
    email: 'dragon@scroll.com',
    bio: 'Ancient legends, modern storytelling. Where East meets action.',
    followers: 21000,
    totalViews: 2520000,
    joinDate: '2024-01-10',
    works: ['steel-dynasty', 'shadow-protocol', 'iron-academy'],
    avatarGradient: 'gradient-cover-5',
  },
  {
    id: 'pub-5',
    username: 'Indie Creator X',
    email: 'indie@creator.com',
    bio: 'Solo creator with big dreams. First work coming soon!',
    followers: 500,
    totalViews: 0,
    joinDate: '2025-01-15',
    works: [],
    avatarGradient: 'gradient-cover-9',
  },
];

export const allGenres = [
  'Action', 'Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Drama',
  'Mystery', 'Horror', 'Slice of Life', 'Adventure', 'Historical', 'School',
];

export const mockNotifications: Notification[] = [
  { id: 'n1', text: 'Solo Ascension Chapter 45 is now live!', time: '2 min ago', read: false },
  { id: 'n2', text: 'Your submission "Iron Academy" was approved', time: '1 hour ago', read: false },
  { id: 'n3', text: 'New follower: @manga_lover_99', time: '3 hours ago', read: true },
  { id: 'n4', text: 'Crimson Throne reached 1M views!', time: '1 day ago', read: true },
  { id: 'n5', text: 'System maintenance scheduled for tonight', time: '2 days ago', read: true },
];

export const mockSubmissions: Submission[] = [
  { id: 's1', manhwaId: 'new-1', title: 'Rising Storm', publisherUsername: 'NeonInk Studios', submittedDate: '2025-02-28', fileName: 'rising_storm_ch1.zip', status: 'pending' },
  { id: 's2', manhwaId: 'new-2', title: 'Digital Hearts', publisherUsername: 'Phantom Press', submittedDate: '2025-02-27', fileName: 'digital_hearts_v1.pdf', status: 'pending' },
  { id: 's3', manhwaId: 'new-3', title: 'Sakura Dreams', publisherUsername: 'Sakura Works', submittedDate: '2025-02-25', fileName: 'sakura_dreams.zip', status: 'pending' },
];

export const mockReports: Report[] = [
  { id: 'r1', targetType: 'manhwa', targetName: 'Iron Academy', reason: 'Suspected plagiarism from another series', reportedBy: 'user_42', date: '2025-02-26' },
  { id: 'r2', targetType: 'publisher', targetName: 'Indie Creator X', reason: 'Uploading AI-generated content without disclosure', reportedBy: 'reader_99', date: '2025-02-24' },
];

export const DUMMY_CREDENTIALS = {
  publisher: { email: 'test123@gmail.com', password: 'Test123' },
  admin: { email: 'test456@gmail.com', password: 'Test123' },
  reader: { email: 'reader@gmail.com', password: 'Test123' },
};

export const formatViews = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};
