import localforage from 'localforage';

// Configure instances for different data types
const expensesStore = localforage.createInstance({
  name: 'TravelSense',
  storeName: 'expenses'
});

const itineraryStore = localforage.createInstance({
  name: 'TravelSense',
  storeName: 'itinerary'
});

const mapCacheStore = localforage.createInstance({
  name: 'TravelSense',
  storeName: 'mapCache'
});

export const saveExpenseOffline = async (expense) => {
  try {
    const existing = await expensesStore.getItem('all_expenses') || [];
    const updated = [expense, ...existing];
    await expensesStore.setItem('all_expenses', updated);
    return updated;
  } catch (err) {
    console.error('Failed to save expense offline', err);
    return [];
  }
};

export const getOfflineExpenses = async () => {
  try {
    return await expensesStore.getItem('all_expenses') || [];
  } catch (err) {
    return [];
  }
};

export const cacheMapData = async (lat, lon, radius, data) => {
  try {
    const key = `map_${Math.round(lat*100)}_${Math.round(lon*100)}_${radius}`;
    await mapCacheStore.setItem(key, { data, timestamp: Date.now() });
  } catch (err) {
    console.error('Failed to cache map data', err);
  }
};

export const getCachedMapData = async (lat, lon, radius) => {
  try {
    const key = `map_${Math.round(lat*100)}_${Math.round(lon*100)}_${radius}`;
    const cached = await mapCacheStore.getItem(key);
    // Cache expires after 24 hours
    if (cached && (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000)) {
      return cached.data;
    }
    return null;
  } catch (err) {
    return null;
  }
};
