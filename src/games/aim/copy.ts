import type { ScenarioId } from './scenarios';

export type Lang = 'nl' | 'en';

interface ScenarioCopy {
  name: string;
  tag: string;
  desc: string;
  hint: string;
}

export interface Copy {
  brand: string;
  tagline: string;
  back: string;

  tabs: { drills: string; sens: string; crosshair: string; target: string; history: string };

  scenarios: Record<ScenarioId, ScenarioCopy>;
  customDrillFallback: string;

  setup: string;
  duration: string;
  custom: string;
  seconds: string;
  targetSize: string;
  targetCount: string;
  spawnArea: string;
  targetSpeed: string;
  directionChange: string;
  degrees: string;
  reset: string;
  start: string;
  quickStart: string;

  myDrills: string;
  noCustomDrills: string;
  newDrill: string;
  createDrill: string;
  exportAll: string;
  importDrills: string;
  importedCount: string;
  importNone: string;
  rename: string;
  duplicate: string;
  deleteDrill: string;
  confirmDelete: string;
  exportDrill: string;
  modeClick: string;
  modeTrack: string;
  modeSpray: string;

  sensTitle: string;
  sensSub: string;
  sourceGame: string;
  inGameSens: string;
  mouseDpi: string;
  fov: string;
  invertY: string;
  edpi: string;
  cm360: string;
  in360: string;
  degPerCount: string;
  countsPer360: string;
  workingTitle: string;
  workingSub: string;
  tableTitle: string;
  tableSub: string;
  colGame: string;
  colYaw: string;
  colSens: string;
  colEdpi: string;
  colCm: string;
  colIn: string;
  matchCm: string;
  matchCmSub: string;
  apply: string;

  crossTitle: string;
  crossSub: string;
  colour: string;
  thickness: string;
  gap: string;
  length: string;
  centreDot: string;
  outline: string;
  preview: string;

  audioTitle: string;
  audioSub: string;
  soundEnabled: string;
  volume: string;

  targetTitle: string;
  targetSub: string;
  targetShape: string;
  shapeCircle: string;
  shapeSquare: string;
  shapeDiamond: string;
  shapeHexagon: string;

  rankTitle: string;
  rankDisclaimer: string;
  rankToNext: string;
  rankMaxed: string;

  historyTitle: string;
  historySub: string;
  noHistory: string;
  clearHistory: string;
  pb: string;
  avg5: string;

  armTitle: string;
  armSub: string;
  armButton: string;
  armFallback: string;
  lockLostTitle: string;
  lockLostSub: string;
  resume: string;
  quit: string;
  lockFailTitle: string;
  lockFailSub: string;
  fallbackOn: string;
  fallbackBadge: string;

  hudScore: string;
  hudAcc: string;
  hudTime: string;
  hudHits: string;
  hudOnTarget: string;
  hudAmmo: string;

  resultTitle: string;
  again: string;
  toMenu: string;
  newPb: string;
  score: string;
  accuracy: string;
  hits: string;
  misses: string;
  shots: string;
  kills: string;
  kps: string;
  avgTtk: string;
  medTtk: string;
  reaction: string;
  overshoot: string;
  undershoot: string;
  overshootRate: string;
  onTargetPct: string;
  sprayGroup: string;
  scatterTitle: string;
  scatterSub: string;
  ttkTitle: string;
  ttkSub: string;
  timelineTitle: string;
  timelineSub: string;
  compareTitle: string;
  compareSub: string;
  thisRun: string;
  noData: string;
  hit: string;
  miss: string;
  radii: string;
}

