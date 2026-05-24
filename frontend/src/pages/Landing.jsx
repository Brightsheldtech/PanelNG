import { Link } from 'react-router-dom';
import { Zap, Shield, BarChart2, MessageSquare, ArrowRight, Check } from 'lucide-react';

export default function Landing() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'rgba(6,8,15,0.94)',
        backdropFilter: 'blur(12px)', zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--primary)', color: '#000',
            fontFamily: 'var(--font-brand)', fontWeight: 800, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6,
          }}>P</div>
          <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
            PanelNG
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started <ArrowRight size={14} /></Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '60px 24px 56px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="landing-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 12px', background: 'var(--primary-muted)',
              border: '1px solid var(--primary-border)', borderRadius: 100,
              fontSize: 11, fontWeight: 700, color: 'var(--primary)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24,
            }}>
              <span className="status-dot dot-green" />
              Live · Nigerian Market
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 52px)', fontFamily: 'var(--font-brand)', fontWeight: 800,
              lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 20,
            }}>
              Scale your<br />
              <span style={{ color: 'var(--primary)' }}>social media.</span><br />
              The right way.
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              SMM services + SMS verification, all priced in naira. No dollar stress.
              No middlemen. Just direct panel access, fast delivery, and a wallet that works.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Free Account <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
              {['₦ Naira payments', 'Instant wallet credit', '24/7 order tracking'].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-muted)' }}>
                  <Check size={14} color="var(--green)" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Mock Dashboard Card — hidden on small mobile via CSS class */}
          <div className="landing-hero-card" style={{ position: 'relative' }}>
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 24, position: 'relative',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                Your PanelNG Dashboard
              </div>
              {/* Wallet */}
              <div style={{ background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700 }}>Wallet Balance</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>₦12,450.00</div>
              </div>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[{ label: 'Orders Today', val: '14', color: 'var(--green)' }, { label: 'Services', val: '500+', color: 'var(--blue)' }].map(({ label, val, color }) => (
                  <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color }}>{val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
              {/* Recent order */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Order</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Instagram Followers</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>5,000 units · ₦1,250.00</div>
                  </div>
                  <span className="badge badge-completed">Done</span>
                </div>
              </div>
            </div>
            {/* Floating SMS card */}
            <div style={{
              position: 'absolute', bottom: -20, right: -20,
              background: 'var(--card)', border: '1px solid var(--green-border)',
              borderRadius: 10, padding: '12px 16px', width: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <MessageSquare size={10} style={{ display: 'inline', marginRight: 4 }} />
                SMS Code Received
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em' }}>
                4 8 2 9 1
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>WhatsApp · Nigeria</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '52px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>What PanelNG Does</div>
            <h2 style={{ fontSize: 28, fontFamily: 'var(--font-brand)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Everything a Nigerian operator needs
            </h2>
          </div>
          <div className="landing-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                icon: BarChart2,
                color: 'var(--primary)',
                bg: 'var(--primary-muted)',
                title: 'SMM Panel',
                desc: 'Instagram, TikTok, YouTube, Twitter/X, Facebook — followers, likes, views, comments. 500+ services sourced directly from JustAnotherPanel.',
                points: ['Real-time delivery tracking', 'Min/max quantity controls', 'Admin-set pricing per service'],
              },
              {
                icon: MessageSquare,
                color: 'var(--green)',
                bg: 'var(--green-muted)',
                title: 'SMS Verification',
                desc: 'Virtual Nigerian and international numbers for verifying any app or platform. Auto-code detection — no manual refresh.',
                points: ['Numbers from 50+ countries', 'Auto polls every 5 seconds', 'One-tap finish or cancel'],
              },
              {
                icon: Shield,
                color: 'var(--blue)',
                bg: 'var(--blue-muted)',
                title: 'Naira Wallet',
                desc: 'Fund once via Paystack, spend across all services. Every kobo tracked. No hidden charges, no FX conversion stress.',
                points: ['Paystack-secured payments', 'Instant wallet credit', 'Full transaction history'],
              },
            ].map(({ icon: Icon, color, bg, title, desc, points }) => (
              <div key={title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
                <div style={{ width: 40, height: 40, background: bg, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color={color} />
                </div>
                <h3 style={{ fontSize: 17, fontFamily: 'var(--font-brand)', fontWeight: 700, marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>{desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {points.map((p) => (
                    <div key={p} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)', alignItems: 'flex-start' }}>
                      <Check size={13} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '52px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontSize: 28, fontFamily: 'var(--font-brand)', fontWeight: 800, letterSpacing: '-0.02em' }}>Up and running in 4 steps</h2>
        </div>
        <div className="landing-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { step: '01', title: 'Create Account', desc: 'Register with your email. No KYC required.' },
            { step: '02', title: 'Fund Wallet', desc: 'Top up in naira via Paystack. Instant credit.' },
            { step: '03', title: 'Place Orders', desc: 'Pick any SMM service or buy an SMS number.' },
            { step: '04', title: 'Track & Grow', desc: 'Monitor delivery in real time from your dashboard.' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 22, position: 'relative' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--border-light)', marginBottom: 12, lineHeight: 1 }}>
                {step}
              </div>
              <h4 style={{ fontSize: 15, fontFamily: 'var(--font-brand)', fontWeight: 700, marginBottom: 8 }}>{title}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 40px', borderTop: '1px solid var(--border)', background: 'var(--surface)', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Zap size={28} color="var(--primary)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 38, fontFamily: 'var(--font-brand)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 14 }}>
            Ready to move?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 30 }}>
            No monthly fee. No minimum deposit. Pay only for what you order.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, fontSize: 15, color: 'var(--text-muted)' }}>
          PanelNG © {new Date().getFullYear()}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          Built for Nigerian operators. Priced in naira. Powered by Paystack.
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sign In</Link>
          <Link to="/register" style={{ fontSize: 13, color: 'var(--primary)' }}>Register</Link>
        </div>
      </footer>
    </div>
  );
}
