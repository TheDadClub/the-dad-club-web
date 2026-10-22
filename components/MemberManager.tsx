import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import { saveMember } from "../app/admin/members/actions";

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  due_date: string | null;
  birth_date: string | null;
  status: "active" | "archived";
};

type Entitlement = {
  member_id: string;
  session_number: number;
  status: "available" | "used" | "revoked";
};

type ReservedBooking = {
  member_id: string;
  session_number: number;
};

export type MemberSearchParams = {
  edit?: string;
  error?: string;
  saved?: string;
  page?: string;
};

const pageSize = 25;

const memberFields =
  "id,name,email,phone,location,due_date,birth_date,status";

const sessionNames = [
  "The Beginning",
  "Getting Ready",
  "Finding Your Feet",
  "Adjusting",
  "The Next Chapter",
];

const errors: Record<string, string> = {
  invalid: "Check the required fields, email address and dates.",
  duplicate: "A member with that email address already exists.",
  save: "The member could not be saved. Please try again.",
};

const inputClass =
  "mt-2 w-full min-w-0 rounded-xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3 text-base focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

const entitlementStyles = {
  Available: "bg-[#E8EBDD]/70 text-[#173A2C]",
  Booked: "bg-[#173A2C] text-[#F4F0E5]",
  Used: "bg-[#173A2C]/10 text-[#173A2C]",
  Revoked: "bg-[#C96632]/15 text-[#8D3E21]",
  "Needs review": "bg-[#C96632]/15 text-[#8D3E21]",
};

