import { useEffect, useRef } from 'react';
import { initConstellation } from '../fx/constellation';

// A faint ambient constellation behind the hero. Sits behind content
// (pointer-events: none); gated by prefers-reduced-motion inside the module.
export function HeroFx() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    return initConstellation(canvasRef.current);
  }, []);

  return (
    <div className="hero-fx" aria-hidden="true">
      <canvas className="hero-fx-canvas" ref={canvasRef} />
    </div>
  );
}
