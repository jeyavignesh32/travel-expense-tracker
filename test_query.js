const test = async () => {
  const lat = 15.4909;
  const lon = 73.8278;
  const radius = 5000;
  
  // Try a very simple query targeting just nodes with name and amenity place_of_worship
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="place_of_worship"]["name"](around:${radius},${lat},${lon});
      way["amenity"="place_of_worship"]["name"](around:${radius},${lat},${lon});
      node["tourism"~"museum|attraction|viewpoint|gallery|theme_park|zoo"]["name"](around:${radius},${lat},${lon});
      way["tourism"~"museum|attraction|viewpoint|gallery|theme_park|zoo"]["name"](around:${radius},${lat},${lon});
      node["historic"~"monument|castle|fort|ruins|archaeological_site"]["name"](around:${radius},${lat},${lon});
      way["historic"~"monument|castle|fort|ruins|archaeological_site"]["name"](around:${radius},${lat},${lon});
      node["amenity"~"restaurant|cafe|pub|bar"]["name"](around:${radius},${lat},${lon});
      way["amenity"~"restaurant|cafe|pub|bar"]["name"](around:${radius},${lat},${lon});
      node["leisure"~"park|garden"]["name"](around:${radius},${lat},${lon});
      way["leisure"~"park|garden"]["name"](around:${radius},${lat},${lon});
    );
    out center 45;
  `;

  const urls = [
    'https://overpass.osm.ch/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter'
  ];

  for (const url of urls) {
    try {
      const targetUrl = `${url}?data=${encodeURIComponent(query)}`;
      console.log('Sending GET query to:', url);
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'http://localhost:5173/'
        }
      });
      console.log('Status:', res.status);
      if (res.status === 200) {
        const data = await res.json();
        console.log('Elements retrieved:', data.elements?.length || 0);
        if (data.elements) {
          console.log('First 5 elements:');
          console.log(JSON.stringify(data.elements.slice(0, 5), null, 2));
        }
        return;
      }
    } catch (err) {
      console.error(`Fetch error for ${url}:`, err.message);
    }
  }
};

test();
