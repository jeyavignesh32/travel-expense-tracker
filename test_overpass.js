const testOverpass = async () => {
  const lat = 15.4909;
  const lon = 73.8278;
  // Use nwr (node, way, relation) and out center to catch all tourist attractions
  const query = `
    [out:json][timeout:15];
    (
      nwr["tourism"](around:10000,${lat},${lon});
      nwr["historic"](around:10000,${lat},${lon});
    );
    out center 15;
  `;
  
  const urls = [
    'https://overpass.osm.ch/api/interpreter',
    'https://overpass-api.de/api/interpreter'
  ];

  for (const url of urls) {
    try {
      console.log(`Fetching from ${url} using POST...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'http://localhost:5173/'
        },
        body: `data=${encodeURIComponent(query)}`
      });
      console.log(`Status for ${url}:`, res.status);
      const text = await res.text();
      if (res.status === 200) {
        const data = JSON.parse(text);
        console.log('SUCCESS! Elements found:', data.elements?.length || 0);
        if (data.elements && data.elements.length > 0) {
          data.elements.slice(0, 5).forEach(el => {
            const name = el.tags?.name || 'Unnamed';
            const type = el.tags?.tourism || el.tags?.historic || el.tags?.leisure || 'unknown';
            const latitude = el.lat || (el.center && el.center.lat);
            const longitude = el.lon || (el.center && el.center.lon);
            console.log(`  - ${name} (${type}) at lat: ${latitude}, lon: ${longitude}`);
          });
        }
        return;
      }
    } catch (err) {
      console.error(`FAILED for ${url}:`, err);
    }
  }
};

testOverpass();
