/**
 * The word bank. Two languages, eight themes each, plus a `mixed` pool that is
 * every theme at once. Entries are plain a–z (diacritics already folded, so
 * `skiën` is stored as `skien`) which keeps grid letters and traced letters
 * comparable without any normalisation at claim time.
 */

import type { Bank, Category } from './protocol';

type Themes = Record<Exclude<Category, 'mixed'>, string[]>;

const EN: Themes = {
  animals: [
    'dog', 'cat', 'horse', 'rabbit', 'hamster', 'donkey', 'monkey', 'giraffe', 'elephant',
    'tiger', 'lion', 'leopard', 'cheetah', 'panther', 'wolf', 'fox', 'bear', 'badger',
    'otter', 'beaver', 'squirrel', 'hedgehog', 'mole', 'bat', 'dolphin', 'whale', 'shark',
    'seal', 'walrus', 'penguin', 'eagle', 'falcon', 'owl', 'sparrow', 'swallow', 'pigeon',
    'parrot', 'flamingo', 'pelican', 'ostrich', 'crocodile', 'lizard', 'iguana', 'tortoise',
    'turtle', 'snake', 'python', 'frog', 'toad', 'salmon', 'herring', 'lobster', 'octopus',
    'jellyfish', 'spider', 'beetle', 'butterfly', 'dragonfly', 'cricket', 'camel', 'zebra',
  ],
  food: [
    'bread', 'butter', 'cheese', 'yoghurt', 'pancake', 'waffle', 'pasta', 'noodle', 'risotto',
    'lasagna', 'pizza', 'burger', 'sausage', 'bacon', 'chicken', 'shrimp', 'lentil', 'chickpea',
    'broccoli', 'spinach', 'cabbage', 'carrot', 'potato', 'pumpkin', 'cucumber', 'tomato',
    'pepper', 'onion', 'garlic', 'ginger', 'cinnamon', 'vanilla', 'chocolate', 'caramel',
    'almond', 'walnut', 'hazelnut', 'peanut', 'raisin', 'apricot', 'cherry', 'banana',
    'orange', 'lemon', 'grape', 'melon', 'mango', 'papaya', 'avocado', 'strawberry',
    'pineapple', 'coconut', 'pudding', 'custard', 'honey', 'pastry', 'muffin', 'omelette',
  ],
  countries: [
    'ireland', 'iceland', 'norway', 'sweden', 'finland', 'denmark', 'germany', 'belgium',
    'france', 'spain', 'portugal', 'italy', 'austria', 'hungary', 'poland', 'romania',
    'bulgaria', 'greece', 'turkey', 'ukraine', 'morocco', 'algeria', 'tunisia', 'egypt',
    'nigeria', 'ghana', 'kenya', 'uganda', 'tanzania', 'zambia', 'namibia', 'india',
    'pakistan', 'nepal', 'china', 'japan', 'korea', 'vietnam', 'thailand', 'malaysia',
    'indonesia', 'canada', 'mexico', 'cuba', 'jamaica', 'brazil', 'peru', 'chile',
    'bolivia', 'uruguay', 'paraguay', 'ecuador', 'australia', 'scotland', 'wales', 'serbia',
  ],
  sport: [
    'football', 'hockey', 'handball', 'basketball', 'volleyball', 'baseball', 'cricket',
    'rugby', 'tennis', 'badminton', 'squash', 'golf', 'boxing', 'karate', 'judo', 'wrestling',
    'fencing', 'archery', 'cycling', 'running', 'marathon', 'sprint', 'hurdles', 'javelin',
    'discus', 'rowing', 'sailing', 'surfing', 'swimming', 'diving', 'skating', 'skiing',
    'snowboard', 'climbing', 'gymnastics', 'triathlon', 'curling', 'bowling', 'darts',
    'snooker', 'referee', 'stadium', 'trophy', 'medal', 'whistle', 'offside', 'penalty',
    'striker', 'goalkeeper', 'dribble', 'tackle', 'sprinter', 'league', 'coach', 'dugout',
  ],
  nature: [
    'forest', 'meadow', 'prairie', 'desert', 'jungle', 'swamp', 'marsh', 'valley', 'canyon',
    'glacier', 'volcano', 'mountain', 'hillside', 'island', 'beach', 'cliff', 'river',
    'stream', 'lagoon', 'waterfall', 'lake', 'ocean', 'tide', 'storm', 'thunder', 'lightning',
    'rainbow', 'drizzle', 'blizzard', 'sunrise', 'sunset', 'horizon', 'boulder', 'pebble',
    'granite', 'crystal', 'moss', 'fern', 'clover', 'thistle', 'daisy', 'tulip', 'orchid',
    'willow', 'birch', 'maple', 'poplar', 'cedar', 'acorn', 'pollen', 'nectar', 'breeze',
    'meteor', 'canopy', 'boreal', 'tundra',
  ],
  house: [
    'kitchen', 'bathroom', 'bedroom', 'hallway', 'attic', 'cellar', 'garage', 'balcony',
    'terrace', 'garden', 'window', 'curtain', 'doorway', 'staircase', 'carpet', 'cushion',
    'blanket', 'pillow', 'mattress', 'wardrobe', 'cupboard', 'drawer', 'shelf', 'mirror',
    'lantern', 'candle', 'heater', 'fireplace', 'kettle', 'toaster', 'blender', 'freezer',
    'laundry', 'basket', 'broom', 'bucket', 'hammer', 'ladder', 'shovel', 'sofa', 'armchair',
    'table', 'stool', 'teapot', 'saucer', 'napkin', 'towel', 'soap', 'switch', 'socket',
    'radiator', 'doormat', 'lamp', 'oven', 'sink', 'fence',
  ],
  travel: [
    'airport', 'terminal', 'runway', 'aircraft', 'cockpit', 'luggage', 'passport', 'ticket',
    'boarding', 'suitcase', 'backpack', 'harbour', 'ferry', 'cruise', 'cabin', 'railway',
    'platform', 'carriage', 'tunnel', 'bridge', 'highway', 'roundabout', 'junction', 'taxi',
    'shuttle', 'scooter', 'caravan', 'camping', 'tent', 'hostel', 'hotel', 'resort',
    'postcard', 'souvenir', 'currency', 'compass', 'atlas', 'landmark', 'museum', 'gallery',
    'cathedral', 'castle', 'market', 'bazaar', 'festival', 'journey', 'voyage', 'detour',
    'arrival', 'departure', 'transfer', 'visa', 'guide', 'lounge', 'transit',
  ],
  tech: [
    'keyboard', 'monitor', 'laptop', 'desktop', 'tablet', 'printer', 'scanner', 'speaker',
    'headset', 'webcam', 'battery', 'charger', 'cable', 'router', 'modem', 'server',
    'cluster', 'database', 'firewall', 'network', 'browser', 'website', 'domain', 'cookie',
    'pixel', 'screen', 'render', 'kernel', 'compiler', 'debugger', 'variable', 'function',
    'pointer', 'boolean', 'integer', 'library', 'package', 'version', 'terminal', 'shell',
    'script', 'binary', 'password', 'firmware', 'satellite', 'antenna', 'sensor', 'circuit',
    'processor', 'storage', 'backup', 'cache', 'thread', 'socket', 'widget',
  ],
};

