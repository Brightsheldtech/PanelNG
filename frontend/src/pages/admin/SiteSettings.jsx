import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';

const css = `
  .ss-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: ss-spin 0.7s linear infinite;
    display: inline-block; flex-shrink: 0;
  }
  @keyframes ss-spin { to { transform: rotate(360deg); } }

  .ss-file-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 16px; border-radius: 9px;
    border: 1px solid var(--border); background: var(--surface2);
    color: var(--text); font-size: 13px; cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .ss-file-btn:hover { background: var(--surface3); border-color: var(--border2); }

  .ss-upload-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 9px 20px; border-radius: 9px;
    background: var(--primary); color: #000; font-size: 13px; font-weight: 700;
    border: none; cursor: pointer; transition: opacity 0.15s;
  }
  .ss-upload-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .ss-upload-btn:not(:disabled):hover { opacity: 0.88; }

  .ss-remove-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 9px;
    border: 1px solid var(--red-border); background: transparent;
    color: var(--red); font-size: 13px; cursor: pointer;
    transition: background 0.15s;
  }
  .ss-remove-btn:hover { background: var(--red-dim); }
`;

export default function SiteSettings() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const successTimer = useRef(null);

  const [badgePrice, setBadgePrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    api.get('/settings/hero_image_url')
      .then(res => setCurrentUrl(res.data?.value || ''))
      .catch(() => {});
    api.get('/settings/hero_badge_price')
      .then(res => setBadgePrice(res.data?.value || ''))
      .catch(() => {});
  }, []);

  const handleSavePrice = async () => {
    if (!badgePrice.trim()) return;
    setSavingPrice(true);
    setError('');
    try {
      await api.put('/settings/hero_badge_price', { value: badgePrice.trim() });
      showSuccess('Badge price updated. Changes are live on the landing page.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save price. Try again.');
    } finally {
      setSavingPrice(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setError('');
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(''), 4000);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB. Try compressing it at squoosh.app first.');
      setFile(null);
      setFileName('');
      e.target.value = '';
      return;
    }
    setError('');
    setFile(f);
    setFileName(f.name);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await api.post('/settings/upload/hero-image', {
        filename: file.name,
        mimeType: file.type,
        data: base64,
      });

      setCurrentUrl(res.data.url);
      setFile(null);
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
      showSuccess('Hero image updated. Changes are live on the landing page.');
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Upload failed';
      setError(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError('');
    try {
      await api.delete('/settings/hero-image');
      setCurrentUrl('');
      showSuccess('Image removed.');
    } catch {
      setError('Could not remove image. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 640 }}>
      <style>{css}</style>

      <h1 style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, fontSize: 24, color: 'var(--text)', margin: 0 }}>
        Site Settings
      </h1>

      {/* Hero Image section */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-brand)', fontWeight: 600, fontSize: 17, color: 'var(--text)', margin: '0 0 8px' }}>
          Hero Image
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
          This image appears in the hero section of the landing page. Best results: portrait screenshot at 560×1120px or similar 1:2 ratio. JPEG or WebP, under 2MB.
        </p>

        {/* Preview */}
        <div style={{
          width: 200, height: 400, borderRadius: 18, overflow: 'hidden',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {currentUrl ? (
            <img
              src={currentUrl}
              alt="Hero preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
            />
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>No image set</span>
          )}
        </div>

        {/* Upload controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="ss-file-btn" onClick={() => fileRef.current?.click()}>
              Choose image
            </button>
            {fileName && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fileName}</span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div>
              <button className="ss-upload-btn" onClick={handleUpload} disabled={uploading}>
                {uploading ? <><span className="ss-spinner" /> Uploading…</> : 'Upload'}
              </button>
            </div>
          )}

          {currentUrl && (
            <div>
              <button className="ss-remove-btn" onClick={handleRemove} disabled={removing}>
                {removing ? 'Removing…' : 'Remove image'}
              </button>
            </div>
          )}
        </div>

        {/* Feedback */}
        {error && (
          <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 10, margin: '10px 0 0' }}>{error}</p>
        )}
        {success && (
          <p style={{ fontSize: 13, color: 'var(--green)', marginTop: 10, margin: '10px 0 0' }}>{success}</p>
        )}
      </div>

      {/* Hero Badge Price */}
      <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-brand)', fontWeight: 600, fontSize: 17, color: 'var(--text)', margin: '0 0 8px' }}>
          Hero Badge Price
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
          The wallet balance shown in the floating badge on the landing page hero. Include the ₦ symbol and formatting exactly as you want it displayed (e.g. <strong>₦12,840</strong>).
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="text"
            value={badgePrice}
            onChange={e => setBadgePrice(e.target.value)}
            placeholder="₦12,840"
            style={{
              padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border)',
              background: 'var(--surface2)', color: 'var(--text)', fontSize: 14,
              fontFamily: 'var(--font-mono)', outline: 'none', width: 160,
            }}
          />
          <button
            className="ss-upload-btn"
            onClick={handleSavePrice}
            disabled={savingPrice || !badgePrice.trim()}
          >
            {savingPrice ? <><span className="ss-spinner" /> Saving…</> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
