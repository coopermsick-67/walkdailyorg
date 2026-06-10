"use client";

import { useEffect, useState } from "react";

interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders text character by character with a blinking cursor effect.
 * Once the full text is rendered, the cursor disappears.
 */
export default function StreamingText({
  text,
  speed = 12,
  onComplete,
  className = "",
  style,
}: StreamingTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Typing effect
  useEffect(() => {
    if (!text) {
      setDisplayed("");
      setDone(false);
      return;
    }

    setDisplayed("");
    setDone(false);
    let idx = 0;

    const interval = setInterval(() => {
      idx += 3; // grab 3 chars per tick for visible streaming
      if (idx >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
        onComplete?.();
      } else {
        setDisplayed(text.slice(0, idx));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  // Blinking cursor
  useEffect(() => {
    if (!done) return;
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);

    // Auto-hide cursor after 3 seconds of completion
    const hideTimeout = setTimeout(() => {
      setCursorVisible(false);
      clearInterval(interval);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(hideTimeout);
    };
  }, [done]);

  return (
    <span className={className} style={style}>
      {displayed}
      <span
        aria-hidden="true"
        style={{
          opacity: cursorVisible ? 1 : 0,
          transition: "opacity 0.2s",
          color: "var(--color-accent-500)",
          fontWeight: 400,
        }}
      >
        |
      </span>
    </span>
  );
}