const NL: Themes = {
  animals: [
    'hond', 'kat', 'paard', 'konijn', 'hamster', 'ezel', 'aap', 'giraffe', 'olifant',
    'tijger', 'leeuw', 'luipaard', 'panter', 'wolf', 'vos', 'beer', 'das', 'otter', 'bever',
    'eekhoorn', 'egel', 'mol', 'vleermuis', 'dolfijn', 'walvis', 'haai', 'zeehond', 'walrus',
    'pinguin', 'adelaar', 'valk', 'uil', 'spreeuw', 'zwaluw', 'duif', 'papegaai', 'flamingo',
    'pelikaan', 'struisvogel', 'krokodil', 'hagedis', 'schildpad', 'slang', 'kikker', 'pad',
    'zalm', 'haring', 'kreeft', 'octopus', 'kwal', 'spin', 'kever', 'vlinder', 'libelle',
    'krekel', 'kameel', 'zebra', 'muis',
  ],
  food: [
    'brood', 'boter', 'kaas', 'yoghurt', 'pannenkoek', 'wafel', 'pasta', 'noedel', 'risotto',
    'lasagne', 'pizza', 'hamburger', 'worst', 'spek', 'kip', 'zalm', 'garnaal', 'linze',
    'kikkererwt', 'broccoli', 'spinazie', 'kool', 'wortel', 'aardappel', 'pompoen',
    'komkommer', 'tomaat', 'paprika', 'knoflook', 'gember', 'kaneel', 'vanille', 'chocolade',
    'karamel', 'amandel', 'walnoot', 'hazelnoot', 'pinda', 'rozijn', 'abrikoos', 'kers',
    'banaan', 'sinaasappel', 'citroen', 'druif', 'meloen', 'mango', 'papaja', 'avocado',
    'aardbei', 'ananas', 'kokosnoot', 'pudding', 'honing', 'gebak', 'muffin', 'omelet',
  ],
  countries: [
    'ierland', 'ijsland', 'noorwegen', 'zweden', 'finland', 'denemarken', 'duitsland',
    'belgie', 'frankrijk', 'spanje', 'portugal', 'italie', 'oostenrijk', 'hongarije',
    'polen', 'roemenie', 'bulgarije', 'griekenland', 'turkije', 'oekraine', 'marokko',
    'algerije', 'tunesie', 'egypte', 'nigeria', 'ghana', 'kenia', 'oeganda', 'tanzania',
    'zambia', 'namibie', 'india', 'pakistan', 'nepal', 'china', 'japan', 'korea', 'vietnam',
    'thailand', 'maleisie', 'indonesie', 'canada', 'mexico', 'cuba', 'jamaica', 'brazilie',
    'peru', 'chili', 'bolivia', 'uruguay', 'paraguay', 'ecuador', 'australie', 'schotland',
    'wales', 'servie',
  ],
  sport: [
    'voetbal', 'hockey', 'handbal', 'basketbal', 'volleybal', 'honkbal', 'cricket', 'rugby',
    'tennis', 'badminton', 'squash', 'golf', 'boksen', 'karate', 'judo', 'worstelen',
    'schermen', 'boogschieten', 'wielrennen', 'hardlopen', 'marathon', 'sprint',
    'hordelopen', 'speerwerpen', 'discus', 'roeien', 'zeilen', 'surfen', 'zwemmen', 'duiken',
    'schaatsen', 'skien', 'snowboard', 'klimmen', 'turnen', 'triatlon', 'curling', 'bowlen',
    'darten', 'snooker', 'stadion', 'beker', 'medaille', 'fluitje', 'buitenspel',
    'strafschop', 'spits', 'keeper', 'dribbel', 'tackle', 'sprinter', 'competitie', 'trainer',
    'dugout',
  ],
  nature: [
    'bos', 'weide', 'steppe', 'woestijn', 'oerwoud', 'moeras', 'veen', 'vallei', 'kloof',
    'gletsjer', 'vulkaan', 'berg', 'heuvel', 'eiland', 'strand', 'klif', 'rivier', 'beek',
    'lagune', 'waterval', 'meer', 'oceaan', 'getijde', 'storm', 'onweer', 'bliksem',
    'regenboog', 'motregen', 'sneeuwstorm', 'zonsopgang', 'horizon', 'kei', 'kiezel',
    'graniet', 'kristal', 'mos', 'varen', 'klaver', 'distel', 'madelief', 'tulp', 'orchidee',
    'wilg', 'berk', 'esdoorn', 'populier', 'ceder', 'eikel', 'stuifmeel', 'honing', 'nectar',
    'bries', 'meteoor', 'toendra', 'duin',
  ],
  house: [
    'keuken', 'badkamer', 'slaapkamer', 'gang', 'zolder', 'kelder', 'garage', 'balkon',
    'terras', 'tuin', 'raam', 'gordijn', 'deur', 'trap', 'tapijt', 'kussen', 'deken',
    'hoofdkussen', 'matras', 'kledingkast', 'kast', 'lade', 'schap', 'spiegel', 'lantaarn',
    'kaars', 'kachel', 'haard', 'ketel', 'blender', 'vriezer', 'wasmand', 'mand', 'bezem',
    'emmer', 'hamer', 'ladder', 'schep', 'bank', 'leunstoel', 'tafel', 'kruk', 'theepot',
    'schotel', 'servet', 'handdoek', 'zeep', 'lamp', 'schakelaar', 'stekker', 'radiator',
    'deurmat', 'oven', 'gootsteen', 'hek',
  ],
  travel: [
    'vliegveld', 'terminal', 'landingsbaan', 'vliegtuig', 'cockpit', 'bagage', 'paspoort',
    'kaartje', 'instappen', 'koffer', 'rugzak', 'haven', 'veerboot', 'cruise', 'hut',
    'spoorweg', 'perron', 'wagon', 'tunnel', 'brug', 'snelweg', 'rotonde', 'kruising',
    'taxi', 'pendel', 'scooter', 'caravan', 'kamperen', 'tent', 'hostel', 'hotel', 'resort',
    'ansichtkaart', 'souvenir', 'valuta', 'kompas', 'atlas', 'monument', 'museum', 'galerie',
    'kathedraal', 'kasteel', 'markt', 'bazaar', 'festival', 'reis', 'vaartocht', 'omweg',
    'aankomst', 'vertrek', 'overstap', 'visum', 'gids', 'lounge',
  ],
  tech: [
    'toetsenbord', 'monitor', 'laptop', 'desktop', 'tablet', 'printer', 'scanner',
    'luidspreker', 'headset', 'webcam', 'batterij', 'lader', 'kabel', 'router', 'modem',
    'server', 'cluster', 'database', 'firewall', 'netwerk', 'browser', 'website', 'domein',
    'koekje', 'pixel', 'scherm', 'kernel', 'compiler', 'debugger', 'variabele', 'functie',
    'pointer', 'boolean', 'geheel', 'bibliotheek', 'pakket', 'versie', 'terminal', 'shell',
    'script', 'binair', 'encryptie', 'wachtwoord', 'firmware', 'satelliet', 'antenne',
    'sensor', 'circuit', 'processor', 'opslag', 'backup', 'cache', 'draad', 'widget',
  ],
};