const scenariosEn: Record<ScenarioId, ScenarioCopy> = {
  gridshot: {
    name: 'Gridshot',
    tag: 'Static · click speed',
    desc: 'A wall of static targets. Clear them as fast as you can; every kill respawns somewhere new.',
    hint: 'Left click to shoot.',
  },
  flick: {
    name: 'Flick',
    tag: 'One-shot · snap',
    desc: 'One target at a time, appearing at an unpredictable distance and angle. Snap, fire, reset.',
    hint: 'Left click to shoot. Overshoot is measured on your first shot.',
  },
  tracking: {
    name: 'Smooth tracking',
    tag: 'Hold · time on target',
    desc: 'A target drifting on a smooth path. Hold fire and keep the crosshair buried in it.',
    hint: 'Hold left mouse to beam. Score is time on target.',
  },
  strafe: {
    name: 'Strafe dodge',
    tag: 'Hold · reactive',
    desc: 'Same idea, but the target snaps into a new direction without warning. Reactive tracking.',
    hint: 'Hold left mouse to beam. The target changes direction constantly.',
  },
  micro: {
    name: 'Microshot',
    tag: 'Tiny · precision',
    desc: 'Very small targets in a tight box. Score is weighted by accuracy, so spraying costs you.',
    hint: 'Left click to shoot. Final score is multiplied by your accuracy.',
  },
  switch: {
    name: 'Target switch',
    tag: 'Reaction · discipline',
    desc: 'Several targets, only one lit. Hit the lit one; hitting a dark one counts as a miss.',
    hint: 'Left click the highlighted target only.',
  },
  spray: {
    name: 'Spray control',
    tag: 'Recoil · grouping',
    desc: 'A 25-round rifle pattern kicks your aim up and sideways. Pull against it and keep the group tight.',
    hint: 'Hold left mouse to spray the magazine. Release to reset.',
  },
};

const scenariosNl: Record<ScenarioId, ScenarioCopy> = {
  gridshot: {
    name: 'Gridshot',
    tag: 'Statisch · kliksnelheid',
    desc: 'Een muur van stilstaande doelen. Ruim ze zo snel mogelijk op; elke kill spawnt ergens nieuw.',
    hint: 'Linkermuisknop om te schieten.',
  },
  flick: {
    name: 'Flick',
    tag: 'Eén schot · snap',
    desc: 'Eén doel tegelijk, op een onvoorspelbare afstand en hoek. Snappen, schieten, opnieuw.',
    hint: 'Linkermuisknop om te schieten. Overshoot wordt op je eerste schot gemeten.',
  },
  tracking: {
    name: 'Vloeiend tracken',
    tag: 'Vasthouden · tijd op doel',
    desc: 'Een doel dat een vloeiende baan aflegt. Houd vast en houd je crosshair erin.',
    hint: 'Houd de linkermuisknop ingedrukt. Je score is tijd op het doel.',
  },
  strafe: {
    name: 'Strafe-ontwijking',
    tag: 'Vasthouden · reactief',
    desc: 'Zelfde idee, maar het doel schiet zonder waarschuwing een andere kant op. Reactief tracken.',
    hint: 'Houd de linkermuisknop ingedrukt. Het doel wisselt continu van richting.',
  },
  micro: {
    name: 'Microshot',
    tag: 'Klein · precisie',
    desc: 'Zeer kleine doelen in een krap vak. De score weegt mee met je accuratesse, dus spammen kost je punten.',
    hint: 'Linkermuisknop om te schieten. De eindscore wordt met je accuratesse vermenigvuldigd.',
  },
  switch: {
    name: 'Doelwissel',
    tag: 'Reactie · discipline',
    desc: 'Meerdere doelen, maar er brandt er maar één. Raak die; een donker doel telt als misser.',
    hint: 'Klik alleen het opgelichte doel aan.',
  },
  spray: {
    name: 'Spraycontrole',
    tag: 'Recoil · groepering',
    desc: 'Een patroon van 25 kogels duwt je vizier omhoog en opzij. Trek ertegenin en houd de groep strak.',
    hint: 'Houd de linkermuisknop ingedrukt voor het hele magazijn. Loslaten reset.',
  },
};

