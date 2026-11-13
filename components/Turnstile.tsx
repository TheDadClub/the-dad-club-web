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
      "response-field": boolean;
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      "timeout-callback": () => void;
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
    | "venue_enquiry"
    | "facilitator_application"
    | "member_login"
    | "purchase_checkout"
    | "gift_redemption";
};

export default function Turnstile({
  action = "register_interest",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState("");
  const [failed, setFailed] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    const container = containerRef.current;
    const api = window.turnstile;

    if (!siteKey || !container || !api) {
      return;
    }

    let active = true;
    let widgetId: string | null = null;

    setToken("");
    setFailed(false);

    function invalidate() {
      if (active) {
        setToken("");
      }
    }

    try {
      widgetId = api.render(container, {
        sitekey: siteKey,
        action,
        theme: "light",
        size: "flexible",
        "response-field": false,

        callback: (value) => {
          if (active) {
            setToken(value);
            setFailed(false);
          }
        },

        "error-callback": () => {
          if (active) {
            setToken("");
            setFailed(true);
          }
        },

        "expired-callback": invalidate,
        "timeout-callback": invalidate,
      });
    } catch {
      if (active) {
        setToken("");
        setFailed(true);
      }
    }

    return () => {
      active = false;

      if (widgetId !== null) {
        try {
          api.remove(widgetId);
        } catch {
          // The widget may already have been removed.
        }
      }
    };
  }, [action, siteKey, scriptReady]);

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
        onReady={() => setScriptReady(true)}
        onError={() => {
          setToken("");
          setFailed(true);
        }}
      />

      <div ref={containerRef} />

      <input
        type="hidden"
        name="cf-turnstile-response"
        value={token}
        readOnly
      />

      {failed ? (
        <p role="alert" className="text-sm text-[#9B3D24]">
          The verification check couldn&apos;t load.
          Please refresh the page and try again.
        </p>
      ) : (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-[#52645A]"
        >
          {token
            ? "Verification complete."
            : "Waiting for the verification check…"}
        </p>
      )}

      <noscript>
        <p className="text-sm text-[#9B3D24]">
          Please enable JavaScript to complete the verification,
          or email hello@thedadclub.com.au.
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