type EntitlementLabel = keyof typeof entitlementStyles;

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function MemberManager({
  searchParams,
}: {
  searchParams: Promise<MemberSearchParams>;
}) {
  const { database } = await requireAdmin();
  const params = await searchParams;

  const requestedPage = Number(params.page);
  const page =
    Number.isInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 100000
      ? requestedPage
      : 1;

  const offset = (page - 1) * pageSize;

  const {
    data: memberData,
    count,
    error: membersError,
  } = await database
    .from("members")
    .select(memberFields, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (membersError) {
    throw new Error("Unable to load members.");
  }

  const members = (memberData ?? []) as Member[];

  let selected: Member | null = null;
  let editUnavailable = false;

  if (params.edit) {
    const validId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        params.edit,
      );

    if (validId) {
      const { data, error } = await database
        .from("members")
        .select(memberFields)
        .eq("id", params.edit)
        .maybeSingle();

      if (error) {
        throw new Error("Unable to load the selected member.");
      }

      selected = data as Member | null;
    }

    editUnavailable = !selected;
  }

  let entitlements: Entitlement[] = [];
  let reservedBookings: ReservedBooking[] = [];

  if (members.length > 0) {
    const memberIds = members.map((member) => member.id);

    const [entitlementsResult, bookingsResult] = await Promise.all([
      database
        .from("member_entitlements")
        .select("member_id,session_number,status")
        .in("member_id", memberIds),

      database
        .from("session_bookings")
        .select("member_id,session_number")
        .in("member_id", memberIds)
        .eq("status", "booked"),
    ]);

    if (entitlementsResult.error || bookingsResult.error) {
      throw new Error("Unable to load member entitlements and bookings.");
    }

    entitlements = (entitlementsResult.data ?? []) as Entitlement[];
    reservedBookings = (bookingsResult.data ?? []) as ReservedBooking[];
  }

  const entitlementLookup = new Map(
    entitlements.map((item) => [
      `${item.member_id}:${item.session_number}`,
      item,
    ]),
  );

  const bookedKeys = new Set(
    reservedBookings.map(
      (item) => `${item.member_id}:${item.session_number}`,
    ),
  );

  function entitlementLabel(
    memberId: string,
    sessionNumber: number,
  ): EntitlementLabel {
    const key = `${memberId}:${sessionNumber}`;
    const entitlement = entitlementLookup.get(key);
    const booked = bookedKeys.has(key);

    if (!entitlement) return "Needs review";

    // Surface inconsistent records instead of showing a misleading label.
    if (booked && entitlement.status !== "available") {
      return "Needs review";
    }

    if (entitlement.status === "used") return "Used";
    if (entitlement.status === "revoked") return "Revoked";
    if (booked) return "Booked";

    return "Available";
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-10">
        <h1 className="text-4xl font-black tracking-tight">Members</h1>

        <p className="mt-4 max-w-3xl leading-relaxed text-[#52645A]">
          Manage member contact details and their five session
          entitlements.
        </p>

        <p className="mt-4 rounded-xl bg-[#E8EBDD] p-4 text-sm leading-relaxed">
          Adding a member does not create a login, take payment,
          book sessions or send an email.
        </p>

        {params.saved === "1" && (
          <p role="status" className="mt-6 font-bold">
            Member saved.
          </p>
        )}

        {params.error && (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-[#C96632]/10 p-4 text-sm"
          >
            {errors[params.error] ??
              "Something went wrong. Please try again."}
            {" "}Your changes were not saved.
          </p>
        )}

        <section
          id="member-form"
          className="mt-8 scroll-mt-6 rounded-[28px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-black">
              {params.edit ? "Edit member" : "Add member"}
            </h2>

            {params.edit && (
              <Link
                href="/admin/members#member-form"
                prefetch={false}
                className="text-sm font-bold underline underline-offset-4"
              >
                Cancel editing / add new
              </Link>
            )}
          </div>

          {editUnavailable ? (
            <p className="mt-5" role="alert">
              This member could not be found. Return to the member
              list and try again.
            </p>
          ) : (
            <form
              key={selected?.id ?? "new"}
              action={saveMember}
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >
              <input
                type="hidden"
                name="id"
                value={selected?.id ?? ""}
              />

              <label className="text-sm font-bold">
                Name *
                <input
                  name="name"
                  required
                  maxLength={100}
                  autoComplete="off"
                  defaultValue={selected?.name ?? ""}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-bold">
                Email *
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="off"
                  defaultValue={selected?.email ?? ""}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-bold">
                Phone
                <input
                  name="phone"
                  type="tel"
                  maxLength={40}
                  autoComplete="off"
                  defaultValue={selected?.phone ?? ""}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-bold">
                Suburb or location
                <input
                  name="location"
                  maxLength={100}
                  autoComplete="off"
                  defaultValue={selected?.location ?? ""}
                  className={inputClass}
                />
              </label>

              <label className="min-w-0 text-sm font-bold">
                Expected due date
                <input
                  name="due_date"
                  type="date"
                  defaultValue={selected?.due_date ?? ""}
                  className={inputClass}
                />
              </label>

              <label className="min-w-0 text-sm font-bold">
                Actual birth date
                <input
                  name="birth_date"
                  type="date"
                  defaultValue={selected?.birth_date ?? ""}
                  className={inputClass}
                />
              </label>

              <p className="text-sm leading-relaxed text-[#52645A] sm:col-span-2">
                Dates are optional. Record only dates the member has
                provided. When available, the actual birth date will
                guide future session recommendations.
              </p>

              <label className="text-sm font-bold">
                Member status
                <select
                  name="status"
                  defaultValue={selected?.status ?? "active"}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <p className="self-end text-sm leading-relaxed text-[#52645A]">
                Archiving retains the member record and entitlements.
                It does not erase personal information.
              </p>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-[#173A2C] px-7 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
                >
                  {selected ? "SAVE CHANGES →" : "ADD MEMBER →"}
                </button>

                {!selected && (
                  <p className="mt-4 text-sm text-[#52645A]">
                    Five available session entitlements will be
                    created automatically.
                  </p>
                )}
              </div>
            </form>
          )}
        </section>

        <section className="mt-10" aria-labelledby="member-list-heading">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="member-list-heading" className="text-2xl font-black">
              Member list ({total})
            </h2>

            <Link
              href={`/admin/members?page=${page}`}
              prefetch={false}
              className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold"
            >
              Refresh list
            </Link>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
            Available means ready to book. Booked means a place is
            reserved. Used means attendance has been recorded.
          </p>

          <div className="mt-6 space-y-4">
            {members.map((member) => (
              <article
                key={member.id}
                className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words text-xl font-black">
                      {member.name}
                    </h3>

                    <p className="mt-2 break-all text-sm text-[#52645A]">
                      {member.email}
                    </p>

                    {member.phone && (
                      <p className="mt-1 text-sm text-[#52645A]">
                        {member.phone}
                      </p>
                    )}

                    {member.location && (
                      <p className="mt-1 text-sm text-[#52645A]">
                        {member.location}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-[#E8EBDD] px-4 py-2 text-xs font-bold capitalize">
                      {member.status}
                    </span>

                    <Link
                      href={`/admin/members?edit=${member.id}#member-form`}
                      prefetch={false}
                      className="text-sm font-bold underline underline-offset-4"
                    >
                      Edit
                    </Link>
                  </div>
                </div>

                {(member.due_date || member.birth_date) && (
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#52645A]">
                    {member.due_date && (
                      <p>Due date: {displayDate(member.due_date)}</p>
                    )}

                    {member.birth_date && (
                      <p>Birth date: {displayDate(member.birth_date)}</p>
                    )}
                  </div>
                )}

                <h4 className="mt-6 text-xs font-extrabold tracking-wider">
                  SESSION ENTITLEMENTS
                </h4>

                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sessionNames.map((title, index) => {
                    const label = entitlementLabel(member.id, index + 1);

                    return (
                      <li
                        key={title}
                        className={`rounded-xl p-3 text-sm ${entitlementStyles[label]}`}
                      >
                        <p className="font-bold">
                          {index + 1}. {title}
                        </p>
                        <p className="mt-1">{label}</p>
                      </li>
                    );
                  })}
                </ul>

                {sessionNames.some(
                  (_, index) =>
                    entitlementLabel(member.id, index + 1) === "Booked",
                ) && (
                  <Link
                    href="/admin/bookings"
                    prefetch={false}
                    className="mt-5 inline-block text-sm font-bold underline underline-offset-4"
                  >
                    Manage bookings →
                  </Link>
                )}
              </article>
            ))}

            {members.length === 0 && (
              <p className="rounded-2xl bg-[#E8EBDD] p-6">
                {total === 0
                  ? "No members yet. Add your first member above."
                  : "No members on this page. Return to the first page."}
              </p>
            )}
          </div>

          <nav
            aria-label="Member list pages"
            className="mt-7 flex flex-wrap items-center justify-between gap-4 text-sm font-semibold"
          >
            {page > 1 ? (
              <Link
                href={`/admin/members?page=${page - 1}`}
                prefetch={false}
                className="rounded-full border border-[#173A2C]/25 px-5 py-3"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}

            <span>
              Page {page} of {totalPages}
            </span>

            {page < totalPages ? (
              <Link
                href={`/admin/members?page=${page + 1}`}
                prefetch={false}
                className="rounded-full border border-[#173A2C]/25 px-5 py-3"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}

            {page > totalPages && (
              <Link
                href="/admin/members"
                prefetch={false}
                className="underline"
              >
                First page
              </Link>
            )}
          </nav>
        </section>
      </main>
    </div>
  );
}