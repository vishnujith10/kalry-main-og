const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const supabase = require('./supabaseClient');
const foodLogsRoutes = require('./routes/foodLogs');
const exercisesRoutes = require('./routes/exercises'); // <-- ensure this is present
const sleepLogsRoutes = require('./routes/sleepLogs');
const stepGoalRoutes = require('./routes/stepGoal'); // <-- add this
const stepsRoutes = require('./routes/steps');

const app = express();
app.use(cors());
app.use(express.json());

// --- Profile Upsert ---
app.post('/profile', async (req, res) => {
  const { id, ...profileData } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing user id' });

  const { data, error } = await supabase
    .from('user_profile')
    .upsert([{ id, ...profileData }], { onConflict: ['id'] });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Profile upserted', data });
});

// --- Gemini Test ---
app.get('/test-gemini', async (req, res) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: "Hello" }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Gemini test error:', error.message);
    res.status(500).json({ error: 'Gemini test failed', details: error.message });
  }
});

// --- Analyze Food ---
app.post('/analyze-food', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing food description' });

    const prompt = `You are a nutrition expert. Give me the exact nutrition breakdown for "${text}". Consider it's a standard restaurant/home serving.

Return ONLY the values in this exact format:
Name: ${text}
Serving Size: 1 serving
Calories: [exact number] kcal
Protein: [exact number] g
Carbs: [exact number] g
Fats: [exact number] g

Important:
- Use real, accurate numbers based on standard recipes
- Include all numbers
- No explanations or extra text
- Numbers should be realistic for a typical serving`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!result) throw new Error('No valid response from Gemini');

    const lines = result.split('\n');
    const data = {};
    lines.forEach(line => {
      if (line.startsWith('Name:')) data.name = line.replace('Name:', '').trim();
      else if (line.startsWith('Serving Size:')) data.servingSize = line.replace('Serving Size:', '').trim();
      else if (line.startsWith('Calories:')) data.calories = parseInt(line.replace(/[^\d]/g, ''));
      else if (line.startsWith('Protein:')) data.protein = parseInt(line.replace(/[^\d]/g, ''));
      else if (line.startsWith('Carbs:')) data.carbs = parseInt(line.replace(/[^\d]/g, ''));
      else if (line.startsWith('Fats:')) data.fats = parseInt(line.replace(/[^\d]/g, ''));
    });

    res.json(data);
  } catch (error) {
    console.error('Food analysis error:', error.message);
    res.status(500).json({ error: 'Failed to analyze food', details: error.message });
  }
});

// --- Food Logs Routes ---
app.use('/api/foodlogs', foodLogsRoutes);

// --- Exercises Routes ---
app.use('/api/exercise', exercisesRoutes); // <-- add or ensure this line is present

// --- Sleep Logs Routes ---
app.use('/api/sleeplogs', sleepLogsRoutes);

// --- Step Goal Routes ---
app.use('/api/step-goals', stepGoalRoutes); // <-- add this

// --- Steps Routes ---
app.use('/api/steps', stepsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});