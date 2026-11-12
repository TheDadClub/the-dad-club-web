import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import { venueStatusLabel } from "../lib/venueReviews";
import VenueReviewForm from "./VenueReviewForm";

export type VenueSearchParams = Promise<{
  page?: string | string[];
  saved?: string | string[];
  error?: string | string[];
}>;

type VenueEnquiry = {
  id: string;
  venue_name: string;
  suburb: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  capacity: string;
  privacy: string;
  equipment: string;
  evenings: string[];
  complimentary: string;
  notes: string | null;
  status: string;
  internal_notes: string | null;
  follow_up_at: string | null;
  review_version: number;
  created_at: string;
  updated_at: string;
};

const pageSize = 20;

const privacyLabels: Record<string, string> = {
  private: "Private room",
  "semi-private": "Semi-private or separated area",
  open: "Open dining area",
};

const equipmentLabels: Record<string, string> = {
  tv: "TV or screen",
  projector: "Projector",
  both: "TV and projector",
  none: "Neither",
};

const complimentaryLabels: Record<string, string> = {
  yes: "Yes, potentially",
  discuss: "Happy to discuss",
  no: "Room hire would apply",
};

const capacityLabels: Record<string, string> = {
  "6-12": "6–12 people",
  "13-20": "13–20 people",
  "20+": "More than 20 people",
  unsure: "Not sure",
};

const errors: Record<string, string> = {
  invalid:
    "Please check the review fields. Notes must be no longer than 5,000 characters and the follow-up date must be valid.",
  stale:
    "This enquiry changed after you opened it, or is no longer available. The latest details are shown below. Check them before saving again.",
  save:
    "We couldn't save the review. Please try again.",
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Adelaide",
  }).format(new Date(value));
}

