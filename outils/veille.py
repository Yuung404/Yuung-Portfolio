#!/usr/bin/env python3
"""
Agrégateur de veille « IA et cybersécurité » du portfolio.

Ce que fait ce script, à chaque exécution (toutes les heures, par GitHub Actions) :
  1. il télécharge les flux RSS / Atom des sources listées dans SOURCES ;
  2. il télécharge le catalogue des failles activement exploitées de la CISA (KEV) ;
  3. il garde les 30 derniers jours, retire les doublons et repère les articles qui parlent d'IA ;
  4. il écrit trois fichiers dans assets/data/ :
       - veille.json         : tout le contenu, lu par la page Veille du portfolio ;
       - veille-ia-cyber.xml : un flux RSS des articles « IA et cybersécurité », à ajouter dans un lecteur RSS ;
       - veille-sources.opml : la liste des sources, à importer dans Feedly, Inoreader, NetNewsWire…

Il n'utilise que la bibliothèque standard de Python : rien à installer.
Une source en panne n'arrête pas le script : elle est simplement signalée dans veille.json.
"""
import datetime as dt
import email.utils
import html
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, 'assets', 'data')
JOURS = 30                    # fenêtre conservée
MAX_PAR_SOURCE = 60           # articles gardés au maximum par source
AGENT = 'Mozilla/5.0 (compatible; Veille-Portfolio-Yuung/1.0; +https://yuung404.github.io/Yuung-Portfolio/)'

# Catégories :
#   « ia »    : sources spécialisées dans la sécurité de l'IA, gardées en entier
#   « actu »  : actualité cybersécurité générale, filtrée sur les mots-clés IA pour l'onglet « IA et cyber »
#   « alerte »: alertes et avis officiels (failles, correctifs)
SOURCES = [
    {'id': 'thn', 'nom': 'The Hacker News', 'cat': 'actu', 'langue': 'en',
     'urls': ['https://feeds.feedburner.com/TheHackersNews'], 'site': 'https://thehackernews.com'},
    {'id': 'bleeping', 'nom': 'BleepingComputer', 'cat': 'actu', 'langue': 'en',
     'urls': ['https://www.bleepingcomputer.com/feed/'], 'site': 'https://www.bleepingcomputer.com'},
    {'id': 'darkreading', 'nom': 'Dark Reading', 'cat': 'actu', 'langue': 'en',
     'urls': ['https://www.darkreading.com/rss.xml'], 'site': 'https://www.darkreading.com'},
    {'id': 'securityweek', 'nom': 'SecurityWeek', 'cat': 'actu', 'langue': 'en',
     'urls': ['https://www.securityweek.com/feed/'], 'site': 'https://www.securityweek.com'},
    {'id': 'lmi', 'nom': 'Le Monde Informatique', 'cat': 'actu', 'langue': 'fr',
     'urls': ['https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml'], 'site': 'https://www.lemondeinformatique.fr'},
    {'id': 'embracethered', 'nom': 'Embrace The Red', 'cat': 'ia', 'langue': 'en',
     'urls': ['https://embracethered.com/blog/index.xml'], 'site': 'https://embracethered.com'},
    {'id': 'willison', 'nom': 'Simon Willison (prompt injection)', 'cat': 'ia', 'langue': 'en',
     'urls': ['https://simonwillison.net/tags/prompt-injection.atom'], 'site': 'https://simonwillison.net/tags/prompt-injection/'},
    {'id': 'certfr-alerte', 'nom': 'CERT-FR — Alertes', 'cat': 'alerte', 'langue': 'fr',
     'urls': ['https://cert.cyber.gouv.fr/alerte/feed/', 'https://www.cert.ssi.gouv.fr/alerte/feed/'], 'site': 'https://cert.cyber.gouv.fr/alerte/'},
    {'id': 'certfr-avis', 'nom': 'CERT-FR — Avis de sécurité', 'cat': 'alerte', 'langue': 'fr',
     'urls': ['https://cert.cyber.gouv.fr/avis/feed/', 'https://www.cert.ssi.gouv.fr/avis/feed/'], 'site': 'https://cert.cyber.gouv.fr/avis/'},
]

