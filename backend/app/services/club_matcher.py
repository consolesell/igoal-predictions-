import re
from typing import Optional, Dict, Any, List

# Core dictionary of major clubs across top leagues
MAJOR_CLUBS_DATA = [
    # Premier League
    {"id": "club_arsenal", "name": "Arsenal FC", "short_name": "Arsenal", "country": "England", "league": "Premier League", "fotmob_id": 9825, "aliases": ["gunners", "the gunners", "afc", "arsenal fc"]},
    {"id": "club_aston_villa", "name": "Aston Villa FC", "short_name": "Aston Villa", "country": "England", "league": "Premier League", "fotmob_id": 10252, "aliases": ["villa", "avfc"]},
    {"id": "club_bournemouth", "name": "AFC Bournemouth", "short_name": "Bournemouth", "country": "England", "league": "Premier League", "fotmob_id": 8678, "aliases": ["afc bournemouth", "cherries"]},
    {"id": "club_brentford", "name": "Brentford FC", "short_name": "Brentford", "country": "England", "league": "Premier League", "fotmob_id": 9937, "aliases": ["bees"]},
    {"id": "club_brighton", "name": "Brighton & Hove Albion", "short_name": "Brighton", "country": "England", "league": "Premier League", "fotmob_id": 10204, "aliases": ["seagulls", "brighton hove albion", "bhafc"]},
    {"id": "club_chelsea", "name": "Chelsea FC", "short_name": "Chelsea", "country": "England", "league": "Premier League", "fotmob_id": 8455, "aliases": ["blues", "cfc", "chelsea fc"]},
    {"id": "club_crystal_palace", "name": "Crystal Palace FC", "short_name": "Crystal Palace", "country": "England", "league": "Premier League", "fotmob_id": 9826, "aliases": ["palace", "cpfc", "eagles"]},
    {"id": "club_everton", "name": "Everton FC", "short_name": "Everton", "country": "England", "league": "Premier League", "fotmob_id": 8668, "aliases": ["toffees", "efc"]},
    {"id": "club_fulham", "name": "Fulham FC", "short_name": "Fulham", "country": "England", "league": "Premier League", "fotmob_id": 9879, "aliases": ["cottagers"]},
    {"id": "club_ipswich", "name": "Ipswich Town FC", "short_name": "Ipswich", "country": "England", "league": "Premier League", "fotmob_id": 9406, "aliases": ["tractor boys", "itfc"]},
    {"id": "club_leicester", "name": "Leicester City FC", "short_name": "Leicester", "country": "England", "league": "Premier League", "fotmob_id": 8197, "aliases": ["foxes", "lcfc"]},
    {"id": "club_liverpool", "name": "Liverpool FC", "short_name": "Liverpool", "country": "England", "league": "Premier League", "fotmob_id": 8650, "aliases": ["reds", "lfc", "liverpool fc"]},
    {"id": "club_mancity", "name": "Manchester City FC", "short_name": "Man City", "country": "England", "league": "Premier League", "fotmob_id": 8456, "aliases": ["man city", "mcfc", "citizens", "city"]},
    {"id": "club_manunited", "name": "Manchester United FC", "short_name": "Man United", "country": "England", "league": "Premier League", "fotmob_id": 10260, "aliases": ["man united", "man utd", "mufc", "red devils"]},
    {"id": "club_newcastle", "name": "Newcastle United FC", "short_name": "Newcastle", "country": "England", "league": "Premier League", "fotmob_id": 10261, "aliases": ["magpies", "nufc"]},
    {"id": "club_nottingham", "name": "Nottingham Forest FC", "short_name": "Nottm Forest", "country": "England", "league": "Premier League", "fotmob_id": 10203, "aliases": ["forest", "notts forest"]},
    {"id": "club_southampton", "name": "Southampton FC", "short_name": "Southampton", "country": "England", "league": "Premier League", "fotmob_id": 8466, "aliases": ["saints", "sfc"]},
    {"id": "club_tottenham", "name": "Tottenham Hotspur FC", "short_name": "Tottenham", "country": "England", "league": "Premier League", "fotmob_id": 8586, "aliases": ["spurs", "tottenham", "thfc"]},
    {"id": "club_westham", "name": "West Ham United FC", "short_name": "West Ham", "country": "England", "league": "Premier League", "fotmob_id": 8654, "aliases": ["hammers", "irons", "whufc"]},
    {"id": "club_wolves", "name": "Wolverhampton Wanderers FC", "short_name": "Wolves", "country": "England", "league": "Premier League", "fotmob_id": 8659, "aliases": ["wolves", "wwfc"]},

    # La Liga
    {"id": "club_realmadrid", "name": "Real Madrid CF", "short_name": "Real Madrid", "country": "Spain", "league": "La Liga", "fotmob_id": 8633, "aliases": ["los blancos", "rmcf", "madrid"]},
    {"id": "club_barcelona", "name": "FC Barcelona", "short_name": "Barcelona", "country": "Spain", "league": "La Liga", "fotmob_id": 8634, "aliases": ["barca", "barça", "blaugrana", "fcb"]},
    {"id": "club_atletico", "name": "Club Atlético de Madrid", "short_name": "Atletico Madrid", "country": "Spain", "league": "La Liga", "fotmob_id": 9906, "aliases": ["atleti", "atletico", "colchoneros"]},
    {"id": "club_athletic_bilbao", "name": "Athletic Club Bilbao", "short_name": "Athletic Club", "country": "Spain", "league": "La Liga", "fotmob_id": 8315, "aliases": ["bilbao", "athletic bilbao"]},
    {"id": "club_realsociedad", "name": "Real Sociedad", "short_name": "Real Sociedad", "country": "Spain", "league": "La Liga", "fotmob_id": 8560, "aliases": ["sociedad", "la real"]},
    {"id": "club_realbetis", "name": "Real Betis", "short_name": "Real Betis", "country": "Spain", "league": "La Liga", "fotmob_id": 8603, "aliases": ["betis", "verdiblancos"]},
    {"id": "club_villarreal", "name": "Villarreal CF", "short_name": "Villarreal", "country": "Spain", "league": "La Liga", "fotmob_id": 10205, "aliases": ["villareal", "yellow submarine"]},
    {"id": "club_sevilla", "name": "Sevilla FC", "short_name": "Sevilla", "country": "Spain", "league": "La Liga", "fotmob_id": 8302, "aliases": ["sevilla", "palanganas"]},

    # Serie A
    {"id": "club_inter", "name": "FC Internazionale Milano", "short_name": "Inter", "country": "Italy", "league": "Serie A", "fotmob_id": 8636, "aliases": ["inter", "inter milan", "nerazzurri"]},
    {"id": "club_milan", "name": "AC Milan", "short_name": "Milan", "country": "Italy", "league": "Serie A", "fotmob_id": 8564, "aliases": ["milan", "ac milan", "rossoneri"]},
    {"id": "club_juventus", "name": "Juventus FC", "short_name": "Juventus", "country": "Italy", "league": "Serie A", "fotmob_id": 9885, "aliases": ["juve", "bianconeri"]},
    {"id": "club_napoli", "name": "SSC Napoli", "short_name": "Napoli", "country": "Italy", "league": "Serie A", "fotmob_id": 9875, "aliases": ["napoli", "partenopei"]},
    {"id": "club_atalanta", "name": "Atalanta BC", "short_name": "Atalanta", "country": "Italy", "league": "Serie A", "fotmob_id": 8524, "aliases": ["atalanta", "la dea"]},
    {"id": "club_roma", "name": "AS Roma", "short_name": "Roma", "country": "Italy", "league": "Serie A", "fotmob_id": 8686, "aliases": ["roma", "giallorossi"]},
    {"id": "club_lazio", "name": "SS Lazio", "short_name": "Lazio", "country": "Italy", "league": "Serie A", "fotmob_id": 8543, "aliases": ["lazio", "biancocelesti"]},

    # Bundesliga
    {"id": "club_bayern", "name": "FC Bayern München", "short_name": "Bayern Munich", "country": "Germany", "league": "Bundesliga", "fotmob_id": 9823, "aliases": ["bayern", "fc bayern", "bayern munich", "die bayern"]},
    {"id": "club_leverkusen", "name": "Bayer 04 Leverkusen", "short_name": "Leverkusen", "country": "Germany", "league": "Bundesliga", "fotmob_id": 8178, "aliases": ["leverkusen", "bayer leverkusen", "die werkself"]},
    {"id": "club_dortmund", "name": "Borussia Dortmund", "short_name": "Dortmund", "country": "Germany", "league": "Bundesliga", "fotmob_id": 9789, "aliases": ["dortmund", "bvb", "bvb 09"]},
    {"id": "club_leipzig", "name": "RB Leipzig", "short_name": "RB Leipzig", "country": "Germany", "league": "Bundesliga", "fotmob_id": 178475, "aliases": ["leipzig", "die roten bullen"]},
    {"id": "club_frankfurt", "name": "Eintracht Frankfurt", "short_name": "Frankfurt", "country": "Germany", "league": "Bundesliga", "fotmob_id": 9810, "aliases": ["frankfurt", "die adler"]},

    # Ligue 1
    {"id": "club_psg", "name": "Paris Saint-Germain", "short_name": "PSG", "country": "France", "league": "Ligue 1", "fotmob_id": 9847, "aliases": ["psg", "paris", "paris sg"]},
    {"id": "club_monaco", "name": "AS Monaco", "short_name": "Monaco", "country": "France", "league": "Ligue 1", "fotmob_id": 9829, "aliases": ["monaco", "as monaco"]},
    {"id": "club_marseille", "name": "Olympique de Marseille", "short_name": "Marseille", "country": "France", "league": "Ligue 1", "fotmob_id": 8592, "aliases": ["marseille", "om"]},

    # Continental / Global
    {"id": "club_benfica", "name": "SL Benfica", "short_name": "Benfica", "country": "Portugal", "league": "Primeira Liga", "fotmob_id": 9772, "aliases": ["benfica"]},
    {"id": "club_porto", "name": "FC Porto", "short_name": "Porto", "country": "Portugal", "league": "Primeira Liga", "fotmob_id": 9773, "aliases": ["porto"]},
    {"id": "club_sporting", "name": "Sporting CP", "short_name": "Sporting CP", "country": "Portugal", "league": "Primeira Liga", "fotmob_id": 9768, "aliases": ["sporting", "sporting lisbon"]},
    {"id": "club_ajax", "name": "AFC Ajax", "short_name": "Ajax", "country": "Netherlands", "league": "Eredivisie", "fotmob_id": 8593, "aliases": ["ajax"]},
    {"id": "club_al_hilal", "name": "Al-Hilal SFC", "short_name": "Al-Hilal", "country": "Saudi Arabia", "league": "Saudi Pro League", "fotmob_id": 85906, "aliases": ["al hilal"]},
    {"id": "club_al_nassr", "name": "Al-Nassr FC", "short_name": "Al-Nassr", "country": "Saudi Arabia", "league": "Saudi Pro League", "fotmob_id": 85907, "aliases": ["al nassr"]},
    {"id": "club_inter_miami", "name": "Inter Miami CF", "short_name": "Inter Miami", "country": "USA", "league": "MLS", "fotmob_id": 1150824, "aliases": ["inter miami", "miami"]},
]

