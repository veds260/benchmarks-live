"use client";

import { useEffect, useState } from "react";

export function Preloader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => setLoaded(true), 300);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  if (loaded) return null;

  return (
    <div className={`preloader ${loaded ? "loaded" : ""}`}>
      <div className="preloader-text">
        BENCHMARKS<span className="text-text-muted">.LIVE</span>
        <span className="preloader-dot" />
      </div>
    </div>
  );
}
