import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import axios from 'axios';
import { Heart, X, Sparkles, MapPin, Check } from 'lucide-react';

const SwipeCard = ({ place, onSwipe }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event, info) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe(place, 'right'));
    } else if (info.offset.x < -threshold) {
      controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe(place, 'left'));
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, opacity }}
      animate={controls}
      className="absolute w-full h-[400px] bg-slate-800 rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-slate-700"
    >
      <div 
        className="w-full h-3/5 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${place.tags?.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
          {place.tags?.type || 'Attraction'}
        </div>
      </div>
      
      <div className="p-6 h-2/5 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 truncate">{place.tags?.name || 'Unknown Place'}</h2>
          <p className="text-slate-400 text-sm flex items-center gap-1">
            <MapPin size={14} /> 
            {place.tags?.description || 'A highly recommended spot for your trip.'}
          </p>
        </div>
        
        <div className="flex justify-center gap-6 mt-4">
          <button 
            onClick={() => controls.start({ x: -500, opacity: 0 }).then(() => onSwipe(place, 'left'))}
            className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center text-red-400 hover:bg-slate-700 transition-colors"
          >
            <X size={24} />
          </button>
          <button 
            onClick={() => controls.start({ x: 500, opacity: 0 }).then(() => onSwipe(place, 'right'))}
            className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center text-green-400 hover:bg-slate-700 transition-colors"
          >
            <Heart size={24} fill="currentColor" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const SwipeItinerary = ({ onClose, onBuildComplete }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        // Fetch near Goa (mock default trip location)
        const res = await axios.get('http://localhost:5000/api/nearby/spots?lat=15.2993&lon=74.1240&radius=20000&includeAllSpecial=true');
        const allPlaces = [...(res.data.specialPlaces || []), ...(res.data.restaurantPlaces || [])];
        setPlaces(allPlaces.slice(0, 15).reverse()); // Take top 15, reverse for stack rendering
      } catch (err) {
        console.error('Fetch failed for swipe cards', err);
        // Fallback mock cards
        setPlaces([
          { id: 1, tags: { name: 'Baga Beach', type: 'Beach', description: 'Famous for nightlife.' } },
          { id: 2, tags: { name: 'Dudhsagar Falls', type: 'Nature', description: 'Majestic four-tiered waterfall.' } },
          { id: 3, tags: { name: 'Tito\'s Lane', type: 'Nightlife', description: 'The hub of partying in Goa.' } }
        ].reverse());
      }
      setLoading(false);
    };
    fetchPlaces();
  }, []);

  const handleSwipe = (place, direction) => {
    if (direction === 'right') {
      setMatches(prev => [...prev, place]);
    }
    setPlaces(prev => prev.filter(p => p.id !== place.id));
  };

  const generateItinerary = async () => {
    setBuilding(true);
    // Simulate AI building itinerary from matches
    for (let i = 0; i < matches.length; i++) {
      try {
        await axios.post('http://localhost:5000/api/itinerary', {
          trip_id: 1,
          day_number: (i % 3) + 1, // Distribute across 3 days
          time_slot: `${10 + (i % 4) * 2}:00 AM`,
          name: matches[i].tags.name,
          type: matches[i].tags.type || 'Activity',
          location: matches[i].tags.name
        });
      } catch (e) { console.error('Failed to save to itinerary', e); }
    }
    setBuilding(false);
    onBuildComplete(); // Refresh parent itinerary
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={20} />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="text-blue-400" />
            Swipe to Decide
          </h2>
          <p className="text-slate-400 text-sm mt-1">Swipe right on what you like. We'll build the perfect itinerary.</p>
        </div>

        <div className="relative w-full h-[400px] flex items-center justify-center">
          {loading ? (
            <div className="text-slate-400 flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Finding spots...
            </div>
          ) : places.length > 0 ? (
            places.map((place, index) => (
              <SwipeCard key={place.id} place={place} onSwipe={handleSwipe} />
            ))
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={40} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">All done!</h3>
              <p className="text-slate-400 mb-6">You matched with {matches.length} places.</p>
              
              <button 
                onClick={generateItinerary}
                disabled={building || matches.length === 0}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-bold disabled:opacity-50"
              >
                {building ? 'Building Magic Itinerary...' : `Generate Itinerary (${matches.length})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
