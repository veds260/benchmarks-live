"use client";

import { useEffect, useRef, useState } from "react";

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const scrollY = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Pause when tab is hidden
    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Scroll: parallax shift + fade out as user scrolls down
    const handleScroll = () => {
      scrollY.current = window.scrollY;
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const y = scrollY.current;
        const fadeEnd = window.innerHeight * 1.5;
        const opacity = Math.max(0, 1 - y / fadeEnd);
        const translateY = y * 0.15; // subtle parallax

        container.style.opacity = String(opacity);
        container.style.transform = `translate3d(0, ${translateY}px, 0)`;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none will-change-transform"
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={() => setLoaded(true)}
        className="absolute object-cover"
        style={{
          /*
           * Crop strategy: overscale by 20% in both directions and
           * anchor to top-left. The overflow-hidden parent clips
           * the extra on the right and bottom edges, hiding the
           * Veo watermark regardless of screen aspect ratio.
           */
          top: 0,
          left: 0,
          width: "120%",
          height: "120%",
          opacity: loaded ? 1 : 0,
          transition: "opacity 1.2s ease-in-out",
          mixBlendMode: "screen",
          filter: "brightness(0.35) saturate(0.7)",
        }}
      >
        <source src="/bg-loop.mp4" type="video/mp4" />
        <source src="/bg-loop.webm" type="video/webm" />
      </video>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/60 via-transparent to-bg-primary/90" />
      <div className="absolute inset-0 bg-bg-primary/40" />
    </div>
  );
}
