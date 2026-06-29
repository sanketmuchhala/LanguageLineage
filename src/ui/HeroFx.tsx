import { useEffect, useRef } from 'react';
import { initConstellation } from '../fx/constellation';
import { initCursorGlow } from '../fx/cursorGlow';

// Ambient hero VFX layer: a living node-constellation canvas plus a cursor-tracked
// glow. Sits behind hero content (pointer-events: none) and tears itself down on
// unmount. All motion is gated by prefers-reduced-motion inside the fx modules.
export function HeroFx() {
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const teardown: Array<() => void> = [];
    if (canvasRef.current) teardown.push(initConstellation(canvasRef.current));
    if (layerRef.current) teardown.push(initCursorGlow(layerRef.current));
    return () => teardown.forEach((fn) => fn());
  }, []);

  return (
    <div className="hero-fx" ref={layerRef} aria-hidden="true">
      <canvas className="hero-fx-canvas" ref={canvasRef} />
      <div className="hero-fx-glow" />
    </div>
  );
}
