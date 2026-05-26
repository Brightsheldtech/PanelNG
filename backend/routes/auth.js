const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

function safeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// GET /api/auth/check-username/:username — public, real-time availability check
router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;
  if (!username || username.length < 3) return res.json({ available: false });
  try {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    res.json({ available: !data });
  } catch {
    res.json({ available: false });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, full_name, password, username, phone, referral_code } = req.body;
  if (!email || !full_name || !password) {
    return res.status(400).json({ error: 'Email, full name, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (username) {
    if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3–20 characters, letters/numbers/underscores only' });
    }
  }

  try {
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (existingEmail) return res.status(400).json({ error: 'This email is already registered' });

    if (username) {
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle();
      if (existingUsername) return res.status(400).json({ error: 'Username is already taken' });
    }

    // Generate a unique referral code for this user
    const letters = full_name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
    let myReferralCode = `PNG-${letters}${Math.floor(100 + Math.random() * 900)}`;
    const { data: codeConflict } = await supabase.from('users').select('id').eq('referral_code', myReferralCode).maybeSingle();
    if (codeConflict) myReferralCode = `PNG-${letters}${Math.floor(100 + Math.random() * 900)}`;

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const password_hash = await bcrypt.hash(password, 12);

    const insertPayload = {
      email: email.toLowerCase(),
      full_name,
      password_hash,
      wallet_balance: 0,
      role: 'user',
      referral_code: myReferralCode,
      email_verified: false,
      status: 'active',
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires,
      ...(username && { username: username.toLowerCase() }),
      ...(phone && { phone }),
    };

    const { data: user, error } = await supabase
      .from('users')
      .insert(insertPayload)
      .select('id, email, full_name, wallet_balance, role, username, phone, referral_code, email_verified, status, created_at')
      .single();

    if (error) throw error;

    // Process incoming referral if code provided
    if (referral_code) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referral_code.toUpperCase())
        .maybeSingle();
      if (referrer) {
        await supabase.from('referrals').insert({
          referrer_id: referrer.id,
          referee_id: user.id,
        }).catch(() => {});
      }
    }

    // Send verification email (non-blocking — don't fail registration if email fails)
    const frontendUrl = process.env.FRONTEND_URL || 'https://panelng-production.up.railway.app';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
      transporter.sendMail({
        from: `"PanelNG" <${gmailUser}>`,
        to: user.email,
        subject: 'Verify your PanelNG email address',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#111110;margin-bottom:8px">Verify your email</h2>
            <p style="color:#6B6860;margin-bottom:24px">Hi ${user.full_name}, click the button below to verify your PanelNG email address. This link expires in 24 hours.</p>
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 24px;background:#1C1C1A;color:white;text-decoration:none;border-radius:10px;font-weight:700">Verify Email Address</a>
            <p style="color:#A8A49C;font-size:12px;margin-top:24px">If you didn't create a PanelNG account, you can safely ignore this email.</p>
          </div>
        `,
      }).catch((e) => console.warn('[register] Verification email failed:', e.message));
    }

    res.status(201).json({ pending_verification: true, email: user.email });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err?.message || 'Registration failed. Try again.' });
  }
});

// POST /api/auth/login — supports email or username
router.post('/login', async (req, res) => {
  const { email, username, password, identifier } = req.body;

  // Support legacy { email } and new { identifier } forms
  let lookupEmail = email || null;
  const lookupIdentifier = identifier || username || null;

  if (!lookupEmail && !lookupIdentifier) {
    return res.status(400).json({ error: 'Email/username and password are required' });
  }
  if (!password) return res.status(400).json({ error: 'Password is required' });

  try {
    let user;

    if (lookupEmail) {
      const { data } = await supabase.from('users').select('*').eq('email', lookupEmail.toLowerCase()).maybeSingle();
      user = data;
    } else {
      // Try as email first, then as username
      if (lookupIdentifier.includes('@')) {
        const { data } = await supabase.from('users').select('*').eq('email', lookupIdentifier.toLowerCase()).maybeSingle();
        user = data;
      } else {
        const { data } = await supabase.from('users').select('*').eq('username', lookupIdentifier.toLowerCase()).maybeSingle();
        user = data;
      }
    }

    if (!user) return res.status(401).json({ error: 'Email/username or password is incorrect.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email/username or password is incorrect.' });

    // Check email verification (only if column exists — strict false check)
    if (user.email_verified === false) {
      return res.status(403).json({ error: 'Please verify your email before logging in.', code: 'EMAIL_NOT_VERIFIED', email: user.email });
    }

    // Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.', code: 'ACCOUNT_SUSPENDED' });
    }

    const token = signToken(user);
    res.json({ user: safeUser(user), token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Try again.' });
  }
});

// POST /api/auth/supabase-sync — exchange a Supabase OAuth token for a panelng_token
router.post('/supabase-sync', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'access_token required' });

  try {
    const { data: { user: sbUser }, error: sbErr } = await supabase.auth.getUser(access_token);
    if (sbErr || !sbUser) return res.status(401).json({ error: 'Invalid or expired Supabase token' });

    let { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, wallet_balance, role, username, phone, referral_code, created_at')
      .eq('email', sbUser.email.toLowerCase())
      .maybeSingle();

    if (!user) {
      const fullName = sbUser.user_metadata?.full_name || sbUser.email.split('@')[0];
      const letters = fullName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
      const myReferralCode = `PNG-${letters}${Math.floor(100 + Math.random() * 900)}`;

      const { data: newUser, error: insertErr } = await supabase
        .from('users')
        .insert({
          email: sbUser.email.toLowerCase(),
          full_name: fullName,
          password_hash: 'OAUTH_USER',
          wallet_balance: 0,
          role: 'user',
          referral_code: myReferralCode,
        })
        .select('id, email, full_name, wallet_balance, role, username, phone, referral_code, created_at')
        .single();

      if (insertErr) throw insertErr;
      user = newUser;

      // Process referral stored before OAuth redirect
      const pendingRef = req.body.pending_referral_code;
      if (pendingRef) {
        const { data: referrer } = await supabase.from('users').select('id').eq('referral_code', pendingRef.toUpperCase()).maybeSingle();
        if (referrer) {
          await supabase.from('referrals').insert({ referrer_id: referrer.id, referee_id: user.id }).catch(() => {});
        }
      }
    }

    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('[supabase-sync]:', err.message);
    res.status(500).json({ error: 'Auth sync failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { data: user } = await supabase.from('users').select('id, email, full_name').eq('email', email.toLowerCase()).maybeSingle();

    // Always respond 200 to avoid user enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await supabase.from('users').update({ password_reset_token: token, password_reset_expires: expires }).eq('id', user.id);

    const resetUrl = `${process.env.FRONTEND_URL || 'https://panelng-production.up.railway.app'}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"PanelNG" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'Reset your PanelNG password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#111110;margin-bottom:8px">Reset your password</h2>
          <p style="color:#6B6860;margin-bottom:24px">Hi ${user.full_name}, click the button below to reset your PanelNG password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:14px 24px;background:#1C1C1A;color:white;text-decoration:none;border-radius:10px;font-weight:700">Reset Password</a>
          <p style="color:#A8A49C;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[forgot-password]:', err.message);
    res.status(500).json({ error: 'Could not send reset email. Try again.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, password_reset_token, password_reset_expires')
      .eq('password_reset_token', token)
      .maybeSingle();

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link.' });
    if (new Date(user.password_reset_expires) < new Date()) return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

    const password_hash = await bcrypt.hash(password, 12);
    await supabase.from('users').update({ password_hash, password_reset_token: null, password_reset_expires: null }).eq('id', user.id);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('[reset-password]:', err.message);
    res.status(500).json({ error: 'Password reset failed. Try again.' });
  }
});

