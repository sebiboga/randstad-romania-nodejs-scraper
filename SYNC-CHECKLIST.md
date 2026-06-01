# Sync Checklist — EPAM → Randstad

Verifică periodic dacă toate fișierele, setările și îmbunătățirile din repo-ul EPAM sunt prezente și aici.

Cum se folosește:
- Mergi prin fiecare secțiune și bifează ce e OK
- Ce nu e bifat trebuie portat din EPAM

Ultima verificare: 2026-06-01

---

## 1. Repo About (GitHub)

- [x] **Description** — ✅ "web scraper pentru a aduce locurile de munca de la RANDSTAD Romania in platforma peviitor.ro"
- [x] **Topics** — ✅ `job-seeker-ro-spider`, `peviitor-ro` (EPAM are aceleași)
- [x] **Homepage/Website** — ✅ setat la `https://sebiboga.github.io/randstad-romania-nodejs-scraper/`

```bash
gh repo view sebiboga/randstad-romania-nodejs-scraper --json description,homepageUrl,repositoryTopics
```

---

## 2. Fișiere root

| Fișier | EPAM | Randstad | Syncat? |
|--------|------|----------|---------|
| `index.js` | ✅ | ✅ | ⚠️ logică complet diferită (API JSON vs HTML scraping) |
| `company.js` | ✅ | ✅ | ⚠️ matching: EPAM by name prefix, Randstad by CIF; SOLR query: EPAM by CIF, Randstad by company name |
| `demoanaf.js` / `src/anaf.js` | ✅ (ambele) | ✅ (doar demoanaf.js) | ⚠️ EPAM separă src/anaf.js, Randstad are totul în demoanaf.js |
| `solr.js` | ✅ | ✅ | ✅ funcții comune identice; Randstad are extra `querySOLRByCompany` + `stripInternalFields` |
| `validate-jobs.js` | ✅ (`tests/`) | ✅ (root) | ⚠️ locații diferite, CLI args diferite, logici diferite |
| `company.json` | ✅ (committed) | ✅ (gitignored) | ❌ Randstad îl ignoră în .gitignore (line 48), EPAM îl commit-uie |
| `package.json` | ✅ | ✅ | ✅ identice (structură, versiuni, dependințe) |
| `.gitignore` | ✅ | ✅ | ⚠️ Randstad ignoră `company.json` + `expired-jobs.json` vs EPAM ignoră `epam_response.json` |
| `.npmrc` | ✅ | ✅ | ✅ identice |
| `CHANGELOG.md` | ✅ | ✅ | |
| `README.md` | ✅ | ✅ | |
| `CONTRIBUTING.md` | ✅ | ✅ | |
| `SECURITY.md` | ✅ | ✅ | |
| `LICENSE` | ✅ | ✅ | |
| `company-model.md` | ✅ | ✅ | |
| `job-model.md` | ✅ | ✅ | |
| `files.md` | ✅ | ✅ | |
| `instructions.md` | ✅ | ✅ | |
| `delete_request.json` | ✅ | ✅ | |
| `AGENTS.md` | ✅ | ✅ | |
| `ISSUES.md` | ✅ | ✅ | |
| `ROBOTS.md` | ✅ | ✅ | |
| `TOPICS.md` | ✅ | ✅ | |
| `UPDATE-REPO-ABOUT.md` | ✅ | ✅ | |
| `FROM-EPAM.md` | ❌ | ✅ | |

### De verificat la fiecare fișier comun

- [x] **Structura și exporturile** sunt aceleași — ⚠️ parțial: solr.js și company.js au funcții în comun, dar index.js e complet diferit
- [x] **HEADER-ele de identificare** (User-Agent: `job_seeker_ro_spider`) — ✅ Randstad: 13 locații, EPAM: 17 locații
- [x] **Configurările SOLR** (URL-uri, auth, query pattern) — ✅ aliniate
- [x] **Retry logic** — ⚠️ TIMEOUT: EPAM=10000ms, Randstad=15000ms în index.js; solr.js TIMEOUT=10000 la ambele
- [x] **Caching logic** (company.json fallback) — ✅ aceeași

