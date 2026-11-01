/**
 * Hotel inventory integration.
 * - Amadeus Self-Service Hotel APIs are supported when server-side credentials exist.
 * - A generic contracted supplier adapter is also supported.
 * - OpenStreetMap is used separately for mapped hotel discovery, never as a price source.
 */
const timeoutFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
};

async function searchAmadeus({ destination, checkIn, checkOut, adults = 2 }) {
  const base = (process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com').replace(/\/$/, '');
  const credentials = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.AMADEUS_CLIENT_ID,
    client_secret: process.env.AMADEUS_CLIENT_SECRET,
  });
  const authResponse = await timeoutFetch(`${base}/v1/security/oauth2/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: credentials,
  });
  if (!authResponse.ok) throw new Error(`Hotel supplier authentication failed (${authResponse.status}). Check Amadeus API credentials.`);
  const authData = await authResponse.json();
  const headers = { Authorization: `Bearer ${authData.access_token}` };
  const cityUrl = new URL(`${base}/v1/reference-data/locations`);
  cityUrl.search = new URLSearchParams({ subType: 'CITY', keyword: destination, 'page[limit]': '5' });
  const cityResponse = await timeoutFetch(cityUrl, { headers });
  if (!cityResponse.ok) throw new Error(`Hotel destination lookup failed (${cityResponse.status}).`);
  const cities = (await cityResponse.json()).data || [];
  const cityCode = cities.find((c) => c.iataCode)?.iataCode;
  if (!cityCode) return { configured: true, hotels: [], message: 'No supported city code was found for this destination.' };

  const hotelUrl = new URL(`${base}/v1/reference-data/locations/hotels/by-city`);
  hotelUrl.search = new URLSearchParams({ cityCode, radius: '20', radiusUnit: 'KM', hotelSource: 'ALL' });
  const hotelResponse = await timeoutFetch(hotelUrl, { headers });
  if (!hotelResponse.ok) throw new Error(`Hotel inventory lookup failed (${hotelResponse.status}).`);
  const inventory = (await hotelResponse.json()).data || [];
  const ids = inventory.map((h) => h.hotelId).filter(Boolean).slice(0, 20);
  if (!ids.length) return { configured: true, hotels: [], message: 'No hotel inventory was returned for this destination.' };

  const offersUrl = new URL(`${base}/v3/shopping/hotel-offers`);
  offersUrl.search = new URLSearchParams({ hotelIds: ids.join(','), adults: String(adults), checkInDate: checkIn, checkOutDate: checkOut, roomQuantity: '1', currency: 'INR' });
  const offersResponse = await timeoutFetch(offersUrl, { headers });
  if (!offersResponse.ok) throw new Error(`Hotel rate search failed (${offersResponse.status}).`);
  const offers = (await offersResponse.json()).data || [];
  return {
    configured: true,
    hotels: offers.map((item) => {
      const offer = item.offers?.[0];
      return {
        id: item.hotel?.hotelId,
        name: item.hotel?.name || 'Hotel',
        address: [item.hotel?.address?.lines?.join(', '), item.hotel?.address?.cityName].filter(Boolean).join(', '),
        price: offer?.price?.total,
        currency: offer?.price?.currency || 'INR',
        checkIn, checkOut,
        available: Boolean(offer),
      };
    }).filter((h) => h.price != null).sort((a, b) => Number(a.price) - Number(b.price)),
    message: offers.length ? 'Live hotel offers returned by Amadeus.' : 'No bookable offers were returned for these dates.',
  };
}

export async function searchHotels({ destination, checkIn, checkOut, adults = 2 }) {
  if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    return searchAmadeus({ destination, checkIn, checkOut, adults });
  }
  if (process.env.HOTEL_API_URL && process.env.HOTEL_API_KEY) {
    const response = await timeoutFetch(process.env.HOTEL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.HOTEL_API_KEY}` },
      body: JSON.stringify({ destination, checkIn, checkOut, adults }),
    });
    if (!response.ok) throw new Error(`Hotel supplier request failed (${response.status}).`);
    const data = await response.json();
    return { configured: true, hotels: Array.isArray(data.hotels) ? data.hotels : [], message: data.message || 'Hotel supplier response received.' };
  }
  return {
    configured: false,
    hotels: [],
    message: 'Live hotel rates are not enabled. Add Amadeus API credentials or a contracted hotel supplier. Nearby mapped hotels can still be discovered from OpenStreetMap.',
  };
}
