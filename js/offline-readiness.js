/* Cache-only checks: no network requests and no private data. */
(function (root) {
  async function inspect(cacheStorage, coreName, coreFiles, routeFiles, photoFiles, base, controlled) {
    if (!cacheStorage || !controlled) return { core: null, routes: null, photos: null };
    try {
      const names = await cacheStorage.keys();
      async function count(name, files) {
        if (!Array.isArray(files) || !files.length) return null;
        const unique = [...new Set(files.map(file => new URL(file, base).href))];
        if (!names.includes(name)) return { found: 0, total: unique.length };
        const cache = await cacheStorage.open(name);
        const matches = await Promise.all(unique.map(url => cache.match(url)));
        return { found: matches.filter(response => response && response.ok).length, total: unique.length };
      }
      const [core, routes, photos] = await Promise.all([
        count(coreName, coreFiles), count(coreName, routeFiles), count('camino-fotos', photoFiles)
      ]);
      return { core, routes, photos };
    } catch { return { core: null, routes: null, photos: null }; }
  }
  root.CaminoOfflineReadiness = { inspect };
})(globalThis);