---

## 3. Tests

| Cale | EPAM | Randstad | Syncat? |
|------|------|----------|---------|
| `tests/unit/solr.test.js` | ✅ (20 teste, mock-uri) | ✅ (6 teste, API real) | ❌ filosofie complet diferită |
| `tests/unit/company.test.js` | ✅ (10 teste, mock-uri) | ✅ (3 teste, API real) | ❌ filosofie complet diferită |
| `tests/unit/demoanaf.test.js` | ✅ (13 teste, mock-uri) | ✅ (3 teste, API real) | ❌ filosofie complet diferită |
| `tests/unit/index.test.js` | ✅ (13 teste, funcții pure) | ✅ (5 teste, inclusiv real searchAllPortals) | ⚠️ diferit |
| `tests/integration/workflow.test.js` | ✅ (~16 teste, cu `itIfSolr`) | ✅ (4 teste, fără `itIfSolr`) | ❌ EPAM testează ANAF+Peviitor+SOLR, Randstad doar workflow basic |
| `tests/e2e/scraper.test.js` | ✅ (~16 teste, cu `itIfSolr`) | ✅ (2 teste, fără `itIfSolr`) | ❌ EPAM testează API real+parse+SOLR, Randstad doar ANAF basic |
| `tests/company.json` | ✅ | ✅ | ✅ ambele au cached company data |
| `tests/validate-epam-jobs.js` | ✅ `tests/` | ⚠️ `validate-jobs.js` (root) | ❌ logici diferite (EPAM: peviitor API; Randstad: content-based) |
| `tests/package.json` | ✅ | ❌ | — |
| `tests/package-lock.json` | ✅ | ❌ | — |
| `tests/node_modules/` | ✅ | ❌ | — |

### Total teste

| Tip | EPAM | Randstad |
|-----|------|----------|
| Unit | 56 | 17 |
| Integration | ~16 | 4 |
| E2E | ~16 | 2 |
| **Total** | **~88** | **23** |

### De verificat

