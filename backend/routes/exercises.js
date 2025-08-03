const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// -----------------------------
// GET all exercise
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('exercise').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// POST a new exercise
router.post('/', async (req, res) => {
  const { workout, type, body_part, description, img } = req.body;

  console.log("Request body:", req.body); // 🔍 Log incoming data

  try {
    const { data, error } = await supabase.from('exercise').insert([
      { workout, type, body_part, description, img }
    ]);

    console.log("Insert response:", data, error); // 🔍 Log response

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("Insert error:", err.message); // 🔥 Log actual error
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// PUT (update) an exercise by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { workout, type, body_part, description, img } = req.body;

  try {
    const { data, error } = await supabase
      .from('exercise')
      .update({ workout, type, body_part, description, img })
      .eq('id', id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// DELETE an exercise by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('exercise')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Exercise deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;