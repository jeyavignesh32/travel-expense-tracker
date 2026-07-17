// client/src/components/AIAssistant.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, MapPin, DollarSign, Utensils, Shield, ChevronDown } from 'lucide-react';

// ─── Heuristic AI knowledge base ────────────────────────────────────────────
const KB = {
  greetings: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'hola', 'namaste'],
  budget: ['budget', 'money', 'spend', 'cost', 'expensive', 'cheap', 'afford', 'price', 'rupee', 'inr'],
  food: ['food', 'eat', 'restaurant', 'cafe', 'lunch', 'dinner', 'breakfast', 'meal', 'hungry', 'snack', 'cuisine'],
  places: ['places', 'visit', 'attraction', 'tourist', 'sightseeing', 'temple', 'beach', 'fort', 'museum', 'park'],
  safety: ['safe', 'sos', 'emergency', 'police', 'hospital', 'danger', 'help', 'accident'],
  transport: ['taxi', 'auto', 'bus', 'train', 'uber', 'ola', 'rickshaw', 'travel', 'commute', 'distance'],
  hotel: ['hotel', 'stay', 'hostel', 'accommodation', 'airbnb', 'room', 'lodge', 'sleep'],
  weather: ['weather', 'rain', 'hot', 'cold', 'climate', 'temperature', 'forecast', 'monsoon'],
};

