import { jest } from '@jest/globals';

describe('E2E: Full Scraping Workflow', () => {
  const TEST_CIF = '17549799';
  const TEST_BRAND = 'RANDSTAD';

  it('should complete full workflow', async () => {
    const demoanaf = await import('../../demoanaf.js');
    const company = await import('../../company.js');
    const solr = await import('../../solr.js');

    const searchResults = await demoanaf.searchCompany(TEST_BRAND);
    expect(searchResults.length).toBeGreaterThan(0);

    const randstadCompany = searchResults.find(c =>
      c.cui?.toString() === TEST_CIF &&
      c.statusLabel === 'Funcțiune'
    );
    expect(randstadCompany).toBeDefined();
    expect(randstadCompany.cui.toString()).toBe(TEST_CIF);

    const anafData = await demoanaf.getCompanyFromANAF(TEST_CIF);
    expect(anafData).toBeDefined();
    expect(anafData.inactive).toBe(false);
  });

  it('should handle inactive company gracefully', async () => {
    const demoanaf = await import('../../demoanaf.js');

    const searchResults = await demoanaf.searchCompany('InactiveCompany');
    const inactiveCompany = searchResults.find(c => c.statusLabel !== 'Funcțiune');

    if (inactiveCompany) {
      const anafData = await demoanaf.getCompanyFromANAF(inactiveCompany.cui.toString());
      expect(anafData.inactive).toBe(true);
    }
  });
});
