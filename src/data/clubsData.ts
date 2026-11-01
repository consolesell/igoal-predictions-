/**
 * Comprehensive Major League Clubs Database & Auto-Dictation Engine
 * Covers Premier League, La Liga, Serie A, Bundesliga, Ligue 1, and Global Giants.
 * Handles prefixes (FC, AFC, Real, 1., etc.), suffixes, misplaced words, and typos.
 */

export interface ClubInfo {
  id: string;
  name: string;
  shortName: string;
  country: string;
  league: string;
  fotmobId: number;
  logoUrl: string;
  logoPath: string;
  aliases: string[];
}

export interface DictationResult {
  club: ClubInfo | null;
  confidence: number; // 0 to 100
  matchReason: string;
  normalizedQuery: string;
}

const CDN_BASE = 'https://images.fotmob.com/image_resources/logo/teamlogo';

export const MAJOR_CLUBS: ClubInfo[] = [
  // ---------------------------------------------------------------------------
  // 1. PREMIER LEAGUE (ENGLAND - 20 CLUBS)
  // ---------------------------------------------------------------------------
  {
    id: 'club_arsenal',
    name: 'Arsenal FC',
    shortName: 'Arsenal',
    country: 'England',
    league: 'Premier League',
    fotmobId: 9825,
    logoUrl: `${CDN_BASE}/9825.png`,
    logoPath: 'clubs/club_arsenal/logo.png',
    aliases: ['gunners', 'afc', 'arsenal fc', 'the gunners', 'arsenal london'],
  },
  {
    id: 'club_aston_villa',
    name: 'Aston Villa FC',
    shortName: 'Aston Villa',
    country: 'England',
    league: 'Premier League',
    fotmobId: 10252,
    logoUrl: `${CDN_BASE}/10252.png`,
    logoPath: 'clubs/club_aston_villa/logo.png',
    aliases: ['villa', 'avfc', 'the villains', 'aston villa birmingham'],
  },
  {
    id: 'club_bournemouth',
    name: 'AFC Bournemouth',
    shortName: 'Bournemouth',
    country: 'England',
    league: 'Premier League',
    fotmobId: 8678,
    logoUrl: `${CDN_BASE}/8678.png`,
    logoPath: 'clubs/club_bournemouth/logo.png',
    aliases: ['afc bournemouth', 'cherries', 'the cherries'],
  },
  {
    id: 'club_brentford',
    name: 'Brentford FC',
    shortName: 'Brentford',
    country: 'England',
    league: 'Premier League',
    fotmobId: 9937,
    logoUrl: `${CDN_BASE}/9937.png`,
    logoPath: 'clubs/club_brentford/logo.png',
    aliases: ['bees', 'the bees', 'brentford fc'],
  },
  {
    id: 'club_brighton',
    name: 'Brighton & Hove Albion',
    shortName: 'Brighton',
    country: 'England',
    league: 'Premier League',
    fotmobId: 10204,
    logoUrl: `${CDN_BASE}/10204.png`,
    logoPath: 'clubs/club_brighton/logo.png',
    aliases: ['seagulls', 'brighton hove albion', 'bhafc', 'the seagulls'],
  },
  {
    id: 'club_chelsea',
    name: 'Chelsea FC',
    shortName: 'Chelsea',
    country: 'England',
    league: 'Premier League',
    fotmobId: 8455,
    logoUrl: `${CDN_BASE}/8455.png`,
    logoPath: 'clubs/club_chelsea/logo.png',
    aliases: ['blues', 'the blues', 'cfc', 'chelsea fc'],
  },
  {
    id: 'club_crystal_palace',
    name: 'Crystal Palace FC',
    shortName: 'Crystal Palace',
    country: 'England',
    league: 'Premier League',
    fotmobId: 9826,
    logoUrl: `${CDN_BASE}/9826.png`,
    logoPath: 'clubs/club_crystal_palace/logo.png',
    aliases: ['palace', 'cpfc', 'eagles', 'the eagles'],
  },
  {
    id: 'club_everton',
    name: 'Everton FC',
    shortName: 'Everton',
    country: 'England',
    league: 'Premier League',
    fotmobId: 8668,
    logoUrl: `${CDN_BASE}/8668.png`,
    logoPath: 'clubs/club_everton/logo.png',
    aliases: ['toffees', 'the toffees', 'efc', 'everton fc'],
  },
  {
    id: 'club_fulham',
    name: 'Fulham FC',
    shortName: 'Fulham',
    country: 'England',
    league: 'Premier League',
    fotmobId: 9879,
    logoUrl: `${CDN_BASE}/9879.png`,
    logoPath: 'clubs/club_fulham/logo.png',
    aliases: ['cottagers', 'the cottagers', 'ffc', 'fulham fc'],
  },
  {
    id: 'club_ipswich',
    name: 'Ipswich Town FC',
    shortName: 'Ipswich',
    country: 'England',
    league: 'Premier League',
    fotmobId: 9406,
    logoUrl: `${CDN_BASE}/9406.png`,
    logoPath: 'clubs/club_ipswich/logo.png',
    aliases: ['ipswich town', 'tractor boys', 'itfc'],
  },
  {
    id: 'club_leicester',
    name: 'Leicester City FC',
    shortName: 'Leicester',
    country: 'England',
    league: 'Premier League',
    fotmobId: 8197,
    logoUrl: `${CDN_BASE}/8197.png`,
    logoPath: 'clubs/club_leicester/logo.png',
    aliases: ['foxes', 'the foxes', 'lcfc', 'leicester city'],
  },
  {
    id: 'club_liverpool',
    name: 'Liverpool FC',
    shortName: 'Liverpool',
    country: 'England',
    league: 'Premier League',
    fotmobId: 8650,
    logoUrl: `${CDN_BASE}/8650.png`,
    logoPath: 'clubs/club_liverpool/logo.png',
    aliases: ['reds', 'the reds', 'lfc', 'liverpool fc'],
  },
  {
    id: 'club_mancity',
    name: 'Manchester City FC',
    shortName: 'Man City',
    country: 'England',
    league: 'Premier League',
    fotmobId: 8456,
    logoUrl: `${CDN_BASE}/8456.png`,
    logoPath: 'clubs/club_mancity/logo.png',
    aliases: ['man city', 'manchester city', 'mcfc', 'citizens', 'the citizens', 'city'],
  },
  {
    id: 'club_manunited',
    name: 'Manchester United FC',
    shortName: 'Man United',
    country: 'England',
    league: 'Premier League',
    fotmobId: 10260,
    logoUrl: `${CDN_BASE}/10260.png`,
    logoPath: 'clubs/club_manunited/logo.png',
    aliases: ['man united', 'man utd', 'manchester united', 'mufc', 'red devils', 'the red devils'],
  },
  {
    id: 'club_newcastle',
    name: 'Newcastle United FC',
    shortName: 'Newcastle',
    country: 'England',
    league: 'Premier League',
    fotmobId: 10261,
    logoUrl: `${CDN_BASE}/10261.png`,
    logoPath: 'clubs/club_newcastle/logo.png',
    aliases: ['newcastle', 'magpies', 'the magpies', 'nufc', 'newcastle united'],
  },
  {
    id: 'club_nottingham',
    name: 'Nottingham Forest FC',
    shortName: 'Nottm Forest',
    country: 'England',
    league: 'Premier League',
    fotmobId: 10203,
    logoUrl: `${CDN_BASE}/10203.png`,
    logoPath: 'clubs/club_nottingham/logo.png',
    aliases: ['nottingham forest', 'forest', 'nffc', 'notts forest'],
  },
  {
    id: 'club_southampton',
    name: 'Southampton FC',
    shortName: 'Southampton',
    country: 'England',
    league: 'Premier League',
    fotmobId: 8466,
    logoUrl: `${CDN_BASE}/8466.png`,
    logoPath: 'clubs/club_southampton/logo.png',
    aliases: ['saints', 'the saints', 'sfc', 'southampton fc'],
  },
  {
    id: 'club_tottenham',
    name: 'Tottenham Hotspur FC',
    shortName: 'Tottenham',
    country: 'England',
    league: 'Premier League',
    fotmobId: 8586,
    logoUrl: `${CDN_BASE}/8586.png`,
    logoPath: 'clubs/club_tottenham/logo.png',
    aliases: ['spurs', 'tottenham', 'tottenham hotspur', 'thfc', 'the spurs'],
  },
  {
    id: 'club_westham',
    name: 'West Ham United FC',
    shortName: 'West Ham',
    country: 'England',
    league: 'Premier League',
    fotmobId: 8654,
    logoUrl: `${CDN_BASE}/8654.png`,
    logoPath: 'clubs/club_westham/logo.png',
    aliases: ['hammers', 'the hammers', 'irons', 'whufc', 'west ham united'],
  },
  {
    id: 'club_wolves',
    name: 'Wolverhampton Wanderers FC',
    shortName: 'Wolves',
    country: 'England',
    league: 'Premier League',
    fotmobId: 8659,
    logoUrl: `${CDN_BASE}/8659.png`,
    logoPath: 'clubs/club_wolves/logo.png',
    aliases: ['wolves', 'wolverhampton', 'wwfc', 'wolverhampton wanderers'],
  },

  // ---------------------------------------------------------------------------
  // 2. LA LIGA (SPAIN - 20 CLUBS)
  // ---------------------------------------------------------------------------
  {
    id: 'club_realmadrid',
    name: 'Real Madrid CF',
    shortName: 'Real Madrid',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8633,
    logoUrl: `${CDN_BASE}/8633.png`,
    logoPath: 'clubs/club_realmadrid/logo.png',
    aliases: ['real madrid', 'los blancos', 'rmcf', 'madrid', 'los merengues'],
  },
  {
    id: 'club_barcelona',
    name: 'FC Barcelona',
    shortName: 'Barcelona',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8634,
    logoUrl: `${CDN_BASE}/8634.png`,
    logoPath: 'clubs/club_barcelona/logo.png',
    aliases: ['barca', 'barça', 'barcelona', 'fc barcelona', 'blaugrana', 'fcb'],
  },
  {
    id: 'club_atletico',
    name: 'Club Atlético de Madrid',
    shortName: 'Atletico Madrid',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 9906,
    logoUrl: `${CDN_BASE}/9906.png`,
    logoPath: 'clubs/club_atletico/logo.png',
    aliases: ['atleti', 'atletico', 'atletico madrid', 'atletico de madrid', 'colchoneros'],
  },
  {
    id: 'club_athletic_bilbao',
    name: 'Athletic Club Bilbao',
    shortName: 'Athletic Club',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8315,
    logoUrl: `${CDN_BASE}/8315.png`,
    logoPath: 'clubs/club_athletic_bilbao/logo.png',
    aliases: ['athletic bilbao', 'bilbao', 'athletic club', 'los leones'],
  },
  {
    id: 'club_realsociedad',
    name: 'Real Sociedad de Fútbol',
    shortName: 'Real Sociedad',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8560,
    logoUrl: `${CDN_BASE}/8560.png`,
    logoPath: 'clubs/club_realsociedad/logo.png',
    aliases: ['la real', 'sociedad', 'real sociedad', 'txuri urdin'],
  },
  {
    id: 'club_realbetis',
    name: 'Real Betis Balompié',
    shortName: 'Real Betis',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8603,
    logoUrl: `${CDN_BASE}/8603.png`,
    logoPath: 'clubs/club_realbetis/logo.png',
    aliases: ['betis', 'real betis', 'beticos', 'verdiblancos'],
  },
  {
    id: 'club_villarreal',
    name: 'Villarreal CF',
    shortName: 'Villarreal',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 10205,
    logoUrl: `${CDN_BASE}/10205.png`,
    logoPath: 'clubs/club_villarreal/logo.png',
    aliases: ['villarreal', 'villareal', 'yellow submarine', 'el submarino amarillo'],
  },
  {
    id: 'club_sevilla',
    name: 'Sevilla FC',
    shortName: 'Sevilla',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8302,
    logoUrl: `${CDN_BASE}/8302.png`,
    logoPath: 'clubs/club_sevilla/logo.png',
    aliases: ['sevilla', 'sevilla fc', 'los palanganas', 'los hispalenses'],
  },
  {
    id: 'club_girona',
    name: 'Girona FC',
    shortName: 'Girona',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 7732,
    logoUrl: `${CDN_BASE}/7732.png`,
    logoPath: 'clubs/club_girona/logo.png',
    aliases: ['girona', 'girona fc', 'blanquivermells'],
  },
  {
    id: 'club_valencia',
    name: 'Valencia CF',
    shortName: 'Valencia',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 10267,
    logoUrl: `${CDN_BASE}/10267.png`,
    logoPath: 'clubs/club_valencia/logo.png',
    aliases: ['valencia', 'valencia cf', 'los che', 'los murcielagos'],
  },
  {
    id: 'club_celtavigo',
    name: 'RC Celta de Vigo',
    shortName: 'Celta Vigo',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 9910,
    logoUrl: `${CDN_BASE}/9910.png`,
    logoPath: 'clubs/club_celtavigo/logo.png',
    aliases: ['celta', 'celta vigo', 'rc celta', 'os celestes'],
  },
  {
    id: 'club_mallorca',
    name: 'RCD Mallorca',
    shortName: 'Mallorca',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8661,
    logoUrl: `${CDN_BASE}/8661.png`,
    logoPath: 'clubs/club_mallorca/logo.png',
    aliases: ['mallorca', 'rcd mallorca', 'los bermellones'],
  },
  {
    id: 'club_osasuna',
    name: 'CA Osasuna',
    shortName: 'Osasuna',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8371,
    logoUrl: `${CDN_BASE}/8371.png`,
    logoPath: 'clubs/club_osasuna/logo.png',
    aliases: ['osasuna', 'ca osasuna', 'los rojillos'],
  },
  {
    id: 'club_rayo_vallecano',
    name: 'Rayo Vallecano',
    shortName: 'Rayo Vallecano',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 10144,
    logoUrl: `${CDN_BASE}/10144.png`,
    logoPath: 'clubs/club_rayo_vallecano/logo.png',
    aliases: ['rayo', 'rayo vallecano', 'los franjirrojos'],
  },
  {
    id: 'club_getafe',
    name: 'Getafe CF',
    shortName: 'Getafe',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 9860,
    logoUrl: `${CDN_BASE}/9860.png`,
    logoPath: 'clubs/club_getafe/logo.png',
    aliases: ['getafe', 'getafe cf', 'azulones'],
  },
  {
    id: 'club_espanyol',
    name: 'RCD Espanyol de Barcelona',
    shortName: 'Espanyol',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8558,
    logoUrl: `${CDN_BASE}/8558.png`,
    logoPath: 'clubs/club_espanyol/logo.png',
    aliases: ['espanyol', 'rcd espanyol', 'periquitos'],
  },
  {
    id: 'club_las_palmas',
    name: 'UD Las Palmas',
    shortName: 'Las Palmas',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8306,
    logoUrl: `${CDN_BASE}/8306.png`,
    logoPath: 'clubs/club_las_palmas/logo.png',
    aliases: ['las palmas', 'ud las palmas', 'los amarillos'],
  },
  {
    id: 'club_leganes',
    name: 'CD Leganés',
    shortName: 'Leganes',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 8479,
    logoUrl: `${CDN_BASE}/8479.png`,
    logoPath: 'clubs/club_leganes/logo.png',
    aliases: ['leganes', 'cd leganes', 'pepineros'],
  },
  {
    id: 'club_alaves',
    name: 'Deportivo Alavés',
    shortName: 'Alaves',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 9865,
    logoUrl: `${CDN_BASE}/9865.png`,
    logoPath: 'clubs/club_alaves/logo.png',
    aliases: ['alaves', 'deportivo alaves', 'el glorioso', 'babazorros'],
  },
  {
    id: 'club_valladolid',
    name: 'Real Valladolid CF',
    shortName: 'Valladolid',
    country: 'Spain',
    league: 'La Liga',
    fotmobId: 10281,
    logoUrl: `${CDN_BASE}/10281.png`,
    logoPath: 'clubs/club_valladolid/logo.png',
    aliases: ['valladolid', 'real valladolid', 'pucela', 'pucelanos'],
  },

  // ---------------------------------------------------------------------------
  // 3. SERIE A (ITALY - 20 CLUBS)
  // ---------------------------------------------------------------------------
  {
    id: 'club_inter',
    name: 'FC Internazionale Milano',
    shortName: 'Inter',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 8636,
    logoUrl: `${CDN_BASE}/8636.png`,
    logoPath: 'clubs/club_inter/logo.png',
    aliases: ['inter', 'inter milan', 'internazionale', 'nerazzurri', 'fc inter'],
  },
  {
    id: 'club_milan',
    name: 'AC Milan',
    shortName: 'Milan',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 8564,
    logoUrl: `${CDN_BASE}/8564.png`,
    logoPath: 'clubs/club_milan/logo.png',
    aliases: ['milan', 'ac milan', 'rossoneri', 'il diavolo'],
  },
  {
    id: 'club_juventus',
    name: 'Juventus FC',
    shortName: 'Juventus',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 9885,
    logoUrl: `${CDN_BASE}/9885.png`,
    logoPath: 'clubs/club_juventus/logo.png',
    aliases: ['juve', 'juventus', 'bianconeri', 'la vecchia signora'],
  },
  {
    id: 'club_napoli',
    name: 'SSC Napoli',
    shortName: 'Napoli',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 9875,
    logoUrl: `${CDN_BASE}/9875.png`,
    logoPath: 'clubs/club_napoli/logo.png',
    aliases: ['napoli', 'ssc napoli', 'partenopei', 'gli azzurri'],
  },
  {
    id: 'club_atalanta',
    name: 'Atalanta BC',
    shortName: 'Atalanta',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 8524,
    logoUrl: `${CDN_BASE}/8524.png`,
    logoPath: 'clubs/club_atalanta/logo.png',
    aliases: ['atalanta', 'atalanta bc', 'la dea', 'orobici'],
  },
  {
    id: 'club_roma',
    name: 'AS Roma',
    shortName: 'Roma',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 8686,
    logoUrl: `${CDN_BASE}/8686.png`,
    logoPath: 'clubs/club_roma/logo.png',
    aliases: ['roma', 'as roma', 'giallorossi', 'i lupi'],
  },
  {
    id: 'club_lazio',
    name: 'SS Lazio',
    shortName: 'Lazio',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 8543,
    logoUrl: `${CDN_BASE}/8543.png`,
    logoPath: 'clubs/club_lazio/logo.png',
    aliases: ['lazio', 'ss lazio', 'biancocelesti', 'le aquile'],
  },
  {
    id: 'club_fiorentina',
    name: 'ACF Fiorentina',
    shortName: 'Fiorentina',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 8535,
    logoUrl: `${CDN_BASE}/8535.png`,
    logoPath: 'clubs/club_fiorentina/logo.png',
    aliases: ['fiorentina', 'acf fiorentina', 'viola', 'la viola'],
  },
  {
    id: 'club_bologna',
    name: 'Bologna FC 1909',
    shortName: 'Bologna',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 9857,
    logoUrl: `${CDN_BASE}/9857.png`,
    logoPath: 'clubs/club_bologna/logo.png',
    aliases: ['bologna', 'bologna fc', 'rossoblu'],
  },
  {
    id: 'club_torino',
    name: 'Torino FC',
    shortName: 'Torino',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 9804,
    logoUrl: `${CDN_BASE}/9804.png`,
    logoPath: 'clubs/club_torino/logo.png',
    aliases: ['torino', 'il toro', 'granata'],
  },
  {
    id: 'club_genoa',
    name: 'Genoa CFC',
    shortName: 'Genoa',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 10268,
    logoUrl: `${CDN_BASE}/10268.png`,
    logoPath: 'clubs/club_genoa/logo.png',
    aliases: ['genoa', 'il grifone', 'rossoblu genoa'],
  },
  {
    id: 'club_monza',
    name: 'AC Monza',
    shortName: 'Monza',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 6504,
    logoUrl: `${CDN_BASE}/6504.png`,
    logoPath: 'clubs/club_monza/logo.png',
    aliases: ['monza', 'ac monza', 'i brianzoli'],
  },
  {
    id: 'club_udinese',
    name: 'Udinese Calcio',
    shortName: 'Udinese',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 8600,
    logoUrl: `${CDN_BASE}/8600.png`,
    logoPath: 'clubs/club_udinese/logo.png',
    aliases: ['udinese', 'i friulani', 'le zebrette'],
  },
  {
    id: 'club_parma',
    name: 'Parma Calcio 1913',
    shortName: 'Parma',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 10171,
    logoUrl: `${CDN_BASE}/10171.png`,
    logoPath: 'clubs/club_parma/logo.png',
    aliases: ['parma', 'i crociati', 'i ducali'],
  },
  {
    id: 'club_cagliari',
    name: 'Cagliari Calcio',
    shortName: 'Cagliari',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 8529,
    logoUrl: `${CDN_BASE}/8529.png`,
    logoPath: 'clubs/club_cagliari/logo.png',
    aliases: ['cagliari', 'gli isolani', 'rossoblu cagliari'],
  },
  {
    id: 'club_empoli',
    name: 'Empoli FC',
    shortName: 'Empoli',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 8534,
    logoUrl: `${CDN_BASE}/8534.png`,
    logoPath: 'clubs/club_empoli/logo.png',
    aliases: ['empoli', 'gli azzurri empoli'],
  },
  {
    id: 'club_verona',
    name: 'Hellas Verona FC',
    shortName: 'Verona',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 9876,
    logoUrl: `${CDN_BASE}/9876.png`,
    logoPath: 'clubs/club_verona/logo.png',
    aliases: ['verona', 'hellas verona', 'i mastini', 'gialloblu'],
  },
  {
    id: 'club_lecce',
    name: 'US Lecce',
    shortName: 'Lecce',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 9888,
    logoUrl: `${CDN_BASE}/9888.png`,
    logoPath: 'clubs/club_lecce/logo.png',
    aliases: ['lecce', 'i salentini', 'giallorossi lecce'],
  },
  {
    id: 'club_venezia',
    name: 'Venezia FC',
    shortName: 'Venezia',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 7881,
    logoUrl: `${CDN_BASE}/7881.png`,
    logoPath: 'clubs/club_venezia/logo.png',
    aliases: ['venezia', 'arancioneroverdi', 'i lagunari'],
  },
  {
    id: 'club_como',
    name: 'Como 1907',
    shortName: 'Como',
    country: 'Italy',
    league: 'Serie A',
    fotmobId: 9891,
    logoUrl: `${CDN_BASE}/9891.png`,
    logoPath: 'clubs/club_como/logo.png',
    aliases: ['como', 'i lariani', 'como 1907'],
  },

  // ---------------------------------------------------------------------------
  // 4. BUNDESLIGA (GERMANY - 18 CLUBS)
  // ---------------------------------------------------------------------------
  {
    id: 'club_bayern',
    name: 'FC Bayern München',
    shortName: 'Bayern Munich',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 9823,
    logoUrl: `${CDN_BASE}/9823.png`,
    logoPath: 'clubs/club_bayern/logo.png',
    aliases: ['bayern', 'bayern munich', 'bayern munchen', 'fc bayern', 'die bayern', 'fcb'],
  },
  {
    id: 'club_leverkusen',
    name: 'Bayer 04 Leverkusen',
    shortName: 'Leverkusen',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 8178,
    logoUrl: `${CDN_BASE}/8178.png`,
    logoPath: 'clubs/club_leverkusen/logo.png',
    aliases: ['leverkusen', 'bayer leverkusen', 'bayer 04', 'die werkself'],
  },
  {
    id: 'club_dortmund',
    name: 'Borussia Dortmund',
    shortName: 'Dortmund',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 9789,
    logoUrl: `${CDN_BASE}/9789.png`,
    logoPath: 'clubs/club_dortmund/logo.png',
    aliases: ['bvb', 'dortmund', 'borussia dortmund', 'bvb 09', 'die schwarzgelben'],
  },
  {
    id: 'club_leipzig',
    name: 'RB Leipzig',
    shortName: 'RB Leipzig',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 178475,
    logoUrl: `${CDN_BASE}/178475.png`,
    logoPath: 'clubs/club_leipzig/logo.png',
    aliases: ['leipzig', 'rb leipzig', 'die roten bullen'],
  },
  {
    id: 'club_frankfurt',
    name: 'Eintracht Frankfurt',
    shortName: 'Frankfurt',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 9810,
    logoUrl: `${CDN_BASE}/9810.png`,
    logoPath: 'clubs/club_frankfurt/logo.png',
    aliases: ['frankfurt', 'eintracht frankfurt', 'die adler', 'sge'],
  },
  {
    id: 'club_stuttgart',
    name: 'VfB Stuttgart',
    shortName: 'Stuttgart',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 10269,
    logoUrl: `${CDN_BASE}/10269.png`,
    logoPath: 'clubs/club_stuttgart/logo.png',
    aliases: ['stuttgart', 'vfb stuttgart', 'die schwaben'],
  },
  {
    id: 'club_wolfsburg',
    name: 'VfL Wolfsburg',
    shortName: 'Wolfsburg',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 8721,
    logoUrl: `${CDN_BASE}/8721.png`,
    logoPath: 'clubs/club_wolfsburg/logo.png',
    aliases: ['wolfsburg', 'vfl wolfsburg', 'die wolfe'],
  },
  {
    id: 'club_freiburg',
    name: 'SC Freiburg',
    shortName: 'Freiburg',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 8358,
    logoUrl: `${CDN_BASE}/8358.png`,
    logoPath: 'clubs/club_freiburg/logo.png',
    aliases: ['freiburg', 'sc freiburg', 'breisgau-brasilianer'],
  },
  {
    id: 'club_hoffenheim',
    name: 'TSG 1899 Hoffenheim',
    shortName: 'Hoffenheim',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 8226,
    logoUrl: `${CDN_BASE}/8226.png`,
    logoPath: 'clubs/club_hoffenheim/logo.png',
    aliases: ['hoffenheim', 'tsg hoffenheim', 'die kraichgauer'],
  },
  {
    id: 'club_monchengladbach',
    name: 'Borussia Mönchengladbach',
    shortName: 'M\'gladbach',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 9788,
    logoUrl: `${CDN_BASE}/9788.png`,
    logoPath: 'clubs/club_monchengladbach/logo.png',
    aliases: ['gladbach', 'monchengladbach', 'mönchengladbach', 'borussia monchengladbach', 'die fohlen'],
  },
  {
    id: 'club_werder_bremen',
    name: 'SV Werder Bremen',
    shortName: 'Werder Bremen',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 8697,
    logoUrl: `${CDN_BASE}/8697.png`,
    logoPath: 'clubs/club_werder_bremen/logo.png',
    aliases: ['bremen', 'werder', 'werder bremen', 'die grun-weissen'],
  },
  {
    id: 'club_union_berlin',
    name: '1. FC Union Berlin',
    shortName: 'Union Berlin',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 8467,
    logoUrl: `${CDN_BASE}/8467.png`,
    logoPath: 'clubs/club_union_berlin/logo.png',
    aliases: ['union berlin', '1 fc union berlin', 'eisern union'],
  },
  {
    id: 'club_augsburg',
    name: 'FC Augsburg',
    shortName: 'Augsburg',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 8406,
    logoUrl: `${CDN_BASE}/8406.png`,
    logoPath: 'clubs/club_augsburg/logo.png',
    aliases: ['augsburg', 'fc augsburg', 'fuggerstadter'],
  },
  {
    id: 'club_mainz',
    name: '1. FSV Mainz 05',
    shortName: 'Mainz 05',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 9905,
    logoUrl: `${CDN_BASE}/9905.png`,
    logoPath: 'clubs/club_mainz/logo.png',
    aliases: ['mainz', 'mainz 05', '1 fsv mainz 05', 'die nullfunfer'],
  },
  {
    id: 'club_heidenheim',
    name: '1. FC Heidenheim 1846',
    shortName: 'Heidenheim',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 94937,
    logoUrl: `${CDN_BASE}/94937.png`,
    logoPath: 'clubs/club_heidenheim/logo.png',
    aliases: ['heidenheim', '1 fc heidenheim'],
  },
  {
    id: 'club_st_pauli',
    name: 'FC St. Pauli',
    shortName: 'St. Pauli',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 8152,
    logoUrl: `${CDN_BASE}/8152.png`,
    logoPath: 'clubs/club_st_pauli/logo.png',
    aliases: ['st pauli', 'st. pauli', 'kiezkicker'],
  },
  {
    id: 'club_holstein_kiel',
    name: 'Holstein Kiel',
    shortName: 'Holstein Kiel',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 8295,
    logoUrl: `${CDN_BASE}/8295.png`,
    logoPath: 'clubs/club_holstein_kiel/logo.png',
    aliases: ['kiel', 'holstein kiel', 'die storche'],
  },
  {
    id: 'club_bochum',
    name: 'VfL Bochum 1848',
    shortName: 'Bochum',
    country: 'Germany',
    league: 'Bundesliga',
    fotmobId: 9911,
    logoUrl: `${CDN_BASE}/9911.png`,
    logoPath: 'clubs/club_bochum/logo.png',
    aliases: ['bochum', 'vfl bochum', 'die unabsteigbaren'],
  },

  // ---------------------------------------------------------------------------
  // 5. LIGUE 1 (FRANCE - 18 CLUBS)
  // ---------------------------------------------------------------------------
  {
    id: 'club_psg',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 9847,
    logoUrl: `${CDN_BASE}/9847.png`,
    logoPath: 'clubs/club_psg/logo.png',
    aliases: ['psg', 'paris saint-germain', 'paris sg', 'paris', 'les parisiens'],
  },
  {
    id: 'club_monaco',
    name: 'AS Monaco FC',
    shortName: 'Monaco',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 9829,
    logoUrl: `${CDN_BASE}/9829.png`,
    logoPath: 'clubs/club_monaco/logo.png',
    aliases: ['monaco', 'as monaco', 'les monegasques', 'asm'],
  },
  {
    id: 'club_marseille',
    name: 'Olympique de Marseille',
    shortName: 'Marseille',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 8592,
    logoUrl: `${CDN_BASE}/8592.png`,
    logoPath: 'clubs/club_marseille/logo.png',
    aliases: ['marseille', 'om', 'olympique marseille', 'les olympiens'],
  },
  {
    id: 'club_lille',
    name: 'Lille OSC',
    shortName: 'Lille',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 8639,
    logoUrl: `${CDN_BASE}/8639.png`,
    logoPath: 'clubs/club_lille/logo.png',
    aliases: ['lille', 'losc', 'lille osc', 'les dogues'],
  },
  {
    id: 'club_lyon',
    name: 'Olympique Lyonnais',
    shortName: 'Lyon',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 9748,
    logoUrl: `${CDN_BASE}/9748.png`,
    logoPath: 'clubs/club_lyon/logo.png',
    aliases: ['lyon', 'ol', 'olympique lyon', 'les gones'],
  },
  {
    id: 'club_nice',
    name: 'OGC Nice',
    shortName: 'Nice',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 9831,
    logoUrl: `${CDN_BASE}/9831.png`,
    logoPath: 'clubs/club_nice/logo.png',
    aliases: ['nice', 'ogc nice', 'les aiglons'],
  },
  {
    id: 'club_lens',
    name: 'RC Lens',
    shortName: 'Lens',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 8588,
    logoUrl: `${CDN_BASE}/8588.png`,
    logoPath: 'clubs/club_lens/logo.png',
    aliases: ['lens', 'rc lens', 'les sang et or'],
  },
  {
    id: 'club_rennes',
    name: 'Stade Rennais FC',
    shortName: 'Rennes',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 9851,
    logoUrl: `${CDN_BASE}/9851.png`,
    logoPath: 'clubs/club_rennes/logo.png',
    aliases: ['rennes', 'stade rennais', 'les rouge et noir'],
  },
  {
    id: 'club_strasbourg',
    name: 'RC Strasbourg Alsace',
    shortName: 'Strasbourg',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 9848,
    logoUrl: `${CDN_BASE}/9848.png`,
    logoPath: 'clubs/club_strasbourg/logo.png',
    aliases: ['strasbourg', 'rc strasbourg', 'racing'],
  },
  {
    id: 'club_brest',
    name: 'Stade Brestois 29',
    shortName: 'Brest',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 8521,
    logoUrl: `${CDN_BASE}/8521.png`,
    logoPath: 'clubs/club_brest/logo.png',
    aliases: ['brest', 'stade brestois', 'les ti-zefs'],
  },
  {
    id: 'club_reims',
    name: 'Stade de Reims',
    shortName: 'Reims',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 9837,
    logoUrl: `${CDN_BASE}/9837.png`,
    logoPath: 'clubs/club_reims/logo.png',
    aliases: ['reims', 'stade reims', 'les rouges et blancs'],
  },
  {
    id: 'club_montpellier',
    name: 'Montpellier HSC',
    shortName: 'Montpellier',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 10249,
    logoUrl: `${CDN_BASE}/10249.png`,
    logoPath: 'clubs/club_montpellier/logo.png',
    aliases: ['montpellier', 'mhsc', 'la paillade'],
  },
  {
    id: 'club_nantes',
    name: 'FC Nantes',
    shortName: 'Nantes',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 9830,
    logoUrl: `${CDN_BASE}/9830.png`,
    logoPath: 'clubs/club_nantes/logo.png',
    aliases: ['nantes', 'fc nantes', 'les canaris'],
  },
  {
    id: 'club_toulouse',
    name: 'Toulouse FC',
    shortName: 'Toulouse',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 9941,
    logoUrl: `${CDN_BASE}/9941.png`,
    logoPath: 'clubs/club_toulouse/logo.png',
    aliases: ['toulouse', 'tfc', 'les violets'],
  },
  {
    id: 'club_auxerre',
    name: 'AJ Auxerre',
    shortName: 'Auxerre',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 8583,
    logoUrl: `${CDN_BASE}/8583.png`,
    logoPath: 'clubs/club_auxerre/logo.png',
    aliases: ['auxerre', 'aj auxerre', 'aja'],
  },
  {
    id: 'club_angers',
    name: 'Angers SCO',
    shortName: 'Angers',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 8121,
    logoUrl: `${CDN_BASE}/8121.png`,
    logoPath: 'clubs/club_angers/logo.png',
    aliases: ['angers', 'angers sco', 'le sco'],
  },
  {
    id: 'club_saint_etienne',
    name: 'AS Saint-Étienne',
    shortName: 'Saint-Étienne',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 8682,
    logoUrl: `${CDN_BASE}/8682.png`,
    logoPath: 'clubs/club_saint_etienne/logo.png',
    aliases: ['saint etienne', 'saint-etienne', 'asse', 'les verts'],
  },
  {
    id: 'club_le_havre',
    name: 'Le Havre AC',
    shortName: 'Le Havre',
    country: 'France',
    league: 'Ligue 1',
    fotmobId: 9747,
    logoUrl: `${CDN_BASE}/9747.png`,
    logoPath: 'clubs/club_le_havre/logo.png',
    aliases: ['le havre', 'hac', 'le havre ac', 'ciel et marine'],
  },

  // ---------------------------------------------------------------------------
  // 6. CONTINENTAL & GLOBAL GIANTS
  // ---------------------------------------------------------------------------
  // Portugal
  {
    id: 'club_benfica',
    name: 'SL Benfica',
    shortName: 'Benfica',
    country: 'Portugal',
    league: 'Primeira Liga',
    fotmobId: 9772,
    logoUrl: `${CDN_BASE}/9772.png`,
    logoPath: 'clubs/club_benfica/logo.png',
    aliases: ['benfica', 'sl benfica', 'as aguias', 'os encarnados'],
  },
  {
    id: 'club_porto',
    name: 'FC Porto',
    shortName: 'Porto',
    country: 'Portugal',
    league: 'Primeira Liga',
    fotmobId: 9773,
    logoUrl: `${CDN_BASE}/9773.png`,
    logoPath: 'clubs/club_porto/logo.png',
    aliases: ['porto', 'fc porto', 'dragoes', 'os dragoes'],
  },
  {
    id: 'club_sporting',
    name: 'Sporting Clube de Portugal',
    shortName: 'Sporting CP',
    country: 'Portugal',
    league: 'Primeira Liga',
    fotmobId: 9768,
    logoUrl: `${CDN_BASE}/9768.png`,
    logoPath: 'clubs/club_sporting/logo.png',
    aliases: ['sporting', 'sporting cp', 'sporting lisbon', 'os leoes'],
  },
  {
    id: 'club_braga',
    name: 'SC Braga',
    shortName: 'Braga',
    country: 'Portugal',
    league: 'Primeira Liga',
    fotmobId: 10264,
    logoUrl: `${CDN_BASE}/10264.png`,
    logoPath: 'clubs/club_braga/logo.png',
    aliases: ['braga', 'sc braga', 'os arsenalistas'],
  },
  // Netherlands
  {
    id: 'club_ajax',
    name: 'AFC Ajax',
    shortName: 'Ajax',
    country: 'Netherlands',
    league: 'Eredivisie',
    fotmobId: 8593,
    logoUrl: `${CDN_BASE}/8593.png`,
    logoPath: 'clubs/club_ajax/logo.png',
    aliases: ['ajax', 'afc ajax', 'de godenzonen', 'amsterdam'],
  },
  {
    id: 'club_psv',
    name: 'PSV Eindhoven',
    shortName: 'PSV',
    country: 'Netherlands',
    league: 'Eredivisie',
    fotmobId: 8640,
    logoUrl: `${CDN_BASE}/8640.png`,
    logoPath: 'clubs/club_psv/logo.png',
    aliases: ['psv', 'psv eindhoven', 'boeren'],
  },
  {
    id: 'club_feyenoord',
    name: 'Feyenoord Rotterdam',
    shortName: 'Feyenoord',
    country: 'Netherlands',
    league: 'Eredivisie',
    fotmobId: 10235,
    logoUrl: `${CDN_BASE}/10235.png`,
    logoPath: 'clubs/club_feyenoord/logo.png',
    aliases: ['feyenoord', 'de club aan de maas', 'rotterdam'],
  },
  // Scotland
  {
    id: 'club_celtic',
    name: 'Celtic FC',
    shortName: 'Celtic',
    country: 'Scotland',
    league: 'Scottish Premiership',
    fotmobId: 9925,
    logoUrl: `${CDN_BASE}/9925.png`,
    logoPath: 'clubs/club_celtic/logo.png',
    aliases: ['celtic', 'the bhoys', 'the hoops', 'celtic fc'],
  },
  {
    id: 'club_rangers',
    name: 'Rangers FC',
    shortName: 'Rangers',
    country: 'Scotland',
    league: 'Scottish Premiership',
    fotmobId: 8548,
    logoUrl: `${CDN_BASE}/8548.png`,
    logoPath: 'clubs/club_rangers/logo.png',
    aliases: ['rangers', 'the gers', 'rangers fc', 'glasgow rangers'],
  },
  // Turkey
  {
    id: 'club_galatasaray',
    name: 'Galatasaray SK',
    shortName: 'Galatasaray',
    country: 'Turkey',
    league: 'Super Lig',
    fotmobId: 8637,
    logoUrl: `${CDN_BASE}/8637.png`,
    logoPath: 'clubs/club_galatasaray/logo.png',
    aliases: ['galatasaray', 'cimbom', 'aslanlar'],
  },
  {
    id: 'club_fenerbahce',
    name: 'Fenerbahçe SK',
    shortName: 'Fenerbahce',
    country: 'Turkey',
    league: 'Super Lig',
    fotmobId: 8695,
    logoUrl: `${CDN_BASE}/8695.png`,
    logoPath: 'clubs/club_fenerbahce/logo.png',
    aliases: ['fenerbahce', 'fenerbahçe', 'sari kanaryalar'],
  },
  {
    id: 'club_besiktas',
    name: 'Beşiktaş JK',
    shortName: 'Besiktas',
    country: 'Turkey',
    league: 'Super Lig',
    fotmobId: 10188,
    logoUrl: `${CDN_BASE}/10188.png`,
    logoPath: 'clubs/club_besiktas/logo.png',
    aliases: ['besiktas', 'beşiktaş', 'kara kartallar'],
  },
  // Saudi Pro League
  {
    id: 'club_al_hilal',
    name: 'Al-Hilal SFC',
    shortName: 'Al-Hilal',
    country: 'Saudi Arabia',
    league: 'Saudi Pro League',
    fotmobId: 85906,
    logoUrl: `${CDN_BASE}/85906.png`,
    logoPath: 'clubs/club_al_hilal/logo.png',
    aliases: ['al hilal', 'al-hilal', 'the blue waves', 'alzaeem'],
  },
  {
    id: 'club_al_nassr',
    name: 'Al-Nassr FC',
    shortName: 'Al-Nassr',
    country: 'Saudi Arabia',
    league: 'Saudi Pro League',
    fotmobId: 85907,
    logoUrl: `${CDN_BASE}/85907.png`,
    logoPath: 'clubs/club_al_nassr/logo.png',
    aliases: ['al nassr', 'al-nassr', 'fars najd', 'nassr'],
  },
  {
    id: 'club_al_ittihad',
    name: 'Al-Ittihad Club',
    shortName: 'Al-Ittihad',
    country: 'Saudi Arabia',
    league: 'Saudi Pro League',
    fotmobId: 85905,
    logoUrl: `${CDN_BASE}/85905.png`,
    logoPath: 'clubs/club_al_ittihad/logo.png',
    aliases: ['al ittihad', 'al-ittihad', 'al ameed'],
  },
  // MLS
  {
    id: 'club_inter_miami',
    name: 'Inter Miami CF',
    shortName: 'Inter Miami',
    country: 'USA',
    league: 'MLS',
    fotmobId: 1150824,
    logoUrl: `${CDN_BASE}/1150824.png`,
    logoPath: 'clubs/club_inter_miami/logo.png',
    aliases: ['inter miami', 'miami', 'the herons', 'messi miami'],
  },
  // South America
  {
    id: 'club_flamengo',
    name: 'CR Flamengo',
    shortName: 'Flamengo',
    country: 'Brazil',
    league: 'Brasileirao',
    fotmobId: 5981,
    logoUrl: `${CDN_BASE}/5981.png`,
    logoPath: 'clubs/club_flamengo/logo.png',
    aliases: ['flamengo', 'mengao', 'rubro-negro'],
  },
  {
    id: 'club_palmeiras',
    name: 'SE Palmeiras',
    shortName: 'Palmeiras',
    country: 'Brazil',
    league: 'Brasileirao',
    fotmobId: 10276,
    logoUrl: `${CDN_BASE}/10276.png`,
    logoPath: 'clubs/club_palmeiras/logo.png',
    aliases: ['palmeiras', 'verdao', 'alviverde'],
  },
  {
    id: 'club_river_plate',
    name: 'CA River Plate',
    shortName: 'River Plate',
    country: 'Argentina',
    league: 'Liga Profesional',
    fotmobId: 10086,
    logoUrl: `${CDN_BASE}/10086.png`,
    logoPath: 'clubs/club_river_plate/logo.png',
    aliases: ['river', 'river plate', 'los millonarios'],
  },
  {
    id: 'club_boca_juniors',
    name: 'CA Boca Juniors',
    shortName: 'Boca Juniors',
    country: 'Argentina',
    league: 'Liga Profesional',
    fotmobId: 10083,
    logoUrl: `${CDN_BASE}/10083.png`,
    logoPath: 'clubs/club_boca_juniors/logo.png',
    aliases: ['boca', 'boca juniors', 'xeneizes'],
  },
];

