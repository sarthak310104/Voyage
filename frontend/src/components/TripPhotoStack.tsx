'use client';

import { useEffect, useState } from 'react';

const HOLD_MS = 3000;
const FADE_MS = 900;

function filePath(filename: string, width = 440) {
  // Wikimedia Commons' Special:FilePath is a stable, official redirect
  // straight to the file (the same mechanism Wikipedia's own apps use for
  // hotlinking) -- no API key, and it supports on-the-fly resizing.
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

// A fixed, curated set of freely-licensed (CC0 / public domain) destination
// photos from Wikimedia Commons -- same for every user, not tied to any
// trip. Rotates a sliding window of 3 through this pool of 4.
const DESTINATIONS = [
  { name: 'Paris, France', file: 'Eiffel_tower_paris_france.jpg' },
  { name: 'Santorini, Greece', file: 'Santorini_Greece_Island.jpg' },
  { name: 'Kyoto, Japan', file: 'Temple_of_the_Golden_Pavilion,_Kyoto_Japan_(14437492520).jpg' },
  { name: 'Machu Picchu, Peru', file: 'Peru_Machu_Picchu_1.jpg' }
];

export function TripPhotoStack() {
  const [startIndex, setStartIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let advanceTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const scheduleNext = () => {
      hideTimer = setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
        advanceTimer = setTimeout(() => {
          if (cancelled) return;
          setStartIndex((i) => (i + 1) % DESTINATIONS.length);
          setVisible(true);
          scheduleNext();
        }, FADE_MS);
      }, HOLD_MS);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      clearTimeout(hideTimer);
      clearTimeout(advanceTimer);
    };
  }, []);

  const a = DESTINATIONS[startIndex];
  const b = DESTINATIONS[(startIndex + 1) % DESTINATIONS.length];
  const c = DESTINATIONS[(startIndex + 2) % DESTINATIONS.length];

  return (
    <div className="relative h-[480px] hidden md:flex items-center justify-center">
      <Waves />
      <div className="relative w-[420px] h-[480px]">
        <Photo src={filePath(a.file)} top={-20} left={0} rotate={-11} z={1} visible={visible} />
        <Photo src={filePath(c.file)} bottom={-20} right={0} rotate={11} z={1} visible={visible} />
        <Photo src={filePath(b.file)} top={90} left={100} rotate={2} z={10} visible={visible} />
        <p
          className="absolute -bottom-9 left-0 right-0 text-center text-sm text-navy/50"
          style={{ opacity: visible ? 1 : 0, transition: `opacity ${FADE_MS}ms ease-in-out` }}
        >
          {b.name}
        </p>
      </div>
    </div>
  );
}

function Photo({
  src,
  top,
  bottom,
  left,
  right,
  rotate,
  z,
  visible
}: {
  src: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  rotate: number;
  z: number;
  visible: boolean;
}) {
  return (
    <img
      src={src}
      alt=""
      className="absolute w-[220px] h-[290px] object-cover rounded-[28px] shadow-2xl"
      style={{
        top,
        bottom,
        left,
        right,
        transform: `rotate(${rotate}deg)`,
        zIndex: z,
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease-in-out`
      }}
    />
  );
}

function Waves() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 520" preserveAspectRatio="none">
      <path
        d="M0,180 C120,120 180,260 320,200 C420,160 460,240 500,200 L500,520 L0,520 Z"
        fill="#FFD9B8"
        opacity="0.55"
      />
      <path
        d="M0,260 C140,220 200,340 340,280 C430,240 470,300 500,280 L500,520 L0,520 Z"
        fill="#FFC9A0"
        opacity="0.5"
      />
    </svg>
  );
}