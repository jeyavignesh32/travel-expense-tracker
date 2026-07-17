// client/src/hooks/useNearbyPlaces.js
import { useQuery } from '@tanstack/react-query';
import { fetchNearbyPlaces, distanceMeters } from '../services/overpassService';
import { CATEGORY_KEYS } from '../services/mapCategories';
import { useMemo } from 'react';

// Priority order for OSM types (lower index = higher priority in list)
const TYPE_PRIORITY = [
  'atm', 'bank', 'hospital', 'pharmacy', 'college', 'school',
  'hotel', 'guest_house', 'restaurant', 'shop'
];

export const useNearbyPlaces = (lat, lon, categories = [], radius = 5000) => {
  const categoryKeys = categories.length > 0 ? categories : CATEGORY_KEYS;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['nearbyPlaces', lat, lon, radius],
    queryFn: () => fetchNearbyPlaces(lat, lon, radius, categoryKeys),
    enabled: !!lat && !!lon,
    staleTime: 1000 * 60 * 5,   // 5 minutes — proxy has its own cache
    refetchOnWindowFocus: false, // don't refetch on tab switch
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // exp backoff
  });

  const processedPlaces = useMemo(() => {
    // Proxy returns { places: [...] }
    const items = data?.places || data?.results || [];
    if (!Array.isArray(items) || items.length === 0) return [];

    return items
      .map(p => {
        const distanceM = (lat && lon && p.lat && p.lon) ? distanceMeters(lat, lon, p.lat, p.lon) : (p.distance || 0);
        const distRounded = Math.round(distanceM);
        const distanceKm = distRounded / 1000;

        const typePriority = TYPE_PRIORITY.indexOf(p.category || p.type);
        const priorityRank = typePriority === -1 ? TYPE_PRIORITY.length : typePriority;

        return {
          id: p.id,
          name: p.name || p.tags?.name || (p.type || 'Place'),
          type: p.category || p.type,
          category: p.category || p.type,
          subtype: p.subtype || null,
          lat: p.lat,
          lon: p.lon,
          tags: p.tags || {},
          source: 'openstreetmap',
          distance: distRounded,
          distanceLabel: p.distanceLabel || (distRounded < 1000 ? `${distRounded}m` : `${distanceKm.toFixed(1)}km`),
          priorityRank,
          categories: p.categories || [p.category || p.type]
        };
      })
      .sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return a.priorityRank - b.priorityRank;
      });
  }, [data, lat, lon]);

  return {
    places: processedPlaces,
    total: processedPlaces.length,
    source: 'openstreetmap',
    isLoading,
    error,
    refetch
  };
};