// -----------------------------------------------------------------------------
// Auto-Dictation Engine & Normalizer
// -----------------------------------------------------------------------------

// Noise prefixes, suffixes, and filler tokens
const NOISE_WORDS = new Set([
  'fc', 'cf', 'afc', 'sc', 'ac', 'as', 'ss', 'rc', 'ud', 'ca', 'rcd',
  'vfb', 'vfl', 'tsg', 'fsv', 'sv', 'ogc', 'aj', 'sco', 'cd', 'bsc',
  'sk', 'fk', 'cr', 'se', 'sfc', 'jk', 'cimbom', 'football', 'club',
  'futbol', 'calcio', 'deportivo', 'clube', 'the', 'los', 'les', 'die',
  'de', 'del', 'la', 'le', '1', '04', '05', '09', '1899', '1907', '1909',
  '1913', '1846', '1848', '29', 'united', 'city', 'town', 'hotspur',
  'wanderers', 'albion', 'rovers', 'athletic', 'sporting', 'balompie',
]);

/**
 * Normalizes string: decomposes accents, strips non-alphanumeric, lowercases.
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // replace punctuation with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts essential core tokens from a team name by stripping noise prefixes/suffixes.
 */
export function extractCoreTokens(str: string): string[] {
  const norm = normalizeString(str);
  if (!norm) return [];
  const tokens = norm.split(' ');
  const filtered = tokens.filter((t) => !NOISE_WORDS.has(t) && t.length > 1);
  return filtered.length > 0 ? filtered : tokens;
}

