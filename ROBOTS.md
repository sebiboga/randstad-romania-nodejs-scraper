# ROBOTS.txt Analysis — randstad.ro

## Robots.txt

Sursa: `https://www.randstad.ro/robots.txt`

```
User-agent: *
Allow: /

Disallow: /*/km-
Disallow: /*/postcode-
Disallow: /*/sa-
Disallow: /*/qt-
Disallow: /*search=
Disallow: /*search-app/demo/jobs/
Disallow: /*jobs/mvp/
Disallow: /en/jobs/*,*/
Disallow: /locuri-de-munca/*,*/
Disallow: /*/sd-
Disallow: /*/sh-
Disallow: /*/sm-
Disallow: /*/?id=*
Disallow: /*/mpage-
Disallow: /locuri-de-munca/radius
Disallow: /radius-search/
Disallow: /*/aplica/
Disallow: /locuri-de-munca/aplica/
Disallow: /cauta-job/apply/
Disallow: /en/jobs/apply/
Disallow: /*/?c-career-advice
Disallow: /*/?c-category
Disallow: /*/?c-wf360-category
Disallow: /*/?c-tags
Disallow: /*/?c-press-category
Disallow: /taxonomy/term/
Disallow: /*/profile-
Disallow: /node/
Disallow: /*/node/

Sitemap: https://www.randstad.ro/sitemaps/sitemap.xml
```

## Analysis

- **Permissive**: `Allow: /` permițe accesul la întreg site-ul
- **Job listings**: `/locuri-de-munca/` e permis (doar variantele cu parametri extra sunt blocate)
- **Apply pages**: `/aplica/` și `/apply/` sunt blocate — corect, nu avem nevoie de ele
- **Search/filter pages**: URL-urile cu parametri de căutare sunt blocate — nu avem nevoie de ele
- **Sitemap**: disponibil la `/sitemaps/sitemap.xml`

## Scraping Policy

- Scraperul `job_seeker_ro_spider` respectă regulile din robots.txt
- Se accesează doar paginile de listare joburi (`/locuri-de-munca/`)
- Se evită paginile de aplicare și căutare
- Se adaugă delay de 1s între request-uri
- Se folosește User-Agent: `job_seeker_ro_spider`