const en: Copy = {
  brand: 'RANGE-07',
  tagline: 'VALORANT aim trainer',
  back: '← Back',
  tabs: { drills: 'Drills', sens: 'Sensitivity', crosshair: 'Crosshair', target: 'Target', history: 'History' },
  scenarios: scenariosEn,
  customDrillFallback: 'Custom drill',

  setup: 'Run setup',
  duration: 'Duration',
  custom: 'Custom',
  seconds: 's',
  targetSize: 'Target size',
  targetCount: 'Targets at once',
  spawnArea: 'Spawn area',
  targetSpeed: 'Target speed',
  directionChange: 'Direction change',
  degrees: '°',
  reset: 'Reset to default',
  start: 'Start drill',
  quickStart: 'Start',

  myDrills: 'My drills',
  noCustomDrills: 'No custom drills yet. Build one below.',
  newDrill: '+ New drill',
  createDrill: 'Create',
  exportAll: 'Export all',
  importDrills: 'Import',
  importedCount: 'Imported {n} drill(s).',
  importNone: 'No valid drills found in that file.',
  rename: 'Rename',
  duplicate: 'Duplicate',
  deleteDrill: 'Delete',
  confirmDelete: 'Click again to confirm',
  exportDrill: 'Export',
  modeClick: 'Click',
  modeTrack: 'Track',
  modeSpray: 'Spray',

  sensTitle: 'Sensitivity',
  sensSub:
    'VALORANT turns the camera 0.07° for every mouse count at sensitivity 1. Everything below is that one constant, rearranged.',
  sourceGame: 'Source game',
  inGameSens: 'In-game sensitivity',
  mouseDpi: 'Mouse DPI',
  fov: 'Horizontal FOV',
  invertY: 'Invert Y axis',
  edpi: 'eDPI',
  cm360: 'cm / 360°',
  in360: 'in / 360°',
  degPerCount: 'Degrees per count',
  countsPer360: 'Counts per 360°',
  workingTitle: 'The working',
  workingSub: 'Every number on this page comes out of these four lines.',
  tableTitle: 'Carry it across games',
  tableSub: 'Same DPI, same cm/360°. Type these straight into the other game.',
  colGame: 'Game',
  colYaw: 'Yaw const',
  colSens: 'Sens',
  colEdpi: 'eDPI',
  colCm: 'cm/360',
  colIn: 'in/360',
  matchCm: 'Or solve for a cm/360°',
  matchCmSub: 'Enter the arc you want and get the VALORANT sensitivity that produces it.',
  apply: 'Apply',

  crossTitle: 'Crosshair',
  crossSub: 'Drawn the VALORANT way: four arms, an optional centre dot, and an outline for contrast.',
  colour: 'Colour',
  thickness: 'Thickness',
  gap: 'Inner gap',
  length: 'Arm length',
  centreDot: 'Centre dot',
  outline: 'Outline',
  preview: 'Preview',

  audioTitle: 'Audio',
  audioSub: 'Short synthesized feedback for shots and personal bests.',
  soundEnabled: 'Sound effects',
  volume: 'Volume',

  targetTitle: 'Target',
  targetSub: 'Shape and colour for every target on the range.',
  targetShape: 'Shape',
  shapeCircle: 'Circle',
  shapeSquare: 'Square',
  shapeDiamond: 'Diamond',
  shapeHexagon: 'Hexagon',

  rankTitle: 'Estimated rank',
  rankDisclaimer: 'A rough VALORANT-style estimate from this run only — not a real rank.',
  rankToNext: '+{n} to {name}',
  rankMaxed: 'Radiant — as good as this estimate gets.',

  historyTitle: 'Run history',
  historySub: 'Stored in this browser only. Nothing leaves your machine.',
  noHistory: 'No runs yet. Finish a drill and it lands here.',
  clearHistory: 'Clear history',
  pb: 'Personal best',
  avg5: 'Last 5 average',

  armTitle: 'Mouse capture',
  armSub: 'The trainer needs pointer lock so your mouse behaves like an FPS instead of a desktop cursor.',
  armButton: 'Click to capture mouse',
  armFallback: 'Use cursor mode instead',
  lockLostTitle: 'Paused',
  lockLostSub: 'Mouse capture was released. The clock is stopped.',
  resume: 'Resume',
  quit: 'Quit run',
  lockFailTitle: 'Pointer lock refused',
  lockFailSub:
    'Your browser would not hand over the mouse. Cursor mode works everywhere — the crosshair follows your pointer instead.',
  fallbackOn: 'Continue in cursor mode',
  fallbackBadge: 'Cursor mode',

  hudScore: 'Score',
  hudAcc: 'Acc',
  hudTime: 'Time',
  hudHits: 'Hits',
  hudOnTarget: 'On target',
  hudAmmo: 'Ammo',

  resultTitle: 'Run report',
  again: 'Run it again',
  toMenu: 'Back to drills',
  newPb: 'New personal best',
  score: 'Score',
  accuracy: 'Accuracy',
  hits: 'Hits',
  misses: 'Misses',
  shots: 'Shots',
  kills: 'Kills',
  kps: 'Kills / sec',
  avgTtk: 'Average TTK',
  medTtk: 'Median TTK',
  reaction: 'Reaction',
  overshoot: 'Avg overshoot',
  undershoot: 'Avg undershoot',
  overshootRate: 'Overshoot rate',
  onTargetPct: 'Time on target',
  sprayGroup: 'Group radius',
  scatterTitle: 'Shot placement',
  scatterSub: 'Every shot relative to the target centre. The ring is the target edge.',
  ttkTitle: 'Time to kill',
  ttkSub: 'How long each target survived.',
  timelineTitle: 'Run timeline',
  timelineSub: 'Score and accuracy across the run.',
  compareTitle: 'Against yourself',
  compareSub: 'This run next to your best and your recent average on this drill.',
  thisRun: 'This run',
  noData: 'Not measured in this drill.',
  hit: 'hit',
  miss: 'miss',
  radii: 'target radii',
};

