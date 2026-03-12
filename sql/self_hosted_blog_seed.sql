-- Komixora: SEO-safe blog seed templates for self-hosted database
-- Usage:
-- 1) Replace ALL occurrences of REPLACE_WITH_AUTHOR_UUID with a valid auth user id from your self-hosted setup
-- 2) Run this file in your self-hosted SQL editor

insert into public.blogs (
  title,
  slug,
  description,
  content,
  thumbnail_url,
  seo_title,
  seo_description,
  seo_keywords,
  is_published,
  is_faq,
  author_id
)
values
(
  'Best Legal Ways to Read Manga and Manhwa in 2026',
  'best-legal-ways-read-manga-manhwa-2026',
  'A practical guide to reading manga, manhwa, and webtoons legally while supporting creators and avoiding copyright risks.',
  $$
  <h2>Why legal reading matters</h2>
  <p>Reading from legal sources protects creators, keeps stories online for longer, and reduces takedown risk for readers.</p>
  <h2>How to spot a legal platform</h2>
  <ul>
    <li>Clear publisher information and licensing details</li>
    <li>Visible copyright and DMCA policy</li>
    <li>Consistent release schedules</li>
    <li>Transparent creator support model</li>
  </ul>
  <h2>Final tip</h2>
  <p>Share legal links when recommending series to help creators and reduce copyright risk.</p>
  $$,
  '/images/blog-legal-reading-2026.jpg',
  'Best Legal Ways to Read Manga & Manhwa in 2026',
  'Learn safe, legal ways to read manga and manhwa online in 2026 while supporting creators and avoiding copyright issues.',
  array['legal manga reading','legal manhwa reading','read manga legally','read manhwa online','webtoon legal guide','copyright safe reading'],
  true,
  false,
  'REPLACE_WITH_AUTHOR_UUID'
),
(
  'Manhwa vs Manga vs Webtoon: Complete Beginner Guide',
  'manhwa-vs-manga-vs-webtoon-beginner-guide',
  'Understand the differences between manhwa, manga, and webtoons with format, style, reading direction, and publishing tips.',
  $$
  <h2>Quick definitions</h2>
  <p><strong>Manga</strong> is commonly used for Japanese comics, <strong>Manhwa</strong> for Korean comics, and <strong>Webtoon</strong> for digital vertical formats.</p>
  <h2>Format differences</h2>
  <ul>
    <li>Manga: page-based, often black-and-white</li>
    <li>Manhwa: often full-color in digital formats</li>
    <li>Webtoon: mobile-first vertical scrolling</li>
  </ul>
  <h2>Beginner recommendation</h2>
  <p>Start with webtoon format on mobile for easy reading, then explore manga and manhwa styles.</p>
  $$,
  '/images/blog-manhwa-vs-manga.jpg',
  'Manhwa vs Manga vs Webtoon: Beginner Guide',
  'New to comics? Learn the difference between manga, manhwa, and webtoon formats, styles, and best starting points.',
  array['manhwa vs manga','what is webtoon','manga beginner guide','manhwa guide','webtoon format','comic reading guide'],
  true,
  false,
  'REPLACE_WITH_AUTHOR_UUID'
),
(
  'How to Build a Daily Manga Reading Habit Without Burnout',
  'daily-manga-reading-habit-without-burnout',
  'A simple system to enjoy manga and manhwa daily without fatigue using schedule, genre rotation, and chapter pacing.',
  $$
  <h2>Why readers burn out</h2>
  <p>Burnout usually comes from binge-heavy routines and no genre variety.</p>
  <h2>The 20-minute system</h2>
  <p>Set a fixed daily 20-minute reading slot to stay consistent without pressure.</p>
  <h2>Genre rotation</h2>
  <p>Rotate action, romance, comedy, and thriller to keep your reading energy fresh.</p>
  $$,
  '/images/blog-reading-habit.jpg',
  'Daily Manga Reading Habit: No Burnout Plan',
  'Create a simple daily manga and manhwa reading routine with practical tips to avoid burnout and stay consistent.',
  array['daily manga reading','manhwa reading habit','avoid reading burnout','webtoon routine','reading productivity','manga tips'],
  true,
  false,
  'REPLACE_WITH_AUTHOR_UUID'
),
(
  'Top Storytelling Tropes Fans Love in Action Fantasy Manhwa',
  'storytelling-tropes-fans-love-action-fantasy-manhwa',
  'Explore high-performing action fantasy tropes that readers consistently love, plus why they work in serialized storytelling.',
  $$
  <h2>Why tropes work</h2>
  <p>Tropes help readers connect quickly when they are combined with fresh character motivation and worldbuilding.</p>
  <h2>Top fan favorites</h2>
  <ol>
    <li>Underdog power progression</li>
    <li>Regression or second-chance timelines</li>
    <li>Guild and rank systems</li>
    <li>Hidden identity tension</li>
  </ol>
  <h2>Serialization tip</h2>
  <p>End each chapter with a decision point, reveal, or dilemma to improve retention.</p>
  $$,
  '/images/blog-storytelling-tropes.jpg',
  'Top Action Fantasy Manhwa Tropes Readers Love',
  'Discover top storytelling tropes in action fantasy manhwa and how they boost reader retention in serialized comics.',
  array['action fantasy manhwa','manhwa storytelling tropes','reader retention comics','webtoon writing tips','fantasy comic structure','comic plot devices'],
  true,
  false,
  'REPLACE_WITH_AUTHOR_UUID'
),
(
  'How Indie Comic Creators Can Grow Audience Organically in 2026',
  'indie-comic-creators-grow-audience-organically-2026',
  'A practical growth framework for indie manga and manhwa creators using consistency, community loops, and SEO-safe distribution.',
  $$
  <h2>Start with identity</h2>
  <p>Pick a clear genre lane and release cadence so readers know what to expect.</p>
  <h2>3-channel growth model</h2>
  <ul>
    <li>Main publishing platform</li>
    <li>Social teaser channel</li>
    <li>Community feedback channel</li>
  </ul>
  <h2>SEO-safe strategy</h2>
  <p>Use educational and creator-process content instead of trademark-heavy clickbait titles.</p>
  $$,
  '/images/blog-indie-creators.jpg',
  'How Indie Comic Creators Grow Audience Organically',
  'Actionable 2026 strategy for indie manga and manhwa creators to grow audience organically with sustainable SEO-safe methods.',
  array['indie comic growth','manhwa creator tips','manga creator marketing','organic audience growth','webtoon creator strategy','seo safe comic marketing'],
  true,
  false,
  '6f88aad1-2242-4dd5-865f-89d9a4dec625'
)
on conflict (slug)
do update
set
  title = excluded.title,
  description = excluded.description,
  content = excluded.content,
  thumbnail_url = excluded.thumbnail_url,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  seo_keywords = excluded.seo_keywords,
  is_published = excluded.is_published,
  is_faq = excluded.is_faq,
  author_id = excluded.author_id,
  updated_at = now();
