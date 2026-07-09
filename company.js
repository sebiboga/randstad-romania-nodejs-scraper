/**
 * Company Module - Company Validation and Data Management
 * 
 * PURPOSE: Handles company data validation from ANAF, caches company information,
 * and validates companies against the Peviitor API. This module ensures the scraper
 * only processes legitimate, active companies registered in Romania.
 */

import fetch from "node-fetch";
import fs from "fs";
import { querySOLR, deleteJobsByCIF } from "./solr.js";
import { getCompanyFromANAF } from "./src/anaf.js";
import companyConfig from "./config/company.js";

// ============================================================================
// CONFIGURATION — derived from config/company.json
// ============================================================================

// Peviitor API base URL for company validation
const Peviitor_API_URL = "https://api.peviitor.ro/v1/company/";

const COMPANY_CIF = companyConfig.cif;
const COMPANY_BRAND = companyConfig.brand;

// Cache TTL — re-fetch from ANAF if cached data is older than this
const CACHE_MAX_AGE_DAYS = 7;

// Root cache file (committed to repo, survives between CI runs)
const ROOT_CACHE_PATH = "company.json";
// Local tmp cache (per-run, gitignored)
const TMP_CACHE_PATH = "tmp/company.json";

// ============================================================================
// COMPANY MODEL - Defines the expected schema for company data
// ============================================================================

/**
 * Company model field definitions for validation
 * Used to ensure data integrity and compliance with Peviitor schema
 */
const COMPANY_MODEL_FIELDS = [
  { name: "id", required: true, type: "string" },           // CIF/CUI as string
  { name: "company", required: true, type: "string" },      // Official company name
  { name: "brand", required: false, type: "string" },        // Marketing brand name
  { name: "group", required: false, type: "string" },        // Corporate group
  { name: "status", required: false, type: "string", allowed: ["activ", "suspendat", "inactiv", "radiat"] }, // Romanian business status
  { name: "location", required: false, type: "array" },     // Office locations
  { name: "website", required: false, type: "array" },       // Company website URLs
  { name: "career", required: false, type: "array" },       // Career page URLs
  { name: "lastScraped", required: false, type: "string" },  // Last scrape timestamp
  { name: "scraperFile", required: false, type: "string" }   // Link to scraper source
];

// ============================================================================
// PEVIITOR API - External validation
// ============================================================================

/**
 * Fetches company data from Peviitor API
 * Used for cross-validation with Peviitor's existing company database
 * @param {string} companyName - Name to search for
 * @returns {Promise<Object|null>} - Company data or null if not found
 */
