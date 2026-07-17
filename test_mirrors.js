const https = require('https');

const query = '[out:json][timeout:25];(node["amenity"~"atm|bank|hospital|restaurant"](around:2000,28.6139,77.2090););out body 10;';
const body = 'data=' + encodeURIComponent(query);

const mirrors = ['overpass-api.de', 'lz4.overpass-api.de', 'overpass.openstreetmap.ru'];

async function testMirror(hostname) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'TravelExpenseApp/1.0',
      },
      rejectUnauthorized: false,
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          resolve({ mirror: hostname, status: res.statusCode, elements: (j.elements||[]).length });
        } catch(e) {
          resolve({ mirror: hostname, status: res.statusCode, error: 'parse error', raw: d.slice(0,200) });
        }
      });
    });
    req.setTimeout(20000, () => { req.destroy(); resolve({ mirror: hostname, error: 'TIMEOUT' }); });
    req.on('error', e => resolve({ mirror: hostname, error: e.message }));
    req.write(body);
    req.end();
  });
}

(async () => {
  for (const m of mirrors) {
    console.log('Testing:', m, '...');
    const result = await testMirror(m);
    console.log(JSON.stringify(result));
  }
})();
