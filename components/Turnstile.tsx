"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileAPI = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: string;
      size: string;
      "error-callback": () => void;
      callback: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}

type TurnstileProps = {
  action?:
    | "register_interest"
    | "facilitator_application"
    | "member_login";
};

export default function Turnstile({
  action = "register_interest",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  function renderWidget() {
    if (
      !siteKey ||
      !containerRef.current ||
      !window.turnstile ||
      widgetRef.current !== null
    ) {
      return;
    }

    try {
      widgetRef.current = window.turnstile.render(
        containerRef.current,
        {
          sitekey: siteKey,
          action,
          theme: "light",
          size: "flexible",
          "error-callback": () => setFailed(true),
          callback: () => setFailed(false),
        },
      );
    } catch {
      setFailed(true);
    }
  }

  useEffect(() => {
    return () => {
      if (widgetRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, []);

  if (!siteKey) {
    return (
      <p role="alert" className="text-sm text-[#9B3D24]">
        Form verification is unavailable. Please contact
        hello@thedadclub.com.au.
      </p>
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
        onError={() => setFailed(true)}
      />

      <div ref={containerRef} />

      {failed && (
        <p role="alert" className="text-sm text-[#9B3D24]">
          The verification check couldn&apos;t load. Please refresh
          the page and try again.
        </p>
      )}

      <noscript>
        <p className="text-sm text-[#9B3D24]">
          Please enable JavaScript to complete the verification, or
          email hello@thedadclub.com.au with your enquiry.
        </p>
      </noscript>

      <p className="text-xs leading-relaxed text-[#52645A]">
        We use Cloudflare Turnstile to help prevent automated
        submissions. See Cloudflare&apos;s{" "}
        <a
          href="https://www.cloudflare.com/privacypolicy/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}