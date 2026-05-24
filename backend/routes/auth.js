const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, full_name, password } = req.body;
  if (!email || !full_name || !password) {
    return res.status(400).json({ error: 'Email, full name, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) return res.status(400).json({ error: 'This email is already registered' });

    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ email: email.toLowerCase(), full_name, password_hash, wallet_balance: 0, role: 'user' })
      .select('id, email, full_name, wallet_balance, role, created_at')
      .single();

    if (error) throw error;

    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const { password_hash, ...safeUser } = user;
    const token = signToken(safeUser);
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// PATCH /api/auth/profile
router.patch('/profile', auth, async (req, res) => {
  const { full_name } = req.body;
  if (!full_name) return res.status(400).json({ error: 'full_name is required' });
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ full_name })
      .eq('id', req.user.id)
      .select('id, email, full_name, wallet_balance, role')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// PATCH /api/auth/change-password
router.patch('/change-password', auth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Min 6 characters' });
  try {
    const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user.id).single();
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const password_hash = await bcrypt.hash(new_password, 12);
    await supabase.from('users').update({ password_hash }).eq('id', req.user.id);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router;
