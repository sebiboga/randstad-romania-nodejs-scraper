import { jest } from '@jest/globals';

const CACHED_ANAF_DATA = {
  cui: 17549799,
  name: "RANDSTAD ROMANIA SRL",
  address: "BUCUREȘTI, SECTORUL 2, STR. BARBU VĂCĂRESCU 301-311",
  registrationNumber: "J40/6315/2006",
  phone: "",
  fax: "",
  postalCode: "",
  caenCode: "7810",
  iban: "",
  registrationDate: "2006-04-26",
  fiscalAuthority: "Sector 2",
  ownershipForm: "PROPR.PRIVATA-CAPITAL PRIVAT AUTOHTON",
  organizationForm: "PERSOANA JURIDICA",
  legalForm: "SOCIETATE COMERCIALĂ CU RĂSPUNDERE LIMITATĂ",
  vatRegistered: true,
  cashBasisVat: false,
  cashBasisVatStart: null,
  cashBasisVatEnd: null,
  inactive: false,
  inactiveSince: null,
  reactivatedSince: null,
  splitVat: false,
  eFacturaRegistered: false,
  headquartersAddress: {
    street: "Str. Barbu Vacarescu",
    number: "301-311",
    locality: "Sectorul 2",
    county: "BUCUREȘTI",
    country: "",
    postalCode: ""
  },
  fiscalAddress: {
    street: "",
    number: "",
    locality: "",
    county: "",
    country: "",
    postalCode: ""
  },
  administrators: [],
  authorizedCaenCodes: ["7810"],
  onrcStatus: 1048,
  onrcStatusLabel: "Funcțiune"
};

describe('demoanaf.js', () => {
  let demoanaf;

  beforeAll(async () => {
    demoanaf = await import('../../demoanaf.js');
  });

  describe('searchCompany', () => {
    it('should return array of companies for valid brand', async () => {
      const results = await demoanaf.searchCompany('RANDSTAD');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('cui');
      expect(results[0]).toHaveProperty('name');
    });

    it('should return empty array for non-existent brand', async () => {
      const results = await demoanaf.searchCompany('NonExistentBrandXYZ123');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('getCompanyFromANAF', () => {
    it('should return company data for valid CIF with fallback', async () => {
      const data = await demoanaf.getCompanyFromANAFWithFallback('17549799', CACHED_ANAF_DATA);

      expect(data).toBeDefined();
      expect(data.cui).toBe(17549799);
      expect(data.name).toBe('RANDSTAD ROMANIA SRL');
      expect(data).toHaveProperty('address');
      expect(data).toHaveProperty('registrationNumber');
    }, 120000);
  });
});
