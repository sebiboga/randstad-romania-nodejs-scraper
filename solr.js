import fetch from "node-fetch";
import fs from "fs";

const SOLR_URL = "https://solr.peviitor.ro/solr/job";
const SOLR_COMPANY_URL = "https://solr.peviitor.ro/solr/company";
const TIMEOUT = 10000;

export function getSolrAuth() {
  return process.env.SOLR_AUTH;
}

export async function querySOLR(cif) {
  const AUTH = process.env.SOLR_AUTH;
  if (!AUTH) throw new Error("SOLR_AUTH not set in environment");

  const params = new URLSearchParams({
    q: `cif:${cif}`,
    rows: 100,
    wt: "json"
  });

  const res = await fetch(`${SOLR_URL}/select?${params}`, {
    headers: {
      "Authorization": "Basic " + Buffer.from(AUTH).toString("base64"),
      "User-Agent": "job_seeker_ro_spider"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR query error: ${res.status} - ${text}`);
  }

  const data = await res.json();
  return data.response;
}

export async function querySOLRByCompany(companyName) {
  const AUTH = process.env.SOLR_AUTH;
  if (!AUTH) throw new Error("SOLR_AUTH not set in environment");

  const params = new URLSearchParams({
    q: `company:${companyName}`,
    rows: 500,
    wt: "json"
  });

  const res = await fetch(`${SOLR_URL}/select?${params}`, {
    headers: {
      "Authorization": "Basic " + Buffer.from(AUTH).toString("base64"),
      "User-Agent": "job_seeker_ro_spider"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR query error: ${res.status} - ${text}`);
  }

  const data = await res.json();
  return data.response;
}

export async function queryCompanySOLR(companyQuery) {
  const AUTH = process.env.SOLR_AUTH;
  if (!AUTH) throw new Error("SOLR_AUTH not set in environment");

  const params = new URLSearchParams({
    q: companyQuery,
    rows: 10,
    wt: "json"
  });

  const res = await fetch(`${SOLR_COMPANY_URL}/select?${params}`, {
    headers: {
      "Authorization": "Basic " + Buffer.from(AUTH).toString("base64"),
      "User-Agent": "job_seeker_ro_spider"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR company query error: ${res.status} - ${text}`);
  }

  const data = await res.json();
  return data.response;
}

export async function deleteJobsByCIF(cif) {
  const AUTH = process.env.SOLR_AUTH;
  if (!AUTH) throw new Error("SOLR_AUTH not set in environment");

  const params = new URLSearchParams({ commit: "true" });

  const deleteQuery = JSON.stringify({
    delete: { query: `cif:${cif}` }
  });

  const res = await fetch(`${SOLR_URL}/update?${params}`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(AUTH).toString("base64"),
      "Content-Type": "application/json",
      "User-Agent": "job_seeker_ro_spider"
    },
    body: deleteQuery
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR delete error: ${res.status} - ${text}`);
  }

  console.log("✅ Jobs deleted from SOLR.");
}

export async function deleteJobByUrl(url) {
  const AUTH = process.env.SOLR_AUTH;
  if (!AUTH) throw new Error("SOLR_AUTH not set in environment");

  const params = new URLSearchParams({ commit: "true" });

  const deleteQuery = JSON.stringify({
    delete: { query: `url:"${url}"` }
  });

  const res = await fetch(`${SOLR_URL}/update?${params}`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(AUTH).toString("base64"),
      "Content-Type": "application/json",
      "User-Agent": "job_seeker_ro_spider"
    },
    body: deleteQuery
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR delete error: ${res.status} - ${text}`);
  }
}

function stripInternalFields(jobs) {
  return jobs.map(job => {
    const clean = { ...job };
    delete clean._version_;
    return clean;
  });
}

export async function upsertJobs(jobs) {
  const AUTH = process.env.SOLR_AUTH;
  if (!AUTH) throw new Error("SOLR_AUTH not set in environment");

  const params = new URLSearchParams({ commit: "true" });

  const cleanJobs = stripInternalFields(jobs);
  const body = JSON.stringify(cleanJobs);

  const res = await fetch(`${SOLR_URL}/update?${params}`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(AUTH).toString("base64"),
      "Content-Type": "application/json",
      "User-Agent": "job_seeker_ro_spider"
    },
    body
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR upsert error: ${res.status} - ${text}`);
  }

  console.log(`✅ Upserted ${jobs.length} jobs to SOLR.`);
}

