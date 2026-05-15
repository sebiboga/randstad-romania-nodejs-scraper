import { jest } from '@jest/globals';

describe('Integration: API Workflow', () => {

  describe('Full company validation workflow', () => {
    it('should go from brand to validated company', async () => {
      const demoanaf = await import('../../demoanaf.js');
      const company = await import('../../company.js');
      const solr = await import('../../solr.js');

      const searchResults = await demoanaf.searchCompany('RANDSTAD');
      expect(searchResults.length).toBeGreaterThan(0);

      const randstadCompany = searchResults.find(c =>
        c.name.toUpperCase().includes('RANDSTAD') && c.statusLabel === 'Funcțiune'
      );
      expect(randstadCompany).toBeDefined();

      const anafData = await demoanaf.getCompanyFromANAF(randstadCompany.cui.toString());
      expect(anafData.name).toMatch(/RANDSTAD/i);

      const companyResult = await company.validateAndGetCompany();
      expect(companyResult.status).toBe('active');
      expect(companyResult.cif).toBe('17549799');
    });
  });

  describe('Company Core Model Validation', () => {
    it('should have all required fields per company model', async () => {
      const solr = await import('../../solr.js');

      const result = await solr.queryCompanySOLR('id:17549799');
      expect(result.numFound).toBe(1);

      const randstad = result.docs[0];

      expect(randstad.id).toBe('17549799');
      expect(randstad.company).toBeDefined();
      expect(randstad.brand).toBe('RANDSTAD');
      expect(randstad.status).toBeDefined();
      expect(['activ', 'suspendat', 'inactiv', 'radiat']).toContain(randstad.status);
      expect(randstad.location).toBeDefined();
      expect(Array.isArray(randstad.location)).toBe(true);
      expect(randstad.lastScraped).toBeDefined();
      expect(randstad.scraperFile).toBeDefined();
    });
  });
});
