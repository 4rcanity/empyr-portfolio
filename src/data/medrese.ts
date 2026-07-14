export type MedreseLang = 'nl' | 'tr' | 'en';

export const medreseLanguages: MedreseLang[] = ['nl', 'tr', 'en'];

export const medreseLanguageLabels: Record<MedreseLang, string> = {
  nl: 'Nederlands',
  tr: 'Türkçe',
  en: 'English',
};

export type MedreseSectionId =
  | 'risale'
  | 'basiskennis'
  | 'koran'
  | 'hadith'
  | 'vragen'
  | 'artikelen'
  | 'media'
  | 'medrese'
  | 'evenementen'
  | 'bibliotheek';

export interface LocalizedText {
  nl: string;
  tr: string;
  en: string;
}

export interface MedreseSection {
  id: MedreseSectionId;
  icon: string;
  title: LocalizedText;
  description: LocalizedText;
  featured?: boolean;
}

export interface MedreseContentItem {
  id: string;
  section: MedreseSectionId;
  title: LocalizedText;
  summary: LocalizedText;
  meta: LocalizedText;
  tags: string[];
  source?: string;
  availability?: 'available' | 'permission';
}

export const medreseSections: MedreseSection[] = [
  {
    id: 'risale',
    icon: 'book-open',
    featured: true,
    title: { nl: 'Over de Risale-i Nur', tr: 'Risale-i Nur Hakkında', en: 'About the Risale-i Nur' },
    description: {
      nl: 'Ontdek de ontstaansgeschiedenis, thema’s en het leven van Bediüzzaman Said Nursî.',
      tr: 'Risale-i Nur’un tarihini, ana konularını ve Bediüzzaman Said Nursî’nin hayatını keşfedin.',
      en: 'Explore its history, central themes and the life of Bediüzzaman Said Nursî.',
    },
  },
  {
    id: 'basiskennis',
    icon: 'compass',
    featured: true,
    title: { nl: 'Islamitische basiskennis', tr: 'Temel İslami Bilgiler', en: 'Islamic foundations' },
    description: {
      nl: 'Een helder leerpad langs geloof, aanbidding, fiqh en adab.',
      tr: 'İman, ibadet, fıkıh ve adab üzerine anlaşılır bir öğrenme yolu.',
      en: 'A clear learning path through faith, worship, fiqh and adab.',
    },
  },
  {
    id: 'koran',
    icon: 'sparkles',
    featured: true,
    title: { nl: 'Koran', tr: 'Kur’an', en: 'Quran' },
    description: {
      nl: 'Dagelijkse verzen, thema’s en toegankelijke tafsir met bronvermelding.',
      tr: 'Günün ayeti, temalar ve kaynaklı, anlaşılır tefsir notları.',
      en: 'Daily verses, themes and accessible tafsir with clear citations.',
    },
  },
  {
    id: 'hadith',
    icon: 'quote',
    title: { nl: 'Hadith', tr: 'Hadis', en: 'Hadith' },
    description: {
      nl: 'Betrouwbare overleveringen, thematisch geordend en kort toegelicht.',
      tr: 'Güvenilir rivayetler, konuya göre düzenlenmiş kısa açıklamalarla.',
      en: 'Reliable narrations, arranged by theme with concise explanation.',
    },
  },
  {
    id: 'vragen',
    icon: 'help',
    title: { nl: 'Vragen & antwoorden', tr: 'Sorular & Cevaplar', en: 'Questions & answers' },
    description: {
      nl: 'Grote vragen over geloof, lijden, wetenschap en het dagelijks leven.',
      tr: 'İman, acı, bilim ve günlük hayat üzerine temel sorular.',
      en: 'Big questions about faith, suffering, science and everyday life.',
    },
  },
  {
    id: 'artikelen',
    icon: 'article',
    title: { nl: 'Artikelen', tr: 'Makaleler', en: 'Articles' },
    description: {
      nl: 'Geloof, familie, opvoeding, werk en actualiteit.',
      tr: 'İman, aile, eğitim, iş hayatı ve güncel konular.',
      en: 'Faith, family, education, work and current affairs.',
    },
  },
  {
    id: 'media',
    icon: 'play',
    title: { nl: 'Video & podcasts', tr: 'Video & Podcast', en: 'Video & podcasts' },
    description: {
      nl: 'Lezingen, uitlegseries en vraag-en-antwoordsessies.',
      tr: 'Sohbetler, açıklama serileri ve soru-cevap oturumları.',
      en: 'Lectures, explanation series and question-and-answer sessions.',
    },
  },
  {
    id: 'medrese',
    icon: 'users',
    featured: true,
    title: { nl: 'Medrese', tr: 'Medrese', en: 'Medrese' },
    description: {
      nl: 'Lesrooster, studiegroepen, kinderlessen en jongerenactiviteiten.',
      tr: 'Ders programı, okuma grupları, çocuk dersleri ve gençlik faaliyetleri.',
      en: 'Schedules, study groups, children’s classes and youth activities.',
    },
  },
  {
    id: 'evenementen',
    icon: 'calendar',
    title: { nl: 'Evenementen', tr: 'Etkinlikler', en: 'Events' },
    description: {
      nl: 'Lezingen, cursussen, Ramadanprogramma’s en Eid-bijeenkomsten.',
      tr: 'Sohbetler, kurslar, Ramazan programları ve bayram buluşmaları.',
      en: 'Lectures, courses, Ramadan programs and Eid gatherings.',
    },
  },
  {
    id: 'bibliotheek',
    icon: 'library',
    title: { nl: 'Bibliotheek', tr: 'Kütüphane', en: 'Library' },
    description: {
      nl: 'Aanbevolen boeken in het Nederlands, Turks en Engels.',
      tr: 'Türkçe, Hollandaca ve İngilizce tavsiye edilen kitaplar.',
      en: 'Recommended books in Dutch, Turkish and English.',
    },
  },
];

