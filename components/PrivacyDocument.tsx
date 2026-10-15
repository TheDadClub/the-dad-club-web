import Link from "next/link";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

type PrivacySection = {
  title: string;
  paragraphs: string[];
};

type ProviderLink = {
  label: string;
  href: string;
};

type PrivacyDocumentProps = {
  title: string;
  introduction: string;
  sections: PrivacySection[];
  providers?: ProviderLink[];
  notice?: string;
};

export default function PrivacyDocument({
  title,
  introduction,
  sections,
  providers = [],
  notice,
}: PrivacyDocumentProps) {
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
          {title}
        </h1>

        <p className="mt-4 text-sm text-[#52645A]">
          Last updated: 15 October 2026
        </p>

        <p className="mt-7 text-lg leading-relaxed text-[#52645A]">
          {introduction}
        </p>

        {notice && (
          <p className="mt-7 rounded-2xl bg-[#E8EBDD] p-6 text-sm leading-relaxed">
            {notice}
          </p>
        )}

        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-black tracking-tight">
                {section.title}
              </h2>

              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 leading-relaxed text-[#52645A]"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        {providers.length > 0 && (
          <section className="mt-10 rounded-[28px] bg-[#E8EBDD] p-7">
            <h2 className="text-xl font-black">
              Service provider privacy information
            </h2>

            <ul className="mt-5 space-y-4 text-sm font-semibold">
              {providers.map((provider) => (
                <li key={provider.href}>
                  <a
                    href={provider.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    {provider.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 border-t border-[#173A2C]/15 pt-7">
          <h2 className="text-xl font-black">Contact us</h2>
          <p className="mt-3 text-sm text-[#52645A]">
            Peter Mann, trading as The Dad Club
          </p>
          <a
            href="mailto:hello@thedadclub.com.au"
            className="mt-3 inline-block break-all font-semibold underline underline-offset-4"
          >
            hello@thedadclub.com.au
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}