export async function upsertCompany(companyDoc) {
  const AUTH = process.env.SOLR_AUTH;
  if (!AUTH) throw new Error("SOLR_AUTH not set in environment");

  const params = new URLSearchParams({ commit: "true" });

  const res = await fetch(`${SOLR_COMPANY_URL}/update?${params}`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(AUTH).toString("base64"),
      "Content-Type": "application/json",
      "User-Agent": "job_seeker_ro_spider"
    },
    body: JSON.stringify([companyDoc])
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR company upsert error: ${res.status} - ${text}`);
  }

  console.log(`✅ Company "${companyDoc.company}" upserted to SOLR company core.`);
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      timeout: TIMEOUT,
      headers: { "User-Agent": "job_seeker_ro_spider" }
    });
    return { url, status: res.status, valid: res.ok };
  } catch (err) {
    return { url, status: 0, valid: false, error: err.message };
  }
}

async function runVerification(cif) {
  console.log("=== Verify SOLR Jobs ===\n");

  const result = await querySOLR(cif);
  console.log(`Total jobs in SOLR for CIF ${cif}: ${result.numFound}`);

  console.log("\nFirst 5 jobs:");
  result.docs.slice(0, 5).forEach((job, i) => {
    console.log(`${i+1}. ${job.title} (${job.location?.join(', ')}) - ${job.workmode}`);
  });

  if (fs.existsSync("jobs_existing.json")) {
    console.log("\n=== Verify existing URLs ===\n");
    const existing = JSON.parse(fs.readFileSync("jobs_existing.json", "utf-8"));
    const existingJobs = existing.jobs || [];
    console.log(`Checking ${existingJobs.length} URLs...`);

    const invalidUrls = [];
    for (let i = 0; i < existingJobs.length; i++) {
      const job = existingJobs[i];
      const res = await checkUrl(job.url);
      console.log(`[${i+1}/${existingJobs.length}] ${res.status > 0 ? res.status : 'ERR'} - ${job.url}`);
      if (!res.valid) invalidUrls.push(job.url);
    }

    if (invalidUrls.length > 0) {
      console.log(`\n⚠️ ${invalidUrls.length} invalid URLs found - deleting from SOLR...`);
      for (const url of invalidUrls) {
        await deleteJobByUrl(url);
      }
      console.log(`✅ Deleted ${invalidUrls.length} invalid jobs from SOLR`);
    }

    if (invalidUrls.length === 0) {
      console.log("\n✅ All URLs valid - deleting jobs_existing.json");
      fs.unlinkSync("jobs_existing.json");
    } else {
      console.log("⚠️ Keeping jobs_existing.json for reference");
    }
  }
}

async function runExtract(companyName) {
  console.log("=== Extract existing jobs from SOLR ===\n");

  try {
    const result = await querySOLRByCompany(companyName);
    console.log(`Found ${result.numFound} existing jobs in SOLR for company "${companyName}"`);

    if (result.numFound === 0) {
      console.log("No existing jobs to backup.");
      return;
    }

    const backup = {
      extractedAt: new Date().toISOString(),
      company: companyName,
      count: result.numFound,
      jobs: result.docs
    };

    fs.writeFileSync("jobs_existing.json", JSON.stringify(backup, null, 2), "utf-8");
    console.log("\n✅ Saved existing jobs to jobs_existing.json\n");
  } catch (err) {
    console.error("Failed to extract existing jobs:", err.message);
    process.exit(1);
  }
}

async function runCompanyQuery(args) {
  console.log("=== Query Company in SOLR ===\n");

  const query = args[1] || "company:RANDSTAD*";
  console.log(`Query: ${query}`);

  const result = await queryCompanySOLR(query);
  console.log(`Found ${result.numFound} companies`);

  if (result.docs?.length) {
    console.log("\nFirst company:");
    console.log(JSON.stringify(result.docs[0], null, 2));
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("solr.js")) {
  const args = process.argv.slice(2);

  if (args.includes("extract")) {
    const companyName = args[1] || null;
    if (!companyName) {
      console.error("Error: company name required. Usage: node solr.js extract <company_name>");
      process.exit(1);
    }
    await runExtract(companyName);
  } else if (args.includes("company")) {
    await runCompanyQuery(args);
  } else {
    const cif = args[0] || null;
    if (!cif) {
      console.error("Error: CIF required. Usage: node solr.js <CIF>");
      process.exit(1);
    }
    await runVerification(cif);
  }
}
