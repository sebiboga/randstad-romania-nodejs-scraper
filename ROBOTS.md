# Robots.txt Analysis — Randstad Romania / jobRapid.ro

## randstad.ro

Sursa: https://www.randstad.ro/robots.txt

### Reguli

```
User-agent: *
Disallow: /search/
Disallow: /wp-json/
Disallow: /wp-admin/
Disallow: /xmlrpc.php
Disallow: /cgi-bin/
Disallow: /sitemap.xml
Allow: /
```

### Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` (landing) | ✅ Da | Pagina principală |
| `/jobs/` | ✅ Da | Listări de job-uri (front-end HTML) |
| `/wp-admin/` | ❌ Disallowed | Admin WordPress |
| `/wp-json/` | ❌ Disallowed | API intern WordPress |

## jobRapid.ro

Sursa: https://www.jobrapid.ro/robots.txt

### Reguli

```
User-agent: *
Disallow: /cauta/
Disallow: /login/
Disallow: /cont/
Disallow: /companie/
Allow: /
```

### Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` (landing) | ✅ Da | Pagina principală |
| `/locuri-de-munca/` | ✅ Da | Pagini individuale de job |
| `/cauta/` | ❌ Disallowed | Căutare |
| `/companie/` | ❌ Disallowed | Pagini companie |
| `/login/` | ❌ Disallowed | Autentificare |

## ANOFM (mediere.anofm.ro)

API-ul public ANOFM este folosit de toate scraper-ele din ecosistemul peviitor.ro.
Scraperul trimite un POST cu CIF-ul companiei și primește job-urile asociate.

## Recomandare

robots.txt NU este legal binding, dar reprezintă intenția proprietarului site-ului.

- Scraperul curent accesează doar paginile `Allow: /` de pe ambele site-uri
- Rate limiting: o singură cerere simultană, fetch cu timeout, User-Agent standard (`job_seeker_ro_spider`)
- Nu se accesează căi interzise (`/cauta/`, `/companie/`, `/wp-admin/`)

**Concluzie**: Risc minim. Ambele site-uri permit accesul la paginile scrapate, iar scraperul e politicos (rate limiting, User-Agent standard, o singură cerere simultană).