- [x] **Validator script**: EPAM are `tests/validate-epam-jobs.js` (172 linii, peviitor API); Randstad are `validate-jobs.js` în root (235 linii, content-based) — ❌ logici fundamental diferite
- [x] **tests/package.json + tests/node_modules/** — EPAM le are, Randstad nu. Nu sunt necesare (Randstad rulează din root)
- [x] **Numărul de teste unitare** — EPAM: 56, Randstad: 17 (diferență majoră de acoperire)
- [x] **Testele de integrare** — EPAM are `itIfSolr` + teste ANAF+Peviitor+SOLR; Randstad nu are `itIfSolr`
- [x] **Testele E2E** — EPAM testează API real+parse+SOLR; Randstad doar ANAF basic
- [x] **`itIfSolr`** — EPAM îl folosește; Randstad NU ❌
- [x] **`--test` mode** — EPAM are `testMode` flag, Randstad nu

---

## 4. Docs

| Cale | EPAM | Randstad | Syncat? |
|------|------|----------|---------|
| `docs/README.md` | ✅ | ✅ | |
| `docs/index.html` | ✅ | ✅ | |

---

## 5. GitHub Actions

| Workflow | EPAM | Randstad | Syncat? |
|----------|------|----------|---------|
| `scrape.yml` | ✅ | ✅ | ⚠️ Randstad are push trigger în plus; nume diferit |
| `test.yml` | ✅ | ✅ | ✅ identice (după issue #14) |
| `deploy.yml` | ✅ (GitHub Pages) | ❌ | — |

### De verificat

- [x] **Scrape workflow** — ✅ același cron (`0 6 * * *`), env vars, script; ⚠️ Randstad rulează și pe push la master
- [x] **Test workflow** — ✅ aceleași job-uri
- [x] **ensure-company-core** — ✅ date specifice companiei (CIF, brand, URL-uri)
- [x] **Test timeout** — `--testTimeout=60000` setat
- [x] **Secret SOLR_AUTH** — setat în GitHub repo secrets
- [x] **deploy.yml** — EPAM are workflow pentru GitHub Pages; Randstad nu — probabil nefolosit

---

## 6. package.json

- [x] **Scripts** — ✅ identice (`test`, `test:unit`, `test:integration`, `test:e2e`, `scrape`)
- [x] **Dependencies** — ✅ identice (`node-fetch`, `cheerio`, `dotenv`, `jest`, `jest-html-reporter`)
- [x] **Jest config** — ✅ `testTimeout: 30000`
- [x] **`--no-deprecation`** flag — ✅ în toate scripturile Node

---

## 7. Configurări specifice EPAM care trebuie adaptate la Randstad

| EPAM | Randstad | Status |
|------|----------|--------|
| CIF: `33159615` | CIF: `17549799` | ✅ |
| Company: `EPAM SYSTEMS INTERNATIONAL SRL` | Company: `RANDSTAD ROMANIA SRL` | ✅ |
| API: `careers.epam.com/api/jobs/v2/...` | API: `randstad.ro` + `jobRapid.ro` | ✅ |
| Country ID: `8150000000000001155` | N/A (HTML scraping) | ✅ |
| `src/anaf.js` separat | ANAF direct în `demoanaf.js` | ⚠️ |
| TIMEOUT=10000 | TIMEOUT=15000 | ⚠️ |
| Mock-uri în teste | API-uri reale în teste | ⚠️ |
| `itIfSolr` prezent | `itIfSolr` lipsă | ⚠️ |

---

## 8. Îmbunătățiri recente pe EPAM de portat

### Aplicate deja

- [x] **User-Agent `job_seeker_ro_spider`** — setat pe toate request-urile HTTP (#11)
- [x] **Punycode DEP0040 warning** — `--no-deprecation` flag în scripturi (#10)
- [x] **`defaultTimeout` → `testTimeout`** — corectat în package.json jest config
- [x] **SOLR upsertCompany** — `upsertCompany()` în solr.js, apelat din index.js:main() (#12)
- [x] **CIF regex fix** — `/^\d{7}$/` → `/^\d{7,}$/` (#15)
- [x] **validate-jobs job** — adăugat în test.yml (#14)
- [x] **AGENTS.md** — creat (#4)
- [x] **ISSUES.md** — creat (#5)
- [x] **ROBOTS.md** — creat (#6)
- [x] **TOPICS.md** — creat (#7)
- [x] **UPDATE-REPO-ABOUT.md** — creat (#8)
- [x] **docs/README.md** — creat (#9)

### Găsite la verificare

- [ ] **Test coverage gap** — EPAM: 56 unit + ~32 integration/e2e = ~88 teste; Randstad: 17 unit + 6 integration/e2e = 23 teste
- [ ] **`itIfSolr` helper** — Randstad nu are teste SOLR condiționale; testele sar cu eroare când `SOLR_AUTH` lipsește
- [ ] **`--no-deprecation` in test scripts** — EPAM are în toate scripturile de test; Randstad la fel (✅)
- [ ] **company.json în .gitignore** — Randstad ignoră `company.json`, EPAM îl commit-uie. De decis comportamentul dorit

---

## Cum se rulează verificarea

```bash
# 1. Vezi ce fișiere noi a apărut pe EPAM
cd /path/to/epam
git log --oneline --name-only -10

# 2. Compară fișierele comune între repo-uri
cd /path/to/randstad
diff <(ls /path/to/epam/*.js) <(ls *.js)

# 3. Verifică topic-urile
gh repo view sebiboga/randstad-romania-nodejs-scraper --json repositoryTopics

# 4. Rulează testele
npm run test:unit
node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=integration --testTimeout=60000
```
