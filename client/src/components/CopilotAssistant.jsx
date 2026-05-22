// client/src/components/CopilotAssistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, Send, Mic, MicOff, RefreshCw, 
  Sparkles, CheckCircle2, AlertCircle, ShoppingBag, 
  Wallet, Calendar, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
  "Log food expense of ₹450 for beach snacks",
  "Suggest a 2-day itinerary for Goa",
  "Add 'First Aid Kit' to meds packing list",
  "What are some safety tips for Goa?"
];

export const CopilotAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: `Hey ${user?.name || 'there'}! I am your TravelSense Copilot. Ask me to log expenses, plan your itinerary, suggest packing checklists, or give local safety advice!` }
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  // Web Speech API Voice recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsListening(false);
      };
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Try Chrome or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // Add user message to history
    const userMsg = { role: 'user', content: query };
    setChatHistory(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Send chat request to local backend endpoint
      const res = await axios.post('http://localhost:5000/api/copilot/chat', {
        message: query,
        chatHistory: chatHistory.slice(-10), // Send last 10 messages for context
        tripId: 1
      });

      const reply = {
        role: 'assistant',
        content: res.data.content,
        actions: res.data.actions || []
      };

      setChatHistory(prev => [...prev, reply]);

      // If the AI successfully updated backend tables, fire custom global window events
      if (res.data.actions && res.data.actions.length > 0) {
        res.data.actions.forEach(action => {
          console.log(`📣 Dispatched custom action event: ${action.tool}`);
          if (action.tool === 'add_expense') {
            window.dispatchEvent(new Event('expense-updated'));
          } else if (action.tool === 'add_itinerary_item') {
            window.dispatchEvent(new Event('itinerary-updated'));
          } else if (action.tool.includes('packing')) {
            window.dispatchEvent(new Event('packing-updated'));
          }
        });
      }

    } catch (err) {
      console.error('Copilot send failure:', err);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I had trouble processing that request. Please make sure the backend server is running."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderActionCard = (action, idx) => {
    const { tool, arguments: args, result } = action;
    const isMock = result && result.mode === 'mock';

    switch (tool) {
      case 'add_expense':
        return (
          <div key={idx} style={styles.actionCard}>
            <div style={styles.cardHeader}>
              <Wallet size={16} color="var(--primary)" />
              <span style={styles.cardTitle}>Expense Logged</span>
              {isMock && <span style={styles.mockBadge}>Demo Mode</span>}
            </div>
            <p style={styles.cardText}>₹{args.amount} logged for <strong>"{args.description}"</strong> under category <em>{args.category}</em>.</p>
            <div style={styles.successIndicator}><CheckCircle2 size={14} /> Database synced</div>
          </div>
        );
      case 'add_itinerary_item':
        return (
          <div key={idx} style={styles.actionCard}>
            <div style={styles.cardHeader}>
              <Calendar size={16} color="var(--secondary)" />
              <span style={styles.cardTitle}>Activity Added</span>
              {isMock && <span style={styles.mockBadge}>Demo Mode</span>}
            </div>
            <p style={styles.cardText}>"{args.name}" scheduled on <strong>Day {args.day_number}</strong> at {args.time_slot}.</p>
            <div style={styles.successIndicator}><CheckCircle2 size={14} /> Added to timeline</div>
          </div>
        );
      case 'add_packing_item':
        return (
          <div key={idx} style={styles.actionCard}>
            <div style={styles.cardHeader}>
              <ShoppingBag size={16} color="var(--success)" />
              <span style={styles.cardTitle}>Packing Item Added</span>
              {isMock && <span style={styles.mockBadge}>Demo Mode</span>}
            </div>
            <p style={styles.cardText}>Added <strong>"{args.name}"</strong> under category <em>{args.category}</em>.</p>
            <div style={styles.successIndicator}><CheckCircle2 size={14} /> Checklist updated</div>
          </div>
        );
      case 'toggle_packing_item':
        return (
          <div key={idx} style={styles.actionCard}>
            <div style={styles.cardHeader}>
              <ShoppingBag size={16} color="var(--success)" />
              <span style={styles.cardTitle}>Packing Updated</span>
              {isMock && <span style={styles.mockBadge}>Demo Mode</span>}
            </div>
            <p style={styles.cardText}>Checklist item {args.item_id} marked as <strong>{args.packed ? 'packed' : 'unpacked'}</strong>.</p>
            <div style={styles.successIndicator}><CheckCircle2 size={14} /> Status modified</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <motion.button 
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', right: '28px', bottom: '28px',
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          border: 'none', cursor: 'pointer', zIndex: 199,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 30px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.4)',
          color: 'white'
        }}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        
        {/* Sparkle decorative effect */}
        <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--warning)', borderRadius: '50%', padding: '4px', border: '2px solid var(--bg-surface)' }}>
          <Sparkles size={12} color="white" />
        </span>
      </motion.button>

      {/* Slide-out Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={styles.overlay}
            />

            {/* Sidebar drawer container */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={styles.sidebar}
            >
              {/* Header */}
              <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={styles.logoBadge}>
                    <Sparkles size={18} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', margin: 0 }}>Travel Copilot</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Powered by OpenAI GPT-4o</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>

              {/* Chat messages viewport */}
              <div style={styles.chatArea}>
                {chatHistory.map((msg, i) => (
                  <div key={i} style={msg.role === 'user' ? styles.userRow : styles.assistantRow}>
                    <div style={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      
                      {/* Render Confirmation Action Cards if AI modified data */}
                      {msg.actions && msg.actions.map((act, idx) => renderActionCard(act, idx))}
                    </div>
                  </div>
                ))}
                
                {/* Typing Loader */}
                {loading && (
                  <div style={styles.assistantRow}>
                    <div style={styles.assistantBubble}>
                      <div style={styles.typingIndicator}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions quick chips */}
              {chatHistory.length <= 1 && (
                <div style={styles.suggestionsContainer}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '8px' }}>Suggestions:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {SUGGESTIONS.map((s, idx) => (
                      <button key={idx} onClick={() => handleSend(s)} style={styles.suggestionChip}>
                        <Play size={10} style={{ opacity: 0.5 }} />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Input Controls */}
              <div style={styles.footer}>
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <button 
                    type="button" 
                    onClick={toggleListening} 
                    style={{
                      ...styles.actionIconBtn,
                      background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      color: isListening ? 'var(--danger)' : 'var(--text-muted)'
                    }}
                  >
                    {isListening ? <MicOff size={20} className="pulse-mic" /> : <Mic size={20} />}
                  </button>
                  <input 
                    className="input-premium"
                    style={{ flex: 1, padding: '12px 16px', fontSize: '14px', borderRadius: '12px' }}
                    placeholder={isListening ? "Listening..." : "Message Copilot..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                  />
                  <button 
                    type="submit" 
                    className="btn-premium" 
                    style={{ width: '42px', height: '42px', padding: 0, borderRadius: '12px', flexShrink: 0 }}
                    disabled={loading || !input.trim()}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mic Animation styling inject */}
      <style>{`
        @keyframes micPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); box-shadow: 0 0 8px rgba(239, 68, 68, 0.3); }
          100% { transform: scale(1); }
        }
        .pulse-mic {
          animation: micPulse 1.2s infinite ease-in-out;
        }
        
        .typing-indicator span {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--text-muted);
          margin-right: 4px;
          animation: typingPulse 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes typingPulse {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};

// Styles for custom widgets
const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.25)', 
    backdropFilter: 'blur(4px)', zIndex: 197
  },
  sidebar: {
    position: 'fixed', right: 0, top: 0, bottom: 0, width: '420px',
    maxWidth: '100%', background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(20px)',
    borderLeft: '1px solid var(--border-light)', zIndex: 198,
    boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column'
  },
  header: {
    padding: '20px 24px', borderBottom: '1px solid var(--border-light)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  logoBadge: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  closeBtn: {
    border: 'none', background: 'transparent', color: 'var(--text-muted)',
    cursor: 'pointer', display: 'flex', alignItems: 'center'
  },
  chatArea: {
    flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', 
    flexDirection: 'column', gap: '16px'
  },
  userRow: {
    display: 'flex', justifyContent: 'flex-end'
  },
  userBubble: {
    maxWidth: '80%', padding: '12px 18px', borderRadius: '18px 18px 4px 18px',
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    color: 'white', fontSize: '14px', boxShadow: 'var(--shadow-sm)'
  },
  assistantRow: {
    display: 'flex', justifyContent: 'flex-start'
  },
  assistantBubble: {
    maxWidth: '85%', padding: '14px 20px', borderRadius: '18px 18px 18px 4px',
    background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
    color: 'var(--text-main)', fontSize: '14px', boxShadow: 'var(--shadow-sm)'
  },
  typingIndicator: {
    display: 'flex', alignItems: 'center', height: '14px'
  },
  footer: {
    padding: '16px 20px', borderTop: '1px solid var(--border-light)',
    background: 'var(--bg-surface)'
  },
  actionIconBtn: {
    border: 'none', cursor: 'pointer', width: '42px', height: '42px',
    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s'
  },
  suggestionsContainer: {
    padding: '0 24px 16px 24px'
  },
  suggestionChip: {
    width: '100%', padding: '8px 12px', border: '1px solid var(--border-light)',
    borderRadius: '10px', background: 'var(--bg-surface)', textAlign: 'left',
    fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
    color: 'var(--text-muted)', transition: 'all 0.2s'
  },
  actionCard: {
    marginTop: '12px', padding: '12px', borderRadius: '10px',
    background: 'var(--bg-main)', border: '1px solid var(--border-light)',
    display: 'flex', flexDirection: 'column', gap: '6px'
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px',
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em'
  },
  cardTitle: {
    color: 'var(--text-main)'
  },
  cardText: {
    fontSize: '12px', color: 'var(--text-muted)', margin: 0
  },
  successIndicator: {
    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px',
    color: 'var(--success)', fontWeight: '600'
  },
  mockBadge: {
    fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '6px',
    background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', marginLeft: 'auto'
  }
};
