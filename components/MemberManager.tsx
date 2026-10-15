import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import { signOut } from "../app/admin/actions";
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
  "One Year In",
  "The Next Chapter",
];

const entitlementLabels = {
  available: "Available",
  used: "Used",
  revoked: "Revoked",
};

const errors: Record<string, string> = {
  invalid: "Check the required fields, email address and dates.",
  duplicate: "A member with that email address already exists.",
  save: "The member could not be saved. Please try again.",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#173A2C]/25 bg-white px-4 py-3 text-base text-[#173A2C] focus:outline-none focus:ring-2 focus:ring-[#C96632]";

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
        params.edit
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

  if (members.length > 0) {
    const { data, error } = await database
      .from("member_entitlements")
      .select("member_id,session_number,status")
      .in(
        "member_id",
        members.map((member) => member.id)
      );

    if (error) {
      throw new Error("Unable to load member entitlements.");
    }

    entitlements = (data ?? []) as Entitlement[];
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-[#F4F0E5] px-5 py-8 text-[#173A2C] md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-[#C96632]">
              THE DAD CLUB · PRIVATE ADMIN
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Members
            </h1>
          </div>

          <div className="flex items-center gap-5 text-sm font-bold">
            <Link href="/" prefetch={false} className="underline">
              Website
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-[#173A2C]/30 px-5 py-3"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <nav
          aria-label="Admin navigation"
          className="mt-8 flex flex-wrap gap-3 text-sm font-bold"
        >
          <Link
            href="/admin"
            prefetch={false}
            className="rounded-full border border-[#173A2C]/25 px-5 py-3"
          >
            Interest registrations
          </Link>
          <Link
            href="/admin/sessions"
            prefetch={false}
            className="rounded-full border border-[#173A2C]/25 px-5 py-3"
          >
            Sessions
          </Link>
          <Link
            href="/admin/members"
            prefetch={false}
            aria-current="page"
            className="rounded-full bg-[#173A2C] px-5 py-3 text-[#F4F0E5]"
          >
            Members
          </Link>
        </nav>

        <p className="mt-8 max-w-3xl leading-relaxed text-[#52645A]">
          Manage member contact details and their five session
          entitlements. Adding a member does not create a login, take
          payment, book sessions or send an email.
        </p>

        {params.saved === "1" && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-[#173A2C]/20 bg-[#E8EBDD] p-4 font-bold"
          >
            Member saved.
          </p>
        )}

        {params.error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-700/30 bg-red-50 p-4 text-red-900"
          >
            {errors[params.error] ?? "Something went wrong. Please try again."}
            {" "}Your changes were not saved.
          </p>
        )}

        <section
          id="member-form"
          className="mt-8 scroll-mt-6 rounded-3xl border border-[#173A2C]/15 bg-[#FBF8F0] p-6 md:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-black">
              {params.edit ? "Edit member" : "Add member"}
            </h2>

            {params.edit && (
              <Link
                href="/admin/members"
                prefetch={false}
                className="text-sm font-bold underline"
              >
                Cancel editing
              </Link>
            )}
          </div>

          {editUnavailable ? (
            <p className="mt-5" role="alert">
              This member could not be found. Return to the member list
              and try again.
            </p>
          ) : (
            <form
              key={selected?.id ?? "new"}
              action={saveMember}
              className="mt-6 grid gap-5 md:grid-cols-2"
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
                  className={`${inputClass} min-w-0`}
                />
              </label>

              <label className="min-w-0 text-sm font-bold">
                Actual birth date
                <input
                  name="birth_date"
                  type="date"
                  defaultValue={selected?.birth_date ?? ""}
                  className={`${inputClass} min-w-0`}
                />
              </label>

              <p className="text-sm leading-relaxed text-[#52645A] md:col-span-2">
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

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-[#173A2C] px-7 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
                >
                  {selected ? "SAVE CHANGES" : "ADD MEMBER"}
                </button>

                {!selected && (
                  <p className="mt-4 text-sm text-[#52645A]">
                    Five available session entitlements will be created
                    automatically.
                  </p>
                )}
              </div>
            </form>
          )}
        </section>

        <section className="mt-12" aria-labelledby="member-list-heading">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="member-list-heading" className="text-2xl font-black">
              Member list ({total})
            </h2>

            <Link
              href={`/admin/members?page=${page}`}
              prefetch={false}
              className="text-sm font-bold underline"
            >
              Refresh list
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            {members.map((member) => (
              <article
                key={member.id}
                className="rounded-3xl border border-[#173A2C]/15 bg-[#FBF8F0] p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words text-xl font-black">
                      {member.name}
                    </h3>

                    <p className="mt-2 break-words text-sm">
                      {member.email}
                    </p>

                    {member.phone && (
                      <p className="mt-1 text-sm">{member.phone}</p>
                    )}

                    {member.location && (
                      <p className="mt-1 text-sm text-[#52645A]">
                        {member.location}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-[#E8EBDD] px-3 py-2 text-xs font-bold capitalize">
                      {member.status}
                    </span>

                    <Link
                      href={`/admin/members?edit=${member.id}#member-form`}
                      prefetch={false}
                      className="text-sm font-bold underline"
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
                    const entitlement = entitlements.find(
                      (item) =>
                        item.member_id === member.id &&
                        item.session_number === index + 1
                    );

                    return (
                      <li
                        key={title}
                        className="rounded-xl bg-[#E8EBDD]/70 p-3 text-sm"
                      >
                        <p className="font-bold">
                          {index + 1}. {title}
                        </p>
                        <p className="mt-1 text-[#52645A]">
                          {entitlement
                            ? entitlementLabels[entitlement.status]
                            : "Missing — needs review"}
                        </p>
                      </li>
                    );
                  })}
                </ul>
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
            className="mt-6 flex flex-wrap items-center gap-5 text-sm font-bold"
          >
            {page > 1 && (
              <Link
                href={`/admin/members?page=${page - 1}`}
                prefetch={false}
                className="underline"
              >
                ← Previous
              </Link>
            )}

            <p>
              Page {page} of {totalPages}
            </p>

            {page < totalPages && (
              <Link
                href={`/admin/members?page=${page + 1}`}
                prefetch={false}
                className="underline"
              >
                Next →
              </Link>
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
      </div>
    </main>
  );
}