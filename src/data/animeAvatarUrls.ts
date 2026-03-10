const seeds = [
  'Aneka','Felix','Lily','Nolan','Sophia','Oliver','Mia','Leo','Zoe','Max',
  'Luna','Jack','Bella','Sam','Chloe','Ryan','Emma','Noah','Ava','Liam',
  'Harper','Ethan','Amelia','Lucas','Ella','Mason','Grace','Logan','Aria','Aiden',
  'Riley','Caleb','Layla','Owen','Zoey','Elijah','Penelope','James','Nora','Ben',
  'Hazel','Henry','Violet','Alex','Scarlett','Daniel','Stella','Matthew','Aurora','David',
  'Willow','Carter','Ivy','Jayden','Emilia','Luke','Hannah','Grayson','Abigail','Levi',
  'Emily','Isaac','Elizabeth','Gabriel','Sofia','Julian','Camila','Wyatt','Aaliyah','Jaxon',
  'Savannah','Joshua','Victoria','Andrew','Paisley','Lincoln','Naomi','Nathan','Claire','Sebastian',
  'Eleanor','Thomas','Maya','Charles','Cora','Christopher','Ruby','Ezra','Alice','Elias',
  'Madelyn','Josiah','Sadie','Colton','Aubrey','Hunter','Kinsley','Adrian','Piper','Asher',
];

export const animeAvatarUrls: string[] = seeds.map(
  (seed) => `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`,
);
