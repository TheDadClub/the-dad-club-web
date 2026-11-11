"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const features = [
  {
    title: "Your journey. Your pace.",
    description:
      "A little support for where you are right now. Follow your own adjustment to fatherhood, from pregnancy through your child’s second birthday.",
    detail: "For your side of the story.",
    image: "/images/app-home.png",
    alt: "The Dad Club home screen showing a personalised fatherhood journey.",
  },
  {
    title: "A little perspective, right on time.",
    description:
      "Honest reflections on the changes, mixed feelings and everyday moments of becoming a dad. Save something for later or share a card that hits home.",
    detail: "Excited and terrified can coexist.",
    image: "/images/app-timeline.png",
    alt: "The Dad Club timeline showing a reflection about feeling excited and terrified before becoming a father.",
  },
  {
    title: "Make a little room for yourself.",
    description:
      "Pause and notice how you’re travelling. A simple Check-In gives you somewhere to start, with room to look back on how things have been.",
    detail: "No perfect words required.",
    image: "/images/app-checkin.png",
    alt: "The Dad Club Check-In screen with five options for reflecting on how you are feeling.",
  },
  {
    title: "You don’t have to figure it out alone.",
    description:
      "Find support resources when you want someone in your corner. You don’t need to have everything worked out before reaching out.",
    detail: "Support belongs in fatherhood too.",
    image: "/images/app-help.png",
    alt: "The Dad Club Help screen showing support resources for fathers.",
  },
];

export default function AppShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  function goToSlide(index: number) {
    const track = trackRef.current;

    if (!track) return;

    const nextIndex =
      (index + features.length) % features.length;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    track.scrollTo({
      left: nextIndex * track.clientWidth,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }

  function updateActiveSlide() {
    const track = trackRef.current;

    if (!track || track.clientWidth === 0) return;

    const index = Math.round(
      track.scrollLeft / track.clientWidth,
    );

    setActiveSlide(
      Math.max(0, Math.min(features.length - 1, index)),
    );
  }

  const arrowClass =
    "flex size-12 shrink-0 items-center justify-center rounded-full border border-[#F4F0E5]/30 text-2xl text-[#F4F0E5] transition-colors hover:border-[#F4F0E5] hover:bg-[#F4F0E5] hover:text-[#173A2C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Explore The Dad Club app"
      className="mx-auto w-full max-w-4xl text-[#F4F0E5]"
    >
      <div
        ref={trackRef}
        tabIndex={0}
        aria-label="App screenshots. Use the left and right arrow keys to explore."
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
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-3xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#C96632] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {features.map((feature, index) => (
          <div
            key={feature.image}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${features.length}: ${feature.title}`}
            className="w-full min-w-0 shrink-0 snap-center snap-always"
          >
            <div className="grid items-center gap-9 px-3 py-5 sm:gap-12 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:gap-14 md:py-8">
              <div className="flex justify-center">
                <div className="w-[min(100%,260px)] rounded-[38px] border border-white/20 bg-[#10291F] p-[7px] sm:w-[280px]">
                  <div className="overflow-hidden rounded-[30px] bg-[#F4F0E5]">
                    <Image
                      src={feature.image}
                      alt={feature.alt}
                      width={946}
                      height={2048}
                      sizes="(max-width: 639px) 260px, 280px"
                      className="block h-auto w-full"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>

              <div className="mx-auto w-full max-w-md pb-2 text-center md:mx-0 md:text-left">
                <p className="text-xs font-extrabold tracking-[0.2em] text-[#D6A17C]">
                  INSIDE THE APP
                  <span
                    aria-hidden="true"
                    className="mx-3 text-[#F4F0E5]/30"
                  >
                    /
                  </span>
                  {String(index + 1).padStart(2, "0")}
                </p>

                <h3 className="mt-5 text-3xl font-black leading-[1.12] tracking-tight sm:text-4xl">
                  {feature.title}
                </h3>

                <p className="mt-6 text-base leading-relaxed text-[#D8E1D8] sm:text-lg">
                  {feature.description}
                </p>

                <div
                  aria-hidden="true"
                  className="mx-auto mt-8 h-1 w-12 rounded-full bg-[#C96632] md:mx-0"
                />

                <p className="mt-5 text-sm font-semibold text-[#F4F0E5]">
                  {feature.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-7 flex max-w-sm items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => goToSlide(activeSlide - 1)}
          aria-label="Previous app screenshot"
          className={arrowClass}
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className="flex items-center justify-center">
          {features.map((feature, index) => (
            <button
              key={feature.image}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Show screenshot ${index + 1}: ${feature.title}`}
              aria-current={
                activeSlide === index ? "true" : undefined
              }
              className="flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C96632]"
            >
              <span
                aria-hidden="true"
                className={`h-2 rounded-full transition-all motion-reduce:transition-none ${
                  activeSlide === index
                    ? "w-6 bg-[#C96632]"
                    : "w-2 bg-[#F4F0E5]/35"
                }`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goToSlide(activeSlide + 1)}
          aria-label="Next app screenshot"
          className={arrowClass}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <p
        aria-live="polite"
        aria-atomic="true"
        className="mt-4 text-center text-xs text-[#D8E1D8]"
      >
        {activeSlide + 1} of {features.length}
        <span aria-hidden="true" className="md:hidden">
          {" "}· Swipe to explore
        </span>
      </p>
    </div>
  );
}