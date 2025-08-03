const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get user's step goal
router.get('/:userId', async (req, res) => {
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
router.post('/', async (req, res) => {
  console.log('POST /step-goals', req.body);
  const { user_id, goal } = req.body;
  if (!user_id || goal == null) {
    console.log('Missing required fields', req.body);
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const { error } = await supabase
    .from('step_goals')
    .upsert({ user_id, goal, updated_at: new Date().toISOString() }, { onConflict: ['user_id'] });
  if (error) {
    console.log('Supabase error:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json({ message: 'Goal updated', goal });
});

module.exports = router; 