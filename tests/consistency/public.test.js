import fetch from 'node-fetch';

const REPO = process.env.GITHUB_REPOSITORY;
const TOKEN = process.env.GITHUB_TOKEN;

describe('Repository Visibility', () => {
  it('must be PUBLIC (not private)', async () => {
    if (!REPO) {
      console.log('GITHUB_REPOSITORY not set — running locally, skipping API check');
      return;
    }

    const headers = { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'jest-test' };
    if (TOKEN) headers.Authorization = `token ${TOKEN}`;

    const res = await fetch(`https://api.github.com/repos/${REPO}`, { headers });
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data.private).toBe(false);
    expect(data.visibility).toBe('public');

    console.log(`✅ Repo ${REPO} is ${data.visibility}`);
  });
});
