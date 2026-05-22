// server/routes/copilot.js
const express = require('express');
const { pool, isHealthy } = require('../db/config');
const router = express.Router();

// Safety rules and local suggestions for travel context fallback
const LOCAL_SAFETY_TIPS = {
  'Goa': [
    'Always carry cash as beach shacks may not accept credit cards.',
    'Swim only in designated areas; avoid swimming at night or during high tide.',
    'Hire pre-paid taxis or rent scooters from licensed operators only.',
    'Keep your travel documents and emergency cash in your hotel safe.'
  ]
};

// Definition of AI Tools (Functions)
const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_expense',
      description: 'Add a new travel expense to the database',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Expense amount in INR (rupees)' },
          category: { type: 'string', enum: ['Food', 'Transport', 'Hotel', 'Shopping', 'Other'], description: 'Expense category' },
          description: { type: 'string', description: 'What this expense was spent on' },
          expense_date: { type: 'string', description: 'Date of expense in YYYY-MM-DD format (default: today)' }
        },
        required: ['amount', 'category', 'description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_expenses',
      description: 'Get all logged expenses for the trip to summarize and review',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_itinerary_item',
      description: 'Add an activity or check-in spot to the travel itinerary timeline',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Activity or spot name' },
          type: { type: 'string', enum: ['Food', 'Activity', 'Transport', 'Historic', 'Place'], description: 'Activity type' },
          day_number: { type: 'number', description: 'Timeline day (e.g., 1, 2, 3)' },
          time_slot: { type: 'string', description: 'Scheduled time (e.g., "10:30 AM", "03:00 PM")' }
        },
        required: ['name', 'day_number', 'time_slot']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_itinerary',
      description: 'Get the trip itinerary timeline to see what is planned',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_packing_list',
      description: 'Get the packing list items to check what needs to be packed',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_packing_item',
      description: 'Add an item to the packing checklist',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Item name (e.g., Swimwear, Charger)' },
          category: { type: 'string', enum: ['Clothing', 'Documents', 'Electronics', 'Meds', 'Toiletries'], description: 'Item category' }
        },
        required: ['name', 'category']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'toggle_packing_item',
      description: 'Mark a packing item as packed (true) or unpacked (false)',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'number', description: 'Database ID of the packing item' },
          packed: { type: 'boolean', description: 'Whether the item is packed' }
        },
        required: ['item_id', 'packed']
      }
    }
  }
];