export const medreseItems: MedreseContentItem[] = [
  {
    id: 'said-nursi',
    section: 'risale',
    title: { nl: 'Wie was Said Nursî?', tr: 'Said Nursî kimdir?', en: 'Who was Said Nursî?' },
    summary: {
      nl: 'Een biografische introductie tot zijn leven, onderwijsvisie en intellectuele nalatenschap.',
      tr: 'Hayatı, eğitim anlayışı ve fikrî mirasına giriş niteliğinde bir biyografi.',
      en: 'A biographical introduction to his life, educational vision and intellectual legacy.',
    },
    meta: { nl: 'Introductie · 8 min', tr: 'Başlangıç · 8 dk', en: 'Introduction · 8 min' },
    tags: ['risale', 'history', 'biography'],
    source: 'Original educational summary',
  },
  {
    id: 'risale-history',
    section: 'risale',
    title: { nl: 'Geschiedenis van de collectie', tr: 'Külliyatın tarihi', en: 'History of the collection' },
    summary: {
      nl: 'Hoe de verhandelingen ontstonden en zich via leeskringen verspreidden.',
      tr: 'Risalelerin nasıl doğduğu ve okuma halkalarıyla nasıl yayıldığı.',
      en: 'How the treatises emerged and spread through reading circles.',
    },
    meta: { nl: 'Geschiedenis · 12 min', tr: 'Tarih · 12 dk', en: 'History · 12 min' },
    tags: ['risale', 'history'],
    source: 'Original educational summary',
  },
  {
    id: 'risale-library',
    section: 'risale',
    title: { nl: 'Risale-i Nur bibliotheek', tr: 'Risale-i Nur Kütüphanesi', en: 'Risale-i Nur library' },
    summary: {
      nl: 'Een catalogus van delen en onderwerpen. Volledige teksten alleen met toestemming.',
      tr: 'Eserler ve konular kataloğu. Tam metinler yalnızca izinle sunulur.',
      en: 'A catalogue of volumes and themes. Full texts are available only with permission.',
    },
    meta: { nl: 'Catalogus · 14 delen', tr: 'Katalog · 14 eser', en: 'Catalogue · 14 volumes' },
    tags: ['risale', 'library'],
    availability: 'permission',
  },
  {
    id: 'faith-pillars',
    section: 'basiskennis',
    title: { nl: 'De zes geloofspijlers', tr: 'İmanın altı şartı', en: 'The six pillars of faith' },
    summary: {
      nl: 'Een overzicht van de kern van islamitische geloofsleer.',
      tr: 'İslam inancının temel esaslarına genel bir bakış.',
      en: 'An overview of the foundations of Islamic belief.',
    },
    meta: { nl: 'Beginner · 6 lessen', tr: 'Başlangıç · 6 ders', en: 'Beginner · 6 lessons' },
    tags: ['aqidah', 'faith', 'beginner'],
  },
  {
    id: 'islam-pillars',
    section: 'basiskennis',
    title: { nl: 'De vijf zuilen', tr: 'İslam’ın beş şartı', en: 'The five pillars' },
    summary: {
      nl: 'Van geloofsgetuigenis tot gebed, vasten, zakaat en bedevaart.',
      tr: 'Şehadetten namaz, oruç, zekât ve hacca uzanan temel ibadetler.',
      en: 'From testimony of faith to prayer, fasting, charity and pilgrimage.',
    },
    meta: { nl: 'Beginner · 5 lessen', tr: 'Başlangıç · 5 ders', en: 'Beginner · 5 lessons' },
    tags: ['worship', 'fiqh', 'beginner'],
  },
  {
    id: 'adab',
    section: 'basiskennis',
    title: { nl: 'Adab in het dagelijks leven', tr: 'Günlük hayatta adab', en: 'Adab in daily life' },
    summary: {
      nl: 'Respect, intentie en goede omgangsvormen in gezin en samenleving.',
      tr: 'Ailede ve toplumda saygı, niyet ve güzel davranışlar.',
      en: 'Respect, intention and good conduct in family and society.',
    },
    meta: { nl: 'Praktijk · 7 lessen', tr: 'Uygulama · 7 ders', en: 'Practice · 7 lessons' },
    tags: ['adab', 'family', 'practice'],
  },
  {
    id: 'quran-mercy',
    section: 'koran',
    title: { nl: 'Barmhartigheid in de Koran', tr: 'Kur’an’da rahmet', en: 'Mercy in the Quran' },
    summary: {
      nl: 'Een thematische route langs verzen over hoop, vergeving en verantwoordelijkheid.',
      tr: 'Ümit, bağışlanma ve sorumluluk ayetleri üzerinden tematik bir yolculuk.',
      en: 'A thematic path through verses on hope, forgiveness and responsibility.',
    },
    meta: { nl: 'Thema · 9 verzen', tr: 'Tema · 9 ayet', en: 'Theme · 9 verses' },
    tags: ['quran', 'mercy', 'hope'],
    source: 'Quran references with original paraphrases',
  },
  {
    id: 'quran-tafsir',
    section: 'koran',
    title: { nl: 'Inleiding tot tafsir', tr: 'Tefsire giriş', en: 'Introduction to tafsir' },
    summary: {
      nl: 'Wat is uitleg van de Koran en welke bronnen gebruiken geleerden?',
      tr: 'Tefsir nedir ve âlimler hangi kaynakları kullanır?',
      en: 'What is Quranic exegesis and which sources do scholars use?',
    },
    meta: { nl: 'Methodiek · 10 min', tr: 'Yöntem · 10 dk', en: 'Method · 10 min' },
    tags: ['quran', 'tafsir', 'method'],
  },
  {
    id: 'quran-search',
    section: 'koran',
    title: { nl: 'Zoeken op onderwerp', tr: 'Konuya göre ara', en: 'Search by topic' },
    summary: {
      nl: 'Vind verwijzingen over gebed, geduld, schepping, familie en meer.',
      tr: 'Namaz, sabır, yaratılış, aile ve daha fazlası hakkında ayetler bulun.',
      en: 'Find references about prayer, patience, creation, family and more.',
    },
    meta: { nl: 'Index · 24 thema’s', tr: 'Dizin · 24 tema', en: 'Index · 24 themes' },
    tags: ['quran', 'search', 'themes'],
  },
  {
    id: 'hadith-intention',
    section: 'hadith',
    title: { nl: 'Intentie en oprechtheid', tr: 'Niyet ve ihlas', en: 'Intention and sincerity' },
    summary: {
      nl: 'Een bronvermelde introductie tot overleveringen over intentie.',
      tr: 'Niyet hakkındaki rivayetlere kaynaklı bir giriş.',
      en: 'A sourced introduction to narrations about intention.',
    },
    meta: { nl: 'Sahih · 4 overleveringen', tr: 'Sahih · 4 rivayet', en: 'Sahih · 4 narrations' },
    tags: ['hadith', 'intention'],
    source: 'Sahih al-Bukhari 1; paraphrased summary',
  },
  {
    id: 'hadith-character',
    section: 'hadith',
    title: { nl: 'Goed karakter', tr: 'Güzel ahlak', en: 'Good character' },
    summary: {
      nl: 'Over vriendelijkheid, eerlijkheid en verantwoordelijkheid.',
      tr: 'Nezaket, dürüstlük ve sorumluluk üzerine.',
      en: 'On kindness, honesty and responsibility.',
    },
    meta: { nl: 'Thema · 6 overleveringen', tr: 'Tema · 6 rivayet', en: 'Theme · 6 narrations' },
    tags: ['hadith', 'character', 'adab'],
  },
  {
    id: 'hadith-daily',
    section: 'hadith',
    title: { nl: 'Dagelijkse hadith', tr: 'Günün hadisi', en: 'Daily hadith' },
    summary: {
      nl: 'Iedere dag één korte, controleerbare bron met uitleg.',
      tr: 'Her gün kısa, doğrulanabilir bir kaynak ve açıklama.',
      en: 'One short, verifiable source with explanation each day.',
    },
    meta: { nl: 'Dagelijks', tr: 'Her gün', en: 'Daily' },
    tags: ['hadith', 'daily'],
  },
  {
    id: 'why-pray',
    section: 'vragen',
    title: { nl: 'Waarom bidden?', tr: 'Neden namaz kılıyoruz?', en: 'Why pray?' },
    summary: {
      nl: 'Een rustig antwoord over aanbidding, ritme en nabijheid tot Allah.',
      tr: 'İbadet, düzen ve Allah’a yakınlık üzerine sade bir cevap.',
      en: 'A calm answer about worship, rhythm and closeness to Allah.',
    },
    meta: { nl: 'Veelgestelde vraag · 7 min', tr: 'Sık sorulan · 7 dk', en: 'FAQ · 7 min' },
    tags: ['prayer', 'questions', 'youth'],
  },
  {
    id: 'suffering',
    section: 'vragen',
    title: { nl: 'Waarom is er lijden?', tr: 'Neden acı var?', en: 'Why is there suffering?' },
    summary: {
      nl: 'Perspectieven op beproeving, vrije wil, mededogen en hoop.',
      tr: 'İmtihan, özgür irade, merhamet ve ümit üzerine bakışlar.',
      en: 'Perspectives on trial, free will, compassion and hope.',
    },
    meta: { nl: 'Geloofsvraag · 12 min', tr: 'İman sorusu · 12 dk', en: 'Faith question · 12 min' },
    tags: ['suffering', 'faith', 'questions'],
  },
  {
    id: 'science',
    section: 'vragen',
    title: { nl: 'Wetenschap en islam', tr: 'Bilim ve İslam', en: 'Science and Islam' },
    summary: {
      nl: 'Hoe geloof en onderzoek elkaar kunnen ontmoeten zonder simplificatie.',
      tr: 'İman ve araştırmanın basitleştirmeden nasıl buluşabileceği.',
      en: 'How faith and inquiry can meet without oversimplification.',
    },
    meta: { nl: 'Verdieping · 15 min', tr: 'İleri · 15 dk', en: 'Deep dive · 15 min' },
    tags: ['science', 'faith', 'evolution'],
  },
  {
    id: 'family-faith',
    section: 'artikelen',
    title: { nl: 'Geloof in het gezin', tr: 'Ailede iman eğitimi', en: 'Faith in the family' },
    summary: {
      nl: 'Praktische manieren om geloofsgesprekken thuis open en warm te houden.',
      tr: 'Evde iman sohbetlerini açık ve sıcak tutmanın pratik yolları.',
      en: 'Practical ways to keep conversations about faith open and warm at home.',
    },
    meta: { nl: 'Familie · 6 min', tr: 'Aile · 6 dk', en: 'Family · 6 min' },
    tags: ['family', 'education', 'article'],
  },
  {
    id: 'work-ethics',
    section: 'artikelen',
    title: { nl: 'Ethiek op het werk', tr: 'İş hayatında ahlak', en: 'Ethics at work' },
    summary: {
      nl: 'Over eerlijkheid, vakmanschap en verantwoordelijkheid in je beroep.',
      tr: 'Meslekte dürüstlük, ustalık ve sorumluluk üzerine.',
      en: 'On honesty, craftsmanship and responsibility in professional life.',
    },
    meta: { nl: 'Werk · 8 min', tr: 'İş · 8 dk', en: 'Work · 8 min' },
    tags: ['work', 'ethics', 'article'],
  },
  {
    id: 'digital-balance',
    section: 'artikelen',
    title: { nl: 'Rust in een digitale wereld', tr: 'Dijital dünyada sükûnet', en: 'Calm in a digital world' },
    summary: {
      nl: 'Aandacht, intentie en gezonde grenzen voor jongeren en gezinnen.',
      tr: 'Gençler ve aileler için dikkat, niyet ve sağlıklı sınırlar.',
      en: 'Attention, intention and healthy boundaries for young people and families.',
    },
    meta: { nl: 'Jongeren · 9 min', tr: 'Gençlik · 9 dk', en: 'Youth · 9 min' },
    tags: ['youth', 'digital', 'article'],
  },
  {
    id: 'media-risale',
    section: 'media',
    title: { nl: 'Risale in 10 minuten', tr: '10 dakikada Risale', en: 'Risale in 10 minutes' },
    summary: {
      nl: 'Een visuele introductie tot de opbouw en centrale vragen van de collectie.',
      tr: 'Külliyatın yapısına ve ana sorularına görsel bir giriş.',
      en: 'A visual introduction to the collection’s structure and central questions.',
    },
    meta: { nl: 'Video · 10:24', tr: 'Video · 10:24', en: 'Video · 10:24' },
    tags: ['video', 'risale', 'introduction'],
  },
  {
    id: 'media-youth',
    section: 'media',
    title: { nl: 'Jongeren vragen', tr: 'Gençler soruyor', en: 'Young people ask' },
    summary: {
      nl: 'Korte antwoorden op vragen over identiteit, keuzes en geloof.',
      tr: 'Kimlik, tercihler ve iman hakkında kısa cevaplar.',
      en: 'Short answers about identity, choices and faith.',
    },
    meta: { nl: 'Podcast · 24 min', tr: 'Podcast · 24 dk', en: 'Podcast · 24 min' },
    tags: ['podcast', 'youth', 'questions'],
  },
  {
    id: 'media-tafsir',
    section: 'media',
    title: { nl: 'Tafsir-kring', tr: 'Tefsir halkası', en: 'Tafsir circle' },
    summary: {
      nl: 'Een demo-aflevering over lezen met context en bronbewustzijn.',
      tr: 'Bağlam ve kaynak bilinciyle okuma üzerine örnek bir bölüm.',
      en: 'A sample episode on reading with context and source awareness.',
    },
    meta: { nl: 'Lezing · 38 min', tr: 'Sohbet · 38 dk', en: 'Lecture · 38 min' },
    tags: ['lecture', 'quran', 'tafsir'],
  },
  {
    id: 'study-groups',
    section: 'medrese',
    title: { nl: 'Wekelijkse studiegroepen', tr: 'Haftalık okuma grupları', en: 'Weekly study groups' },
    summary: {
      nl: 'Kleine groepen voor beginners, gevorderden en jongeren.',
      tr: 'Başlangıç, ileri seviye ve gençler için küçük gruplar.',
      en: 'Small groups for beginners, advanced readers and youth.',
    },
    meta: { nl: 'Dinsdag & donderdag', tr: 'Salı & perşembe', en: 'Tuesday & Thursday' },
    tags: ['schedule', 'study', 'community'],
  },
  {
    id: 'children',
    section: 'medrese',
    title: { nl: 'Kinderlessen', tr: 'Çocuk dersleri', en: 'Children’s classes' },
    summary: {
      nl: 'Speelse lessen over geloof, profetenverhalen en goed gedrag.',
      tr: 'İman, peygamber kıssaları ve güzel ahlak üzerine eğlenceli dersler.',
      en: 'Playful lessons on faith, prophetic stories and good character.',
    },
    meta: { nl: 'Zaterdag · 10:00', tr: 'Cumartesi · 10:00', en: 'Saturday · 10:00' },
    tags: ['children', 'schedule', 'education'],
  },
  {
    id: 'youth',
    section: 'medrese',
    title: { nl: 'Jongerenavond', tr: 'Gençlik akşamı', en: 'Youth evening' },
    summary: {
      nl: 'Gesprek, sport en reflectie in een veilige omgeving.',
      tr: 'Güvenli bir ortamda sohbet, spor ve tefekkür.',
      en: 'Conversation, sport and reflection in a safe environment.',
    },
    meta: { nl: 'Vrijdag · 19:30', tr: 'Cuma · 19:30', en: 'Friday · 19:30' },
    tags: ['youth', 'schedule', 'community'],
  },
  {
    id: 'event-lecture',
    section: 'evenementen',
    title: { nl: 'Lezing: geloof en verwondering', tr: 'Sohbet: iman ve hayret', en: 'Lecture: faith and wonder' },
    summary: {
      nl: 'Een toegankelijke avond over kijken naar schepping, kennis en betekenis.',
      tr: 'Yaratılış, bilgi ve anlam üzerine herkes için açık bir akşam.',
      en: 'An accessible evening about creation, knowledge and meaning.',
    },
    meta: { nl: '18 september · 19:30', tr: '18 Eylül · 19:30', en: '18 September · 19:30' },
    tags: ['event', 'lecture'],
  },
  {
    id: 'event-course',
    section: 'evenementen',
    title: { nl: 'Basiscursus geloof', tr: 'Temel iman kursu', en: 'Foundations of faith course' },
    summary: {
      nl: 'Vier avonden voor iedereen die gestructureerd wil beginnen.',
      tr: 'Düzenli bir başlangıç yapmak isteyenler için dört akşam.',
      en: 'Four evenings for anyone seeking a structured beginning.',
    },
    meta: { nl: 'Start 3 oktober', tr: '3 Ekim’de başlıyor', en: 'Starts 3 October' },
    tags: ['event', 'course', 'beginner'],
  },
  {
    id: 'event-family',
    section: 'evenementen',
    title: { nl: 'Familiedag', tr: 'Aile günü', en: 'Family day' },
    summary: {
      nl: 'Kinderprogramma, workshops en gezamenlijke maaltijd.',
      tr: 'Çocuk programı, atölyeler ve birlikte yemek.',
      en: 'Children’s program, workshops and a shared meal.',
    },
    meta: { nl: '12 oktober · hele dag', tr: '12 Ekim · tüm gün', en: '12 October · all day' },
    tags: ['event', 'family', 'children'],
  },
  {
    id: 'library-risale',
    section: 'bibliotheek',
    title: { nl: 'Risale-i Nur catalogus', tr: 'Risale-i Nur Kataloğu', en: 'Risale-i Nur catalogue' },
    summary: {
      nl: 'Bibliografische informatie en onderwerpindex, zonder ongeautoriseerde downloads.',
      tr: 'İzinsiz indirme olmadan bibliyografik bilgi ve konu dizini.',
      en: 'Bibliographic information and a subject index without unauthorized downloads.',
    },
    meta: { nl: 'Turks · boek', tr: 'Türkçe · kitap', en: 'Turkish · book' },
    tags: ['library', 'risale', 'turkish'],
    availability: 'permission',
  },
  {
    id: 'library-foundations',
    section: 'bibliotheek',
    title: { nl: 'Geloof voor beginners', tr: 'Yeni başlayanlar için iman', en: 'Faith for beginners' },
    summary: {
      nl: 'Een samengestelde leeslijst met toegankelijke introducties.',
      tr: 'Anlaşılır giriş eserlerinden oluşan seçilmiş bir okuma listesi.',
      en: 'A curated reading list of accessible introductions.',
    },
    meta: { nl: 'NL / TR / EN · 8 boeken', tr: 'TR / NL / EN · 8 kitap', en: 'EN / NL / TR · 8 books' },
    tags: ['library', 'beginner', 'faith'],
  },
  {
    id: 'library-children',
    section: 'bibliotheek',
    title: { nl: 'Kinderbibliotheek', tr: 'Çocuk Kütüphanesi', en: 'Children’s library' },
    summary: {
      nl: 'Boeken over profeten, karakter en islamitische geschiedenis.',
      tr: 'Peygamberler, ahlak ve İslam tarihi üzerine çocuk kitapları.',
      en: 'Books about prophets, character and Islamic history.',
    },
    meta: { nl: 'Kinderen · 12 boeken', tr: 'Çocuk · 12 kitap', en: 'Children · 12 books' },
    tags: ['library', 'children', 'stories'],
  },
];

