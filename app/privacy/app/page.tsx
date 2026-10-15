import Link from "next/link";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";

export default function AppPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-5 py-14 md:px-10 md:py-24">
        <Link
          href="/privacy"
          className="text-sm font-bold hover:text-[#C96632]"
        >
          ← Privacy hub
        </Link>

        <h1 className="mt-7 text-4xl font-black tracking-tight md:text-6xl">
          APP PRIVACY
        </h1>

        <div className="mt-8 rounded-[28px] border border-[#173A2C]/15 bg-[#FBF8F0] p-7 sm:p-9">
          <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
            POLICY BEING FINALISED
          </p>

          <h2 className="mt-5 text-2xl font-black tracking-tight">
            Privacy information for The Dad Club app.
          </h2>

          <p className="mt-5 leading-relaxed text-[#52645A]">
            The app&apos;s privacy policy is being prepared against
            its release version. This page is not yet a completed
            app privacy policy.
          </p>

          <p className="mt-4 leading-relaxed text-[#52645A]">
            It will explain how profile details, journey dates,
            check-ins and saved content are handled, including what
            stays on your device and any information processed by
            external services.
          </p>

          <p className="mt-4 leading-relaxed text-[#52645A]">
            Website registrations are covered separately by our
            website privacy notice.
          </p>

          <Link
            href="/privacy/website"
            className="mt-6 inline-block text-sm font-extrabold underline underline-offset-4"
          >
            WEBSITE PRIVACY →
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-black tracking-tight">
            Questions about app privacy?
          </h2>

          <a
            href="mailto:hello@thedadclub.com.au"
            className="mt-4 inline-block break-all font-semibold underline underline-offset-4"
          >
            hello@thedadclub.com.au
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}