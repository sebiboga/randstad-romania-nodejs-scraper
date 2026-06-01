import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import { fileURLToPath } from "url";
import { validateAndGetCompany } from "./company.js";
import { querySOLRByCompany, querySOLR, deleteJobsByCIF, upsertJobs } from "./solr.js";

const COMPANY_CIF = "17549799";
const TIMEOUT = 15000;
let COMPANY_NAME = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Source: https://www.randstad.ro/jobs/ - Randstad Romania career page
async function searchRandstad() {
  const jobs = [];
  const searchUrl = "https://www.randstad.ro/jobs/";

  try {
    console.log(`Searching randstad.ro: ${searchUrl}`);
    const res = await fetch(searchUrl, {
      timeout: TIMEOUT,
      headers: {
        "User-Agent": "job_seeker_ro_spider"
      }
    });

    if (!res.ok) {
      console.log(`  randstad.ro returned ${res.status} for ${searchUrl}`);
      return jobs;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    $('a[href*="/jobs/"]').each((i, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      if (!href || !title) return;

      const cleanTitle = title.replace(/\s+/g, ' ').trim();
      if (cleanTitle.length < 5) return;

      const url = href.startsWith('http') ? href : `https://www.randstad.ro${href}`;
      if (!jobs.find(j => j.url === url)) {
        jobs.push({ url, title: cleanTitle, source: "randstad.ro" });
      }
    });

    // Also look for job card containers - randstad often uses article or div.card elements
    $('article, [class*="job"], [class*="card"]').each((i, el) => {
      const link = $(el).find('a[href]').first();
      const href = link.attr('href');
      const title = link.text().trim() || $(el).find('[class*="title"], h2, h3').first().text().trim();
      if (!href || !title) return;

      const cleanTitle = title.replace(/\s+/g, ' ').trim();
      if (cleanTitle.length < 5) return;

      const url = href.startsWith('http') ? href : `https://www.randstad.ro${href}`;
      if (!jobs.find(j => j.url === url)) {
        jobs.push({ url, title: cleanTitle, source: "randstad.ro" });
      }
    });

    console.log(`  Found ${jobs.length} jobs on randstad.ro`);
  } catch (err) {
    console.log(`  randstad.ro error: ${err.message}`);
  }

  return jobs;
}

// Source: https://www.jobrapid.ro/ - secondary job portal
async function searchJobRapid(brand) {
  const jobs = [];
  const urlsToTry = [
    `https://www.jobrapid.ro/companie/${brand.toLowerCase().replace(/\s+/g, '-')}`,
    `https://www.jobrapid.ro/companie/sc-${brand.toLowerCase().replace(/\s+/g, '-')}-sa-1219.html`,
    `https://www.jobrapid.ro/cauta?q=${encodeURIComponent(brand)}`
  ];

  for (const searchUrl of urlsToTry) {
    try {
      console.log(`Searching jobRapid.ro: ${searchUrl}`);
      const res = await fetch(searchUrl, {
        timeout: TIMEOUT,
        headers: {
          "User-Agent": "job_seeker_ro_spider"
        }
      });

      if (!res.ok) {
        console.log(`  jobRapid.ro returned ${res.status} for ${searchUrl}`);
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      $('a[href*="/locuri-de-munca/"]').each((i, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();
        if (!href || !title) return;

        const slug = href.replace(/^https?:\/\/[^\/]+/, '').replace(/^\//, '');
        const parts = slug.split('/');
        if (parts.length < 2) return;

        const path = parts.slice(1).join('/');

        if (/^\s*(cauta|login|cont|compani[ei]|aplicat|salvat|contact|setari|termeni|confidentialitate|sitemap|ajutor|intrebari|facebook|linkedin|google|instagram|twitter)/i.test(path)) return;
        if (path.includes('/')) return;

        if (path.length < 15) return;

        const url = href.startsWith('http') ? href : `https://www.jobrapid.ro${href}`;
        if (!jobs.find(j => j.url === url)) {
          jobs.push({ url, title, source: "jobRapid.ro" });
        }
      });

      console.log(`  Found ${jobs.length} jobs on jobRapid.ro (from ${searchUrl})`);
    } catch (err) {
      console.log(`  jobRapid.ro error for ${searchUrl}: ${err.message}`);
    }
  }

  return jobs;
}

function isKnownGoodUrl(url) {
  return url.includes('mediere.anofm.ro') || url.includes('jobrapid.ro') || url.includes('anofm.ro') || url.includes('randstad.ro');
}

function filterLegitimateJobs(jobs) {
  return jobs.filter(j => isKnownGoodUrl(j.url));
}

async function searchAllPortals(brand, testOnly = false) {
  console.log(`\n=== Searching job portals for "${brand}" ===\n`);

  const allJobs = [];

  const searches = [
    searchRandstad(),
    searchJobRapid(brand)
  ];

  const results = await Promise.allSettled(searches);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const job of result.value) {
        if (!allJobs.find(j => j.url === job.url)) {
          allJobs.push(job);
        }
      }
    }
  }

  console.log(`\nTotal unique jobs found across all portals: ${allJobs.length}`);
  return allJobs;
}

function extractLocationFromTitle(title) {
  const romanianCities = [
    'București', 'Bucharest', 'Cluj-Napoca', 'Cluj',
    'Timișoara', 'Timisoara', 'Iași', 'Iasi', 'Brașov', 'Brasov',
    'Constanța', 'Constanta', 'Craiova', 'Galați', 'Galati',
    'Ploiești', 'Ploiesti', 'Oradea', 'Brăila', 'Braila',
    'Arad', 'Pitești', 'Pitesti', 'Sibiu', 'Bacău', 'Bacau',
    'Târgu Mureș', 'Targu Mures', 'Suceava', 'Satu Mare'
  ];

  const lower = title.toLowerCase();
  for (const city of romanianCities) {
    if (lower.includes(city.toLowerCase())) {
      return city;
    }
  }
  return null;
}