/**
 * Computes Dice Coefficient / Token Overlap Similarity between two strings.
 */
export function calculateTokenSimilarity(queryTokens: string[], targetTokens: string[]): number {
  if (queryTokens.length === 0 || targetTokens.length === 0) return 0;

  let matches = 0;
  for (const q of queryTokens) {
    if (targetTokens.some((t) => t === q || t.startsWith(q) || q.startsWith(t))) {
      matches += 1;
    }
  }

  const denominator = queryTokens.length + targetTokens.length;
  return Math.min(100, Math.round((2 * matches * 100) / denominator));
}

/**
 * Intelligent Auto-Dictation Engine:
 * Resolves club and logo automatically even if misplaced ("Madrid Real", "City Man", "Hotspur Tottenham"),
 * prefixed ("FC Arsenal", "AFC Bournemouth", "Club Atletico Madrid"),
 * informal ("PSG", "Spurs", "Wolves", "Atleti", "BVB", "Barca"),
 * or mis-spaced.
 */
export function dictateClub(rawInput: string): DictationResult {
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      club: null,
      confidence: 0,
      matchReason: 'Empty query',
      normalizedQuery: '',
    };
  }

  const queryNorm = normalizeString(rawInput);
  const queryTokens = extractCoreTokens(rawInput);
  const querySorted = [...queryTokens].sort().join(' ');

  // 1. Direct ID / slug exact match
  const directIdMatch = MAJOR_CLUBS.find(
    (c) => c.id === rawInput.trim() || c.id === `club_${queryNorm.replace(/\s+/g, '_')}`
  );
  if (directIdMatch) {
    return {
      club: directIdMatch,
      confidence: 100,
      matchReason: 'Exact club ID match',
      normalizedQuery: queryNorm,
    };
  }

  // 2. Exact alias match
  for (const club of MAJOR_CLUBS) {
    for (const alias of club.aliases) {
      const aliasNorm = normalizeString(alias);
      if (aliasNorm === queryNorm) {
        return {
          club,
          confidence: 99,
          matchReason: `Exact alias match ('${alias}')`,
          normalizedQuery: queryNorm,
        };
      }
    }
  }

  // 3. Exact Name or ShortName match
  for (const club of MAJOR_CLUBS) {
    const nameNorm = normalizeString(club.name);
    const shortNorm = normalizeString(club.shortName);
    if (nameNorm === queryNorm || shortNorm === queryNorm) {
      return {
        club,
        confidence: 98,
        matchReason: `Exact canonical name match ('${club.name}')`,
        normalizedQuery: queryNorm,
      };
    }
  }

  // 4. Misplaced Words Match (Token Bag Match)
  // Handles: "Madrid Real" -> Real Madrid, "City Manchester" -> Manchester City, "Munich Bayern" -> Bayern Munich
  for (const club of MAJOR_CLUBS) {
    const clubCoreTokens = extractCoreTokens(club.name);
    const clubSorted = [...clubCoreTokens].sort().join(' ');
    if (querySorted === clubSorted && querySorted.length > 0) {
      return {
        club,
        confidence: 95,
        matchReason: `Misplaced words resolved (ordered tokens match '${club.name}')`,
        normalizedQuery: queryNorm,
      };
    }

    const shortCoreTokens = extractCoreTokens(club.shortName);
    const shortSorted = [...shortCoreTokens].sort().join(' ');
    if (querySorted === shortSorted && querySorted.length > 0) {
      return {
        club,
        confidence: 94,
        matchReason: `Misplaced words resolved against short name ('${club.shortName}')`,
        normalizedQuery: queryNorm,
      };
    }
  }

  // 5. Prefix / Suffix Stripped Core Substring Match
  // Handles: "FC Arsenal" -> "arsenal", "AFC Bournemouth" -> "bournemouth"
  if (queryTokens.length > 0) {
    for (const club of MAJOR_CLUBS) {
      const clubCore = extractCoreTokens(club.name).join(' ');
      const shortCore = extractCoreTokens(club.shortName).join(' ');
      const qJoined = queryTokens.join(' ');

      if (clubCore === qJoined || shortCore === qJoined) {
        return {
          club,
          confidence: 92,
          matchReason: `Core keyword match after prefix stripping ('${club.name}')`,
          normalizedQuery: queryNorm,
        };
      }
    }
  }

  // 6. Substring Containment / Partial Alias Match
  for (const club of MAJOR_CLUBS) {
    // Check if query is contained in club name or vice versa
    const nameNorm = normalizeString(club.name);
    const shortNorm = normalizeString(club.shortName);

    if (queryNorm.length >= 4 && (nameNorm.includes(queryNorm) || shortNorm.includes(queryNorm))) {
      return {
        club,
        confidence: 88,
        matchReason: `Substring inclusion match ('${club.name}')`,
        normalizedQuery: queryNorm,
      };
    }

    for (const alias of club.aliases) {
      const aliasNorm = normalizeString(alias);
      if (queryNorm.length >= 3 && (aliasNorm.includes(queryNorm) || queryNorm.includes(aliasNorm))) {
        return {
          club,
          confidence: 85,
          matchReason: `Fuzzy alias association ('${alias}')`,
          normalizedQuery: queryNorm,
        };
      }
    }
  }

  // 7. Token Similarity Scoring (Fuzzy / Token Overlap)
  let bestScore = 0;
  let bestClub: ClubInfo | null = null;
  let bestReason = '';

  for (const club of MAJOR_CLUBS) {
    const clubTokens = extractCoreTokens(club.name);
    const score = calculateTokenSimilarity(queryTokens, clubTokens);

    if (score > bestScore) {
      bestScore = score;
      bestClub = club;
      bestReason = `Token similarity score ${score}% with '${club.name}'`;
    }

    // Also compare against aliases
    for (const alias of club.aliases) {
      const aliasTokens = extractCoreTokens(alias);
      const aliasScore = calculateTokenSimilarity(queryTokens, aliasTokens);
      if (aliasScore > bestScore) {
        bestScore = aliasScore;
        bestClub = club;
        bestReason = `Token similarity score ${aliasScore}% with alias '${alias}'`;
      }
    }
  }

  // Threshold: $\ge 60\%$ confidence dictates match
  if (bestScore >= 60 && bestClub) {
    return {
      club: bestClub,
      confidence: bestScore,
      matchReason: bestReason,
      normalizedQuery: queryNorm,
    };
  }

  return {
    club: null,
    confidence: bestScore,
    matchReason: 'No high-confidence match found',
    normalizedQuery: queryNorm,
  };
}

/**
 * Helper to auto-resolve both home and away club logos for any fixture.
 */
export function dictateFixtureLogos(homeStr: string, awayStr: string) {
  const homeRes = dictateClub(homeStr);
  const awayRes = dictateClub(awayStr);

  return {
    homeClub: homeRes.club,
    awayClub: awayRes.club,
    homeLogoUrl: homeRes.club?.logoUrl || null,
    awayLogoUrl: awayRes.club?.logoUrl || null,
    homeClubId: homeRes.club?.id || null,
    awayClubId: awayRes.club?.id || null,
    homeConfidence: homeRes.confidence,
    awayConfidence: awayRes.confidence,
  };
}
