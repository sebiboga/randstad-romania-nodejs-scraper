# job_seeker_ro_spider — RANDSTAD

**job_seeker_ro_spider** — scraper pentru job-urile RANDSTAD România.

Extrage anunțurile de pe [randstad.ro](https://www.randstad.ro/jobs/) și [jobRapid.ro](https://www.jobrapid.ro/angajator/randstad) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Identificare

Toate request-urile HTTP folosesc User-Agent-ul:

```
job_seeker_ro_spider
```

## Ce face

1. **Validează compania** — interoghează API-ul public ANAF ([demoanaf.ro](https://demoanaf.ro)) după CIF-ul RANDSTAD (17549799) și verifică:
   - Denumirea oficială: RANDSTAD ROMANIA SRL
   - Status: activ/inactiv/radiat
   - Adresa completă din registrul comerțului
2. **Cross-validează cu Peviitor** — verifică existența companiei în API-ul Peviitor
3. **Scrape-uiește job-urile** — extrage lista completă de job-uri de pe randstad.ro + jobRapid.ro
4. **Transformă datele** — normalizează locațiile, tag-urile, workmode-ul
5. **Stochează în SOLR** — upsert în `job` core și `company` core

## Structură proiect

```
├── index.js           # Orchestrator principal
├── company.js         # Validare companie (ANAF + Peviitor + SOLR)
├── demoanaf.js        # ANAF API (search + company details)
├── solr.js            # Operații SOLR (query, upsert, delete)
├── company.json       # Cache companie (fallback când ANAF e down)
├── ROBOTS.md          # Analiză robots.txt și politici de scraping
├── tests/
│   ├── unit/          # Teste unitare (API-uri mock-uite)
│   ├── integration/   # Teste de integrare (ANAF + SOLR live)
│   └── e2e/           # Teste end-to-end (pipelin complet)
└── .github/workflows/
    ├── scrape.yml     # Rulează zilnic la 6 AM UTC
    └── test.yml       # Teste automate la fiecare push/PR
```

## API-uri folosite

| API | URL | Autentificare |
|-----|-----|---------------|
| randstad.ro | `https://www.randstad.ro/jobs/` | Public |
| jobRapid.ro | `https://www.jobrapid.ro/angajator/randstad` | Public |
| ANAF (demoanaf) | `https://demoanaf.ro/api/...` | Public |
| Peviitor | `https://api.peviitor.ro/v1/company/` | Public |
| SOLR (job core) | `https://solr.peviitor.ro/solr/job` | `SOLR_AUTH` |
| SOLR (company core) | `https://solr.peviitor.ro/solr/company` | `SOLR_AUTH` |

## Robots.txt

randstad.ro permite scraping-ul paginilor de job-uri (`/locuri-de-munca/`). Vezi [ROBOTS.md](../ROBOTS.md) pentru analiza completă.

## Testare

```bash
# Toate testele
npm test

# Doar unitare
npm run test:unit

# Doar integrare (necesită ANAF live, SOLR conditional)
npm run test:integration

# Doar E2E (API-uri reale + SOLR)
npm run test:e2e
```

Testele SOLR folosesc `itIfSolr` — se auto-skip dacă variabila `SOLR_AUTH` nu e setată.