export const medreseCopy = {
  nl: {
    siteName: 'Medrese',
    navLearn: 'Leren',
    navLibrary: 'Bibliotheek',
    navActivities: 'Activiteiten',
    navAbout: 'Over ons',
    search: 'Zoeken',
    searchPlaceholder: 'Zoek in lessen, artikelen en bronnen…',
    noResults: 'Geen resultaten gevonden.',
    theme: 'Thema wisselen',
    heroEyebrow: 'Kennis die hart en verstand verbindt',
    heroTitle: 'Leer. Verdiep. Deel.',
    heroBody:
      'Een moderne leeromgeving voor de Risale-i Nur, islamitische basiskennis en een betrokken gemeenschap.',
    startLearning: 'Start met leren',
    discoverRisale: 'Ontdek de Risale-i Nur',
    daily: 'Vandaag',
    ayahLabel: 'Dagelijkse ayah',
    ayahText: 'Allah belast geen ziel boven haar vermogen — een uitnodiging tot vertrouwen en volharding.',
    ayahSource: 'Koran 2:286 · eigen samenvatting',
    hadithLabel: 'Dagelijkse hadith',
    hadithText: 'Handelingen krijgen hun waarde door de intentie waarmee ze worden verricht.',
    hadithSource: 'Sahih al-Bukhari 1 · parafrase',
    explore: 'Ontdek de leeromgeving',
    exploreBody: 'Begin bij een onderwerp of volg een rustig opgebouwd leerpad.',
    viewSection: 'Bekijk onderdeel',
    latest: 'Nieuw & actueel',
    latestBody: 'Nieuwe artikelen, lessen en activiteiten uit de gemeenschap.',
    prayerTitle: 'Gebedstijden',
    prayerCity: 'Demostad · voorbeeldtijden',
    prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
    times: ['04:18', '13:42', '17:58', '21:47', '23:16'],
    nextPrayer: 'Volgend gebed',
    scheduleTitle: 'Deze week in de medrese',
    aiTitle: 'Vraag de kennisbank',
    aiBody: 'Een bronbewuste AI-demo op basis van gecontroleerde inhoud.',
    aiPlaceholder: 'Bijv. Waarom is gebed belangrijk?',
    aiAsk: 'Stel vraag',
    aiAnswer:
      'Gebed geeft structuur aan de dag en brengt aanbidding, dankbaarheid en aandacht samen. Binnen deze demo wordt ieder antwoord gekoppeld aan controleerbare bronnen.',
    aiSources: 'Bronnen: Koran 20:14 · Islamitische basiskennis / Gebed',
    aiDisclaimer: 'Demo — geen live AI en geen vervanging voor een gekwalificeerde leraar.',
    newsletterTitle: 'Blijf betrokken',
    newsletterBody: 'Ontvang nieuwe lessen, activiteiten en leestips in je inbox.',
    emailPlaceholder: 'jouw@email.nl',
    subscribe: 'Aanmelden',
    demoSuccess: 'Bedankt! Dit formulier is een demo en verstuurt geen gegevens.',
    favorites: 'Favorieten',
    favorite: 'Bewaar',
    saved: 'Bewaard',
    readMore: 'Open onderwerp',
    rights: 'Bronnen & rechten',
    rightsBody:
      'Deze demo bevat originele samenvattingen en bronverwijzingen. Volledige Risale-teksten, vertalingen, audio en PDF’s worden alleen aangeboden met toestemming.',
    footer: 'Een Empyr concept · educatieve demo',
    backPortfolio: 'Terug naar Empyr',
    allSections: 'Alle onderdelen',
  },
  tr: {
    siteName: 'Medrese',
    navLearn: 'Öğren',
    navLibrary: 'Kütüphane',
    navActivities: 'Faaliyetler',
    navAbout: 'Hakkımızda',
    search: 'Ara',
    searchPlaceholder: 'Derslerde, makalelerde ve kaynaklarda ara…',
    noResults: 'Sonuç bulunamadı.',
    theme: 'Temayı değiştir',
    heroEyebrow: 'Kalp ile aklı buluşturan bilgi',
    heroTitle: 'Öğren. Derinleş. Paylaş.',
    heroBody:
      'Risale-i Nur, temel İslami bilgiler ve güçlü bir topluluk için modern bir öğrenme ortamı.',
    startLearning: 'Öğrenmeye başla',
    discoverRisale: 'Risale-i Nur’u keşfet',
    daily: 'Bugün',
    ayahLabel: 'Günün ayeti',
    ayahText: 'Allah hiçbir nefse gücünün yettiğinden fazlasını yüklemez — güven ve sebata bir davet.',
    ayahSource: 'Kur’an 2:286 · özgün özet',
    hadithLabel: 'Günün hadisi',
    hadithText: 'Ameller, onları yaparken taşıdığımız niyete göre değer kazanır.',
    hadithSource: 'Sahih el-Buhârî 1 · anlam özeti',
    explore: 'Öğrenme ortamını keşfet',
    exploreBody: 'Bir konudan başlayın veya adım adım hazırlanmış bir öğrenme yolunu izleyin.',
    viewSection: 'Bölümü aç',
    latest: 'Yeni & güncel',
    latestBody: 'Topluluktan yeni makaleler, dersler ve faaliyetler.',
    prayerTitle: 'Namaz vakitleri',
    prayerCity: 'Örnekşehir · örnek vakitler',
    prayers: ['İmsak', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'],
    times: ['04:18', '13:42', '17:58', '21:47', '23:16'],
    nextPrayer: 'Sıradaki namaz',
    scheduleTitle: 'Bu hafta medresede',
    aiTitle: 'Bilgi bankasına sor',
    aiBody: 'Kontrol edilmiş içeriklere dayalı, kaynak odaklı bir yapay zekâ demosu.',
    aiPlaceholder: 'Örn. Namaz neden önemlidir?',
    aiAsk: 'Sor',
    aiAnswer:
      'Namaz güne düzen verir; ibadet, şükür ve dikkati bir araya getirir. Bu demoda her cevap doğrulanabilir kaynaklarla ilişkilendirilir.',
    aiSources: 'Kaynaklar: Kur’an 20:14 · Temel İslami Bilgiler / Namaz',
    aiDisclaimer: 'Demo — canlı yapay zekâ değildir ve ehil bir hocanın yerini tutmaz.',
    newsletterTitle: 'Bağlantıda kalın',
    newsletterBody: 'Yeni dersleri, faaliyetleri ve okuma önerilerini e-postanızda alın.',
    emailPlaceholder: 'eposta@ornek.nl',
    subscribe: 'Kaydol',
    demoSuccess: 'Teşekkürler! Bu form bir demodur ve veri göndermez.',
    favorites: 'Favoriler',
    favorite: 'Kaydet',
    saved: 'Kaydedildi',
    readMore: 'Konuyu aç',
    rights: 'Kaynaklar & haklar',
    rightsBody:
      'Bu demo özgün özetler ve kaynak bilgileri içerir. Tam Risale metinleri, tercümeler, ses kayıtları ve PDF’ler yalnızca izinle sunulur.',
    footer: 'Bir Empyr konsepti · eğitim demosu',
    backPortfolio: 'Empyr’e dön',
    allSections: 'Tüm bölümler',
  },
  en: {
    siteName: 'Medrese',
    navLearn: 'Learn',
    navLibrary: 'Library',
    navActivities: 'Activities',
    navAbout: 'About',
    search: 'Search',
    searchPlaceholder: 'Search lessons, articles and sources…',
    noResults: 'No results found.',
    theme: 'Change theme',
    heroEyebrow: 'Knowledge connecting heart and mind',
    heroTitle: 'Learn. Deepen. Share.',
    heroBody:
      'A modern learning environment for the Risale-i Nur, Islamic foundations and an engaged community.',
    startLearning: 'Start learning',
    discoverRisale: 'Discover the Risale-i Nur',
    daily: 'Today',
    ayahLabel: 'Daily ayah',
    ayahText: 'Allah does not burden a soul beyond its capacity — an invitation to trust and perseverance.',
    ayahSource: 'Quran 2:286 · original paraphrase',
    hadithLabel: 'Daily hadith',
    hadithText: 'Actions receive their value through the intention with which they are performed.',
    hadithSource: 'Sahih al-Bukhari 1 · paraphrase',
    explore: 'Explore the learning environment',
    exploreBody: 'Start with a topic or follow a carefully structured learning path.',
    viewSection: 'View section',
    latest: 'New & current',
    latestBody: 'New articles, lessons and activities from the community.',
    prayerTitle: 'Prayer times',
    prayerCity: 'Demo City · sample times',
    prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
    times: ['04:18', '13:42', '17:58', '21:47', '23:16'],
    nextPrayer: 'Next prayer',
    scheduleTitle: 'This week at the medrese',
    aiTitle: 'Ask the knowledge base',
    aiBody: 'A source-aware AI demo based on reviewed content.',
    aiPlaceholder: 'E.g. Why is prayer important?',
    aiAsk: 'Ask',
    aiAnswer:
      'Prayer gives structure to the day and brings worship, gratitude and attention together. In this demo, every answer connects to verifiable sources.',
    aiSources: 'Sources: Quran 20:14 · Islamic foundations / Prayer',
    aiDisclaimer: 'Demo — not live AI and not a substitute for a qualified teacher.',
    newsletterTitle: 'Stay connected',
    newsletterBody: 'Receive new lessons, activities and reading recommendations.',
    emailPlaceholder: 'you@example.com',
    subscribe: 'Subscribe',
    demoSuccess: 'Thank you! This form is a demo and sends no data.',
    favorites: 'Favorites',
    favorite: 'Save',
    saved: 'Saved',
    readMore: 'Open topic',
    rights: 'Sources & rights',
    rightsBody:
      'This demo contains original summaries and source references. Full Risale texts, translations, audio and PDFs are offered only with permission.',
    footer: 'An Empyr concept · educational demo',
    backPortfolio: 'Back to Empyr',
    allSections: 'All sections',
  },
} as const;

export function getMedreseCopy(lang: MedreseLang) {
  return medreseCopy[lang];
}

export function localize(text: LocalizedText, lang: MedreseLang) {
  return text[lang];
}

export function getSection(id: string) {
  return medreseSections.find((section) => section.id === id);
}
/*
export const medreseLanguages = ['nl', 'tr', 'en'] as const;
export type MedreseLang = (typeof medreseLanguages)[number];

export const medreseLanguageLabels: Record<MedreseLang, string> = {
  nl: 'Nederlands',
  tr: 'Türkçe',
  en: 'English',
};

export const medreseSectionSlugs = [
  'risale',
  'basiskennis',
  'koran',
  'hadith',
  'vragen',
  'artikelen',
  'media',
  'medrese',
  'evenementen',
  'bibliotheek',
] as const;

export type MedreseSectionSlug = (typeof medreseSectionSlugs)[number];

export interface MedreseItem {
  id: string;
  title: string;
  summary: string;
  tag: string;
  meta: string;
  source?: string;
}

export interface MedreseSection {
  slug: MedreseSectionSlug;
  icon: string;
  title: string;
  description: string;
  eyebrow: string;
  items: MedreseItem[];
}

export interface MedreseCopy {
  siteName: string;
  demoLabel: string;
  nav: {
    home: string;
    learn: string;
    activities: string;
    library: string;
    contact: string;
    search: string;
    openMenu: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    accent: string;
    body: string;
    primary: string;
    secondary: string;
  };
  daily: {
    label: string;
    ayahTitle: string;
    ayahText: string;
    ayahSource: string;
    hadithTitle: string;
    hadithText: string;
    hadithSource: string;
    disclaimer: string;
  };
  sections: {
    eyebrow: string;
    title: string;
    body: string;
    view: string;
  };
  mission: {
    eyebrow: string;
    title: string;
    body: string;
    values: Array<{ title: string; body: string }>;
  };
  schedule: {
    eyebrow: string;
    title: string;
    body: string;
    rows: Array<{ day: string; time: string; activity: string; audience: string }>;
  };
  prayer: {
    label: string;
    city: string;
    names: string[];
    times: string[];
    note: string;
  };
  events: {
    eyebrow: string;
    title: string;
    items: Array<{ day: string; month: string; title: string; meta: string }>;
  };
  ai: {
    eyebrow: string;
    title: string;
    body: string;
    placeholder: string;
    suggestions: string[];
    answerTitle: string;
    answer: string;
    source: string;
    disclaimer: string;
  };
  newsletter: {
    title: string;
    body: string;
    placeholder: string;
    button: string;
    success: string;
  };
  footer: string;
  backHome: string;
  page: {
    read: string;
    save: string;
    saved: string;
    source: string;
    rights: string;
    empty: string;
  };
}

const sectionIcons: Record<MedreseSectionSlug, string> = {
  risale: 'book-open',
  basiskennis: 'spark',
  koran: 'moon',
  hadith: 'quote',
  vragen: 'question',
  artikelen: 'pen',
  media: 'play',
  medrese: 'users',
  evenementen: 'calendar',
  bibliotheek: 'books',
};

function section(
  slug: MedreseSectionSlug,
  title: string,
  description: string,
  eyebrow: string,
  items: MedreseItem[]
): MedreseSection {
  return { slug, icon: sectionIcons[slug], title, description, eyebrow, items };
}

export const medreseSections: Record<MedreseLang, MedreseSection[]> = {
  nl: [
    section('risale', 'Over de Risale-i Nur', 'Een toegankelijke introductie tot het werk, de context en de centrale geloofsvragen.', 'Erfenis & verdieping', [
      { id: 'risale-intro', title: 'Wat is de Risale-i Nur?', summary: 'Een originele samenvatting van de opbouw, doelen en belangrijkste thema’s van de collectie.', tag: 'Introductie', meta: '8 min', source: 'Redactionele samenvatting' },
      { id: 'nursi-life', title: 'Bediüzzaman Said Nursî', summary: 'Een beknopte biografische tijdlijn met historische context en verwijzingen voor verder lezen.', tag: 'Biografie', meta: '12 min', source: 'Biografische metadata' },
      { id: 'risale-why', title: 'Waarom werd het geschreven?', summary: 'Hoe geloof, moderniteit, twijfel en spirituele verdieping samenkomen in het werk.', tag: 'Context', meta: '10 min', source: 'Redactionele samenvatting' },
    ]),
    section('basiskennis', 'Islamitische basiskennis', 'Heldere leerpaden over geloof, aanbidding en karaktervorming.', 'Begin bij de basis', [
      { id: 'six-pillars', title: 'De zes geloofspijlers', summary: 'Allah, engelen, boeken, profeten, de Laatste Dag en de goddelijke beschikking.', tag: 'Aqieda', meta: '6 lessen' },
      { id: 'five-pillars', title: 'De vijf zuilen', summary: 'Een praktisch overzicht van geloofsgetuigenis, gebed, zakat, vasten en bedevaart.', tag: 'Praktijk', meta: '5 lessen' },
      { id: 'adab', title: 'Adab in het dagelijks leven', summary: 'Islamitische omgangsvormen thuis, op school, op het werk en online.', tag: 'Karakter', meta: '7 lessen' },
    ]),
    section('koran', 'Koran', 'Dagelijkse verzen, thematische routes en betrouwbare uitleg met bronvermelding.', 'Lezen & overdenken', [
      { id: 'quran-mercy', title: 'Barmhartigheid als thema', summary: 'Een thematische route langs verzen over hoop, vergeving en verantwoordelijkheid.', tag: 'Thema', meta: '9 verwijzingen', source: 'Koranverwijzingen; eigen parafrase' },
      { id: 'quran-patience', title: 'Geduld en standvastigheid', summary: 'Wat sabr betekent in verlies, inspanning en morele keuzes.', tag: 'Tafsir', meta: '7 verwijzingen', source: 'Koranverwijzingen; eigen parafrase' },
      { id: 'quran-search', title: 'Zoeken op onderwerp', summary: 'Ontdek demo-onderwerpen zoals gebed, familie, kennis, schepping en rechtvaardigheid.', tag: 'Index', meta: '24 onderwerpen' },
    ]),
    section('hadith', 'Hadith', 'Thematische selectie met collectie, nummering, status en uitleg.', 'Profetische wijsheid', [
      { id: 'hadith-intention', title: 'Intentie en oprechtheid', summary: 'Een leerkaart over niyyah, verantwoordelijkheid en de waarde van handelingen.', tag: 'Karakter', meta: '4 bronnen', source: 'Collectieverwijzingen; eigen parafrase' },
      { id: 'hadith-kindness', title: 'Zachtheid en barmhartigheid', summary: 'Over vriendelijkheid als kracht in gezin, gemeenschap en verschil van mening.', tag: 'Adab', meta: '5 bronnen', source: 'Collectieverwijzingen; eigen parafrase' },
      { id: 'hadith-knowledge', title: 'Kennis zoeken', summary: 'Waarom leren samengaat met nederigheid, betrouwbaarheid en handelen.', tag: 'Kennis', meta: '6 bronnen', source: 'Collectieverwijzingen; eigen parafrase' },
    ]),
    section('vragen', 'Vragen & antwoorden', 'Rustige, bronbewuste antwoorden op grote en alledaagse geloofsvragen.', 'Vraag vrijuit', [
      { id: 'qa-existence', title: 'Bestaat Allah?', summary: 'Een inleiding tot orde, afhankelijkheid, betekenis en klassieke geloofsargumenten.', tag: 'Geloof', meta: '10 min' },
      { id: 'qa-prayer', title: 'Waarom bidden?', summary: 'Gebed als verbinding, ritme, dankbaarheid en innerlijke discipline.', tag: 'Gebed', meta: '7 min' },
      { id: 'qa-suffering', title: 'Waarom lijden mensen?', summary: 'Een voorzichtige verkenning van beproeving, vrije wil, mededogen en het hiernamaals.', tag: 'Zingeving', meta: '12 min' },
    ]),
    section('artikelen', 'Artikelen', 'Reflecties over geloof, gezin, opvoeding, werk en samenleving.', 'Lees & reflecteer', [
      { id: 'article-family', title: 'Een huis waarin geloof groeit', summary: 'Praktische gewoonten voor aandacht, gesprek en voorbeeldgedrag in het gezin.', tag: 'Familie', meta: '7 min' },
      { id: 'article-work', title: 'Ihsan op het werk', summary: 'Vakmanschap, eerlijkheid en dienstbaarheid als onderdelen van professioneel karakter.', tag: 'Werk', meta: '6 min' },
      { id: 'article-youth', title: 'Ruimte voor vragen van jongeren', summary: 'Hoe luisteren en vertrouwen een sterkere geloofsopvoeding mogelijk maken.', tag: 'Opvoeding', meta: '9 min' },
    ]),
    section('media', 'Video’s & podcasts', 'Lezingen, korte uitleg en gesprekken, overzichtelijk per serie.', 'Kijk & luister', [
      { id: 'media-risale', title: 'Risale in 10 minuten', summary: 'Een korte videoserie met context, begrippen en leesroutes.', tag: 'Videoserie', meta: '6 afleveringen' },
      { id: 'media-qa', title: 'Jongeren vragen', summary: 'Een podcastformat rond geloof, identiteit, studie en sociale media.', tag: 'Podcast', meta: '8 afleveringen' },
      { id: 'media-tafsir', title: 'Tafsir-notities', summary: 'Korte reflecties op geselecteerde verzen met duidelijke bronverwijzingen.', tag: 'Audio', meta: '12 afleveringen' },
    ]),
    section('medrese', 'Medrese', 'Lessen, studiegroepen en activiteiten voor kinderen, jongeren en volwassenen.', 'Samen leren', [
      { id: 'academy-schedule', title: 'Lesrooster', summary: 'Bekijk wekelijkse lessen, niveaus en beschikbare plaatsen.', tag: 'Planning', meta: 'Wekelijks' },
      { id: 'academy-groups', title: 'Studiegroepen', summary: 'Kleine groepen rond Koran, basiskennis en Risale-i Nur.', tag: 'Groepen', meta: '4 niveaus' },
      { id: 'academy-youth', title: 'Jongerenactiviteiten', summary: 'Interactieve avonden met gesprek, sport en gezamenlijke projecten.', tag: 'Jongeren', meta: '12–18 jaar' },
    ]),
    section('evenementen', 'Evenementen', 'Lezingen, cursussen en seizoensprogramma’s op één plek.', 'Ontmoet & verdiep', [
      { id: 'event-faith', title: 'Lezing: geloof in een snelle wereld', summary: 'Een avond over aandacht, twijfel en spirituele rust.', tag: 'Lezing', meta: 'Vrijdag 19:30' },
      { id: 'event-course', title: 'Basiscursus islam', summary: 'Vier interactieve bijeenkomsten voor beginners en herstarters.', tag: 'Cursus', meta: '4 weken' },
      { id: 'event-ramadan', title: 'Ramadanprogramma', summary: 'Dagelijkse reflecties, gezamenlijke iftar en activiteiten voor gezinnen.', tag: 'Seizoen', meta: 'Ramadan' },
    ]),
    section('bibliotheek', 'Bibliotheek', 'Aanbevolen boeken in het Nederlands, Turks en Engels.', 'Lees verder', [
      { id: 'library-risale', title: 'Risale-i Nur catalogus', summary: 'Bibliografische metadata en leesroutes; volledige teksten alleen met toestemming.', tag: 'Collectie', meta: 'Metadata' },
      { id: 'library-foundations', title: 'Islamitische basiswerken', summary: 'Een gecureerde startlijst rond geloofsleer, fiqh, spiritualiteit en geschiedenis.', tag: 'Boekenlijst', meta: '18 titels' },
      { id: 'library-children', title: 'Kinderboeken', summary: 'Leeftijdsgerichte boeken over profeten, karakter en islamitische feestdagen.', tag: 'Kinderen', meta: '12 titels' },
    ]),
  ],
  tr: [
    section('risale', 'Risale-i Nur Hakkında', 'Külliyatın amacı, tarihi bağlamı ve temel iman meselelerine erişilebilir bir giriş.', 'Miras ve tefekkür', [
      { id: 'risale-intro', title: 'Risale-i Nur nedir?', summary: 'Külliyatın yapısı, hedefleri ve ana temaları hakkında özgün bir özet.', tag: 'Giriş', meta: '8 dk', source: 'Editoryal özet' },
      { id: 'nursi-life', title: 'Bediüzzaman Said Nursî', summary: 'Tarihî bağlam ve ileri okuma kaynaklarıyla kısa bir hayat kronolojisi.', tag: 'Biyografi', meta: '12 dk', source: 'Biyografik metadata' },
      { id: 'risale-why', title: 'Neden yazıldı?', summary: 'İman, modernite, şüphe ve manevî derinliğin eserde nasıl buluştuğu.', tag: 'Bağlam', meta: '10 dk', source: 'Editoryal özet' },
    ]),
    section('basiskennis', 'Temel İslam Bilgisi', 'İman, ibadet ve ahlak üzerine anlaşılır öğrenme yolları.', 'Temelden başla', [
      { id: 'six-pillars', title: 'İmanın altı şartı', summary: 'Allah, melekler, kitaplar, peygamberler, ahiret ve kader.', tag: 'Akaid', meta: '6 ders' },
      { id: 'five-pillars', title: 'İslam’ın beş şartı', summary: 'Şehadet, namaz, zekât, oruç ve hac hakkında pratik bir çerçeve.', tag: 'İbadet', meta: '5 ders' },
      { id: 'adab', title: 'Günlük hayatta edep', summary: 'Evde, okulda, işte ve dijital dünyada İslamî davranış ilkeleri.', tag: 'Ahlak', meta: '7 ders' },
    ]),
    section('koran', 'Kur’an', 'Günün ayeti, tematik yollar ve kaynaklı açıklamalar.', 'Oku ve düşün', [
      { id: 'quran-mercy', title: 'Merhamet teması', summary: 'Ümit, bağışlanma ve sorumluluk ayetleri arasında tematik bir yolculuk.', tag: 'Tema', meta: '9 referans', source: 'Ayet referansları; özgün açıklama' },
      { id: 'quran-patience', title: 'Sabır ve sebat', summary: 'Kayıp, emek ve ahlakî tercihlerde sabrın anlamı.', tag: 'Tefsir', meta: '7 referans', source: 'Ayet referansları; özgün açıklama' },
      { id: 'quran-search', title: 'Konuya göre ara', summary: 'Namaz, aile, ilim, yaratılış ve adalet gibi demo konularını keşfet.', tag: 'İndeks', meta: '24 konu' },
    ]),
    section('hadith', 'Hadis', 'Kaynak, numara, sıhhat bilgisi ve açıklamayla tematik seçkiler.', 'Nebevi hikmet', [
      { id: 'hadith-intention', title: 'Niyet ve ihlas', summary: 'Niyet, sorumluluk ve amellerin değeri üzerine bir öğrenme kartı.', tag: 'Ahlak', meta: '4 kaynak', source: 'Koleksiyon referansları; özgün açıklama' },
      { id: 'hadith-kindness', title: 'Rıfk ve merhamet', summary: 'Ailede, toplumda ve ihtilafta yumuşaklığın gücü.', tag: 'Edep', meta: '5 kaynak', source: 'Koleksiyon referansları; özgün açıklama' },
      { id: 'hadith-knowledge', title: 'İlim talebi', summary: 'Öğrenmenin tevazu, güvenilirlik ve amelle ilişkisi.', tag: 'İlim', meta: '6 kaynak', source: 'Koleksiyon referansları; özgün açıklama' },
    ]),
    section('vragen', 'Sorular ve cevaplar', 'Büyük ve günlük iman sorularına sakin, kaynak odaklı cevaplar.', 'Rahatça sor', [
      { id: 'qa-existence', title: 'Allah var mı?', summary: 'Düzen, bağımlılık, anlam ve klasik iman delillerine giriş.', tag: 'İman', meta: '10 dk' },
      { id: 'qa-prayer', title: 'Neden namaz?', summary: 'Bağ, ritim, şükür ve iç disiplin olarak namaz.', tag: 'Namaz', meta: '7 dk' },
      { id: 'qa-suffering', title: 'İnsanlar neden acı çeker?', summary: 'İmtihan, irade, merhamet ve ahiret hakkında dikkatli bir değerlendirme.', tag: 'Anlam', meta: '12 dk' },
    ]),
    section('artikelen', 'Makaleler', 'İman, aile, eğitim, iş ve toplum üzerine düşünceler.', 'Oku ve düşün', [
      { id: 'article-family', title: 'İmanın büyüdüğü bir ev', summary: 'Ailede dikkat, sohbet ve örneklik için pratik alışkanlıklar.', tag: 'Aile', meta: '7 dk' },
      { id: 'article-work', title: 'İş hayatında ihsan', summary: 'Meslek ahlakında ustalık, dürüstlük ve hizmet.', tag: 'İş', meta: '6 dk' },
      { id: 'article-youth', title: 'Gençlerin sorularına alan açmak', summary: 'Dinlemek ve güvenmek daha güçlü bir eğitim ortamı nasıl kurar?', tag: 'Eğitim', meta: '9 dk' },
    ]),
    section('media', 'Video ve podcast', 'Dersler, kısa anlatımlar ve soru-cevap serileri.', 'İzle ve dinle', [
      { id: 'media-risale', title: '10 dakikada Risale', summary: 'Bağlam, kavramlar ve okuma yolları üzerine kısa video serisi.', tag: 'Video serisi', meta: '6 bölüm' },
      { id: 'media-qa', title: 'Gençler soruyor', summary: 'İman, kimlik, eğitim ve sosyal medya üzerine podcast.', tag: 'Podcast', meta: '8 bölüm' },
      { id: 'media-tafsir', title: 'Tefsir notları', summary: 'Seçili ayetler üzerine kaynaklı kısa tefekkürler.', tag: 'Ses', meta: '12 bölüm' },
    ]),
    section('medrese', 'Medrese', 'Çocuklar, gençler ve yetişkinler için ders ve çalışma grupları.', 'Birlikte öğren', [
      { id: 'academy-schedule', title: 'Ders programı', summary: 'Haftalık dersleri, seviyeleri ve kontenjanları görüntüle.', tag: 'Program', meta: 'Haftalık' },
      { id: 'academy-groups', title: 'Okuma grupları', summary: 'Kur’an, temel bilgiler ve Risale-i Nur etrafında küçük gruplar.', tag: 'Gruplar', meta: '4 seviye' },
      { id: 'academy-youth', title: 'Gençlik faaliyetleri', summary: 'Sohbet, spor ve ortak projelerle etkileşimli akşamlar.', tag: 'Gençlik', meta: '12–18 yaş' },
    ]),
    section('evenementen', 'Etkinlikler', 'Seminerler, kurslar ve mevsimlik programlar.', 'Buluş ve derinleş', [
      { id: 'event-faith', title: 'Seminer: hızlı dünyada iman', summary: 'Dikkat, şüphe ve manevî sükûnet üzerine bir akşam.', tag: 'Seminer', meta: 'Cuma 19:30' },
      { id: 'event-course', title: 'Temel İslam kursu', summary: 'Yeni başlayanlar için dört interaktif buluşma.', tag: 'Kurs', meta: '4 hafta' },
      { id: 'event-ramadan', title: 'Ramazan programı', summary: 'Günlük tefekkür, ortak iftar ve aile faaliyetleri.', tag: 'Mevsim', meta: 'Ramazan' },
    ]),
    section('bibliotheek', 'Kütüphane', 'Türkçe, Hollandaca ve İngilizce seçilmiş kitaplar.', 'Okumaya devam et', [
      { id: 'library-risale', title: 'Risale-i Nur kataloğu', summary: 'Bibliyografik bilgiler ve okuma yolları; tam metinler yalnızca izinle.', tag: 'Külliyat', meta: 'Metadata' },
      { id: 'library-foundations', title: 'Temel İslam eserleri', summary: 'Akaid, fıkıh, maneviyat ve tarih için başlangıç listesi.', tag: 'Kitap listesi', meta: '18 kitap' },
      { id: 'library-children', title: 'Çocuk kitapları', summary: 'Peygamberler, ahlak ve bayramlar hakkında yaşa uygun eserler.', tag: 'Çocuk', meta: '12 kitap' },
    ]),
  ],
  en: [
    section('risale', 'About the Risale-i Nur', 'An accessible introduction to the work, its context and its central questions of faith.', 'Legacy & reflection', [
      { id: 'risale-intro', title: 'What is the Risale-i Nur?', summary: 'An original overview of the collection’s structure, purpose and core themes.', tag: 'Introduction', meta: '8 min', source: 'Editorial summary' },
      { id: 'nursi-life', title: 'Bediüzzaman Said Nursî', summary: 'A concise biographical timeline with historical context and further-reading references.', tag: 'Biography', meta: '12 min', source: 'Biographical metadata' },
      { id: 'risale-why', title: 'Why was it written?', summary: 'How faith, modernity, doubt and spiritual depth meet in the work.', tag: 'Context', meta: '10 min', source: 'Editorial summary' },
    ]),
    section('basiskennis', 'Islamic foundations', 'Clear learning paths covering belief, worship and character.', 'Start with the essentials', [
      { id: 'six-pillars', title: 'The six pillars of faith', summary: 'Allah, angels, books, messengers, the Last Day and divine decree.', tag: 'Aqeedah', meta: '6 lessons' },
      { id: 'five-pillars', title: 'The five pillars of Islam', summary: 'A practical overview of testimony, prayer, zakat, fasting and pilgrimage.', tag: 'Practice', meta: '5 lessons' },
      { id: 'adab', title: 'Adab in daily life', summary: 'Islamic manners at home, school, work and online.', tag: 'Character', meta: '7 lessons' },
    ]),
    section('koran', 'Quran', 'Daily verses, thematic pathways and reliable explanation with citations.', 'Read & reflect', [
      { id: 'quran-mercy', title: 'Mercy as a theme', summary: 'A thematic route through references on hope, forgiveness and responsibility.', tag: 'Theme', meta: '9 references', source: 'Quran references; original paraphrase' },
      { id: 'quran-patience', title: 'Patience and steadfastness', summary: 'What sabr means in loss, effort and moral choice.', tag: 'Tafsir', meta: '7 references', source: 'Quran references; original paraphrase' },
      { id: 'quran-search', title: 'Search by topic', summary: 'Explore demo topics including prayer, family, knowledge, creation and justice.', tag: 'Index', meta: '24 topics' },
    ]),
    section('hadith', 'Hadith', 'Thematic selections with collection, numbering, grading and explanation.', 'Prophetic wisdom', [
      { id: 'hadith-intention', title: 'Intention and sincerity', summary: 'A learning card on niyyah, responsibility and the value of actions.', tag: 'Character', meta: '4 sources', source: 'Collection references; original paraphrase' },
      { id: 'hadith-kindness', title: 'Gentleness and mercy', summary: 'Kindness as strength in family, community and disagreement.', tag: 'Adab', meta: '5 sources', source: 'Collection references; original paraphrase' },
      { id: 'hadith-knowledge', title: 'Seeking knowledge', summary: 'Why learning belongs with humility, trustworthiness and action.', tag: 'Knowledge', meta: '6 sources', source: 'Collection references; original paraphrase' },
    ]),
    section('vragen', 'Questions & answers', 'Calm, source-aware responses to major and everyday questions of faith.', 'Ask freely', [
      { id: 'qa-existence', title: 'Does Allah exist?', summary: 'An introduction to order, dependence, meaning and classical arguments for belief.', tag: 'Faith', meta: '10 min' },
      { id: 'qa-prayer', title: 'Why pray?', summary: 'Prayer as connection, rhythm, gratitude and inner discipline.', tag: 'Prayer', meta: '7 min' },
      { id: 'qa-suffering', title: 'Why do people suffer?', summary: 'A careful exploration of trial, free will, compassion and the hereafter.', tag: 'Meaning', meta: '12 min' },
    ]),
    section('artikelen', 'Articles', 'Reflections on faith, family, education, work and society.', 'Read & reflect', [
      { id: 'article-family', title: 'A home where faith can grow', summary: 'Practical habits for attention, conversation and leading by example.', tag: 'Family', meta: '7 min' },
      { id: 'article-work', title: 'Ihsan at work', summary: 'Craft, honesty and service as elements of professional character.', tag: 'Work', meta: '6 min' },
      { id: 'article-youth', title: 'Making room for young people’s questions', summary: 'How listening and trust create stronger faith education.', tag: 'Education', meta: '9 min' },
    ]),
    section('media', 'Videos & podcasts', 'Lectures, concise explainers and conversations organised by series.', 'Watch & listen', [
      { id: 'media-risale', title: 'Risale in 10 minutes', summary: 'A short video series covering context, concepts and reading routes.', tag: 'Video series', meta: '6 episodes' },
      { id: 'media-qa', title: 'Young people ask', summary: 'A podcast format about faith, identity, study and social media.', tag: 'Podcast', meta: '8 episodes' },
      { id: 'media-tafsir', title: 'Tafsir notes', summary: 'Short reflections on selected verses with transparent references.', tag: 'Audio', meta: '12 episodes' },
    ]),
    section('medrese', 'Medrese', 'Lessons, study groups and activities for children, young people and adults.', 'Learn together', [
      { id: 'academy-schedule', title: 'Class schedule', summary: 'View weekly lessons, levels and available places.', tag: 'Schedule', meta: 'Weekly' },
      { id: 'academy-groups', title: 'Study groups', summary: 'Small groups around Quran, Islamic foundations and Risale-i Nur.', tag: 'Groups', meta: '4 levels' },
      { id: 'academy-youth', title: 'Youth activities', summary: 'Interactive evenings combining conversation, sport and shared projects.', tag: 'Youth', meta: 'Ages 12–18' },
    ]),
    section('evenementen', 'Events', 'Lectures, courses and seasonal programmes in one place.', 'Meet & deepen', [
      { id: 'event-faith', title: 'Lecture: faith in a fast world', summary: 'An evening about attention, doubt and spiritual calm.', tag: 'Lecture', meta: 'Friday 19:30' },
      { id: 'event-course', title: 'Islamic foundations course', summary: 'Four interactive sessions for beginners and returners.', tag: 'Course', meta: '4 weeks' },
      { id: 'event-ramadan', title: 'Ramadan programme', summary: 'Daily reflections, community iftar and activities for families.', tag: 'Seasonal', meta: 'Ramadan' },
    ]),
    section('bibliotheek', 'Library', 'Recommended reading in Dutch, Turkish and English.', 'Keep reading', [
      { id: 'library-risale', title: 'Risale-i Nur catalogue', summary: 'Bibliographic metadata and reading paths; full texts only with permission.', tag: 'Collection', meta: 'Metadata' },
      { id: 'library-foundations', title: 'Islamic foundation texts', summary: 'A curated starter list covering creed, fiqh, spirituality and history.', tag: 'Book list', meta: '18 titles' },
      { id: 'library-children', title: 'Children’s books', summary: 'Age-appropriate titles about prophets, character and Islamic celebrations.', tag: 'Children', meta: '12 titles' },
    ]),
  ],
};

export const medreseCopy: Record<MedreseLang, MedreseCopy> = {
  nl: {
    siteName: 'Medrese',
    demoLabel: 'Educatief platform · Demo',
    nav: { home: 'Home', learn: 'Leren', activities: 'Activiteiten', library: 'Bibliotheek', contact: 'Contact', search: 'Zoeken', openMenu: 'Menu openen' },
    hero: {
      eyebrow: 'Kennis die hart en verstand verbindt',
      title: 'Leren met',
      accent: 'richting.',
      body: 'Een rustige digitale medrese voor geloofskennis, verdieping en gemeenschap — toegankelijk voor elke nieuwe stap.',
      primary: 'Begin met leren',
      secondary: 'Bekijk het lesrooster',
    },
    daily: {
      label: 'Dagelijkse reflectie',
      ayahTitle: 'De Koran over draagkracht',
      ayahText: 'Een mens wordt niet belast boven zijn vermogen; verantwoordelijkheid en goddelijke barmhartigheid gaan samen.',
      ayahSource: 'Koran 2:286 · redactionele parafrase',
      hadithTitle: 'Over intentie',
      hadithText: 'De waarde van een handeling hangt samen met de bedoeling waarmee zij wordt verricht.',
      hadithSource: 'Sahih al-Bukhari 1 · redactionele parafrase',
      disclaimer: 'Parafrases voor deze demo; raadpleeg een erkende vertaling en geleerde voor studie.',
    },
    sections: { eyebrow: 'Ontdek de medrese', title: 'Eén plek om te leren, vragen en groeien.', body: 'Van de basis van het geloof tot verdiepende leesroutes, lessen en ontmoetingen.', view: 'Open onderdeel' },
    mission: {
      eyebrow: 'Onze missie',
      title: 'Betrouwbare kennis, menselijk uitgelegd.',
      body: 'Deze demo laat zien hoe een moderne medrese kennis zorgvuldig kan ordenen zonder de warmte van ontmoeting te verliezen.',
      values: [
        { title: 'Bronbewust', body: 'Elke uitleg verwijst transparant naar de gebruikte bron of redactionele samenvatting.' },
        { title: 'Toegankelijk', body: 'Heldere leerpaden voor beginners, jongeren, gezinnen en gevorderde lezers.' },
        { title: 'Verbonden', body: 'Digitale kennis leidt door naar lessen, studiegroepen en lokale activiteiten.' },
      ],
    },
    schedule: {
      eyebrow: 'Deze week',
      title: 'Lesrooster',
      body: 'Voorbeeldprogramma voor de demo-locatie Medrese Centrum.',
      rows: [
        { day: 'Dinsdag', time: '19:00', activity: 'Islamitische basiskennis', audience: 'Volwassenen' },
        { day: 'Woensdag', time: '16:30', activity: 'Koran & adab', audience: 'Kinderen 8–12' },
        { day: 'Vrijdag', time: '20:00', activity: 'Risale-i Nur leeskring', audience: 'Open groep' },
        { day: 'Zaterdag', time: '14:00', activity: 'Jongerenatelier', audience: '12–18 jaar' },
      ],
    },
    prayer: { label: 'Gebedstijden', city: 'Demostad · voorbeeldtijden', names: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], times: ['04:12', '13:42', '17:58', '21:47', '23:18'], note: 'Demo — verbind later een betrouwbare lokale gebedstijdenbron.' },
    events: {
      eyebrow: 'Komende activiteiten',
      title: 'Leren gebeurt ook samen.',
      items: [
        { day: '18', month: 'SEP', title: 'Open avond: kennismaken met de medrese', meta: '19:30 · Medrese Centrum' },
        { day: '26', month: 'SEP', title: 'Lezing: geloof en wetenschap', meta: '20:00 · Grote zaal' },
        { day: '04', month: 'OKT', title: 'Familiedag & kinderprogramma', meta: '13:00 · Hele gebouw' },
      ],
    },
    ai: {
      eyebrow: 'Brongebonden AI-demo',
      title: 'Stel een vraag, zie de bronnen.',
      body: 'Een voorproef van zoeken door betrouwbare, toegestane bronnen. Deze demo gebruikt vooraf geschreven antwoorden en is geen fatwa-dienst.',
      placeholder: 'Bijvoorbeeld: waarom bidden moslims?',
      suggestions: ['Waarom bidden?', 'Wat is tawakkul?', 'Wat is de Risale-i Nur?'],
      answerTitle: 'Voorbeeldantwoord',
      answer: 'Het gebed geeft de dag ritme en richt aandacht, dankbaarheid en afhankelijkheid bewust op Allah. In de islamitische traditie is het zowel aanbidding als een terugkerend moment van innerlijke heroriëntatie.',
      source: 'Bronnen: Koran 20:14 · Islamitische basiskennis / Gebed',
      disclaimer: 'Demoantwoord · controleer religieuze vragen altijd bij gekwalificeerde geleerden.',
    },
    newsletter: { title: 'Blijf leren.', body: 'Ontvang nieuwe artikelen, lessen en activiteiten in je inbox.', placeholder: 'jouw@email.nl', button: 'Aanmelden', success: 'Bedankt — dit is een demo-inschrijving.' },
    footer: 'Medrese is een Empyr-conceptdemo. Religieuze inhoud is samengevat en bedoeld voor productdemonstratie.',
    backHome: 'Terug naar Medrese',
    page: { read: 'Open les', save: 'Bewaar', saved: 'Bewaard', source: 'Bron', rights: 'Volledige teksten, audio en PDF’s worden alleen aangeboden met toestemming van rechthebbenden.', empty: 'Geen resultaten gevonden.' },
  },
  tr: {
    siteName: 'Medrese',
    demoLabel: 'Eğitim platformu · Demo',
    nav: { home: 'Ana sayfa', learn: 'Öğren', activities: 'Etkinlikler', library: 'Kütüphane', contact: 'İletişim', search: 'Ara', openMenu: 'Menüyü aç' },
    hero: {
      eyebrow: 'Kalbi ve aklı buluşturan bilgi',
      title: 'Yön veren',
      accent: 'bir öğrenme.',
      body: 'İman bilgisi, tefekkür ve topluluk için sakin bir dijital medrese — her yeni adıma açık.',
      primary: 'Öğrenmeye başla',
      secondary: 'Ders programı',
    },
    daily: {
      label: 'Günün tefekkürü',
      ayahTitle: 'Kur’an’da sorumluluk',
      ayahText: 'İnsana gücünün üzerinde yük yüklenmez; sorumluluk ilahî rahmetle birlikte düşünülür.',
      ayahSource: 'Kur’an 2:286 · editoryal açıklama',
      hadithTitle: 'Niyet hakkında',
      hadithText: 'Bir amelin değeri, onun hangi niyetle yapıldığıyla yakından ilişkilidir.',
      hadithSource: 'Sahih al-Bukhari 1 · editoryal açıklama',
      disclaimer: 'Demo için özgün açıklamalar; çalışma için güvenilir tercüme ve hocalara başvurun.',
    },
    sections: { eyebrow: 'Medreseyi keşfet', title: 'Öğrenmek, sormak ve gelişmek için tek yer.', body: 'İmanın temellerinden derin okuma yollarına, derslere ve buluşmalara.', view: 'Bölümü aç' },
    mission: {
      eyebrow: 'Misyonumuz',
      title: 'Güvenilir bilgi, insanca anlatım.',
      body: 'Bu demo, modern bir medresenin bilgiyi özenle düzenlerken buluşmanın sıcaklığını nasıl koruyabileceğini gösterir.',
      values: [
        { title: 'Kaynak odaklı', body: 'Her açıklama kullanılan kaynağı veya editoryal özeti açıkça belirtir.' },
        { title: 'Erişilebilir', body: 'Yeni başlayanlar, gençler, aileler ve ileri okuyucular için açık yollar.' },
        { title: 'Bağ kuran', body: 'Dijital bilgi derslere, okuma gruplarına ve yerel faaliyetlere açılır.' },
      ],
    },
    schedule: {
      eyebrow: 'Bu hafta',
      title: 'Ders programı',
      body: 'Medrese Merkezi demo konumu için örnek program.',
      rows: [
        { day: 'Salı', time: '19:00', activity: 'Temel İslam bilgisi', audience: 'Yetişkinler' },
        { day: 'Çarşamba', time: '16:30', activity: 'Kur’an ve edep', audience: '8–12 yaş' },
        { day: 'Cuma', time: '20:00', activity: 'Risale-i Nur okuma grubu', audience: 'Açık grup' },
        { day: 'Cumartesi', time: '14:00', activity: 'Gençlik atölyesi', audience: '12–18 yaş' },
      ],
    },
    prayer: { label: 'Namaz vakitleri', city: 'Demo Şehir · örnek vakitler', names: ['İmsak', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'], times: ['04:12', '13:42', '17:58', '21:47', '23:18'], note: 'Demo — daha sonra güvenilir yerel vakit kaynağı bağlanmalıdır.' },
    events: {
      eyebrow: 'Yaklaşan etkinlikler',
      title: 'Öğrenmek birlikte güzeldir.',
      items: [
        { day: '18', month: 'EYL', title: 'Açık akşam: medreseyle tanışma', meta: '19:30 · Medrese Merkezi' },
        { day: '26', month: 'EYL', title: 'Seminer: iman ve bilim', meta: '20:00 · Büyük salon' },
        { day: '04', month: 'EKİ', title: 'Aile günü ve çocuk programı', meta: '13:00 · Tüm bina' },
      ],
    },
    ai: {
      eyebrow: 'Kaynaklı AI demosu',
      title: 'Sorunu sor, kaynakları gör.',
      body: 'Güvenilir ve izinli kaynaklarda aramanın bir ön gösterimi. Önceden yazılmış cevaplar kullanır; fetva hizmeti değildir.',
      placeholder: 'Örneğin: Müslümanlar neden namaz kılar?',
      suggestions: ['Neden namaz?', 'Tevekkül nedir?', 'Risale-i Nur nedir?'],
      answerTitle: 'Örnek cevap',
      answer: 'Namaz güne ritim kazandırır; dikkati, şükrü ve Allah’a kulluk bilincini düzenli olarak yeniler. İslam geleneğinde hem ibadet hem de iç yöneliş anıdır.',
      source: 'Kaynaklar: Kur’an 20:14 · Temel İslam bilgisi / Namaz',
      disclaimer: 'Demo cevabı · dinî soruları ehil hocalarla teyit edin.',
    },
    newsletter: { title: 'Öğrenmeye devam et.', body: 'Yeni yazıları, dersleri ve etkinlikleri e-postayla al.', placeholder: 'eposta@adresin.nl', button: 'Kayıt ol', success: 'Teşekkürler — bu bir demo kaydıdır.' },
    footer: 'Medrese bir Empyr konsept demosudur. Dinî içerik özetlenmiş ve ürün tanıtımı amacıyla hazırlanmıştır.',
    backHome: 'Medreseye dön',
    page: { read: 'Dersi aç', save: 'Kaydet', saved: 'Kaydedildi', source: 'Kaynak', rights: 'Tam metinler, sesler ve PDF’ler yalnızca hak sahiplerinin izniyle sunulur.', empty: 'Sonuç bulunamadı.' },
  },
  en: {
    siteName: 'Medrese',
    demoLabel: 'Learning platform · Demo',
    nav: { home: 'Home', learn: 'Learn', activities: 'Activities', library: 'Library', contact: 'Contact', search: 'Search', openMenu: 'Open menu' },
    hero: {
      eyebrow: 'Knowledge that connects heart and mind',
      title: 'Learning with',
      accent: 'direction.',
      body: 'A calm digital medrese for faith, reflection and community — accessible at every new step.',
      primary: 'Start learning',
      secondary: 'View the schedule',
    },
    daily: {
      label: 'Daily reflection',
      ayahTitle: 'The Quran on capacity',
      ayahText: 'A person is not burdened beyond their capacity; responsibility and divine mercy belong together.',
      ayahSource: 'Quran 2:286 · editorial paraphrase',
      hadithTitle: 'On intention',
      hadithText: 'The value of an action is closely connected to the intention with which it is performed.',
      hadithSource: 'Sahih al-Bukhari 1 · editorial paraphrase',
      disclaimer: 'Original paraphrases for this demo; consult a recognised translation and scholar for study.',
    },
    sections: { eyebrow: 'Explore the medrese', title: 'One place to learn, ask and grow.', body: 'From foundations of faith to deeper reading paths, classes and gatherings.', view: 'Open section' },
    mission: {
      eyebrow: 'Our mission',
      title: 'Reliable knowledge, explained with care.',
      body: 'This demo shows how a modern medrese can organise knowledge carefully without losing the warmth of meeting.',
      values: [
        { title: 'Source-aware', body: 'Every explanation transparently identifies its source or editorial summary.' },
        { title: 'Accessible', body: 'Clear learning paths for beginners, young people, families and advanced readers.' },
        { title: 'Connected', body: 'Digital knowledge leads into classes, study groups and local activities.' },
      ],
    },
    schedule: {
      eyebrow: 'This week',
      title: 'Class schedule',
      body: 'Sample programme for the fictional Medrese Centre location.',
      rows: [
        { day: 'Tuesday', time: '19:00', activity: 'Islamic foundations', audience: 'Adults' },
        { day: 'Wednesday', time: '16:30', activity: 'Quran & adab', audience: 'Children 8–12' },
        { day: 'Friday', time: '20:00', activity: 'Risale-i Nur study circle', audience: 'Open group' },
        { day: 'Saturday', time: '14:00', activity: 'Youth studio', audience: 'Ages 12–18' },
      ],
    },
    prayer: { label: 'Prayer times', city: 'Demo City · sample times', names: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], times: ['04:12', '13:42', '17:58', '21:47', '23:18'], note: 'Demo — connect a trusted local prayer-time source later.' },
    events: {
      eyebrow: 'Upcoming activities',
      title: 'Learning also happens together.',
      items: [
        { day: '18', month: 'SEP', title: 'Open evening: meet the medrese', meta: '19:30 · Medrese Centre' },
        { day: '26', month: 'SEP', title: 'Lecture: faith and science', meta: '20:00 · Main hall' },
        { day: '04', month: 'OCT', title: 'Family day & children’s programme', meta: '13:00 · Full building' },
      ],
    },
    ai: {
      eyebrow: 'Source-grounded AI demo',
      title: 'Ask a question, see the sources.',
      body: 'A preview of searching trusted, permitted sources. This demo uses prewritten answers and is not a fatwa service.',
      placeholder: 'For example: why do Muslims pray?',
      suggestions: ['Why pray?', 'What is tawakkul?', 'What is the Risale-i Nur?'],
      answerTitle: 'Sample answer',
      answer: 'Prayer gives the day rhythm and repeatedly directs attention, gratitude and dependence toward Allah. In Islamic tradition it is both worship and a recurring moment of inner reorientation.',
      source: 'Sources: Quran 20:14 · Islamic foundations / Prayer',
      disclaimer: 'Demo answer · always verify religious questions with qualified scholars.',
    },
    newsletter: { title: 'Keep learning.', body: 'Receive new articles, lessons and activities in your inbox.', placeholder: 'your@email.com', button: 'Subscribe', success: 'Thank you — this is a demo subscription.' },
    footer: 'Medrese is an Empyr concept demo. Religious content is summarised and intended for product demonstration.',
    backHome: 'Back to Medrese',
    page: { read: 'Open lesson', save: 'Save', saved: 'Saved', source: 'Source', rights: 'Full texts, audio and PDFs are only offered with permission from rights holders.', empty: 'No results found.' },
  },
};

export function isMedreseLang(value: string | undefined): value is MedreseLang {
  return !!value && medreseLanguages.includes(value as MedreseLang);
}

export function getMedreseSection(lang: MedreseLang, slug: string): MedreseSection | undefined {
  return medreseSections[lang].find((entry) => entry.slug === slug);
}

export function getMedreseSearchIndex(lang: MedreseLang) {
  return medreseSections[lang].flatMap((sectionEntry) =>
    sectionEntry.items.map((item) => ({
      ...item,
      section: sectionEntry.title,
      href: `/${lang}/medrese/${sectionEntry.slug}/#${item.id}`,
    }))
  );
}
*/