const responses = {
  greeting: [
    "Hey there, fellow traveler! 🌍 I'm your AI Travel Assistant. Ask me about nearby places, budget tips, food spots, or safety advice!",
    "Namaste! 🙏 Ready to help you explore like a local. What do you want to know?",
    "Hello, adventurer! ✈️ I can help with budget planning, food recommendations, tourist spots, and more. What's on your mind?"
  ],
  budget: [
    "💰 **Budget Tips for Smart Travelers:**\n• Street food averages ₹50–₹150 per meal\n• Budget hotels: ₹600–₹1500/night\n• Local buses: ₹10–₹50 per ride\n• Auto-rickshaw: ~₹15/km\n• Tourist spots: ₹0–₹500 entry\n\nKeep your daily budget around ₹1,500–₹2,500 for a comfortable trip!",
    "🎯 **Budget Optimization:**\n• Book hotels midweek (20–30% cheaper)\n• Use local transport over cabs\n• Visit free attractions: parks, viewpoints, temples\n• Eat where locals eat — tastier and cheaper!\n• Always carry small change for local markets",
  ],
  food: [
    "🍛 **Food Recommendations:**\n• **Street Food:** Pav Bhaji, Vada Pav, Dosas — ₹30–₹100\n• **Budget Restaurants:** Look for 'meals' joints (₹80–₹150)\n• **Mid-range:** Themed cafes (₹200–₹400 per head)\n• **Tip:** Avoid tourist traps near monuments — walk 100m further for real local food!\n\nUse the Map tab to find top-rated restaurants near you.",
    "☕ **Best Food Spots Strategy:**\n• Check Google Maps ratings > 4.0 with 100+ reviews\n• South Indian breakfast is value for money everywhere\n• Thalis give best quantity at lowest price\n• For hygiene: prefer crowded local joints over empty ones",
  ],
  places: [
    "🗺️ **Exploring Like a Pro:**\n• Open the **Map tab** to see all nearby attractions with distances\n• Temples & viewpoints are usually **free entry**\n• Visit popular spots early morning (before 9 AM) — cooler and less crowded\n• Heritage sites: ₹50–₹500 (Indians get discounts!)\n• Use the city search on the map to scout any destination in advance",
    "🏛️ **Must-Visit Categories:**\n• **Religious:** Temples, churches, mosques — free, peaceful\n• **Historical:** Forts, palaces — ₹50–₹200 entry\n• **Natural:** Beaches, parks, viewpoints — mostly free\n• **Cultural:** Museums, galleries — ₹20–₹200\n\nAll visible on your Live Map with distance info!",
  ],
  safety: [
    "🛡️ **Travel Safety Essentials:**\n• Always share your live location with trusted contacts\n• Use the **SOS button** on the Map or Safety page for emergencies\n• Save local police number: **100** | Ambulance: **108**\n• Keep a photocopy of your passport/ID in your vault\n• Avoid isolated areas after dark\n• Trust your instincts — if it feels wrong, leave",
    "🚨 **Emergency Contacts (India):**\n• Police: **100**\n• Ambulance: **108** \n• Women Helpline: **181**\n• Tourist Helpline: **1800-111-363**\n\nYour app's Safety page has an encrypted vault for important documents!",
  ],
  transport: [
    "🚗 **Getting Around Smartly:**\n• **Auto-rickshaw:** Negotiate or use meter — ~₹15/km\n• **Taxi/Cab:** Uber/Ola are safer with GPS tracking — ₹10–₹15/km\n• **Local Bus:** Cheapest, ₹10–₹50 per ride\n• **Metro:** Most cities have it, very affordable\n• **Rental Bikes/Scooters:** ₹300–₹600/day — great for exploring\n\nTip: Avoid sharing auto with strangers at night.",
    "🚌 **Transport Cost Estimator:**\n• 5 km auto ride ≈ ₹75\n• 10 km Uber ≈ ₹130–₹180\n• Day pass metro ≈ ₹50–₹100\n• Intercity train (budget) ≈ ₹200–₹500",
  ],
  hotel: [
    "🏨 **Accommodation Guide:**\n• **Hostels/Dormitories:** ₹300–₹700/night (great for solo travelers!)\n• **Budget Hotels:** ₹800–₹1,500/night\n• **Mid-range:** ₹2,000–₹5,000/night\n• **Heritage Hotels:** Unique experience, ₹3,000–₹10,000\n\nBook via MakeMyTrip or Booking.com for best deals. Always check reviews for cleanliness!",
  ],
  weather: [
    "🌤️ **Weather-Smart Traveling:**\n• Check the live weather widget on your Dashboard\n• Monsoon (Jun–Sep): Carry rain gear, avoid flash flood zones\n• Summer (Mar–May): Start early morning, stay hydrated (2–3L water/day)\n• Winter (Oct–Feb): Best travel season for most of India\n• Mountains: Always carry layers — temperature drops sharply after sunset",
  ],
  default: [
    "🤔 Interesting question! As your travel AI, I'm best at:\n• **Budget planning** — How much to spend where\n• **Food spots** — Best local eats\n• **Tourist places** — What to visit nearby\n• **Safety tips** — Stay secure on the road\n• **Transport** — Getting around cheaply\n\nWhat would you like to know?",
    "I'm learning more every day! 🌱 For now, try asking me about:\n• \"What's a good daily budget for Goa?\"\n• \"What food should I try?\"\n• \"How do I stay safe while traveling?\"\n• \"What places should I visit nearby?\"",
  ]
};

function getResponse(message) {
  const lower = message.toLowerCase();
  
  if (KB.greetings.some(w => lower.includes(w))) {
    return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
  }
  if (KB.safety.some(w => lower.includes(w))) {
    return responses.safety[Math.floor(Math.random() * responses.safety.length)];
  }
  if (KB.budget.some(w => lower.includes(w))) {
    return responses.budget[Math.floor(Math.random() * responses.budget.length)];
  }
  if (KB.food.some(w => lower.includes(w))) {
    return responses.food[Math.floor(Math.random() * responses.food.length)];
  }
  if (KB.places.some(w => lower.includes(w))) {
    return responses.places[Math.floor(Math.random() * responses.places.length)];
  }
  if (KB.transport.some(w => lower.includes(w))) {
    return responses.transport[Math.floor(Math.random() * responses.transport.length)];
  }
  if (KB.hotel.some(w => lower.includes(w))) {
    return responses.hotel[Math.floor(Math.random() * responses.hotel.length)];
  }
  if (KB.weather.some(w => lower.includes(w))) {
    return responses.weather[Math.floor(Math.random() * responses.weather.length)];
  }
  return responses.default[Math.floor(Math.random() * responses.default.length)];
}

