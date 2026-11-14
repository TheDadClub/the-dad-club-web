"use client";

export type PurchaseProduct =
  | "before_baby"
  | "after_baby"
  | "hat";

export type PurchasePrices = Record<PurchaseProduct, number>;

const offers: {
  code: PurchaseProduct;
  label: string;
  title: string;
  description: string;
  sessions: string[];
  note: string;
}[] = [
  {
    code: "before_baby",
    label: "BEFORE BABY",
    title: "The whole journey.",
    description:
      "Five sessions, from preparing for fatherhood through your child's second birthday.",
    sessions: [
      "The Beginning",
      "Getting Ready",
      "Finding Your Feet",
      "Adjusting",
      "The Next Chapter",
    ],
    note: "Includes one Dad Club hat and standard Australian delivery.",
  },
  {
    code: "after_baby",
    label: "AFTER BABY",
    title: "Already in the thick of it?",
    description:
      "Three post-birth sessions, with room for your own adjustment alongside everything else.",
    sessions: [
      "Finding Your Feet",
      "Adjusting",
      "The Next Chapter",
    ],
    note: "Includes one Dad Club hat and standard Australian delivery.",
  },
  {
    code: "hat",
    label: "THE DAD CLUB HAT",
    title: "A little less on top? Covered.",
    description:
      "A forest-green cap with the orange Dad Club arrow embroidered on the front.",
    sessions: [],
    note: "One hat, including standard Australian delivery.",
  },
];

function displayPrice(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function PurchaseProductPicker({
  selected,
  prices,
  onSelect,
}: {
  selected: PurchaseProduct | null;
  prices: PurchasePrices;
  onSelect: (product: PurchaseProduct) => void;
}) {
  return (
    <section aria-labelledby="purchase-options-title">
      <h2
        id="purchase-options-title"
        className="text-xl font-black tracking-tight md:text-2xl"
      >
        1. Choose something for the dad.
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-[#52645A]">
        Select a card to continue. Program packages can
        be purchased for yourself or as a gift.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {offers.map((offer) => {
          const active = selected === offer.code;

          return (
            <button
              key={offer.code}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(offer.code)}
              className={`flex h-full min-w-0 flex-col rounded-[24px] border-2 p-6 text-left transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] sm:p-7 ${
                active
                  ? "border-[#173A2C] bg-[#E8EBDD] shadow-md"
                  : "border-[#173A2C]/15 bg-[#FBF8F0] hover:border-[#173A2C]/50 hover:bg-[#E8EBDD]/60"
              }`}
            >
              <span className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
                {offer.label}
              </span>

              <span className="mt-4 text-2xl font-black leading-tight tracking-tight">
                {offer.title}
              </span>

              <span className="mt-5 text-4xl font-black">
                {displayPrice(prices[offer.code])}
                <span className="ml-2 text-sm font-bold">
                  AUD
                </span>
              </span>

              <span className="mt-2 text-xs font-semibold text-[#52645A]">
                One-off payment
              </span>

              <span className="mt-5 leading-relaxed text-[#52645A]">
                {offer.description}
              </span>

              {offer.sessions.length > 0 && (
                <span className="mt-5 space-y-2 text-sm font-semibold">
                  {offer.sessions.map((title) => (
                    <span key={title} className="block">
                      {title}
                    </span>
                  ))}
                </span>
              )}

              <span className="mt-auto pt-6 text-sm leading-relaxed text-[#52645A]">
                {offer.note}
              </span>

              <span
                className={`mt-6 flex min-h-12 w-full items-center justify-center rounded-full px-4 py-3 text-sm font-extrabold ${
                  active
                    ? "bg-[#173A2C] text-[#F4F0E5]"
                    : "border border-[#173A2C]/25 text-[#173A2C]"
                }`}
              >
                {active ? "SELECTED ✓" : "CHOOSE THIS →"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}