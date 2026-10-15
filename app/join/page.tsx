import { Suspense } from "react";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import InterestForm from "../../components/InterestForm";

type SearchParams = Promise<{
  status?: string | string[];
}>;

async function Registration({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status =
    typeof params.status === "string" ? params.status : undefined;

  const successful =
    status === "success" || status === "success_no_email";

  if (!successful) {
    return <InterestForm status={status} />;
  }

  return (
    <div role="status">
      <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
        THANKS FOR PUTTING YOUR HAND UP
      </p>

      <h2 className="mt-5 text-3xl font-black tracking-tight">
        You&apos;re on the interest list.
      </h2>

      <p className="mt-5 leading-relaxed text-[#52645A]">
        We&apos;ll be in touch when there&apos;s news about upcoming
        programs. There&apos;s nothing to pay and no commitment to
        attend.
      </p>

      <div className="mt-6 rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed">
        {status === "success_no_email" ? (
          <p>
            Your registration is saved, but we couldn&apos;t confirm
            that your email was sent. You don&apos;t need to register
            again. Contact us if you have a question.
          </p>
        ) : (
          <p>
            For a new registration, look out for a confirmation email.
            It may take a few minutes; check your junk folder too.
            If you registered previously, we haven&apos;t sent another
            confirmation.
          </p>
        )}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-[#52645A]">
        Questions? Email{" "}
        <a
          href="mailto:hello@thedadclub.com.au"
          className="break-all font-semibold underline underline-offset-4"
        >
          hello@thedadclub.com.au
        </a>
        .
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-[#173A2C] px-6 py-4 text-xs font-extrabold text-[#F4F0E5] hover:bg-[#245540]"
      >
        BACK TO THE DAD CLUB →
      </Link>
    </div>
  );
}

export default function JoinPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:px-10 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
              JOIN THE CLUB
            </p>

            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              A NEW CHAPTER.
              <br />
              SOME GOOD COMPANY.
            </h1>

            <p className="mt-7 max-w-lg text-base leading-relaxed text-[#52645A] sm:text-lg">
              Becoming a dad changes how you see yourself, your
              relationships and your place in the world. You
              don&apos;t have to work through those changes alone.
            </p>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#52645A]">
              Register your interest and we&apos;ll be in touch about
              upcoming Dad Club programs.
            </p>

            <div className="mt-9 rounded-[28px] bg-[#173A2C] p-7 text-[#F4F0E5] sm:p-9">
              <p className="text-xs font-extrabold tracking-[0.16em] text-[#D6A17C]">
                A SPACE FOR THE DAD YOU&apos;RE BECOMING
              </p>

              <ul className="mt-6 space-y-5 text-base leading-relaxed">
                <li>Connect with other first-time fathers.</li>
                <li>Talk about adjustment, identity and relationships.</li>
                <li>Make room for your own mental health and wellbeing.</li>
                <li>Share the good, the hard and the unexpected.</li>
              </ul>

              <p className="mt-7 border-t border-[#F4F0E5]/20 pt-6 text-sm leading-relaxed text-[#D8E1D8]">
                Registering interest is free. There&apos;s no payment
                or commitment to join the program.
              </p>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-[#52645A]">
              You don&apos;t need to have the answers. Turning up as
              yourself is a good place to start.
            </p>
          </div>

          <div
            id="registration"
            className="min-w-0 scroll-mt-8 rounded-[28px] border border-[#173A2C]/10 bg-white/50 p-6 sm:p-9"
          >
            <Suspense
              fallback={
                <p className="text-sm text-[#52645A]">
                  Loading registration…
                </p>
              }
            >
              <Registration searchParams={searchParams} />
            </Suspense>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}