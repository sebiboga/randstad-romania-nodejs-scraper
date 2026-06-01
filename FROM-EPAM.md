# From EPAM

Acest scraper a fost creat după sablonul [epam-systems-international-srl-nodejs-scraper](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper).

## Relația cu EPAM

Toate deciziile arhitecturale, configurațiile și îmbunătățirile făcute pe EPAM trebuie aduse și aici.

### Ce se sincronizează

| Componentă | Fișier EPAM | Fișier Randstad |
|------------|-------------|-----------------|
| SOLR operations | `solr.js` | `solr.js` |
| ANAF integration | `src/anaf.js` | `demoanaf.js` |
| Company validation | `company.js` | `company.js` |
| Main scraper | `index.js` | `index.js` |
| DemoANAF CLI | `demoanaf.js` | `demoanaf.js` |
| Unit/integration/e2e tests | `tests/` | `tests/` |
| GitHub workflows | `.github/workflows/` | `.github/workflows/` |
| Project rules | `AGENTS.md` | *(n/a)* |
| Issues & conventions | `ISSUES.md` | *(n/a)* |
| Repo topics | `TOPICS.md` | *(n/a)* |
| Repo About update | `UPDATE-REPO-ABOUT.md` | *(n/a)* |

### Ce NU se sincronizează

- **Logica de scraping** — EPAM ia joburi dintr-un API JSON, Randstad face scraping HTML pe randstad.ro + jobRapid.ro
- **Numele companiei / CIF-ul** — fiecare are propriul CIF și brand
- **Testele specifice** — testele sunt adaptate la sursa de date a fiecărui scraper

## Workflow de portare

1. Se face o modificare pe EPAM (cu issue, branch, PR)
2. Se identifică fișierele corespunzătoare din tabelul de mai sus
3. Se portează modificarea pe Randstad
4. Se creează issue și pe Randstad
5. Se commit și push

## Motiv

EPAM este scraperul de referință — primul creat, cel mai bine testat, cu cele mai multe îmbunătățiri. Randstad păstrează același pattern pentru consistență.
