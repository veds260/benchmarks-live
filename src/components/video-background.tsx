"use client";

import { useEffect, useRef, useState } from "react";

export function VideoBackground() {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const rafId = useRef(0);

  useEffect(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    const container = containerRef.current;
    if (!videoA || !videoB || !container) return;

    const CROSSFADE = 0.8; // seconds before end to start crossfade

    // Video B stays hidden until needed
    videoB.style.opacity = "0";
    videoA.style.opacity = "1";

    let activeVideo = videoA;
    let standbyVideo = videoB;

    // Crossfade near the end of each video to eliminate loop gap
    const handleTimeUpdate = () => {
      const v = activeVideo;
      if (!v.duration) return;
      const timeLeft = v.duration - v.currentTime;

      if (timeLeft <= CROSSFADE && standbyVideo.paused) {
        // Start the standby video and fade it in
        standbyVideo.currentTime = 0;
        standbyVideo.play().catch(() => {});
        standbyVideo.style.opacity = "1";
        activeVideo.style.opacity = "0";

        // Swap roles
        const temp = activeVideo;
        activeVideo = standbyVideo;
        standbyVideo = temp;
      }
    };

    videoA.addEventListener("timeupdate", handleTimeUpdate);
    videoB.addEventListener("timeupdate", handleTimeUpdate);

    // Pause both when tab hidden
    const handleVisibility = () => {
      if (document.hidden) {
        videoA.pause();
        videoB.pause();
      } else {
        activeVideo.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Scroll: parallax + fade
    const handleScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        const fadeEnd = window.innerHeight * 1.5;
        const opacity = Math.max(0, 1 - y / fadeEnd);
        const translateY = y * 0.15;
        container.style.opacity = String(opacity);
        container.style.transform = `translate3d(0, ${translateY}px, 0)`;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      videoA.removeEventListener("timeupdate", handleTimeUpdate);
      videoB.removeEventListener("timeupdate", handleTimeUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  const videoStyle: React.CSSProperties = {
    top: 0,
    left: 0,
    width: "120%",
    height: "120%",
    transition: "opacity 0.8s ease-in-out",
    mixBlendMode: "screen",
    filter: "brightness(0.35) saturate(0.7)",
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none will-change-transform"
    >
      <video
        ref={videoARef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlay={() => setLoaded(true)}
        className="absolute object-cover"
        style={{ ...videoStyle, opacity: loaded ? 1 : 0 }}
      >
        <source src="/bg-loop.mp4" type="video/mp4" />
      </video>

      <video
        ref={videoBRef}
        muted
        playsInline
        preload="auto"
        className="absolute object-cover"
        style={{ ...videoStyle, opacity: 0 }}
      >
        <source src="/bg-loop.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/60 via-transparent to-bg-primary/90" />
      <div className="absolute inset-0 bg-bg-primary/40" />
    </div>
  );
}