function mapToJobModel(rawJob, cif, companyName = COMPANY_NAME) {
  const now = new Date().toISOString();

  const location = [];
  const locationFromTitle = extractLocationFromTitle(rawJob.title);
  if (locationFromTitle) {
    location.push(locationFromTitle);
  }

  const job = {
    url: rawJob.url,
    title: rawJob.title,
    company: companyName,
    cif: cif,
    location: location.length ? location : undefined,
    date: now,
    status: "scraped"
  };

  Object.keys(job).forEach((k) => job[k] === undefined && delete job[k]);

  return job;
}

function addCifToExistingJobs(existingJobs, cif, companyName) {
  console.log(`\nAdding CIF ${cif} to ${existingJobs.length} existing jobs...`);

  return existingJobs.map(job => {
    const updated = { ...job };
    updated.cif = cif;
    updated.company = companyName;
    updated.date = new Date().toISOString();
    updated.status = job.status || "scraped";
    return updated;
  });
}

function transformJobsForSOLR(payload) {
  const normalizeWorkmode = (wm) => {
    if (!wm) return undefined;
    const lower = wm.toLowerCase();
    if (lower.includes('remote')) return 'remote';
    if (lower.includes('office') || lower.includes('on-site') || lower.includes('site')) return 'on-site';
    if (lower.includes('hybrid')) return 'hybrid';
    return undefined;
  };

  const transformed = {
    ...payload,
    company: payload.company?.toUpperCase(),
    jobs: payload.jobs.map(job => ({
      ...job,
      workmode: normalizeWorkmode(job.workmode) || job.workmode
    }))
  };

  return transformed;
}

async function main() {
  const testOnly = process.argv.includes("--test");

  try {
    console.log("=== Step 1: Validate company via ANAF ===");
    const { company, cif } = await validateAndGetCompany();
    COMPANY_NAME = company;

    console.log("\n=== Step 2: Extract existing jobs from SOLR ===");
    let existingJobs = [];
    try {
      const result = await querySOLRByCompany(`RANDSTAD*`);
      existingJobs = result.docs || [];
      console.log(`Found ${existingJobs.length} existing jobs in SOLR`);
    } catch (err) {
      console.log(`No existing jobs found or query error: ${err.message}`);
      console.log("Trying fallback - query by partial name...");
      try {
        const result = await querySOLR(cif);
        existingJobs = result.docs || [];
        console.log(`Found ${existingJobs.length} jobs by CIF`);
      } catch (e2) {
        console.log("Still no jobs found, continuing with empty set.");
      }
    }

    const existingBackup = {
      extractedAt: new Date().toISOString(),
      company: COMPANY_NAME,
      cif: cif,
      count: existingJobs.length,
      jobs: existingJobs
    };
    fs.writeFileSync("jobs_existing.json", JSON.stringify(existingBackup, null, 2), "utf-8");
    console.log(`Saved ${existingJobs.length} existing jobs to jobs_existing.json`);

    console.log("\n=== Step 3: Search job portals for new jobs ===");
    let portalJobs = [];
    if (!testOnly) {
      portalJobs = await searchAllPortals("RANDSTAD", testOnly);
    } else {
      console.log("Test mode: skipping portal search");
    }

    console.log(`\n=== Step 4: Filter existing jobs ===`);
    const legitExisting = filterLegitimateJobs(existingJobs);
    console.log(`Existing jobs kept (known-good sources): ${legitExisting.length} (rejected ${existingJobs.length - legitExisting.length})`);

    const updatedExisting = addCifToExistingJobs(legitExisting, cif, COMPANY_NAME);
    const newJobs = portalJobs.map(job => mapToJobModel(job, cif));

    const allJobs = [...updatedExisting, ...newJobs];
    console.log(`Total jobs to upsert: ${allJobs.length} (${updatedExisting.length} existing + ${newJobs.length} new)`);

    const seenUrls = new Set();
    const uniqueJobs = [];
    for (const job of allJobs) {
      if (!seenUrls.has(job.url)) {
        seenUrls.add(job.url);
        uniqueJobs.push(job);
      }
    }
    console.log(`Unique jobs after dedup: ${uniqueJobs.length}`);

    const payload = {
      source: "randstad.ro",
      scrapedAt: new Date().toISOString(),
      company: COMPANY_NAME,
      cif: cif,
      jobs: uniqueJobs
    };

    console.log("Transforming jobs for SOLR...");
    const transformedPayload = transformJobsForSOLR(payload);

    fs.writeFileSync("jobs.json", JSON.stringify(transformedPayload, null, 2), "utf-8");
    console.log("Saved jobs.json");

    console.log("\n=== Step 5: Delete old jobs by CIF ===");
    await deleteJobsByCIF(cif);

    console.log("\n=== Step 6: Upsert clean jobs to SOLR ===");
    await upsertJobs(transformedPayload.jobs);

    console.log("\n=== Step 7: Verify ===");
    const finalResult = await querySOLR(cif);
    console.log(`\n📊 === SUMMARY ===`);
    console.log(`📊 Jobs existing in SOLR before: ${existingJobs.length}`);
    console.log(`📊 Jobs found on portals: ${portalJobs.length}`);
    console.log(`📊 Jobs in SOLR after upsert: ${finalResult.numFound}`);
    console.log(`====================`);

    console.log("\n=== DONE ===");
    console.log("Scraper completed successfully!");

  } catch (err) {
    console.error("Scraper failed:", err);
    process.exit(1);
  }
}

export { mapToJobModel, transformJobsForSOLR, searchAllPortals };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
