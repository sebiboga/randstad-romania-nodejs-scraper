# Sync Checklist — EPAM → Randstad

Verifică periodic dacă toate fișierele, setările și îmbunătățirile din repo-ul EPAM sunt prezente și aici.

Cum se folosește:
- Mergi prin fiecare secțiune și bifează ce e OK
- Ce nu e bifat trebuie portat din EPAM

## 1. Repo About (GitHub)

- [ ] **Description** — conține "Randstad" + "Romania" + "peviitor.ro"
- [ ] **Topics** — `randstad-romania`, `job-seeker-ro-spider`, `peviitor-ro` (EPAM are `job-seeker-ro-spider`, `peviitor-ro`)
- [ ] **Homepage/Website** — setat la GitHub Pages URL (dacă există)

```bash
gh repo view <owner>/<repo> --json description,homepageUrl,repositoryTopics
```

## 2. Fișiere root

| Fișier | EPAM | Randstad | Syncat? |
|--------|------|----------|---------|
| `index.js` | ✅ | ✅ | |
| `company.js` | ✅ | ✅ | |
| `demoanaf.js` / `src/anaf.js` | ✅ (ambele) | ✅ (doar demoanaf.js) | |
| `solr.js` | ✅ | ✅ | |
| `validate-jobs.js` | ✅ | ✅ | |
| `company.json` | ✅ | ✅ | |
| `package.json` | ✅ | ✅ | |
| `.gitignore` | ✅ | ✅ | |
| `.npmrc` | ✅ | ✅ | |
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
| `AGENTS.md` | ✅ | ❌ | |
| `ISSUES.md` | ✅ | ❌ | |
| `ROBOTS.md` | ✅ | ❌ | |
| `TOPICS.md` | ✅ | ❌ | |
| `UPDATE-REPO-ABOUT.md` | ✅ | ❌ | |
| `FROM-EPAM.md` | ❌ | ✅ | |

### De verificat la fiecare fișier comun

- [ ] **Structura și exporturile** sunt aceleași (aceleași funcții, aceiași parametri)
- [ ] **HEADER-ele de identificare** (User-Agent: `job_seeker_ro_spider`) sunt prezente
- [ ] **Configurările SOLR** (URL-uri, auth, query pattern) sunt aliniate
- [ ] **Retry logic** (număr de încercări, delay) e același
- [ ] **Caching logic** (company.json fallback) e același

## 3. Tests

| Cale | EPAM | Randstad | Syncat? |
|------|------|----------|---------|
| `tests/unit/solr.test.js` | ✅ | ✅ | |
| `tests/unit/company.test.js` | ✅ | ✅ | |
| `tests/unit/demoanaf.test.js` | ✅ | ✅ | |
| `tests/unit/index.test.js` | ✅ | ✅ | |
| `tests/integration/workflow.test.js` | ✅ | ✅ | |
| `tests/e2e/scraper.test.js` | ✅ | ✅ | |
| `tests/company.json` | ✅ | ✅ | |
| `tests/validate-epam-jobs.js` | ✅ `tests/` | ⚠️ `validate-jobs.js` (root) | |
| `tests/package.json` | ✅ | ❌ | |
| `tests/package-lock.json` | ✅ | ❌ | |
| `tests/node_modules/` | ✅ | ❌ | |

### De verificat

