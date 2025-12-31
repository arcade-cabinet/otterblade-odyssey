import { useStore } from "@/game/store";
import { useEffect, useState } from "react";

export default function DamageFlash() {
  const damageFlash = useStore((s) => s.damageFlash);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (damageFlash > performance.now()) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), damageFlash - performance.now());
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [damageFlash]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-[11] transition-opacity duration-100 ${show ? "opacity-100" : "opacity-0"}`}
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgba(244,63,94,0.22) 0%, rgba(244,63,94,0.0) 70%)",
      }}
    />
  );
}
