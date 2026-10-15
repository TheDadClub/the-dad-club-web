"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const features = [
  {
    title: "YOUR JOURNEY",
    description:
      "A personalised experience that follows your journey from pregnancy through your child's second birthday.",
    image: "/images/dad-club-home.png",
    alt: "The Dad Club personalised home screen",
  },
  {
    title: "THE RIGHT ADVICE. AT THE RIGHT TIME.",
    description:
      "Practical information and honest perspectives delivered when they're most relevant.",
    image: "/images/dad-club-timeline.png",
    alt: "The Dad Club personalised fatherhood timeline",
  },
  {
    title: "CHECK IN WITH YOURSELF",
    description:
      "A simple way to reflect on how you're travelling, without pressure or judgement.",
    image: "/images/dad-club-checkin.png",
    alt: "The Dad Club wellbeing check-in screen",
  },
  {
    title: "SUPPORT WHEN YOU NEED IT",
    description:
      "Helpful resources and support services for the moments when things feel difficult.",
    image: "/images/dad-club-help.png",
    alt: "The Dad Club support resources screen",
  },
];

export default function AppShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  function goToSlide(index: number) {
    const track = trackRef.current;
    if (!track) return;

    const nextIndex = (index + features.length) % features.length;
    const slide = track.children[nextIndex] as HTMLElement | undefined;
    if (!slide) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    track.scrollTo({
      left: slide.offsetLeft,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }

  function updateActiveSlide() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;

    const index = Math.round(track.scrollLeft / track.clientWidth);

    setActiveSlide(Math.max(0, Math.min(features.length - 1, index)));
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Explore The Dad Club app"
      className="mx-auto w-full max-w-xl"
    >
      <div className="overflow-hidden rounded-[28px] border border-[#F4F0E5]/20 bg-[#F4F0E5]">
        {/* Native horizontal scrolling supports iPhone swipes. */}
        <div
          ref={trackRef}
          tabIndex={0}
          aria-label="App screenshots. Use left and right arrow keys to navigate."
          onScroll={updateActiveSlide}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              goToSlide(activeSlide - 1);
            }

            if (event.key === "ArrowRight") {
              event.preventDefault();
              goToSlide(activeSlide + 1);
            }
          }}
          className="relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#C96632] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {features.map((feature, index) => (
            <div
              key={feature.image}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${features.length}: ${feature.title}`}
              className="w-full min-w-0 shrink-0 snap-center snap-always"
            >
              <div className="p-4 sm:p-6">
                <div className="relative h-[clamp(280px,52svh,480px)] overflow-hidden rounded-2xl bg-[#173A2C]">
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    fill
                    sizes="(max-width: 640px) 90vw, 528px"
                    className="object-contain"
                    draggable={false}
                  />
                </div>
              </div>

              <div className="border-t border-[#173A2C]/10 px-6 py-6 text-[#173A2C] sm:px-8">
                <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#C96632] sm:text-xs">
                  FEATURE {String(index + 1).padStart(2, "0")} / 04
                </p>

                <h3 className="mt-3 text-lg font-black leading-tight sm:text-xl">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-[#52645A] sm:text-base">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Previous/next controls and navigation dots. */}
      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => goToSlide(activeSlide - 1)}
          aria-label="Previous app screenshot"
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#F4F0E5]/40 text-2xl text-[#F4F0E5] transition-colors hover:bg-[#F4F0E5] hover:text-[#173A2C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className="flex items-center justify-center">
          {features.map((feature, index) => (
            <button
              key={feature.image}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Show ${feature.title.toLowerCase()}`}
              aria-current={activeSlide === index ? "true" : undefined}
              className="flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C96632]"
            >
              <span
                className={`h-2.5 rounded-full transition-all motion-reduce:transition-none ${
                  activeSlide === index
                    ? "w-7 bg-[#C96632]"
                    : "w-2.5 bg-[#F4F0E5]/40"
                }`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goToSlide(activeSlide + 1)}
          aria-label="Next app screenshot"
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#F4F0E5]/40 text-2xl text-[#F4F0E5] transition-colors hover:bg-[#F4F0E5] hover:text-[#173A2C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <p
        aria-live="polite"
        aria-atomic="true"
        className="mt-3 text-center text-xs text-[#D8E1D8]"
      >
        {activeSlide + 1} of {features.length}
        <span aria-hidden="true" className="sm:hidden">
          {" "}· Swipe to explore
        </span>
      </p>
    </div>
  );
}