- [ ] **Validator script**: EPAM are `tests/validate-epam-jobs.js`; Randstad are `validate-jobs.js` în root — verifică dacă logica e aceeași
- [ ] **tests/package.json + tests/node_modules/** — EPAM le are, Randstad nu. E posibil să nu fie necesare (Randstad rulează validarea din root)
- [ ] Numărul de teste unitare e același (EPAM: 56, Randstad: 18)
- [ ] Testele de integrare acoperă aceleași scenarii (ANAF, SOLR, Peviitor, Full Validation)
- [ ] Testele E2E sunt similare (scrape complet cu API-uri reale)
- [ ] `itIfSolr` — testele SOLR sar automat când `SOLR_AUTH` lipsește
- [ ] `--test` mode testat (single page / single portal)

## 4. Docs

| Cale | EPAM | Randstad | Syncat? |
|------|------|----------|---------|
| `docs/README.md` | ✅ | ? | |
| `docs/index.html` | ✅ | ? | |

## 5. GitHub Actions

| Workflow | EPAM | Randstad | Syncat? |
|----------|------|----------|---------|
| `scrape.yml` | ✅ | ✅ | |
| `test.yml` | ✅ | ✅ | |

### De verificat

- [ ] **Scrape workflow** — aceleași cron trigger, aceleași env vars, același script `npm run scrape`
- [ ] **Test workflow** — aceleași job-uri (`ensure-company-core`, `unit`, `integration`, `e2e`)
- [ ] **ensure-company-core** — inserează compania corectă (EPAM vs Randstad) în SOLR company core
- [ ] **Test timeout** — `--testTimeout=60000` setat la integration și e2e
- [ ] **Secret SOLR_AUTH** — setat în GitHub repo secrets

## 6. package.json

- [ ] **Scripts** — aceleași comenzi (`test`, `test:unit`, `test:integration`, `test:e2e`, `scrape`)
- [ ] **Dependencies** — aceleași pachete (`node-fetch`, etc.)
- [ ] **Jest config** — `testTimeout: 30000` (nu `defaultTimeout`)
- [ ] **`--no-deprecation`** flag în toate scripturile Node

## 7. Configurări specifice EPAM care trebuie adaptate la Randstad

| EPAM | Randstad | Status |
|------|----------|--------|
| CIF: `33159615` | CIF: `17549799` | ✅ |
| Company: `EPAM SYSTEMS INTERNATIONAL SRL` | Company: `RANDSTAD ROMANIA SRL` | ✅ |
| API: `careers.epam.com/api/jobs/v2/...` | API: `randstad.ro` + `jobRapid.ro` | ✅ |
| Country ID: `8150000000000001155` | N/A (HTML scraping) | ✅ |
| `src/anaf.js` separat | ANAF direct în `demoanaf.js` | ⚠️ |

## 8. Îmbunătățiri recente pe EPAM de portat

Treci prin commit-urile recente de pe EPAM (`git log --oneline -20`) și verifică dacă îmbunătățirile sunt deja aplicate aici.

### Listă îmbunătățiri cunoscute

- [ ] **User-Agent `job_seeker_ro_spider`** — setat pe toate request-urile HTTP (EPAM: 17 locații, Randstad: 13 locații)
- [ ] **Punycode DEP0040 warning** — `--no-deprecation` flag în scripturi
- [ ] **`defaultTimeout` → `testTimeout`** — corectat în package.json jest config
- [ ] **SOLR upsertCompany** — `upsertCompany()` în solr.js, apelat din index.js:main()
- [ ] **Invalid CIF test timeout** — 60000ms în loc de 30000ms
- [ ] **AGENTS.md** — reguli pentru AI agents (tmp/, issues, ESM+Jest)
- [ ] **ISSUES.md** — regulă: orice modificare de cod trebuie să aibă issue
- [ ] **TOPICS.md** — documentează topic-urile din repo About
- [ ] **UPDATE-REPO-ABOUT.md** — cum se actualizează secțiunea About
- [ ] **ROBOTS.md** — analiză robots.txt și politici de scraping

## Cum se rulează verificarea

```bash
# 1. Vezi ce fișiere noi a apărut pe EPAM
cd /path/to/epam
git log --oneline --name-only -10

# 2. Compară fișierele comune între repo-uri
cd /path/to/randstad
diff <(ls /path/to/epam/*.js) <(ls *.js)

# 3. Verifică topic-urile
gh repo view <owner>/randstad-romania-nodejs-scraper --json repositoryTopics

# 4. Rulează testele
npm run test:unit
node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=integration --testTimeout=60000
```