// POST /api/auth/verify-email — confirm a verification token from the email link
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Verification token is required' });

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, wallet_balance, role, username, phone, referral_code, email_verified, status, email_verification_expires, created_at')
      .eq('email_verification_token', token)
      .maybeSingle();

    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link.' });
    if (user.email_verified) {
      // Already verified — just log them in
      const jwtToken = signToken(user);
      return res.json({ user: safeUser(user), token: jwtToken });
    }
    if (new Date(user.email_verification_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification link has expired. Request a new one.', code: 'TOKEN_EXPIRED', email: user.email });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({ email_verified: true, email_verification_token: null, email_verification_expires: null })
      .eq('id', user.id)
      .select('id, email, full_name, wallet_balance, role, username, phone, referral_code, email_verified, status, created_at')
      .single();

    if (updateErr) throw updateErr;

    const jwtToken = signToken(updated);
    res.json({ user: safeUser(updated), token: jwtToken });
  } catch (err) {
    console.error('[verify-email]:', err.message);
    res.status(500).json({ error: 'Verification failed. Try again.' });
  }
});

// POST /api/auth/resend-verification — resend verification email
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, email_verified')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    // Always respond 200 to avoid user enumeration
    if (!user || user.email_verified) {
      return res.json({ message: 'If that email is unverified, a new link has been sent.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabase.from('users').update({
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires,
    }).eq('id', user.id);

    const frontendUrl = process.env.FRONTEND_URL || 'https://panelng-production.up.railway.app';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
      await transporter.sendMail({
        from: `"PanelNG" <${gmailUser}>`,
        to: user.email,
        subject: 'Verify your PanelNG email address',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#111110;margin-bottom:8px">Verify your email</h2>
            <p style="color:#6B6860;margin-bottom:24px">Hi ${user.full_name}, here's a new verification link for your PanelNG account. It expires in 24 hours.</p>
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 24px;background:#1C1C1A;color:white;text-decoration:none;border-radius:10px;font-weight:700">Verify Email Address</a>
            <p style="color:#A8A49C;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore it.</p>
          </div>
        `,
      });
    }

    res.json({ message: 'If that email is unverified, a new link has been sent.' });
  } catch (err) {
    console.error('[resend-verification]:', err.message);
    res.status(500).json({ error: 'Could not resend verification email. Try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, wallet_balance, role, username, phone, referral_code, created_at')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
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
  if (new_password.length < 8) return res.status(400).json({ error: 'Min 8 characters' });
  try {
    const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user.id).single();
    if (user.password_hash === 'OAUTH_USER') return res.status(400).json({ error: 'Google sign-in accounts cannot change password here.' });
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
