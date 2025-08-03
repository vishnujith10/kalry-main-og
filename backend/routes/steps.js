const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get all steps for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('steps')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add or update steps for a day
router.post('/', async (req, res) => {
  const { user_id, date, steps, calories, distance } = req.body;
  if (!user_id || !date || steps == null) return res.status(400).json({ error: 'Missing required fields' });
  const { data, error } = await supabase
    .from('steps')
    .upsert([{ user_id, date, steps, calories, distance }], { onConflict: ['user_id', 'date'] });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Steps upserted', data });
});

// Get user's step goal
router.get('/goal/:userId', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('step_goals')
    .select('goal')
    .eq('user_id', userId)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ goal: data ? data.goal : 10000 });
});

// Set user's step goal
router.post('/goal', async (req, res) => {
  const { user_id, goal } = req.body;
  if (!user_id || !goal) return res.status(400).json({ error: 'Missing required fields' });
  const { error } = await supabase
    .from('step_goals')
    .upsert({ user_id, goal, updated_at: new Date().toISOString() }, { onConflict: ['user_id'] });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Goal updated', goal });
});

module.exports = router; 