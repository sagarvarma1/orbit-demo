import { useEffect, useRef } from "react";

// A badge hanging from a lanyard. The lanyard is a stiff spring with gravity, the card swings
// with it, and a sideways fling spins the card around until it settles on one of its faces.
// Everything runs in one requestAnimationFrame loop that writes styles directly, no re-renders.

const GRAVITY = 0.55;
const STIFFNESS = 0.16;
const AIR = 0.985;

export default function Badge({ front, back }) {
  const cardRef = useRef(null);
  const strapRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    const s = {
      anchor: { x: 0, y: -12 },
      length: 0,
      w: 0,
      h: 0,
      p: { x: 0, y: 0 },
      v: { x: 0, y: 0 },
      rz: 0,
      rzV: 0,
      rx: 0,
      ry: -160,
      ryV: 0,
      face: 0,
      drag: null,
    };

    function layout() {
      const W = window.innerWidth;
      const H = window.innerHeight;
      s.w = Math.min(300, W * 0.78);
      s.h = s.w * 1.42;
      card.style.width = `${s.w}px`;
      card.style.height = `${s.h}px`;
      s.anchor = { x: W / 2, y: -12 };
      s.length = Math.max(60, (H - s.h) / 2 - s.anchor.y - 10);
    }
    layout();
    // Drop in from above the screen.
    s.p = { x: s.anchor.x + 40, y: -s.h - 80 };

    function step(f) {
      const { p, v, anchor } = s;
      if (s.drag) {
        const tx = s.drag.pointer.x - s.drag.offset.x;
        const ty = s.drag.pointer.y - s.drag.offset.y;
        v.x = v.x * 0.5 + (tx - p.x) * 0.5;
        v.y = v.y * 0.5 + (ty - p.y) * 0.5;
        p.x = tx;
        p.y = ty;
        s.ryV += (tx - s.drag.lastX) * 0.08;
        s.drag.lastX = tx;
      } else {
        v.y += GRAVITY * f;
        const dx = p.x - anchor.x;
        const dy = p.y - anchor.y;
        const d = Math.hypot(dx, dy);
        if (d > s.length) {
          const pull = (d - s.length) * STIFFNESS * f;
          v.x -= (dx / d) * pull;
          v.y -= (dy / d) * pull;
        }
        const air = AIR ** f;
        v.x *= air;
        v.y *= air;
        p.x += v.x * f;
        p.y += v.y * f;
      }

      // The card hangs along the strap, lagging a little behind its motion.
      const ropeAngle = (Math.atan2(p.x - anchor.x, p.y - anchor.y) * 180) / Math.PI;
      const targetZ = Math.max(-60, Math.min(60, -ropeAngle - v.x * 0.8));
      s.rzV = (s.rzV + (targetZ - s.rz) * 0.09 * f) * 0.86 ** f;
      s.rz += s.rzV * f;
      s.rx += (Math.max(-25, Math.min(25, -v.y * 0.7)) - s.rx) * 0.15 * f;

      // Spin, settling on the nearest face once it slows down.
      if (!s.drag) s.ryV += (s.face - s.ry) * 0.012 * f;
      s.ryV *= 0.955 ** f;
      s.ry += s.ryV * f;
    }

    function draw() {
      const { p, anchor } = s;
      card.style.transform = `translate3d(${p.x - s.w / 2}px, ${p.y}px, 0) rotateZ(${s.rz}deg) rotateX(${s.rx}deg) rotateY(${s.ry}deg)`;
      card.style.setProperty("--shine", `${(((s.ry % 360) + 360) % 360) / 3.6 + s.rz}%`);

      const d = Math.hypot(p.x - anchor.x, p.y - anchor.y);
      const sag = d < s.length ? Math.sqrt(s.length ** 2 - d ** 2) * 0.7 : 0;
      const cx = (anchor.x + p.x) / 2;
      const cy = (anchor.y + p.y) / 2 + sag;
      const path = `M ${anchor.x} ${anchor.y} Q ${cx} ${cy} ${p.x} ${p.y + 6}`;
      strapRef.current.setAttribute("d", path);
      textRef.current.setAttribute("d", path);
    }

    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const f = Math.min((now - last) / (1000 / 60), 3);
      last = now;
      step(f / 2);
      step(f / 2);
      draw();
      frame = requestAnimationFrame(tick);
    });

    function onDown(e) {
      card.setPointerCapture(e.pointerId);
      s.drag = {
        pointer: { x: e.clientX, y: e.clientY },
        offset: { x: e.clientX - s.p.x, y: e.clientY - s.p.y },
        start: { x: e.clientX, y: e.clientY, t: performance.now() },
        lastX: s.p.x,
      };
      card.classList.add("grabbing");
    }
    function onMove(e) {
      if (s.drag) s.drag.pointer = { x: e.clientX, y: e.clientY };
    }
    function onUp(e) {
      if (!s.drag) return;
      const { start } = s.drag;
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      s.drag = null;
      card.classList.remove("grabbing");
      s.v.x = Math.max(-28, Math.min(28, s.v.x));
      s.v.y = Math.max(-28, Math.min(28, s.v.y));
      if (moved < 6 && performance.now() - start.t < 350) {
        // A tap flips the card.
        s.face = Math.round(s.ry / 180) * 180 + 180;
        s.ryV += 4;
      } else {
        // A fling keeps spinning; land on whichever face it would naturally stop at.
        s.ryV += s.v.x * 0.9;
        s.face = Math.round((s.ry + s.ryV * 22) / 180) * 180;
      }
    }

    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp);
    card.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", layout);
    return () => {
      cancelAnimationFrame(frame);
      card.removeEventListener("pointerdown", onDown);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerup", onUp);
      card.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", layout);
    };
  }, []);

  return (
    <>
      <svg className="lanyard" aria-hidden="true">
        <path ref={strapRef} className="strap" />
        <path ref={textRef} id="lanyard-path" fill="none" stroke="none" />
        <text className="strap-text" dy="4">
          <textPath href="#lanyard-path">{"ORBIT · DEPLOY · PREVIEW · SHIP · ".repeat(12)}</textPath>
        </text>
      </svg>
      <div ref={cardRef} className="card" role="img" aria-label="Sagar Varma's badge. Drag, fling or tap to flip.">
        <div className="clip" />
        <div className="face front">
          {front}
          <div className="foil" />
        </div>
        <div className="face back">
          {back}
          <div className="foil" />
        </div>
      </div>
    </>
  );
}
