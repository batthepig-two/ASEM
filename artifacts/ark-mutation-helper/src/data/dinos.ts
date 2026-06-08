export const ARK_DINOS = [
  "Allosaurus", "Amargasaurus", "Andrewsarchus", "Ankylosaurus", "Araneo",
  "Archaeopteryx", "Argentavis", "Astrocetus", "Astrodelphis", "Baryonyx",
  "Basilisk", "Basilosaurus", "Beelzebufo", "Bloodstalker", "Brontosaurus",
  "Carbonemys", "Carnotaurus", "Castoroides", "Carcharodontosaurus", "Ceratosaurus",
  "Chalicotherium", "Daeodon", "Deinonychus", "Deleturus", "Desmodus",
  "Dilophosaur", "Dimorphodon", "Diplocaulus", "Diplodocus", "Direbear",
  "Direwolf", "Dodo", "Doedicurus", "Dunkleosteus", "Equus",
  "Eurypterid", "Ferox", "Fjordhawk", "Gacha", "Gallimimus",
  "Gasbags", "Giganotosaurus", "Gigantopithecus", "Glowbug", "Griffin",
  "Hesperornis", "Hyaenodon", "Ichthyornis", "Ichthyosaurus", "Iguanodon",
  "Jerboa", "Kaprosuchus", "Karkinos", "Kentrosaurus", "Kibble",
  "Leedsichthys", "Liopleurodon", "Lystrosaurus", "Maewing", "Magmasaur",
  "Mammoth", "Managarmr", "Manta", "Megalania", "Megaloceros",
  "Megalodon", "Megalosaurus", "Megapithecus", "Megatherium", "Mesopithecus",
  "Microraptor", "Morellatops", "Mosasaurus", "Moschops", "Noglin",
  "Ovis", "Pachycephalosaurus", "Pachyrhinosaurus", "Paraceratherium", "Parasaur",
  "Parakeet Fish School", "Pegomastax", "Pelagornis", "Phiomia", "Phoenix",
  "Piranha", "Plesiosaur", "Procoptodon", "Pteranodon", "Pulmonoscorpius",
  "Pugnacia", "Quetzal", "Raptor", "Ravager", "Reaper",
  "Rex", "Rhyniognatha", "Rock Drake", "Rock Elemental", "Roll Rat",
  "Sabertooth", "Sarco", "Shadowmane", "Sinomacrops", "Skeletal Rex",
  "Snow Owl", "Spino", "Stegosaurus", "Tapejara", "Terror Bird",
  "Therizinosaurus", "Thylacoleo", "Titanboa", "Titanosaur", "Triceratops",
  "Tropeognathus", "Troodon", "Tusoteuthis", "Voidwyrm", "Vulture",
  "Wyvern (Crystal)", "Wyvern (Fire)", "Wyvern (Ice)", "Wyvern (Lightning)", "Wyvern (Poison)",
  "Xiphactinus", "Yutyrannus", "Zombie Wyvern"
];

export const STATS = ["Health", "Stamina", "Oxygen", "Food", "Weight", "Melee", "Speed", "Crafting"] as const;
export type Stat = typeof STATS[number];

export const BREEDABLE_STATS: Stat[] = ["Health", "Stamina", "Oxygen", "Food", "Weight", "Melee"];
