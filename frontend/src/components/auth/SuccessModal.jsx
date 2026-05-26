import { useNavigate } from 'react-router-dom';

const css = `
  .sm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .sm-card { background: white; border-radius: 20px; padding: 40px 32px; max-width: 360px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
  .sm-circle-wrap { width: 72px; height: 72px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; }
  .sm-circle { fill: none; stroke: #16A34A; stroke-width: 2; stroke-dasharray: 220; stroke-dashoffset: 220; animation: sm-draw-circle 0.6s ease forwards; }
  .sm-check { fill: none; stroke: #16A34A; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 50; stroke-dashoffset: 50; animation: sm-draw-check 0.4s ease 0.5s forwards; }
  @keyframes sm-draw-circle { to { stroke-dashoffset: 0; } }
  @keyframes sm-draw-check { to { stroke-dashoffset: 0; } }
  .sm-heading { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800; font-size: 24px; color: #111110; margin: 0 0 8px; }
  .sm-sub { font-family: 'Epilogue', sans-serif; font-size: 14px; color: #6B6860; line-height: 1.6; margin: 0 0 28px; }
  .sm-btn { width: 100%; padding: 14px; border-radius: 12px; background: #1C1C1A; color: white; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 15px; border: none; cursor: pointer; transition: background 0.15s; }
  .sm-btn:hover { background: #111110; }
`;

export default function SuccessModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const handleGo = () => {
    if (onClose) onClose();
    navigate('/dashboard');
  };

  return (
    <>
      <style>{css}</style>
      <div className="sm-overlay">
        <div className="sm-card">
          <div className="sm-circle-wrap">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle className="sm-circle" cx="36" cy="36" r="34" />
              <polyline className="sm-check" points="20,37 30,47 52,25" />
            </svg>
          </div>
          <h2 className="sm-heading">You're in!</h2>
          <p className="sm-sub">Your PanelNG account is ready. Fund your wallet and start ordering.</p>
          <button className="sm-btn" onClick={handleGo}>Go to Dashboard →</button>
        </div>
      </div>
    </>
  );
}