# Catalogue CISA des failles activement exploitées (copie officielle sur GitHub, plus fiable que le site de la CISA)
KEV_URLS = ['https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json',
            'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json']

# Mots-clés qui signalent un lien avec l'intelligence artificielle.
# Les sigles (AI, IA, LLM, GPT, MCP) sont cherchés en MAJUSCULES pour éviter les faux positifs (« ai » dans « mai »).
SIGLES_IA = re.compile(r'\b(AI|IA|LLMs?|GPT(-\d)?|MCP|RAG|GenAI)\b')
MOTS_IA = re.compile(
    r'(artificial intelligence|intelligence artificielle|machine learning|apprentissage automatique|deep ?fakes?|'
    r'prompt injection|injection de prompt|jailbreak|chatbot|chatgpt|openai|anthropic|claude|gemini|copilot|'
    r'mistral|llama|ollama|langchain|llamaindex|hugging ?face|agentic|ai agent|agent ia|agents ia|'
    r'model context protocol|vibe coding|ia générative|generative ai|large language model|grand modèle de langage)',
    re.IGNORECASE)
CVE = re.compile(r'CVE-\d{4}-\d{4,}')


def telecharger(url, timeout=25):
    req = urllib.request.Request(url, headers={'User-Agent': AGENT, 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def texte(el):
    return '' if el is None else ''.join(el.itertext()).strip()


def nettoyer(t, n=300):
    t = re.sub(r'<[^>]+>', ' ', html.unescape(t or ''))
    t = re.sub(r'\s+', ' ', t).strip()
    return t if len(t) <= n else t[:n].rsplit(' ', 1)[0] + '…'


def lire_date(t):
    t = (t or '').strip()
    if not t:
        return None
    try:
        d = email.utils.parsedate_to_datetime(t)          # format RSS : « Tue, 03 Nov 2026 17:18:50 -0500 »
    except (TypeError, ValueError):
        try:
            d = dt.datetime.fromisoformat(t.replace('Z', '+00:00'))   # format Atom : « 2026-09-17T10:00:00Z »
        except ValueError:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc)


def sans_ns(tag):
    return tag.rsplit('}', 1)[-1]


def analyser_flux(data):
    """Renvoie une liste de dictionnaires {titre, lien, date, resume} pour un flux RSS 2.0 ou Atom."""
    racine = ET.fromstring(data)
    articles = []
    for el in racine.iter():
        nom = sans_ns(el.tag)
        if nom not in ('item', 'entry'):
            continue
        champs = {sans_ns(e.tag): e for e in el}
        titre = texte(champs.get('title'))
        lien = ''
        if nom == 'item':
            lien = texte(champs.get('link'))
        else:
            for e in el:
                if sans_ns(e.tag) == 'link' and e.get('rel', 'alternate') == 'alternate':
                    lien = e.get('href', '')
                    break
        date = None
        for cle in ('pubDate', 'published', 'updated', 'date'):
            if cle in champs:
                date = lire_date(texte(champs[cle]))
                if date:
                    break
        resume = ''
        for cle in ('description', 'summary', 'content', 'encoded'):
            if cle in champs and texte(champs[cle]):
                resume = texte(champs[cle])
                break
        if titre and lien:
            articles.append({'titre': nettoyer(titre, 220), 'lien': lien.strip(), 'date': date, 'resume': nettoyer(resume)})
    return articles


def parle_ia(*textes):
    t = ' '.join(textes)
    return bool(SIGLES_IA.search(t) or MOTS_IA.search(t))


def main():
    maintenant = dt.datetime.now(dt.timezone.utc)
    limite = maintenant - dt.timedelta(days=JOURS)
    articles, etat = [], []

    for s in SOURCES:
        statut = {'id': s['id'], 'nom': s['nom'], 'site': s['site'], 'cat': s['cat'], 'ok': False, 'nb': 0, 'erreur': ''}
        for url in s['urls']:
            try:
                items = analyser_flux(telecharger(url))
                statut.update(ok=True, url=url, erreur='')
                break
            except Exception as e:                        # une source en panne ne bloque pas les autres
                statut['erreur'] = f'{type(e).__name__}: {e}'[:160]
                items = []
        recents = [i for i in items if i['date'] and i['date'] >= limite][:MAX_PAR_SOURCE]
        for i in recents:
            ia = s['cat'] == 'ia' or parle_ia(i['titre'], i['resume'])
            tags = []
            if ia:
                tags.append('ia')
            if s['cat'] == 'alerte' or CVE.search(i['titre'] + ' ' + i['resume']):
                tags.append('faille')
            articles.append({
                'titre': i['titre'], 'lien': i['lien'], 'source': s['nom'], 'source_id': s['id'], 'langue': s['langue'],
                'date': i['date'].isoformat(), 'resume': i['resume'], 'tags': tags,
                'cve': sorted(set(CVE.findall(i['titre'] + ' ' + i['resume'])))[:5],
            })
        statut['nb'] = len(recents)
        etat.append(statut)
        print(f"{'OK ' if statut['ok'] else 'KO '} {s['nom']:<35} {statut['nb']:>3} articles  {statut['erreur']}")

    # --- Catalogue CISA KEV : failles ajoutées pendant la fenêtre
    kev, kev_etat = [], {'id': 'cisa-kev', 'nom': 'CISA — Failles exploitées (KEV)', 'site': 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
                         'cat': 'kev', 'ok': False, 'nb': 0, 'erreur': ''}
    for url in KEV_URLS:
        try:
            catalogue = json.loads(telecharger(url, timeout=40))
            for v in catalogue.get('vulnerabilities', []):
                ajout = dt.datetime.fromisoformat(v['dateAdded']).replace(tzinfo=dt.timezone.utc)
                if ajout < limite:
                    continue
                desc = v.get('shortDescription', '')
                kev.append({
                    'cve': v['cveID'], 'editeur': v.get('vendorProject', ''), 'produit': v.get('product', ''),
                    'nom': v.get('vulnerabilityName', ''), 'date': ajout.isoformat(), 'echeance': v.get('dueDate', ''),
                    'description': nettoyer(desc, 400), 'rancongiciel': v.get('knownRansomwareCampaignUse', '') == 'Known',
                    'ia': parle_ia(v.get('vendorProject', ''), v.get('product', ''), v.get('vulnerabilityName', ''), desc),
                    'lien': f"https://nvd.nist.gov/vuln/detail/{v['cveID']}",
                })
            kev.sort(key=lambda k: k['date'], reverse=True)
            kev_etat.update(ok=True, nb=len(kev), url=url, erreur='')
            break
        except Exception as e:
            kev_etat['erreur'] = f'{type(e).__name__}: {e}'[:160]
    etat.append(kev_etat)
    print(f"{'OK ' if kev_etat['ok'] else 'KO '} {kev_etat['nom']:<35} {kev_etat['nb']:>3} failles  {kev_etat['erreur']}")

    # --- Dédoublonnage (même lien ou même titre) et tri du plus récent au plus ancien
    vus, uniques = set(), []
    for a in sorted(articles, key=lambda a: a['date'], reverse=True):
        cle = (a['lien'].split('?')[0].rstrip('/'), a['titre'].lower())
        if cle[0] in vus or cle[1] in vus:
            continue
        vus.update(cle)
        uniques.append(a)

    os.makedirs(SORTIE, exist_ok=True)
    donnees = {
        'genere_le': maintenant.isoformat(timespec='seconds'),
        'fenetre_jours': JOURS,
        'compteurs': {'articles': len(uniques), 'ia': sum('ia' in a['tags'] for a in uniques), 'kev': len(kev),
                      'kev_ia': sum(k['ia'] for k in kev)},
        'sources': etat,
        'articles': uniques,
        'kev': kev,
    }
    with open(os.path.join(SORTIE, 'veille.json'), 'w', encoding='utf-8') as f:
        json.dump(donnees, f, ensure_ascii=False, indent=1)

    # --- Flux RSS personnel « IA et cybersécurité » (articles IA + failles exploitées liées à l'IA)
    rss = ET.Element('rss', version='2.0')
    ch = ET.SubElement(rss, 'channel')
    ET.SubElement(ch, 'title').text = 'Veille IA et cybersécurité — Yuung Kansietoko'
    ET.SubElement(ch, 'link').text = 'https://yuung404.github.io/Yuung-Portfolio/fr/veille.html'
    ET.SubElement(ch, 'description').text = ("Articles sur l'intelligence artificielle dans la cybersécurité et failles exploitées liées à l'IA, "
                                            'agrégés toutes les heures depuis The Hacker News, BleepingComputer, Dark Reading, SecurityWeek, '
                                            'Le Monde Informatique, Embrace The Red, Simon Willison, le CERT-FR et la CISA.')
    ET.SubElement(ch, 'language').text = 'fr'
    ET.SubElement(ch, 'lastBuildDate').text = email.utils.format_datetime(maintenant)
    entrees = [(a['date'], f"[{a['source']}] {a['titre']}", a['lien'], a['resume']) for a in uniques if 'ia' in a['tags']]
    entrees += [(k['date'], f"[Faille exploitée] {k['cve']} — {k['editeur']} {k['produit']}", k['lien'], k['description']) for k in kev if k['ia']]
    for date, titre, lien, resume in sorted(entrees, reverse=True)[:100]:
        it = ET.SubElement(ch, 'item')
        ET.SubElement(it, 'title').text = titre
        ET.SubElement(it, 'link').text = lien
        ET.SubElement(it, 'guid', isPermaLink='true').text = lien
        ET.SubElement(it, 'pubDate').text = email.utils.format_datetime(dt.datetime.fromisoformat(date))
        ET.SubElement(it, 'description').text = resume
    ET.ElementTree(rss).write(os.path.join(SORTIE, 'veille-ia-cyber.xml'), encoding='utf-8', xml_declaration=True)

    # --- Liste des sources au format OPML (import dans un lecteur RSS)
    opml = ET.Element('opml', version='2.0')
    ET.SubElement(ET.SubElement(opml, 'head'), 'title').text = 'Veille IA et cybersécurité — sources'
    corps = ET.SubElement(opml, 'body')
    groupes = {'ia': 'Sécurité de l\'IA', 'actu': 'Actualité cybersécurité', 'alerte': 'Alertes officielles'}
    for cat, titre in groupes.items():
        g = ET.SubElement(corps, 'outline', text=titre, title=titre)
        for s in SOURCES:
            if s['cat'] == cat:
                ET.SubElement(g, 'outline', type='rss', text=s['nom'], title=s['nom'], xmlUrl=s['urls'][0], htmlUrl=s['site'])
    perso = ET.SubElement(corps, 'outline', text='Mon flux agrégé', title='Mon flux agrégé')
    ET.SubElement(perso, 'outline', type='rss', text='Veille IA et cybersécurité (portfolio)', title='Veille IA et cybersécurité (portfolio)',
                  xmlUrl='https://yuung404.github.io/Yuung-Portfolio/assets/data/veille-ia-cyber.xml',
                  htmlUrl='https://yuung404.github.io/Yuung-Portfolio/fr/veille.html')
    ET.ElementTree(opml).write(os.path.join(SORTIE, 'veille-sources.opml'), encoding='utf-8', xml_declaration=True)

    print(f"\n{len(uniques)} articles dont {donnees['compteurs']['ia']} sur l'IA, {len(kev)} failles exploitées "
          f"dont {donnees['compteurs']['kev_ia']} liées à l'IA. Fichiers écrits dans assets/data/.")
    # Échec seulement si TOUTES les sources sont en panne (sinon on publie ce qu'on a)
    return 0 if any(s['ok'] for s in etat) else 1


if __name__ == '__main__':
    sys.exit(main())
