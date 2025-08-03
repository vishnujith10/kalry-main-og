const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Add a new sleep log
router.post('/', async (req, res) => {
  const { user_id, date, start_time, end_time, duration, quality, mood } = req.body;
  if (!user_id || !date || !start_time || !end_time || !duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const { data, error } = await supabase.from('sleep_logs').insert([
    { user_id, date, start_time, end_time, duration, quality, mood }
  ]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Sleep log added', data });
});

// Get all sleep logs for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router; 