import "server-only";

import { getStripeEnvironment } from "../lib/stripe";

export default function PurchaseModeNotice() {
  if (getStripeEnvironment() === "live") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#C96632]/30 bg-[#E8EBDD] p-5">
      <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
        SANDBOX PREVIEW
      </p>

      <p className="mt-2 text-sm leading-relaxed">
        This is a test environment. Purchases do not take
        real payments. Email verification and confirmation
        messages may still be sent.
      </p>
    </div>
  );
}