export const animeAvatarUrls: string[] = Array.from({ length: 50 }, (_, index) =>
  `https://api.dicebear.com/9.x/adventurer/svg?seed=anime-${index + 1}`,
);
