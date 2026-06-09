import fetch from "node-fetch";

const SOLR_URL = "https://solr.peviitor.ro/solr/job";
const CIF = "17549799";
const COMPANY = "RANDSTAD";

function getAuth() {
  return process.env.SOLR_AUTH;
}

async function querySolr(url, params) {
  const auth = getAuth();
  const qs = new URLSearchParams(params);
  const res = await fetch(`${url}/select?${qs}`, {
    headers: {
      Authorization: "Basic " + Buffer.from(auth).toString("base64"),
      "User-Agent": "job_seeker_ro_spider"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.response;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const doDelete = process.argv.includes("--delete");

  if (!getAuth()) {
    console.log("SOLR_AUTH not set — skipping validation");
    process.exit(0);
  }

  console.log(`=== Validating ${COMPANY} (CIF: ${CIF}) ===\n`);
  const result = await querySolr(SOLR_URL, { q: `cif:${CIF}`, rows: 100, wt: "json" });
  console.log(`Total jobs in SOLR: ${result.numFound}`);

  if (result.numFound === 0) {
    console.log("No jobs to validate.");
    return;
  }

  const invalid = [];
  for (const job of result.docs) {
    const res = await fetch(job.url, { method: "HEAD" });
    console.log(`[${res.status}] ${job.title}`);
    if (!res.ok) invalid.push(job);
  }

  if (invalid.length > 0) {
    console.log(`\n⚠️ ${invalid.length} invalid jobs found`);
    if (doDelete && !dryRun) {
      for (const job of invalid) {
        const params = new URLSearchParams({ commit: "true" });
        const deleteQuery = JSON.stringify({ delete: { query: `url:"${job.url}"` } });
        await fetch(`${SOLR_URL}/update?${params}`, {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(getAuth()).toString("base64"),
            "Content-Type": "application/json"
          },
          body: deleteQuery
        });
        console.log(`Deleted: ${job.title}`);
      }
    }
    if (dryRun) console.log("(dry run — no deletions performed)");
  } else {
    console.log("\n✅ All jobs valid");
  }
}

main().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
