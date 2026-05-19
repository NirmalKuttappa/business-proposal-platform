"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

const COLORS = ["#0071e3", "#1d8a3a", "#ffd60a", "#ff375f", "#5b3fd1"];

export function SuccessCelebration({
  show,
  clientName,
  onClose,
}: {
  show: boolean;
  clientName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!show) return;

    confetti({
      particleCount: 140,
      spread: 95,
      startVelocity: 42,
      origin: { y: 0.55 },
      colors: COLORS,
    });

    const end = Date.now() + 1400;
    let raf = 0;
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: COLORS,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: COLORS,
      });
      if (Date.now() < end) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 px-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-3xl border border-hairline/70 bg-white p-9 text-center shadow-xl"
            initial={{ scale: 0.9, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
          >
            <motion.div
              className="mx-auto flex size-16 items-center justify-center rounded-full bg-positive text-white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <motion.path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.35, duration: 0.45 }}
                />
              </svg>
            </motion.div>
            <h2 className="mt-6 text-[26px] font-semibold tracking-tight text-ink">
              You&apos;re all set
            </h2>
            <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">
              Thank you{clientName ? `, ${clientName.split(" ")[0]}` : ""}. Your
              proposal is signed and payment is complete. We can&apos;t wait to
              get started together.
            </p>
            <button
              onClick={onClose}
              className="mt-7 rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