// Helper to execute DB tools
async function executeTool(name, args, tripId) {
  console.log(`🤖 Tool execution triggered: ${name}`, args);
  const dbConnected = isHealthy();

  try {
    switch (name) {
      case 'add_expense': {
        const { amount, category, description, expense_date } = args;
        const date = expense_date || new Date().toISOString().split('T')[0];
        
        if (!dbConnected) {
          return { success: true, mode: 'mock', message: `Mock mode: Logged ₹${amount} for ${description} under ${category}` };
        }
        
        const [result] = await pool.query(
          'INSERT INTO expenses (trip_id, payer_id, amount, currency, category, description, expense_date) VALUES (?, 1, ?, "INR", ?, ?, ?)',
          [tripId, amount, category, description, date]
        );
        return { success: true, mode: 'db', id: result.insertId, amount, category, description, date };
      }

      case 'get_expenses': {
        if (!dbConnected) {
          return { success: true, mode: 'mock', count: 3, expenses: [
            { amount: 450, category: 'Food', description: 'Beach Shack Lunch' },
            { amount: 1200, category: 'Transport', description: 'Taxi to Baga' },
            { amount: 5000, category: 'Hotel', description: 'Resort Deposit' }
          ]};
        }
        const [rows] = await pool.query(
          'SELECT amount, category, description, expense_date FROM expenses WHERE trip_id = ? ORDER BY expense_date DESC',
          [tripId]
        );
        return { success: true, mode: 'db', count: rows.length, expenses: rows };
      }

      case 'add_itinerary_item': {
        const { name: actName, type, day_number, time_slot } = args;
        
        if (!dbConnected) {
          return { success: true, mode: 'mock', message: `Mock mode: Added activity "${actName}" on Day ${day_number} at ${time_slot}` };
        }
        
        const [result] = await pool.query(
          'INSERT INTO itinerary_items (trip_id, name, type, day_number, time_slot, status) VALUES (?, ?, ?, ?, ?, "selected")',
          [tripId, actName, type || 'Place', day_number, time_slot]
        );
        return { success: true, mode: 'db', id: result.insertId, name: actName, type, day_number, time_slot };
      }

      case 'get_itinerary': {
        if (!dbConnected) {
          return { success: true, mode: 'mock', count: 2, items: [
            { day: 1, time: '09:00 AM', name: 'Arrival & Check-in', type: 'Transport' },
            { day: 1, time: '01:00 PM', name: 'Lunch at Beach Shack', type: 'Food' }
          ]};
        }
        const [rows] = await pool.query(
          'SELECT name, type, day_number, time_slot FROM itinerary_items WHERE trip_id = ? ORDER BY day_number, time_slot',
          [tripId]
        );
        return { success: true, mode: 'db', count: rows.length, items: rows };
      }

      case 'get_packing_list': {
        if (!dbConnected) {
          return { success: true, mode: 'mock', count: 2, items: [
            { id: 1, name: 'Passport & Visas', category: 'Documents', packed: true },
            { id: 2, name: 'Beach Towel', category: 'Clothing', packed: false }
          ]};
        }
        const [rows] = await pool.query(
          'SELECT id, name, category, packed FROM packing_items WHERE trip_id = ? ORDER BY created_at',
          [tripId]
        );
        return { success: true, mode: 'db', count: rows.length, items: rows };
      }

      case 'add_packing_item': {
        const { name: itemName, category } = args;
        
        if (!dbConnected) {
          return { success: true, mode: 'mock', message: `Mock mode: Added "${itemName}" under ${category} to checklist` };
        }
        
        const [result] = await pool.query(
          'INSERT INTO packing_items (trip_id, name, category, packed) VALUES (?, ?, ?, false)',
          [tripId, itemName, category]
        );
        return { success: true, mode: 'db', id: result.insertId, name: itemName, category, packed: false };
      }

      case 'toggle_packing_item': {
        const { item_id, packed } = args;
        
        if (!dbConnected) {
          return { success: true, mode: 'mock', message: `Mock mode: Marked item ${item_id} as ${packed ? 'packed' : 'unpacked'}` };
        }
        
        await pool.query(
          'UPDATE packing_items SET packed = ? WHERE id = ?',
          [packed ? 1 : 0, item_id]
        );
        return { success: true, mode: 'db', item_id, packed };
      }

      default:
        return { error: 'Unknown tool' };
    }
  } catch (err) {
    console.error(`❌ DB error executing tool ${name}:`, err.message);
    return { error: err.message };
  }
}