export default async function VenueEnquiries({
  searchParams,
}: {
  searchParams: VenueSearchParams;
}) {
  const { database } = await requireAdmin();
  const params = await searchParams;

  const rawPage =
    typeof params.page === "string" ? params.page : "1";

  const parsedPage = Number(rawPage);

  const page =
    /^\d+$/.test(rawPage) &&
    Number.isSafeInteger(parsedPage) &&
    parsedPage >= 1 &&
    parsedPage <= 100000
      ? parsedPage
      : 1;

  const offset = (page - 1) * pageSize;

  const errorMessage =
    typeof params.error === "string"
      ? errors[params.error]
      : undefined;

  let enquiries: VenueEnquiry[] = [];
  let total = 0;
  let failed = false;

  try {
    const { data, count, error } = await database
      .from("venue_partners")
      .select(
        "id, venue_name, suburb, contact_name, contact_email, contact_phone, capacity, privacy, equipment, evenings, complimentary, notes, status, internal_notes, follow_up_at, review_version, created_at, updated_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Venue enquiry loading failed:", error.code);
      failed = true;
    } else {
      enquiries = (data ?? []) as VenueEnquiry[];
      total = count ?? 0;
    }
  } catch {
    console.error("Venue enquiry database request failed.");
    failed = true;
  }

  const hasNext = offset + pageSize < total;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
            VENUE PARTNERSHIPS
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Venue enquiries
          </h1>

          <p className="mt-4 max-w-2xl leading-relaxed text-[#52645A]">
            Review venues interested in hosting Dad Club sessions.
            Enquiries are shown newest first.
          </p>

          {!failed && (
            <p className="mt-3 text-sm font-bold">
              {total} {total === 1 ? "enquiry" : "enquiries"}
            </p>
          )}
        </div>

        <Link
          href="/venues"
          prefetch={false}
          className="inline-flex min-h-12 items-center rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold hover:bg-[#E8EBDD]"
        >
          View public venue page →
        </Link>
      </div>

      {params.saved === "saved" && (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-[#173A2C]/20 bg-[#E8EBDD] p-5 font-semibold"
        >
          Venue review saved. No email was sent.
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-[#C96632]/40 bg-[#C96632]/10 p-5"
        >
          {errorMessage}
        </p>
      )}

      {failed ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-[#C96632]/40 bg-[#C96632]/10 p-6"
        >
          We couldn&apos;t load venue enquiries. Please refresh
          the page and try again.
        </div>
      ) : enquiries.length === 0 ? (
        <div className="mt-8 rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6">
          <p className="font-bold">
            {page === 1
              ? "No venue enquiries yet."
              : "No enquiries on this page."}
          </p>

          {page > 1 && (
            <Link
              href="/admin/venues"
              prefetch={false}
              className="mt-4 inline-block font-bold underline underline-offset-4"
            >
              Return to the first page
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {enquiries.map((venue) => {
            const details = [
              ["Location", venue.suburb],
              [
                "Room capacity",
                capacityLabels[venue.capacity] ?? venue.capacity,
              ],
              [
                "Type of space",
                privacyLabels[venue.privacy] ?? venue.privacy,
              ],
              [
                "Presentation equipment",
                equipmentLabels[venue.equipment] ?? venue.equipment,
              ],
              [
                "Available evenings",
                venue.evenings.length > 0
                  ? venue.evenings.join(", ")
                  : "Not specified",
              ],
              [
                "Complimentary room use",
                complimentaryLabels[venue.complimentary] ??
                  venue.complimentary,
              ],
            ];

            return (
              <article
                key={`${venue.id}-${venue.review_version}`}
                id={`venue-${venue.id}`}
                className="scroll-mt-6 rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="break-words text-2xl font-black">
                      {venue.venue_name}
                    </h2>

                    <p className="mt-2 text-sm text-[#52645A]">
                      Received {displayDate(venue.created_at)}
                      {" · "}Australian Central time
                    </p>
                  </div>

                  <span className="rounded-full bg-[#E8EBDD] px-4 py-2 text-sm font-bold">
                    {venueStatusLabel(venue.status)}
                  </span>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <section>
                    <h3 className="text-sm font-extrabold">
                      CONTACT
                    </h3>

                    <p className="mt-3 break-words font-semibold">
                      {venue.contact_name}
                    </p>

                    <a
                      href={`mailto:${venue.contact_email}`}
                      className="mt-2 inline-block break-all text-sm underline underline-offset-4"
                    >
                      {venue.contact_email}
                    </a>

                    {venue.contact_phone && (
                      <p className="mt-2 break-words text-sm">
                        {venue.contact_phone}
                      </p>
                    )}
                  </section>

                  <dl className="space-y-4">
                    {details.map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-sm font-bold">
                          {label}
                        </dt>

                        <dd className="mt-1 break-words text-sm leading-relaxed text-[#52645A]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {venue.notes && (
                  <section className="mt-6 border-t border-[#173A2C]/15 pt-5">
                    <h3 className="text-sm font-bold">
                      Details supplied by the venue
                    </h3>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#52645A]">
                      {venue.notes}
                    </p>
                  </section>
                )}

                <VenueReviewForm
                  id={venue.id}
                  status={venue.status}
                  internalNotes={venue.internal_notes}
                  followUpAt={venue.follow_up_at}
                  reviewVersion={venue.review_version}
                  page={page}
                />

                {venue.review_version > 0 && (
                  <p className="mt-4 text-xs text-[#52645A]">
                    Last updated {displayDate(venue.updated_at)}
                    {" · "}Australian Central time
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {!failed && (page > 1 || hasNext) && (
        <nav
          aria-label="Venue enquiry pages"
          className="mt-8 flex flex-wrap items-center justify-between gap-4"
        >
          {page > 1 ? (
            <Link
              href={`/admin/venues?page=${page - 1}`}
              prefetch={false}
              className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold hover:bg-[#E8EBDD]"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}

          <p className="text-sm font-bold">Page {page}</p>

          {hasNext ? (
            <Link
              href={`/admin/venues?page=${page + 1}`}
              prefetch={false}
              className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold hover:bg-[#E8EBDD]"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}