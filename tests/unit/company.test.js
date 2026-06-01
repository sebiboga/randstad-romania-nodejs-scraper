import { jest } from '@jest/globals';

const HAS_SOLR = !!process.env.SOLR_AUTH;

function itIfSolr(name, fn, timeout) {
  if (HAS_SOLR) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: SOLR_AUTH not set)`, fn, timeout);
}

describe('company.js', () => {
  let company;

  beforeAll(async () => {
    company = await import('../../company.js');
  });

  describe('getCompanyBrand', () => {
    it('should return the company brand', () => {
      const brand = company.getCompanyBrand();

      expect(typeof brand).toBe('string');
      expect(brand).toBe('RANDSTAD');
    });
  });

  describe('validateAndGetCompany', () => {
    itIfSolr('should return company data with status active', async () => {
      const result = await company.validateAndGetCompany();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('company');
      expect(result).toHaveProperty('cif');
      expect(result.status).toBe('active');
      expect(result.cif).toBe('17549799');
    });

    itIfSolr('should include existingJobsCount', async () => {
      const result = await company.validateAndGetCompany();

      expect(result).toHaveProperty('existingJobsCount');
      expect(typeof result.existingJobsCount).toBe('number');
    });
  });
});