const nl: Copy = {
  brand: 'RANGE-07',
  tagline: 'VALORANT aim-trainer',
  back: '← Terug',
  tabs: { drills: 'Drills', sens: 'Gevoeligheid', crosshair: 'Crosshair', target: 'Doel', history: 'Historie' },
  scenarios: scenariosNl,
  customDrillFallback: 'Aangepaste drill',

  setup: 'Instellingen',
  duration: 'Duur',
  custom: 'Aangepast',
  seconds: 's',
  targetSize: 'Doelgrootte',
  targetCount: 'Doelen tegelijk',
  spawnArea: 'Spawnvlak',
  targetSpeed: 'Doelsnelheid',
  directionChange: 'Richtingswissel',
  degrees: '°',
  reset: 'Terug naar standaard',
  start: 'Start drill',
  quickStart: 'Start',

  myDrills: 'Mijn drills',
  noCustomDrills: 'Nog geen aangepaste drills. Maak er hieronder een.',
  newDrill: '+ Nieuwe drill',
  createDrill: 'Aanmaken',
  exportAll: 'Alles exporteren',
  importDrills: 'Importeren',
  importedCount: '{n} drill(s) geïmporteerd.',
  importNone: 'Geen geldige drills in dat bestand.',
  rename: 'Hernoemen',
  duplicate: 'Dupliceren',
  deleteDrill: 'Verwijderen',
  confirmDelete: 'Nogmaals klikken om te bevestigen',
  exportDrill: 'Exporteren',
  modeClick: 'Klik',
  modeTrack: 'Track',
  modeSpray: 'Spray',

  sensTitle: 'Gevoeligheid',
  sensSub:
    'VALORANT draait de camera 0,07° per muistelling bij sensitivity 1. Alles hieronder is diezelfde constante, anders opgeschreven.',
  sourceGame: 'Brongame',
  inGameSens: 'Sensitivity in de game',
  mouseDpi: 'Muis-DPI',
  fov: 'Horizontale FOV',
  invertY: 'Y-as omkeren',
  edpi: 'eDPI',
  cm360: 'cm / 360°',
  in360: 'inch / 360°',
  degPerCount: 'Graden per telling',
  countsPer360: 'Tellingen per 360°',
  workingTitle: 'De berekening',
  workingSub: 'Elk getal op deze pagina rolt uit deze vier regels.',
  tableTitle: 'Meenemen naar andere games',
  tableSub: 'Zelfde DPI, zelfde cm/360°. Deze waarden kun je zo overtypen.',
  colGame: 'Game',
  colYaw: 'Yaw-const',
  colSens: 'Sens',
  colEdpi: 'eDPI',
  colCm: 'cm/360',
  colIn: 'inch/360',
  matchCm: 'Of reken terug vanaf cm/360°',
  matchCmSub: 'Vul de gewenste boog in en krijg de VALORANT-sensitivity die dat oplevert.',
  apply: 'Toepassen',

  crossTitle: 'Crosshair',
  crossSub: 'Op z’n VALORANTs: vier armen, een optionele middenstip en een rand voor contrast.',
  colour: 'Kleur',
  thickness: 'Dikte',
  gap: 'Binnenruimte',
  length: 'Armlengte',
  centreDot: 'Middenstip',
  outline: 'Rand',
  preview: 'Voorbeeld',

  audioTitle: 'Audio',
  audioSub: 'Korte synthetische feedback voor schoten en persoonlijke records.',
  soundEnabled: 'Geluidseffecten',
  volume: 'Volume',

  targetTitle: 'Doel',
  targetSub: 'Vorm en kleur voor elk doel op de baan.',
  targetShape: 'Vorm',
  shapeCircle: 'Cirkel',
  shapeSquare: 'Vierkant',
  shapeDiamond: 'Ruit',
  shapeHexagon: 'Hexagon',

  rankTitle: 'Geschatte rank',
  rankDisclaimer: 'Een ruwe VALORANT-achtige schatting op basis van alleen deze run — geen echte rank.',
  rankToNext: '+{n} naar {name}',
  rankMaxed: 'Radiant — zo goed als deze schatting wordt.',

  historyTitle: 'Historie',
  historySub: 'Alleen in deze browser opgeslagen. Er gaat niets van je apparaat af.',
  noHistory: 'Nog geen runs. Rond een drill af en hij komt hier te staan.',
  clearHistory: 'Historie wissen',
  pb: 'Persoonlijk record',
  avg5: 'Gemiddelde laatste 5',

  armTitle: 'Muisvergrendeling',
  armSub: 'De trainer heeft pointer lock nodig zodat je muis zich als in een FPS gedraagt.',
  armButton: 'Klik om de muis te vangen',
  armFallback: 'Gebruik cursormodus',
  lockLostTitle: 'Gepauzeerd',
  lockLostSub: 'De muisvergrendeling is losgelaten. De klok staat stil.',
  resume: 'Hervatten',
  quit: 'Run stoppen',
  lockFailTitle: 'Pointer lock geweigerd',
  lockFailSub:
    'Je browser gaf de muis niet vrij. De cursormodus werkt overal — het vizier volgt dan gewoon je muisaanwijzer.',
  fallbackOn: 'Doorgaan in cursormodus',
  fallbackBadge: 'Cursormodus',

  hudScore: 'Score',
  hudAcc: 'Acc',
  hudTime: 'Tijd',
  hudHits: 'Raak',
  hudOnTarget: 'Op doel',
  hudAmmo: 'Kogels',

  resultTitle: 'Runrapport',
  again: 'Nog een keer',
  toMenu: 'Terug naar drills',
  newPb: 'Nieuw persoonlijk record',
  score: 'Score',
  accuracy: 'Accuratesse',
  hits: 'Raak',
  misses: 'Mis',
  shots: 'Schoten',
  kills: 'Kills',
  kps: 'Kills / sec',
  avgTtk: 'Gemiddelde TTK',
  medTtk: 'Mediane TTK',
  reaction: 'Reactietijd',
  overshoot: 'Gem. overshoot',
  undershoot: 'Gem. undershoot',
  overshootRate: 'Overshoot-ratio',
  onTargetPct: 'Tijd op doel',
  sprayGroup: 'Groepsstraal',
  scatterTitle: 'Trefferspreiding',
  scatterSub: 'Elk schot ten opzichte van het midden. De ring is de rand van het doel.',
  ttkTitle: 'Time to kill',
  ttkSub: 'Hoe lang elk doel het volhield.',
  timelineTitle: 'Verloop van de run',
  timelineSub: 'Score en accuratesse gedurende de run.',
  compareTitle: 'Tegen jezelf',
  compareSub: 'Deze run naast je record en je recente gemiddelde op deze drill.',
  thisRun: 'Deze run',
  noData: 'Niet gemeten in deze drill.',
  hit: 'raak',
  miss: 'mis',
  radii: 'doelstralen',
};

export function copyFor(lang: Lang): Copy {
  return lang === 'nl' ? nl : en;
}