const QUICK_PROMPTS = [
  { label: '💰 Budget Tips', text: 'Give me budget tips for travel' },
  { label: '🍛 Food Spots', text: 'What food should I try nearby?' },
  { label: '🗺️ Places to Visit', text: 'What places should I visit?' },
  { label: '🛡️ Stay Safe', text: 'How do I stay safe while traveling?' },
];

// Format response with basic markdown rendering
const FormattedMsg = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: '13px', lineHeight: '1.7' }}>
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <strong key={i} style={{ display: 'block', marginTop: '4px', color: 'var(--primary)' }}>{line.replace(/\*\*/g, '')}</strong>;
        }
        if (line.startsWith('• ')) {
          return <div key={i} style={{ paddingLeft: '8px', color: 'var(--text-muted)' }}>{line}</div>;
        }
        if (line.includes('**')) {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return <span key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</span>;
        }
        return <span key={i}>{line}{i < lines.length - 1 ? '\n' : ''}</span>;
      })}
    </div>
  );
};

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: "Hi! I'm your AI Travel Assistant. 🌍 Ask me about budget, food, places, safety, or transport tips!", ts: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    const msgText = text || input.trim();
    if (!msgText) return;
    
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: msgText, ts: new Date() }]);
    setIsTyping(true);

    // Simulate thinking delay
    await new Promise(r => setTimeout(r, 700 + Math.random() * 600));
    
    const aiResponse = getResponse(msgText);
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: aiResponse, ts: new Date() }]);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
          width: '56px', height: '56px', borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #2563eb, #9333ea)',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white'
        }}
        title="AI Travel Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><ChevronDown size={22} /></motion.div>
            : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Bot size={22} /></motion.div>
          }
        </AnimatePresence>
        {/* Pulsing ring when closed */}
        {!isOpen && (
          <div style={{
            position: 'absolute', inset: '-4px', borderRadius: '50%',
            border: '2px solid rgba(37,99,235,0.4)',
            animation: 'ai-pulse 2.5s ease-in-out infinite'
          }} />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: '96px', right: '28px', zIndex: 9998,
              width: '360px', height: '520px',
              background: 'var(--bg-glass-heavy)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid var(--border-light)',
              boxShadow: '0 24px 60px -12px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #2563eb, #9333ea)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: 0 }}>AI Travel Assistant</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  Online • Local AI
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Quick Prompts */}
            <div style={{ padding: '10px 12px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)' }}>
              {QUICK_PROMPTS.map(qp => (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.text)}
                  style={{
                    fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px',
                    border: '1px solid var(--border-light)', background: 'var(--primary-glow)',
                    color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  {msg.role === 'ai' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0, alignSelf: 'flex-end' }}>
                      <Sparkles size={12} color="white" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '78%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #2563eb, #9333ea)' : 'var(--bg-surface)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                    border: msg.role === 'ai' ? '1px solid var(--border-light)' : 'none',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {msg.role === 'ai' ? <FormattedMsg text={msg.text} /> : <p style={{ fontSize: '13px', margin: 0 }}>{msg.text}</p>}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={12} color="white" />
                  </div>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: '4px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-surface)' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about food, budget, places..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid var(--border-light)',
                  background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px', outline: 'none'
                }}
              />
              <motion.button
                onClick={() => sendMessage()}
                whileTap={{ scale: 0.9 }}
                disabled={!input.trim() || isTyping}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  background: input.trim() ? 'linear-gradient(135deg, #2563eb, #9333ea)' : 'var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <Send size={16} color={input.trim() ? 'white' : 'var(--text-dim)'} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes ai-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.3; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
};

export default AIAssistant;
