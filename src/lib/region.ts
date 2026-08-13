const REGION_TO_ISO_NUMERIC: Record<string, string> = {
  hk: "344",
  "hong kong": "344",
  hongkong: "344",
  cn: "156",
  china: "156",
  tw: "158",
  taiwan: "158",
  jp: "392",
  japan: "392",
  kr: "410",
  korea: "410",
  "south korea": "410",
  sg: "702",
  singapore: "702",
  us: "840",
  usa: "840",
  "united states": "840",
  "united states of america": "840",
  de: "276",
  germany: "276",
  nl: "528",
  netherlands: "528",
  gb: "826",
  uk: "826",
  "united kingdom": "826",
  fr: "250",
  france: "250",
  ca: "124",
  canada: "124",
  au: "036",
  australia: "036",
  in: "356",
  india: "356",
  ru: "643",
  russia: "643",
  br: "076",
  brazil: "076",
  se: "752",
  sweden: "752",
  fi: "246",
  finland: "246",
  no: "578",
  norway: "578",
  pl: "616",
  poland: "616",
  ie: "372",
  ireland: "372",
  it: "380",
  italy: "380",
  es: "724",
  spain: "724",
  ch: "756",
  switzerland: "756",
  at: "040",
  austria: "040",
  cz: "203",
  "czech republic": "203",
  czechia: "203",
  mo: "446",
  macau: "446",
  macao: "446",
  vn: "704",
  vietnam: "704",
  th: "764",
  thailand: "764",
  my: "458",
  malaysia: "458",
  id: "360",
  indonesia: "360",
  ph: "608",
  philippines: "608",
  nz: "554",
  "new zealand": "554",
  tr: "792",
  turkey: "792",
  ae: "784",
  uae: "784",
  "united arab emirates": "784",
  za: "710",
  "south africa": "710",
  mx: "484",
  mexico: "484",
  ar: "032",
  argentina: "032",
  cl: "152",
  chile: "152",
  ua: "804",
  ukraine: "804",
  ro: "642",
  romania: "642",
  bg: "100",
  bulgaria: "100",
  hu: "348",
  hungary: "348",
  pt: "620",
  portugal: "620",
  dk: "208",
  denmark: "208",
  be: "056",
  belgium: "056",
  lu: "442",
  luxembourg: "442",
  il: "376",
  israel: "376",
  sa: "682",
  "saudi arabia": "682",
  kh: "116",
  cambodia: "116",
  la: "418",
  laos: "418",
  mm: "104",
  myanmar: "104",
  bd: "050",
  bangladesh: "050",
  pk: "586",
  pakistan: "586",
  kz: "398",
  kazakhstan: "398",
  uz: "860",
  uzbekistan: "860",
  ge: "268",
  georgia: "268",
  am: "051",
  armenia: "051",
  az: "031",
  azerbaijan: "031",
};

const ISO_A2_TO_NUMERIC: Record<string, string> = {
  HK: "344",
  CN: "156",
  TW: "158",
  JP: "392",
  KR: "410",
  SG: "702",
  US: "840",
  DE: "276",
  NL: "528",
  GB: "826",
  FR: "250",
  CA: "124",
  AU: "036",
  IN: "356",
  RU: "643",
  BR: "076",
  SE: "752",
  FI: "246",
  NO: "578",
  PL: "616",
  IE: "372",
  IT: "380",
  ES: "724",
  CH: "756",
  AT: "040",
  CZ: "203",
  MO: "446",
  VN: "704",
  TH: "764",
  MY: "458",
  ID: "360",
  PH: "608",
  NZ: "554",
  TR: "792",
  AE: "784",
  ZA: "710",
  MX: "484",
  AR: "032",
  CL: "152",
  UA: "804",
  RO: "642",
  BG: "100",
  HU: "348",
  PT: "620",
  DK: "208",
  BE: "056",
  LU: "442",
  IL: "376",
  SA: "682",
};

const ISO_NUMERIC_TO_A2 = Object.fromEntries(
  Object.entries(ISO_A2_TO_NUMERIC).map(([alpha2, numeric]) => [
    numeric,
    alpha2,
  ]),
);

function flagEmojiToIsoA2(region: string): string | null {
  const points = [...region]
    .map((char) => char.codePointAt(0))
    .filter((point): point is number => point !== undefined);
  if (points.length < 2) {
    return null;
  }
  const [first, second] = points;
  if (
    first === undefined ||
    second === undefined ||
    first < 0x1f1e6 ||
    first > 0x1f1ff ||
    second < 0x1f1e6 ||
    second > 0x1f1ff
  ) {
    return null;
  }
  return String.fromCharCode(first - 0x1f1e6 + 65, second - 0x1f1e6 + 65);
}

export function regionToIsoNumeric(region: string): string | null {
  const trimmed = region.trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d{3}$/.test(trimmed)) {
    return trimmed;
  }
  const fromFlag = flagEmojiToIsoA2(trimmed);
  if (fromFlag && ISO_A2_TO_NUMERIC[fromFlag]) {
    return ISO_A2_TO_NUMERIC[fromFlag];
  }
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && ISO_A2_TO_NUMERIC[upper]) {
    return ISO_A2_TO_NUMERIC[upper];
  }
  const mapped = REGION_TO_ISO_NUMERIC[trimmed.toLowerCase()];
  return mapped ?? null;
}

export function regionToFlagEmoji(region: string): string | null {
  const numeric = regionToIsoNumeric(region);
  if (!numeric) {
    return null;
  }
  const alpha2 = ISO_NUMERIC_TO_A2[numeric];
  if (!alpha2) {
    return null;
  }
  return [...alpha2]
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 0x1f1a5))
    .join("");
}