async function getCompanyFromPeviitor(companyName) {
  const url = `${Peviitor_API_URL}?name=${encodeURIComponent(companyName)}`;
  const res = await fetch(url, {
    headers: {
      origin: "https://peviitor.ro",
      referer: "https://peviitor.ro/",
      "User-Agent": "job_seeker_ro_spider"
    }
  });
  
  if (!res.ok) {
    throw new Error(`Peviitor API error: ${res.status}`);
  }
  
  const data = await res.json();
  return data.companies?.[0] || null;
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

/**
 * Validates company data against the COMPANY_MODEL schema
 * Checks for required fields, correct types, and allowed values
 * @param {Object} data - Company data to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateCompanyModel(data) {
  console.log("\n=== Company Model Validation ===\n");
  
  const errors = [];
  
  // Check each field in the model
  for (const field of COMPANY_MODEL_FIELDS) {
    const value = data[field.name];
    
    // Check required fields
    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push(`Missing required field: ${field.name}`);
      continue;
    }
    
    // Validate field types
    if (value !== undefined && value !== null) {
      if (field.type === "string" && typeof value !== "string") {
        errors.push(`Field ${field.name} should be string, got ${typeof value}`);
      }
      if (field.type === "array" && !Array.isArray(value)) {
        errors.push(`Field ${field.name} should be array, got ${typeof value}`);
      }
      // Validate allowed values for enum fields
      if (field.allowed && !field.allowed.includes(value)) {
        errors.push(`Field ${field.name} has invalid value "${value}". Allowed: ${field.allowed.join(", ")}`);
      }
    }
  }
  
  // Warn about extra fields not in the model
  const allowedFields = COMPANY_MODEL_FIELDS.map(f => f.name);
  const extraFields = Object.keys(data).filter(k => !allowedFields.includes(k));
  if (extraFields.length > 0) {
    console.log(`Note: Extra fields in Peviitor (not in model): ${extraFields.join(", ")}`);
  }
  
  // Report results
  if (errors.length > 0) {
    console.log("ERRORS:");
    errors.forEach(e => console.log(`  - ${e}`));
    return false;
  }
  
  console.log("All required fields present and valid!");
  return true;
}

// ============================================================================
// DATA PERSISTENCE - Caching company data
// ============================================================================

/**
 * Saves company data to company.json for caching
 * This allows the scraper to work offline when ANAF API is unavailable
 * @param {Object} anafData - Company data from ANAF
 * @param {Object} peviitorData - Company data from Peviitor (optional)
 * @returns {Object} - The saved company data object
 */
function saveCompanyData(anafData, peviitorData) {
  const companyData = {
    // Metadata
    validatedAt: new Date().toISOString(),
    source: "ANAF",
    brand: COMPANY_BRAND,
    
    // Raw data from sources
    anaf: anafData,
    peviitor: peviitorData,
    
    // Summary with extracted key fields
    summary: {
      company: anafData?.name || null,                    // Official company name
      cif: anafData?.cui?.toString() || null,              // CIF as string
      active: !anafData?.inactive,                          // Active status
      inactiveSince: anafData?.inactiveSince || null,       // When became inactive
      reactivatedSince: anafData?.reactivatedSince || null,  // When reactivated
      address: anafData?.address || null,                   // Registered address
      registrationNumber: anafData?.registrationNumber || null, // J40/... number
      caenCode: anafData?.caenCode || null,                 // Business activity code
      vatRegistered: anafData?.vatRegistered || false,      // TVA status
      eFacturaRegistered: anafData?.eFacturaRegistered || false // e-Factura status
    }
  };
  
  const json = JSON.stringify(companyData, null, 2);

  // Always write tmp cache (per-run scratch)
  fs.mkdirSync("tmp", { recursive: true });
  fs.writeFileSync(TMP_CACHE_PATH, json, "utf-8");
  console.log(`\n✅ Saved company data to ${TMP_CACHE_PATH}`);

  // Also update root cache (committed to repo, survives between CI runs)
  fs.writeFileSync(ROOT_CACHE_PATH, json, "utf-8");
  console.log(`✅ Updated root cache ${ROOT_CACHE_PATH}\n`);

  return companyData;
}

/**
 * Validates that cached data has the required ANAF fields.
 */
function isValidCache(data) {
  return Boolean(data?.anaf?.cui && data?.anaf?.name);
}

/**
 * Checks whether the cache is still fresh (within CACHE_MAX_AGE_DAYS).
 */
function isCacheFresh(data) {
  if (!data?.validatedAt) return false;
  const ageMs = Date.now() - new Date(data.validatedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays < CACHE_MAX_AGE_DAYS;
}

/**
 * Loads cached company data, checking tmp/ first (fresh per-run), then root (committed backup).
 * Returns the cache if valid AND fresh. Returns null if stale or missing.
 * Returns `{ ...data, _stale: true }` if found but stale — caller may still use as fallback.
 */
function loadCachedCompanyData() {
  for (const cachePath of [TMP_CACHE_PATH, ROOT_CACHE_PATH]) {
    if (!fs.existsSync(cachePath)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      if (!isValidCache(data)) continue;
      if (isCacheFresh(data)) {
        console.log(`Found fresh cached company data in ${cachePath}`);
        return data;
      }
      console.log(`Found stale cached company data in ${cachePath} (older than ${CACHE_MAX_AGE_DAYS} days)`);
      return { ...data, _stale: true };
    } catch (e) {
      console.log(`Warning: Could not parse ${cachePath}`);
    }
  }
  return null;
}

// ============================================================================
// COMPANY DATA RETRIEVAL - Main entry point for getting company info
// ============================================================================

/**
 * Gets company data, preferring cache over live API calls.
 * CIF and brand are read from config/company.json.
 * Cache order: tmp/company.json → company.json (root) → ANAF live.
 * Stale cache is used as fallback if ANAF is unreachable.
 * @returns {Promise<Object>} - Company data with company name, CIF, and active status
 */
export async function getCompanyData() {
  const cachedData = loadCachedCompanyData();

  // Fresh cache → use it, skip ANAF
  if (cachedData && !cachedData._stale && cachedData.summary?.cif) {
    console.log(`Using cached company data for CIF: ${cachedData.summary.cif}`);
    const anafData = cachedData.anaf;

    console.log(`Cached name: ${anafData.name}`);
    console.log(`Cached CUI: ${anafData.cui}`);
    console.log(`Cached status: ${anafData.inactive ? "INACTIVE" : "ACTIVE"}`);

    const company = anafData.name.toUpperCase();
    const cif = anafData.cui.toString();
    const active = !anafData.inactive;

    return { company, cif, active, anafData };
  }

  // Stale or missing cache → try ANAF, fall back to stale cache if ANAF fails
  console.log(`Fetching fresh company data from ANAF for CIF: ${COMPANY_CIF}`);
  let anafData;
  try {
    anafData = await getCompanyFromANAF(COMPANY_CIF);
  } catch (err) {
    if (cachedData?._stale) {
      console.log(`⚠️ ANAF unreachable (${err.message}) — falling back to stale cache`);
      const a = cachedData.anaf;
      return {
        company: a.name.toUpperCase(),
        cif: a.cui.toString(),
        active: !a.inactive,
        anafData: a
      };
    }
    throw err;
  }

  if (!anafData) {
    throw new Error("No data from ANAF - cannot proceed with scraping");
  }
  if (!anafData.name) {
    throw new Error("ANAF returned no company name - cannot proceed with scraping");
  }

  console.log(`ANAF returned name: ${anafData.name}`);
  console.log(`ANAF returned CUI: ${anafData.cui}`);
  console.log(`ANAF status: ${anafData.inactive ? "INACTIVE" : "ACTIVE"}`);

  const company = anafData.name.toUpperCase();
  const cif = anafData.cui.toString();
  const active = !anafData.inactive;

  return { company, cif, active, anafData };
}

// ============================================================================
// COMPANY VALIDATION WORKFLOW - Orchestrates validation steps
// ============================================================================

/**
 * Complete company validation workflow:
 * 1. Validate company exists in ANAF (active)
 * 2. Check existing jobs in SOLR
 * 3. Cross-validate with Peviitor API
 * 4. Cache data for offline use
 * 5. Delete SOLR jobs if company is inactive
 * 
 * @returns {Promise<Object>} - Validation result with status and job count
 */
export async function validateAndGetCompany() {
  console.log("=== Step 1: Validate company via ANAF ===\n");
  
  // Get company data from ANAF (or cache)
  const { company, cif, active, anafData } = await getCompanyData();
  
  // Check how many jobs already exist in SOLR for this company
  console.log("\n=== Step 2: Check existing jobs in SOLR ===\n");
  const solrResult = await querySOLR(cif);
  console.log(`Jobs found in SOLR for CIF ${cif}: ${solrResult.numFound}`);
  
  // Cross-validate with Peviitor
  console.log("\n=== Step 3: Validate via Peviitor ===\n");
  let peviitorData = null;
  try {
    peviitorData = await getCompanyFromPeviitor(COMPANY_BRAND);
    console.log("Peviitor data fetched successfully");
  } catch (e) {
    console.log("Peviitor API error:", e.message);
  }
  
  // Save company data to cache
  saveCompanyData(anafData, peviitorData);
  
  // If company is inactive, remove their jobs from SOLR
  if (!active) {
    console.log("\n⚠️ Company is INACTIVE in ANAF - deleting jobs from SOLR and stopping");
    if (solrResult.numFound > 0) {
      await deleteJobsByCIF(cif);
    }
    return { status: "inactive", company, cif, existingJobsCount: solrResult.numFound };
  }
  
  const address = anafData?.address || anafData?.headquartersAddress?.locality || "";
  
  console.log(`\n✅ Company validated: ${company}, CIF: ${cif}`);
  console.log("Ready to scrape jobs...\n");
  
  return { status: "active", company, cif, existingJobsCount: solrResult.numFound, address, anafData };
}

// ============================================================================
// STANDALONE MODE - Run company.js directly for testing
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("company.js")) {
  console.log("=== Running company.js independently ===\n");
  
  const { company, cif, active } = await getCompanyData();
  console.log(`\nResult: company=${company}, cif=${cif}, active=${active}`);
  
  console.log("\n=== Peviitor Validation Test ===\n");
  
  try {
    const peviitorData = await getCompanyFromPeviitor(company);
    console.log("Peviitor Data:");
    console.log(JSON.stringify(peviitorData, null, 2));
    validateCompanyModel(peviitorData);
  } catch (e) {
    console.log("Peviitor API error:", e.message);
  }
  
  const result = await validateAndGetCompany();
  
  console.log("\nResult:", result);
}
