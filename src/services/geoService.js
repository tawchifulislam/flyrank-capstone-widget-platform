const config = require('../config');

function normalizeIp(ip) {
  if (!ip) {
    return '';
  }
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

function isPrivateIp(ip) {
  return (
    ip === '' ||
    ip === '::1' ||
    /^127\./.test(ip) ||
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^f[cd]/i.test(ip) ||
    /^fe80/i.test(ip)
  );
}

async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(config.geoTimeoutMs),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

const realProviders = [
  {
    name: 'A',
    enabled: () => config.geoProviderAEnabled,
    async lookup(ip) {
      const data = await fetchJson(
        `${config.geoProviderAUrl}/${encodeURIComponent(ip)}?fields=status,country,city`,
      );
      if (data.status !== 'success') {
        throw new Error('lookup failed');
      }
      return { country: data.country || null, city: data.city || null };
    },
  },
  {
    name: 'B',
    enabled: () => config.geoProviderBEnabled,
    async lookup(ip) {
      const data = await fetchJson(
        `${config.geoProviderBUrl}/${encodeURIComponent(ip)}/json/`,
      );
      if (data.error) {
        throw new Error('lookup failed');
      }
      return { country: data.country_name || null, city: data.city || null };
    },
  },
];

const mockProviders = [
  {
    name: 'A',
    enabled: () => config.geoProviderAEnabled,
    async lookup() {
      return { country: 'Mockland A', city: 'Alpha City' };
    },
  },
  {
    name: 'B',
    enabled: () => config.geoProviderBEnabled,
    async lookup() {
      return { country: 'Mockland B', city: 'Beta City' };
    },
  },
];

function parseDown(header) {
  return new Set(
    String(header || '')
      .toLowerCase()
      .split(',')
      .map(part => part.trim())
      .filter(Boolean),
  );
}

async function enrich(rawIp, options = {}) {
  const ip = normalizeIp(rawIp);
  const mock = config.geoMode === 'mock';
  if (!mock && isPrivateIp(ip)) {
    return null;
  }
  const providers = mock ? mockProviders : realProviders;
  const down = mock ? parseDown(options.mockDown) : new Set();
  for (const provider of providers) {
    if (!provider.enabled() || down.has(provider.name.toLowerCase())) {
      console.warn(`Geo provider ${provider.name} is down`);
      continue;
    }
    try {
      const result = await provider.lookup(ip);
      return { ...result, provider: provider.name };
    } catch (err) {
      console.warn(`Geo provider ${provider.name} failed: ${err.message}`);
    }
  }
  return null;
}

module.exports = { enrich };
