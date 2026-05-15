# RANDSTAD ROMANIA SRL - Job Scraper

A Node.js scraper for managing job listings for RANDSTAD ROMANIA SRL and storing them in Solr for [peviitor.ro](https://peviitor.ro).

## Overview

This project automates the management of RANDSTAD ROMANIA SRL job listings in Romania, ensuring the peviitor.ro job board stays up-to-date with the latest career opportunities.

## Features

- Company validation via ANAF (Romanian National Agency for Fiscal Administration)
- Adds CIF to existing jobs in Solr (full push)
- Searches randstad.ro career page and jobRapid.ro for RANDSTAD jobs
- Stores jobs in Solr with proper data validation
- GitHub Actions workflow for daily automated scraping
- Comprehensive test suite for reliability

## Project Structure

```
├── index.js           # Main scraper entry point
├── company.js         # Company validation via ANAF
├── demoanaf.js        # ANAF API integration
├── solr.js            # Solr database operations
├── company.json       # Cached company data
├── tests/             # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/
│   └── workflows/
│       ├── scrape.yml     # Daily scraping workflow
│       └── test.yml      # Test automation
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
```

## Workflows

### Daily Scraping

The `scrape.yml` workflow runs daily at 6 AM UTC via GitHub Actions. It:
1. Validates company data via ANAF
2. Adds CIF to existing jobs
3. Searches job portals for new listings
4. Updates Solr with all jobs

## License

Copyright (c) 2024-2026 BOGA SEBASTIAN-NICOLAE

Licensed under the [MIT License](LICENSE).

## Managed By

This project is managed by [ASOCIATIA OPORTUNITATI SI CARIERE](https://oportunitatisicariere.ro) and used as a web scraper for the [peviitor.ro](https://peviitor.ro) job board project.