const THEMES: Record<Bank, Themes> = { en: EN, nl: NL };

/** Uppercase, a–z only, deduplicated, shortest first is *not* imposed here. */
function clean(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const word = raw.toUpperCase().replace(/[^A-Z]/g, '');
    if (word.length < 3 || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
  }
  return out;
}

const CACHE = new Map<string, string[]>();

/** Every word in a category, uppercased and deduped. `mixed` is all themes. */
export function wordsFor(bank: Bank, category: Category): string[] {
  const key = `${bank}:${category}`;
  const hit = CACHE.get(key);
  if (hit) return hit;

  const themes = THEMES[bank] ?? EN;
  const source =
    category === 'mixed'
      ? Object.values(themes).flat()
      : themes[category] ?? Object.values(themes).flat();
  const list = clean(source);
  CACHE.set(key, list);
  return list;
}

/** Bank sizes, used by the README and the smoke run. */
export function bankStats(): Record<Bank, Record<Category, number>> {
  const out = {} as Record<Bank, Record<Category, number>>;
  for (const bank of ['en', 'nl'] as Bank[]) {
    const per = {} as Record<Category, number>;
    for (const category of Object.keys(THEMES[bank]) as Exclude<Category, 'mixed'>[]) {
      per[category] = wordsFor(bank, category).length;
    }
    per.mixed = wordsFor(bank, 'mixed').length;
    out[bank] = per;
  }
  return out;
}

/**
 * Letter frequencies per language, as relative weights. Filler letters are drawn
 * from these rather than uniformly: uniform noise makes real words leap off the
 * page because common letters cluster around them.
 */
export const FREQUENCY: Record<Bank, Record<string, number>> = {
  en: {
    E: 1202, T: 910, A: 812, O: 768, I: 731, N: 695, S: 628, R: 602, H: 592, D: 432,
    L: 398, U: 288, C: 271, M: 261, F: 230, Y: 211, W: 209, G: 203, P: 182, B: 149,
    V: 111, K: 69, X: 17, Q: 11, J: 10, Z: 7,
  },
  nl: {
    E: 1891, N: 1003, A: 749, T: 679, I: 650, R: 641, O: 606, D: 593, S: 373, L: 357,
    G: 340, V: 285, H: 238, K: 225, M: 221, U: 199, B: 158, P: 157, W: 152, J: 146,
    Z: 139, C: 124, F: 81, X: 4, Y: 4, Q: 9,
  },
};
