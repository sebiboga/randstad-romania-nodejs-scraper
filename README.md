# job_seeker_ro_spider — RANDSTAD Romania Scraper

[![WebScraper RANDSTAD to Peviitor](https://github.com/sebiboga/randstad-romania-nodejs-scraper/actions/workflows/scrape.yml/badge.svg)](https://github.com/sebiboga/randstad-romania-nodejs-scraper/actions/workflows/scrape.yml)
[![Automation Tests](https://github.com/sebiboga/randstad-romania-nodejs-scraper/actions/workflows/test.yml/badge.svg)](https://github.com/sebiboga/randstad-romania-nodejs-scraper/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**job_seeker_ro_spider** — un scraper pentru job-urile RANDSTAD din România. Extrage anunțurile de pe [randstad.ro](https://www.randstad.ro/jobs/) și [jobRapid.ro](https://www.jobrapid.ro/angajator/randstad) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Overview

Proiectul automatizează colectarea zilnică a job-urilor RANDSTAD România, menținând board-ul peviitor.ro la zi cu cele mai recente oportunități de carieră.

## Features

- Extrage job-uri de pe randstad.ro și jobRapid.ro
- Validează compania via ANAF (CUI, status activ/inactiv, adresă completă)
- Cross-validează cu Peviitor API
- Adaugă CIF la job-urile existente în SOLR (full push)
- Stochează în SOLR (job core + company core)
- GitHub Actions: scrape zilnic + testare automată (unit, integration, e2e)
- Teste SOLR condiționale — auto-skip când `SOLR_AUTH` nu e setat
- Se identifică prin User-Agent: `job_seeker_ro_spider`

## Project Structure

```
├── index.js           # Main scraper entry point
├── company.js         # Company validation via ANAF + Peviitor + SOLR
├── demoanaf.js        # ANAF API module (search + company details)
├── solr.js            # SOLR operations (query, upsert, delete, company)
├── company.json       # Cached company data (fallback when ANAF is down)
├── ROBOTS.md          # robots.txt analysis and scraping policy
├── FROM-EPAM.md       # Relationship with EPAM scraper template
├── SYNC-CHECKLIST.md  # Checklist for verifying EPAM sync
├── tests/             # Test suite
│   ├── unit/          # 18 tests (mocked APIs)
│   ├── integration/   # Tests (ANAF + SOLR live, Peviitor skipped)
│   └── e2e/           # Tests (full pipeline, real APIs)
├── .github/workflows/
│   ├── scrape.yml     # Daily scraping at 6 AM UTC
│   └── test.yml       # Automation Tests on push/PR
└── package.json
```

## Setup

### Prerequisites

- Node.js 24+
- npm

### Installation

```bash
npm install
```

### Configuration

Set the `SOLR_AUTH` environment variable with your Solr credentials:

```bash
export SOLR_AUTH="username:password"
```

## Usage

### Run the Scraper

```bash
npm run scrape
```

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Workflows

### Daily Scraping

The `scrape.yml` workflow runs daily at 6 AM UTC via GitHub Actions. It:
1. Validates company data via ANAF
2. Extracts existing jobs from SOLR
3. Searches randstad.ro and jobRapid.ro for new listings
4. Filters and validates existing jobs
5. Updates Solr with clean job data

### Test Automation

The `test.yml` workflow runs on every push and pull request. It:
1. Ensures RANDSTAD exists in the company core
2. Runs unit, integration, and E2E tests
3. Validates data integrity in Solr

## Robots.txt Policy

Acest scraper respectă regulile din [robots.txt](https://www.randstad.ro/robots.txt) al randstad.ro. Pentru analiza completă, vezi [ROBOTS.md](ROBOTS.md).

**Puncte cheie:**
- Paginile de listare job-uri (`/locuri-de-munca/`) sunt permise
- Paginile de aplicare (`/aplica/`, `/apply/`) sunt blocate — scraper-ul NU le accesează
- Se adaugă delay de 1s între request-uri
- Se folosește User-Agent: `job_seeker_ro_spider`

## Acknowledgments

This project was developed with assistance from:
- **[OpenCode](https://opencode.ai)** - AI-powered CLI tool for software engineering
- **Big Pickle LLM** - Large language model powering OpenCode

Special thanks to the open source community and the peviitor.ro team for their support.

## License

Copyright (c) 2024-2026 BOGA SEBASTIAN-NICOLAE

Licensed under the [MIT License](LICENSE).

## Managed By

This project is managed by [ASOCIATIA OPORTUNITATI SI CARIERE](https://oportunitatisicariere.ro) and used as a web scraper for the [peviitor.ro](https://peviitor.ro) job board project.

## Disclaimer

This scraper is designed for educational purposes and legitimate job data aggregation for the Romanian job market. Please respect randstad.ro's Terms of Service and robots.txt when using this scraper.
