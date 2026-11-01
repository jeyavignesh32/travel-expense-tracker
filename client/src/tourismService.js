// Real OSM attraction discovery within a fixed 50 km radius.
// The Nominatim and Overpass public services have usage policies and rate limits;
// for production, proxy/cache these requests and identify your application.
export async function findDestination(query){
 const url=`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
 const r=await fetch(url,{headers:{'Accept-Language':'en'}});
 if(!r.ok) throw new Error('Destination lookup failed');
 const data=await r.json(); if(!data[0]) throw new Error('Destination not found');
 return {lat:Number(data[0].lat),lon:Number(data[0].lon),label:data[0].display_name};
}
export async function findAttractions(lat,lon){
 const q=`[out:json][timeout:35];(node(around:50000,${lat},${lon})[tourism~"attraction|museum|viewpoint|artwork|zoo|theme_park"];way(around:50000,${lat},${lon})[tourism~"attraction|museum|viewpoint|artwork|zoo|theme_park"];node(around:50000,${lat},${lon})[historic];way(around:50000,${lat},${lon})[historic];);out center tags;`;
 const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)});
 if(!r.ok) throw new Error('Attraction search is temporarily unavailable');
 const d=await r.json();
 return (d.elements||[]).map(x=>({id:`${x.type}/${x.id}`,name:x.tags?.name||x.tags?.['name:en'],lat:x.lat??x.center?.lat,lon:x.lon??x.center?.lon,type:x.tags?.tourism||x.tags?.historic||'historic'})).filter(x=>x.name&&Number.isFinite(x.lat)&&Number.isFinite(x.lon)).slice(0,100);
}