// Router post handler
router.post('/chat', async (req, res) => {
  const { message, chatHistory, tripId = 1 } = req.body;
  const apiKey = process.env.VITE_COPILOT_API_KEY || process.env.OPENAI_API_KEY;

  const systemMessage = {
    role: 'system',
    content: `You are TravelSense Copilot, a highly intelligent and aesthetic AI travel assistant integrated into a Travel Expense & Safety Tracker.
Your purpose is to help the user organize their trip. You can fetch or log expenses, itinerary items, and packing lists.
You have tools available to modify and read database tables for the current trip. Always use them when the user requests actions.

Trip context:
- Trip ID: ${tripId}
- Current Destination: Goa, India
- Creator User ID: 1

Be brief, highly professional, encouraging, and style-appropriate. Give safety advice if they mention safety or emergency. If a database transaction completes, summarize it clearly (e.g., "Logged ₹450 under Food").`
  };

  // Build the message stream
  const apiMessages = [
    systemMessage,
    ...(chatHistory || []).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  // If there is NO API key or it is an invalid format proxy key, fallback to local rule-based mock chat
  if (!apiKey || apiKey.startsWith('ck_pub_')) {
    console.log('🔌 No valid OpenAI API Key found, using local rule-based fallback assistant');
    return runFallbackAssistant(message, res);
  }

  try {
    // Initial call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        tools: AI_TOOLS,
        tool_choice: 'auto'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Check if the model wants to call a tool
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const actionsExecuted = [];
      const toolMessages = [];

      for (const call of assistantMessage.tool_calls) {
        const functionName = call.function.name;
        const functionArgs = JSON.parse(call.function.arguments);
        
        // Execute database updates or query fetches
        const toolResult = await executeTool(functionName, functionArgs, tripId);
        
        actionsExecuted.push({
          tool: functionName,
          arguments: functionArgs,
          result: toolResult
        });

        toolMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: functionName,
          content: JSON.stringify(toolResult)
        });
      }

      // Perform secondary completion call to OpenAI to get final textual answer summarizing the tool execution
      const finalCompletionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            ...apiMessages,
            assistantMessage,
            ...toolMessages
          ]
        })
      });

      if (!finalCompletionResponse.ok) {
        throw new Error(`OpenAI API tool review failed: ${finalCompletionResponse.statusText}`);
      }

      const finalData = await finalCompletionResponse.json();
      return res.json({
        role: 'assistant',
        content: finalData.choices[0].message.content,
        actions: actionsExecuted
      });
    }

    // Standard conversational reply (no tools called)
    return res.json({
      role: 'assistant',
      content: assistantMessage.content,
      actions: []
    });

  } catch (err) {
    console.error('❌ Copilot chat handler error:', err.message);
    // Fallback to local rule engine so it never crashes
    return runFallbackAssistant(message, res);
  }
});

// A rule-based assistant fallback that runs completely offline/without keys
function runFallbackAssistant(message, res) {
  const text = message.toLowerCase();
  let content = "I'm your travel copilot! I couldn't reach the OpenAI service, but I'm operating in offline mode. How can I help you with your Goa trip?";
  const actions = [];

  if (text.includes('expense') || text.includes('log') || text.includes('spend')) {
    const amountMatch = text.match(/\d+/);
    const amount = amountMatch ? parseFloat(amountMatch[0]) : 150;
    let category = 'Other';
    if (text.includes('food') || text.includes('dinner') || text.includes('lunch') || text.includes('eat')) category = 'Food';
    else if (text.includes('cab') || text.includes('taxi') || text.includes('fuel') || text.includes('drive')) category = 'Transport';
    else if (text.includes('hotel') || text.includes('stay') || text.includes('resort')) category = 'Hotel';
    
    content = `Logged ₹${amount} under ${category} for you in offline simulation mode!`;
    actions.push({
      tool: 'add_expense',
      arguments: { amount, category, description: 'Quick logged expense' },
      result: { success: true, mode: 'mock', amount, category }
    });
  } else if (text.includes('itinerary') || text.includes('schedule') || text.includes('activity')) {
    content = `I've added a new activity to your Day 1 itinerary timeline in offline simulation mode!`;
    actions.push({
      tool: 'add_itinerary_item',
      arguments: { name: 'Explore Beach', type: 'Activity', day_number: 1, time_slot: '04:00 PM' },
      result: { success: true, mode: 'mock' }
    });
  } else if (text.includes('pack') || text.includes('checklist') || text.includes('clothing')) {
    content = `I've added 'Swimwear' to your clothing packing checklist in offline simulation mode!`;
    actions.push({
      tool: 'add_packing_item',
      arguments: { name: 'Swimwear', category: 'Clothing' },
      result: { success: true, mode: 'mock' }
    });
  } else if (text.includes('safety') || text.includes('safe') || text.includes('emergency')) {
    content = `Here are Goa travel safety tips:
1. Swim only at beaches with active lifeguards and pay attention to flag warnings.
2. Carry cash as some beach shacks do not support credit cards or digital payments.
3. Call 112 in case of any emergency in India.`;
  }

  return res.json({
    role: 'assistant',
    content,
    actions
  });
}

module.exports = router;
