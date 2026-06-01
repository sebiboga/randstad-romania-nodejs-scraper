import { jest } from '@jest/globals';

const HAS_SOLR = !!process.env.SOLR_AUTH;

function itIfSolr(name, fn, timeout) {
  if (HAS_SOLR) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: SOLR_AUTH not set)`, fn, timeout);
}

describe('solr.js', () => {
  let solr;

  beforeAll(async () => {
    solr = await import('../../solr.js');
  });

  describe('querySOLR', () => {
    itIfSolr('should return response object with docs', async () => {
      const result = await solr.querySOLR('17549799');

      expect(result).toHaveProperty('numFound');
      expect(result).toHaveProperty('docs');
      expect(Array.isArray(result.docs)).toBe(true);
    });
  });

  describe('querySOLRByCompany', () => {
    itIfSolr('should return jobs for company name', async () => {
      const result = await solr.querySOLRByCompany('RANDSTAD*');

      expect(result).toHaveProperty('numFound');
      expect(result).toHaveProperty('docs');
    });
  });

  describe('queryCompanySOLR', () => {
    itIfSolr('should return company data', async () => {
      const result = await solr.queryCompanySOLR('company:RANDSTAD*');

      expect(result).toHaveProperty('numFound');
    });
  });

  describe('upsertJobs', () => {
    it.skip('should accept array of jobs', async () => {
      const testJob = {
        url: 'https://test.com/job1',
        title: 'Test Job',
        company: 'RANDSTAD ROMANIA SRL',
        cif: '17549799',
        status: 'scraped'
      };

      await expect(solr.upsertJobs([testJob])).resolves.not.toThrow();
    });
  });

  describe('getSolrAuth', () => {
    itIfSolr('should return SOLR_AUTH from environment', () => {
      const auth = solr.getSolrAuth();

      expect(auth).toBeDefined();
      expect(typeof auth).toBe('string');
    });
  });

  describe('Data Integrity', () => {
    itIfSolr('should have valid CIF format for all jobs', async () => {
      const result = await solr.querySOLR('17549799');

      for (const job of result.docs) {
        expect(job.cif).toMatch(/^\d{7,}$/);
      }
    });

    itIfSolr('should have valid status values', async () => {
      const result = await solr.querySOLR('17549799');
      const validStatuses = ['scraped', 'tested', 'verified', 'published'];

      for (const job of result.docs) {
        expect(validStatuses).toContain(job.status);
      }
    });
  });
});