NOISE_WORDS = {
    'fc', 'cf', 'afc', 'sc', 'ac', 'as', 'ss', 'rc', 'ud', 'ca', 'vfb', 'vfl', '1',
    'the', 'los', 'les', 'die', 'de', 'del', 'la', 'le', 'united', 'city', 'town',
    'hotspur', 'wanderers', 'albion', 'club', 'football'
}

def normalize_text(text: str) -> str:
    if not text:
        return ""
    norm = text.lower()
    norm = re.sub(r'[^a-z0-9\s]', ' ', norm)
    norm = re.sub(r'\s+', ' ', norm).strip()
    return norm

def extract_core_tokens(text: str) -> List[str]:
    norm = normalize_text(text)
    if not norm:
        return []
    tokens = norm.split(' ')
    filtered = [t for t in tokens if t not in NOISE_WORDS and len(t) > 1]
    return filtered if filtered else tokens

def dictate_club(query: str) -> Dict[str, Any]:
    if not query or not query.strip():
        return {"club": None, "confidence": 0, "match_reason": "Empty query"}

    norm_query = normalize_text(query)
    query_tokens = extract_core_tokens(query)
    query_sorted = " ".join(sorted(query_tokens))

    # 1. Exact alias or name
    for item in MAJOR_CLUBS_DATA:
        if normalize_text(item["name"]) == norm_query or normalize_text(item["short_name"]) == norm_query:
            return {
                "club": item,
                "confidence": 98,
                "match_reason": f"Exact name match: {item['name']}",
                "logo_url": f"https://images.fotmob.com/image_resources/logo/teamlogo/{item['fotmob_id']}.png"
            }
        for alias in item["aliases"]:
            if normalize_text(alias) == norm_query:
                return {
                    "club": item,
                    "confidence": 99,
                    "match_reason": f"Exact alias match: {alias}",
                    "logo_url": f"https://images.fotmob.com/image_resources/logo/teamlogo/{item['fotmob_id']}.png"
                }

    # 2. Misplaced words token match (e.g. "Madrid Real", "City Manchester")
    for item in MAJOR_CLUBS_DATA:
        club_tokens = extract_core_tokens(item["name"])
        club_sorted = " ".join(sorted(club_tokens))
        if query_sorted and query_sorted == club_sorted:
            return {
                "club": item,
                "confidence": 95,
                "match_reason": f"Misplaced words token match: {item['name']}",
                "logo_url": f"https://images.fotmob.com/image_resources/logo/teamlogo/{item['fotmob_id']}.png"
            }

    # 3. Substring inclusion
    for item in MAJOR_CLUBS_DATA:
        if len(norm_query) >= 4 and (norm_query in normalize_text(item["name"]) or norm_query in normalize_text(item["short_name"])):
            return {
                "club": item,
                "confidence": 88,
                "match_reason": f"Substring match: {item['name']}",
                "logo_url": f"https://images.fotmob.com/image_resources/logo/teamlogo/{item['fotmob_id']}.png"
            }

    return {"club": None, "confidence": 0, "match_reason": "No match found"}
