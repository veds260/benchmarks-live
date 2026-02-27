"use client";

import { useEffect, useRef, useState } from "react";

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Pause when tab is hidden to save resources
    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 1.2s ease-in-out",
          mixBlendMode: "screen",
          filter: "brightness(0.35) saturate(0.7)",
        }}
      >
        <source src="/bg-loop.mp4" type="video/mp4" />
        <source src="/bg-loop.webm" type="video/webm" />
      </video>

      {/* Gradient overlays to keep text readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/60 via-transparent to-bg-primary/90" />
      <div className="absolute inset-0 bg-bg-primary/40" />
    </div>
  );
}
