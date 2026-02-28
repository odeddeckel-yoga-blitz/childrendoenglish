#!/usr/bin/env node

/**
 * Fetch kid-friendly images from Wikimedia Commons (no API key needed)
 * and optimize to 512x512 webp via sharp.
 *
 * Wikimedia requires a User-Agent header and generous rate limiting.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const UA = 'ChildrenDoEnglish/1.0 (https://childrendoenglish.com; educational app) node-fetch';

// Search terms — very specific to get clear, single-object, child-friendly images
// Multiple search queries per word — tries each in order until one works
const WORDS = {
  // === ANIMALS ===
  cat: ['tabby cat face portrait close', 'domestic cat sitting portrait', 'kitten face close up'],
  dog: ['beagle dog portrait', 'shiba inu dog', 'Canis lupus familiaris portrait'],
  fish: ['clownfish nemo tropical', 'goldfish single orange', 'betta fish colorful'],
  bird: ['colorful bird branch parrot', 'blue bird perched', 'robin bird'],
  rabbit: ['Oryctolagus cuniculus domestic', 'holland lop rabbit pet', 'angora rabbit white'],
  horse: ['horse portrait brown', 'horse running field', 'Pferd horse standing'],
  cow: ['dairy cow Holstein', 'cow grazing field green', 'brown cow portrait'],
  elephant: ['african elephant portrait', 'elephant walking savanna'],
  dolphin: ['spinner dolphin jumping Hawaii', 'Pacific white sided dolphin', 'Delphinus delphis common dolphin ocean'],
  penguin: ['emperor penguin standing antarctica', 'penguin bird black white'],
  giraffe: ['giraffe portrait head neck', 'giraffe standing savanna'],
  turtle: ['sea turtle swimming', 'green turtle portrait', 'tortoise walking'],
  parrot: ['scarlet macaw parrot colorful', 'parrot green portrait', 'Ara macao parrot'],
  flamingo: ['flamingo pink standing water', 'Phoenicopterus flamingo', 'flamingo bird pink'],
  cheetah: ['cheetah running fast', 'Acinonyx jubatus cheetah portrait', 'cheetah sitting savanna'],

  // === FOOD ===
  apple: ['red apple single white background', 'apple fruit red shiny single', 'malus domestica red'],
  banana: ['yellow banana single fruit', 'banana ripe yellow', 'cavendish banana'],
  bread: ['Bauernbrot bread loaf', 'pain de campagne bread', 'Weissbrot white bread loaf'],
  milk: ['pouring milk glass white', 'cow milk fresh dairy product', 'milk carton school lunch'],
  egg: ['egg white background single', 'chicken egg brown', 'boiled egg breakfast'],
  rice: ['bowl white rice steamed', 'cooked rice bowl', 'jasmine rice dish'],
  pizza: ['pepperoni pizza slice', 'margherita pizza'],
  sandwich: ['Butterbrot sandwich', 'ham cheese sandwich plate', 'submarine sandwich hoagie'],
  watermelon: ['watermelon slice red fruit', 'watermelon cut red'],
  carrot: ['orange carrot single vegetable', 'carrot fresh orange', 'daucus carota'],
  avocado: ['avocado cut half seed', 'avocado fruit green', 'Persea americana avocado'],
  broccoli: ['broccoli green vegetable single', 'broccoli head fresh', 'Brassica oleracea broccoli'],
  pineapple: ['pineapple tropical fruit', 'Ananas comosus pineapple', 'pineapple single yellow'],
  strawberry: ['strawberry red fruit close', 'strawberry single ripe', 'Fragaria strawberry'],
  chocolate: ['chocolate bar brown', 'chocolate pieces dark', 'Schokolade chocolate'],

  // === HOME ===
  house: ['Einfamilienhaus residential house', 'cottage house garden', 'Victorian house exterior colorful'],
  bed: ['bedroom bed pillows', 'double bed white sheets', 'bed room interior modern'],
  chair: ['Windsor chair antique', 'Stuhl chair single', 'rocking chair wooden'],
  table: ['Esstisch dining table set', 'wooden table top view', 'Küchentisch kitchen table'],
  door: ['wooden door entrance', 'front door house colorful', 'Tür door closed'],
  window: ['window house exterior', 'Fenster window open', 'window curtains light'],
  lamp: ['table lamp light', 'Lampe desk lamp', 'bedside lamp glowing'],
  clock: ['wall clock face', 'Wanduhr clock round', 'analog clock time'],
  mirror: ['mirror wall ornate', 'Spiegel mirror reflection', 'round mirror bathroom'],
  bookshelf: ['bookshelf books library', 'Bücherregal bookshelf full', 'bookcase wooden'],
  fireplace: ['fireplace burning fire cozy', 'Kamin fireplace brick', 'fireplace living room'],
  curtain: ['curtain window fabric', 'Vorhang curtain colorful', 'window curtains hanging'],
  staircase: ['staircase interior wooden', 'Treppe staircase spiral', 'stairs house interior'],

  // === TRANSPORT ===
  car: ['red car sedan side view', 'blue car automobile parked', 'toyota sedan car'],
  bus: ['yellow school bus', 'school bus American'],
  bicycle: ['bicycle parked red', 'bicycle road bike single', 'bicycle city commuter'],
  airplane: ['Airbus A320 landing approach', 'Boeing 737 takeoff', 'passenger aircraft airport'],
  train: ['passenger train railway', 'Zug train station', 'locomotive train colorful'],
  boat: ['sailboat boat ocean', 'Segelboot boat lake', 'fishing boat harbor'],
  helicopter: ['helicopter flying sky', 'Hubschrauber helicopter', 'rescue helicopter red'],
  motorcycle: ['motorcycle red sport', 'Motorrad motorcycle', 'motorcycle parked side'],
  scooter: ['kick scooter child', 'Tretroller scooter', 'electric scooter city'],
  submarine: ['submarine underwater ocean', 'U-Boot submarine', 'yellow submarine vessel'],
  ambulance: ['ambulance emergency vehicle', 'Krankenwagen ambulance', 'ambulance hospital'],
  tractor: ['tractor farm field', 'Traktor tractor green', 'John Deere tractor'],
  rocket: ['rocket launch space', 'Rakete rocket', 'space rocket liftoff NASA'],

  // === NATURE ===
  sun: ['sun sky photograph real', 'sunshine bright clear sky blue', 'sun rising horizon golden'],
  tree: ['single oak tree green field', 'tree green leaves isolated', 'deciduous tree summer'],
  flower: ['red rose single flower', 'daisy flower close', 'sunflower yellow'],
  rain: ['rain drops window', 'rainy day street umbrella', 'rainfall heavy'],
  grass: ['green grass field lawn', 'grass close up dew', 'meadow grass green'],
  rainbow: ['rainbow arc sky colorful', 'double rainbow landscape', 'rainbow after rain sky'],
  mountain: ['mountain snow peak blue sky', 'mountain landscape scenic alps', 'mount fuji'],
  ocean: ['ocean blue waves tropical', 'ocean horizon blue'],
  butterfly: ['monarch butterfly orange wings', 'butterfly colorful wings'],
  volcano: ['volcano erupting lava', 'Vulkan volcano eruption', 'active volcano landscape'],
  waterfall: ['waterfall tropical beautiful', 'Wasserfall waterfall', 'Niagara falls waterfall'],
  desert: ['Sahara desert sand dunes', 'Wüste desert landscape', 'sand desert dry'],
  forest: ['green forest trees path', 'Wald forest sunlight', 'deciduous forest canopy'],

  // === COLORS ===
  red: ['red color swatch', 'red paint texture', 'red background solid'],
  blue: ['blue color swatch', 'blue paint texture', 'blue background solid'],
  green: ['green color swatch', 'green paint texture', 'green background solid'],
  yellow: ['yellow color swatch', 'yellow paint texture', 'yellow background solid'],
  black: ['black color swatch', 'black background solid', 'black texture dark'],
  white: ['white color swatch background', 'white paint texture', 'white marble texture'],
  orange: ['orange color swatch', 'orange paint texture', 'orange background solid'],
  purple: ['purple color swatch', 'purple paint texture', 'violet purple background'],
  pink: ['pink color swatch', 'pink paint texture', 'pink background solid'],
  brown: ['brown color swatch', 'brown paint texture', 'brown background solid'],
  gray: ['gray color swatch', 'grey paint texture', 'gray background solid'],
  silver: ['silver metallic texture', 'silver color shiny', 'Silber silver metal'],
  golden: ['golden color texture', 'gold metallic shiny', 'golden yellow background'],

  // === NUMBERS ===
  one: ['number 1 colorful', 'number one digit', 'Zahl 1 digit'],
  two: ['number 2 colorful', 'number two digit', 'Zahl 2 digit'],
  three: ['number 3 colorful', 'number three digit', 'Zahl 3 digit'],
  four: ['number 4 colorful', 'number four digit', 'Zahl 4 digit'],
  five: ['number 5 colorful', 'number five digit', 'Zahl 5 digit'],
  six: ['number 6 colorful', 'number six digit', 'Zahl 6 digit'],
  seven: ['number 7 colorful', 'number seven digit', 'Zahl 7 digit'],
  eight: ['number 8 colorful', 'number eight digit', 'Zahl 8 digit'],
  nine: ['number 9 colorful', 'number nine digit', 'Zahl 9 digit'],
  ten: ['number 10 colorful', 'number ten digit', 'Zahl 10'],
  twenty: ['number 20 colorful', 'number twenty', 'Zahl 20'],
  hundred: ['number 100 colorful', 'number hundred', 'Zahl 100'],

  // === BODY ===
  hand: ['human hand palm open', 'Hand Finger palm', 'hand raised waving'],
  foot: ['human foot bare', 'Fuß foot toes', 'bare foot sole'],
  eye: ['human eye close up blue', 'Auge eye iris', 'eye macro green'],
  ear: ['human ear close up', 'Ohr ear anatomy', 'ear side profile'],
  nose: ['human nose face close', 'Nase nose portrait', 'nose close up'],
  arm: ['human arm raised', 'Arm muscle bicep', 'arm outstretched'],
  mouth: ['human mouth lips smile', 'Mund mouth open', 'mouth smiling teeth'],
  head: ['human head silhouette', 'Kopf head portrait', 'person head face'],
  finger: ['human finger pointing', 'Finger hand close', 'index finger pointing'],
  knee: ['human knee joint', 'Knie knee anatomy', 'knee bent leg'],
  tooth: ['tooth single white', 'Zahn tooth model', 'tooth dental white'],
  shoulder: ['human shoulder anatomy', 'Schulter shoulder', 'shoulder joint muscle'],
  elbow: ['human elbow joint', 'Ellbogen elbow', 'elbow arm bent'],
  ankle: ['human ankle joint', 'Knöchel ankle', 'ankle foot joint'],
  wrist: ['human wrist watch hand', 'Handgelenk wrist', 'wrist joint hand'],

  // === CLOTHING ===
  hat: ['hat cap colorful', 'Hut hat summer', 'baseball cap hat'],
  shirt: ['shirt clothing folded', 'Hemd shirt dress', 'polo shirt colorful'],
  shoes: ['shoes pair sneakers', 'Schuhe shoes colorful', 'running shoes pair'],
  pants: ['pants jeans blue', 'Hose pants folded', 'trousers denim'],
  dress: ['dress summer colorful', 'Kleid dress woman', 'floral dress pretty'],
  jacket: ['jacket coat leather', 'Jacke jacket', 'denim jacket blue'],
  gloves: ['winter gloves knitted', 'Handschuhe gloves warm', 'gloves pair woolly'],
  scarf: ['scarf knitted colorful', 'Schal scarf winter', 'wool scarf wrapped'],
  boots: ['rain boots rubber colorful', 'Stiefel boots leather', 'winter boots warm'],
  sweater: ['sweater knitted warm', 'Pullover sweater wool', 'sweater colorful'],
  umbrella: ['umbrella rain colorful', 'Regenschirm umbrella', 'open umbrella red'],
  backpack: ['backpack school bag', 'Rucksack backpack', 'backpack hiking colorful'],
  sunglasses: ['sunglasses pair fashion', 'Sonnenbrille sunglasses', 'sunglasses aviator'],

  // === SCHOOL ===
  book: ['open book reading', 'Buch book pages', 'book stack colorful'],
  pen: ['ballpoint pen writing', 'Kugelschreiber pen', 'pen blue writing'],
  paper: ['blank paper white sheet', 'Papier paper stack', 'paper sheet white'],
  desk: ['school desk classroom', 'Schreibtisch desk', 'student desk wood'],
  ruler: ['ruler measuring tool', 'Lineal ruler', 'ruler centimeters inches'],
  pencil: ['pencil yellow sharp', 'Bleistift pencil', 'pencil writing wooden'],
  eraser: ['eraser rubber pink', 'Radiergummi eraser', 'eraser pencil rubber'],
  crayon: ['crayons colorful wax', 'Wachsmalstift crayon', 'crayon box colorful'],
  notebook: ['notebook spiral lined', 'Notizbuch notebook', 'notebook pen desk'],
  scissors: ['scissors cutting tool', 'Schere scissors', 'scissors craft school'],
  calculator: ['calculator electronic', 'Taschenrechner calculator', 'scientific calculator'],
  globe: ['globe earth world', 'Globus globe', 'world globe desk'],
  microscope: ['microscope science lab', 'Mikroskop microscope', 'microscope laboratory'],

  // === SPORTS ===
  ball: ['soccer ball football', 'Ball sport round', 'colorful ball toy'],
  bat: ['baseball bat wooden', 'cricket bat sport', 'Baseballschläger bat'],
  rope: ['jump rope skipping', 'Springseil jump rope', 'rope coiled thick'],
  net: ['tennis net court', 'volleyball net sport', 'Netz net sport'],
  goal: ['soccer goal football', 'Tor goal net', 'football goal post'],
  soccer: ['soccer football match', 'Fußball soccer ball kick', 'soccer player kick'],
  basketball: ['basketball court game', 'Basketball sport hoop', 'basketball player dunk'],
  tennis: ['tennis player court', 'Tennis racket ball', 'tennis match serve'],
  swimming: ['swimming pool sport', 'Schwimmen swimming', 'swimmer pool lanes'],
  volleyball: ['volleyball beach game', 'Volleyball sport net', 'volleyball player spike'],
  gymnastics: ['gymnastics gymnast performance', 'Turnen gymnastics', 'gymnast balance beam'],
  surfing: ['surfing wave ocean', 'Surfen surfer', 'surfer riding wave'],
  archery: ['archery target bow', 'Bogenschießen archery', 'archer bow arrow'],

  // === WEATHER ===
  cloud: ['white cloud blue sky', 'Wolke cloud cumulus', 'fluffy cloud sky'],
  snow: ['snow falling winter', 'Schnee snow landscape', 'snowflakes falling'],
  wind: ['wind blowing trees', 'Wind windy day flag', 'strong wind storm'],
  ice: ['ice frozen winter', 'Eis ice crystal', 'icicle frozen water'],
  storm: ['thunderstorm lightning', 'Gewitter storm dark clouds', 'storm rain dark'],
  fog: ['fog misty morning', 'Nebel fog forest', 'foggy landscape'],
  hail: ['hailstones ice weather', 'Hagel hail stones', 'hail damage storm'],
  thunder: ['thunderstorm lightning bolt', 'Donner thunder lightning', 'lightning bolt storm'],
  hurricane: ['hurricane satellite image', 'Hurrikan hurricane eye', 'tropical cyclone hurricane'],
  tornado: ['tornado funnel cloud', 'Tornado twister', 'tornado storm destruction'],
  blizzard: ['blizzard snow storm', 'Schneesturm blizzard', 'snow blizzard winter'],
  frost: ['frost ice crystals window', 'Frost frozen morning', 'frost patterns glass'],

  // === FAMILY ===
  mom: ['mother child happy', 'Mutter mother love', 'mom hugging child'],
  dad: ['father child playing', 'Vater father', 'dad son happy'],
  baby: ['baby smiling cute', 'Baby Säugling infant', 'baby face happy'],
  sister: ['sisters girls playing', 'Schwester sister', 'two sisters happy'],
  friend: ['children friends playing', 'Freunde friends school', 'kids friends happy'],
  brother: ['brothers boys playing', 'Bruder brother', 'two brothers happy'],
  grandma: ['grandmother grandchild', 'Großmutter Oma grandmother', 'grandma baking cookies'],
  grandpa: ['grandfather grandchild', 'Großvater Opa grandfather', 'grandpa reading book'],
  uncle: ['uncle family man', 'Onkel uncle', 'man uncle nephew'],
  aunt: ['aunt family woman', 'Tante aunt', 'woman aunt niece'],
  cousin: ['cousins children playing', 'Cousin cousins', 'kids cousins family'],
  nephew: ['nephew boy child uncle', 'Neffe nephew', 'boy nephew playing'],
  niece: ['niece girl child aunt', 'Nichte niece', 'girl niece playing'],

  // === FEELINGS ===
  happy: ['happy child smiling', 'glücklich happy face', 'smiling child joy'],
  sad: ['sad child crying', 'traurig sad face', 'unhappy child tear'],
  angry: ['angry face expression', 'wütend angry', 'angry child expression'],
  scared: ['scared child afraid', 'Angst scared face', 'frightened child'],
  tired: ['tired child yawning', 'müde tired sleepy', 'yawning child tired'],
  hungry: ['hungry child eating', 'hungrig hungry', 'child hungry food'],
  brave: ['brave child superhero', 'mutig brave', 'brave hero child'],
  proud: ['proud child achievement', 'stolz proud medal', 'child proud trophy'],
  excited: ['excited child happy', 'aufgeregt excited', 'child excited jumping'],
  nervous: ['nervous child worried', 'nervös nervous', 'anxious child'],
  lonely: ['lonely child alone', 'einsam lonely', 'child sitting alone sad'],
  confused: ['confused child thinking', 'verwirrt confused', 'puzzled child confused'],

  // === EVERYDAY ===
  cup: ['cup mug coffee', 'Tasse cup ceramic', 'cup white porcelain'],
  plate: ['plate dish white', 'Teller plate ceramic', 'dinner plate empty'],
  key: ['key metal golden', 'Schlüssel key', 'door key brass'],
  phone: ['smartphone mobile phone', 'Telefon phone', 'cell phone screen'],
  soap: ['soap bar hygiene', 'Seife soap', 'soap bubbles hand'],
  fork: ['fork silverware utensil', 'Gabel fork', 'fork metal dining'],
  knife: ['knife kitchen blade', 'Messer knife', 'butter knife silverware'],
  spoon: ['spoon silverware utensil', 'Löffel spoon', 'spoon metal soup'],
  towel: ['towel bath folded', 'Handtuch towel', 'towel stack colorful'],
  toothbrush: ['toothbrush dental hygiene', 'Zahnbürste toothbrush', 'toothbrush colorful'],
  envelope: ['envelope letter mail', 'Briefumschlag envelope', 'envelope white sealed'],
  candle: ['candle flame burning', 'Kerze candle', 'candle light wax'],
  calendar: ['calendar wall monthly', 'Kalender calendar', 'calendar desk planner'],
};

async function searchWikimedia(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=512&format=json&origin=*`;

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const data = await res.json();

  if (!data.query?.pages) return null;

  const pages = Object.values(data.query.pages)
    .filter(p => {
      const info = p.imageinfo?.[0];
      if (!info) return false;
      const mime = info.mime || '';
      // Must be a photo/image, at least 300px, and roughly square-ish (aspect ratio < 2:1)
      const isImage = mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp');
      const bigEnough = info.width >= 300 && info.height >= 300;
      const aspectRatio = Math.max(info.width, info.height) / Math.min(info.width, info.height);
      return isImage && bigEnough && aspectRatio < 2.5;
    })
    .sort((a, b) => {
      // Prefer images closer to square aspect ratio
      const ratioA = Math.abs(1 - (a.imageinfo[0].width / a.imageinfo[0].height));
      const ratioB = Math.abs(1 - (b.imageinfo[0].width / b.imageinfo[0].height));
      return ratioA - ratioB;
    });

  if (pages.length === 0) return null;

  const info = pages[0].imageinfo[0];
  return info.thumburl || info.url;
}

// Try multiple queries for a word, return first successful result
async function searchWithFallbacks(queries) {
  for (const query of queries) {
    const result = await searchWikimedia(query);
    if (result) return result;
    await new Promise(r => setTimeout(r, 1500));
  }
  return null;
}

async function downloadAndOptimize(url, outputName) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const outputPath = path.join(IMAGES_DIR, outputName);

  await sharp(buffer)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  return stats.size;
}

// Check which words already have real images (not the tiny placeholder)
function needsImage(word) {
  const filePath = path.join(IMAGES_DIR, `${word}.webp`);
  if (!fs.existsSync(filePath)) return true;
  const stats = fs.statSync(filePath);
  return stats.size < 500; // placeholder is ~50 bytes
}

async function main() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const words = Object.entries(WORDS).filter(([word]) => needsImage(word));

  if (words.length === 0) {
    console.log('All images already downloaded!');
    return;
  }

  console.log(`Fetching ${words.length} images (skipping ${Object.keys(WORDS).length - words.length} already downloaded)...\n`);

  let success = 0;
  let failed = 0;

  for (const [word, queries] of words) {
    process.stdout.write(`  ${word}... `);

    try {
      const imageUrl = await searchWithFallbacks(queries);
      if (!imageUrl) {
        console.log('NO RESULT (tried all queries)');
        failed++;
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }

      // Wait before downloading the image
      await new Promise(r => setTimeout(r, 2000));

      const size = await downloadAndOptimize(imageUrl, `${word}.webp`);
      console.log(`OK (${(size / 1024).toFixed(1)}KB)`);
      success++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failed++;
    }

    // Generous rate limiting between words
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\nDone: ${success} downloaded, ${failed} failed out of ${words.length}`);

  if (failed > 0) {
    const failedWords = Object.keys(WORDS).filter(w => needsImage(w));
    console.log(`\nStill need images for: ${failedWords.join(', ')}`);
    console.log('Run the script again to retry failed words.');
  }
}

main().catch(console.error);
