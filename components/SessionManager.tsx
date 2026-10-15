import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import { signOut } from "../app/admin/actions";
import { saveSession } from "../app/admin/sessions/actions";
import {
  displaySessionDate,
  sessionTitle,
  sessionTypes,
  utcToAdelaideInput,
  type ProgramSession,
} from "../lib/programSessions";

type SearchParams = Promise<{
  edit?: string | string[];
  error?: string | string[];
  saved?: string | string[];
}>;

const fields =
  "id, session_number, starts_at, ends_at, venue_name, venue_address, capacity, status, admin_notes";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3 text-base focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

const statusClasses: Record<string, string> = {
  draft: "bg-[#E8EBDD] text-[#173A2C]",
  published: "bg-[#173A2C] text-[#F4F0E5]",
  cancelled: "bg-[#C96632]/15 text-[#8D3E21]",
};

export default async function SessionManager({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { database } = await requireAdmin();
  const params = await searchParams;

  const editId = typeof params.edit === "string" ? params.edit : "";

  const { data, error } = await database
    .from("program_sessions")
    .select(fields)
    .order("starts_at", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error("Unable to load sessions. Please try again.");
  }

  const sessions = (data ?? []) as ProgramSession[];
  let editing: ProgramSession | null = null;

  if (editId) {
    const validId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        editId,
      );

    if (validId) {
      const result = await database
        .from("program_sessions")
        .select(fields)
        .eq("id", editId)
        .maybeSingle();

      if (result.error) {
        throw new Error("Unable to load the selected session.");
      }

      editing = result.data as ProgramSession | null;
    }
  }

  const editMissing = Boolean(editId && !editing);

  const errorMessage =
    params.error === "times"
      ? "Check the dates and times. The end must be after the start. Times that overlap a daylight-saving clock change cannot be used."
      : params.error === "invalid"
        ? "Please check all required fields and their permitted lengths."
        : params.error === "save"
          ? "The session could not be saved. Please try again."
          : null;

  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <header className="bg-[#173A2C] text-[#F4F0E5]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-10">
          <Link href="/admin" className="text-lg font-black">
            THE DAD CLUB → ADMIN
          </Link>

          <nav
            aria-label="Admin navigation"
            className="flex flex-wrap items-center gap-5 text-sm font-semibold"
          >
            <Link href="/admin" prefetch={false}>
              Interest list
            </Link>
            <Link href="/admin/sessions" aria-current="page" prefetch={false}>
              Sessions
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-white/40 px-4 py-2"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 md:px-10">
        <h1 className="text-4xl font-black tracking-tight">
          Session management.
        </h1>

        <p className="mt-4 max-w-3xl leading-relaxed text-[#52645A]">
          Create dates for the five program sessions. All date entry
          and display use Adelaide time, including daylight saving.
        </p>

        <p className="mt-4 rounded-xl bg-[#E8EBDD] p-4 text-sm leading-relaxed">
          These controls do not open bookings or send emails.
          Published is an internal status until member bookings are
          added.
        </p>

        {params.saved === "1" && (
          <p role="status" className="mt-6 font-bold">
            Session saved.
          </p>
        )}

        <section
          id="session-form"
          className="mt-8 scroll-mt-6 rounded-[28px] border border-[#173A2C]/15 bg-white/60 p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-black">
              {editing ? "Edit session" : "Create session"}
            </h2>

            {editing && (
              <Link
                href="/admin/sessions#session-form"
                className="text-sm font-bold underline underline-offset-4"
              >
                Cancel editing / create new
              </Link>
            )}
          </div>

          {editMissing ? (
            <p className="mt-5">
              Session not found.{" "}
              <Link href="/admin/sessions" className="underline">
                Return to sessions
              </Link>
            </p>
          ) : (
            <>
              {errorMessage && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl bg-[#C96632]/10 p-4 text-sm"
                >
                  {errorMessage} Unsaved entries may need to be re-entered.
                </p>
              )}

              <form
                key={editing?.id ?? "new"}
                action={saveSession}
                className="mt-6 space-y-5"
              >
                <input type="hidden" name="id" value={editing?.id ?? ""} />

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="session_number" className="text-sm font-bold">
                      Session type
                    </label>
                    <select
                      id="session_number"
                      name="session_number"
                      required
                      defaultValue={editing?.session_number ?? 1}
                      className={inputClass}
                    >
                      {sessionTypes.map((session) => (
                        <option key={session.number} value={session.number}>
                          {session.number}. {session.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status" className="text-sm font-bold">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      defaultValue={editing?.status ?? "draft"}
                      className={inputClass}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="starts_at" className="text-sm font-bold">
                      Starts — Adelaide time
                    </label>
                    <input
                      id="starts_at"
                      name="starts_at"
                      type="datetime-local"
                      required
                      step={60}
                      defaultValue={
                        editing ? utcToAdelaideInput(editing.starts_at) : ""
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="ends_at" className="text-sm font-bold">
                      Ends — Adelaide time
                    </label>
                    <input
                      id="ends_at"
                      name="ends_at"
                      type="datetime-local"
                      required
                      step={60}
                      defaultValue={
                        editing ? utcToAdelaideInput(editing.ends_at) : ""
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="venue_name" className="text-sm font-bold">
                      Venue name
                    </label>
                    <input
                      id="venue_name"
                      name="venue_name"
                      required
                      maxLength={150}
                      defaultValue={editing?.venue_name ?? ""}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="capacity" className="text-sm font-bold">
                      Capacity
                    </label>
                    <input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min={1}
                      max={200}
                      step={1}
                      required
                      defaultValue={editing?.capacity ?? 10}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="venue_address" className="text-sm font-bold">
                    Venue address
                  </label>
                  <input
                    id="venue_address"
                    name="venue_address"
                    required
                    maxLength={300}
                    defaultValue={editing?.venue_address ?? ""}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="admin_notes" className="text-sm font-bold">
                    Internal session notes — optional
                  </label>
                  <textarea
                    id="admin_notes"
                    name="admin_notes"
                    rows={3}
                    maxLength={2000}
                    defaultValue={editing?.admin_notes ?? ""}
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs text-[#52645A]">
                    For logistics only. Do not record personal health
                    information about attendees.
                  </p>
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-[#173A2C] px-7 py-4 text-sm font-extrabold text-[#F4F0E5] hover:bg-[#245540]"
                >
                  {editing ? "SAVE CHANGES →" : "CREATE SESSION →"}
                </button>
              </form>
            </>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black">Scheduled sessions</h2>
          <p className="mt-3 text-sm text-[#52645A]">
            Showing up to 100 sessions, earliest first.
          </p>

          <div className="mt-6 space-y-4">
            {sessions.length === 0 && (
              <p className="rounded-2xl bg-[#E8EBDD] p-6">
                No sessions yet. Create your first draft above.
              </p>
            )}

            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#C96632]">
                      SESSION {String(session.session_number).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 text-xl font-black">
                      {sessionTitle(session.session_number)}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${
                      statusClasses[session.status] ?? ""
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-bold">Starts</dt>
                    <dd className="mt-1 text-[#52645A]">
                      {displaySessionDate(session.starts_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold">Ends</dt>
                    <dd className="mt-1 text-[#52645A]">
                      {displaySessionDate(session.ends_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold">Venue</dt>
                    <dd className="mt-1 break-words text-[#52645A]">
                      {session.venue_name}
                      <br />
                      {session.venue_address}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold">Capacity</dt>
                    <dd className="mt-1 text-[#52645A]">
                      {session.capacity} places
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/admin/sessions?edit=${session.id}#session-form`}
                  prefetch={false}
                  className="mt-6 inline-block rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold"
                >
                  Edit session →
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
