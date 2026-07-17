export const CATEGORIES = [
  { id: 'atm', label: 'ATM', type: 'amenity', value: 'atm', icon: '🏧', color: '#10b981' },
  { id: 'bank', label: 'Bank', type: 'amenity', value: 'bank', icon: '🏦', color: '#059669' },
  { id: 'hospital', label: 'Hospital', type: 'amenity', value: 'hospital', icon: '🏥', color: '#ef4444' },
  { id: 'pharmacy', label: 'Pharmacy', type: 'amenity', value: 'pharmacy', icon: '💊', color: '#f87171' },
  { id: 'restaurant', label: 'Restaurant', type: 'amenity', value: 'restaurant', icon: '🍽️', color: '#f59e0b' },
  { id: 'school', label: 'School', type: 'amenity', value: 'school', icon: '🏫', color: '#3b82f6' },
  { id: 'college', label: 'College', type: 'amenity', value: 'college', icon: '🎓', color: '#2563eb' },
  { id: 'hotel', label: 'Hotel', type: 'tourism', value: 'hotel', icon: '🏨', color: '#8b5cf6' },
  { id: 'guest_house', label: 'Guest House', type: 'tourism', value: 'guest_house', icon: '🏡', color: '#a78bfa' },
  { id: 'shop', label: 'Shop', type: 'shop', value: '*', icon: '🛒', color: '#ec4899' },
];

export const getCategoryStyles = (type, rawTags = {}) => {
  if (type === 'shop' || rawTags.shop) {
    return { icon: '🛒', color: '#ec4899', label: 'Shop' };
  }
  const match = CATEGORIES.find(c => c.value === type);
  return match ? { icon: match.icon, color: match.color, label: match.label } : { icon: '📍', color: '#6b7280', label: type || 'Unknown' };
};
