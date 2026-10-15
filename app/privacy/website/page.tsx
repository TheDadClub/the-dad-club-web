import Link from "next/link";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";

const sections = [
  {
    title: "What this notice covers",
    paragraphs: [
      "This notice describes registrations of interest and enquiries through The Dad Club website. The mobile app has separate privacy information.",
      "Bookings, payments and member accounts are not currently available through the website. This notice will be updated before those features collect information.",
    ],
  },
  {
    title: "Information you provide",
    paragraphs: [
      "When you register your interest, we collect your name, email address, suburb or town, stage of fatherhood and any optional message you provide.",
      "We record when your registration was created, your agreement to be contacted and the version of the contact consent wording.",
      "We also record the status of the confirmation email and, when applicable, the time our email provider accepted it for sending. This does not prove delivery to your inbox.",
      "If you email us, we receive your email address and the information you include in your message. Please avoid including sensitive personal or health information in the interest form.",
    ],
  },
  {
    title: "How we use your information",
    paragraphs: [
      "We use your details to manage your registration, send a confirmation, respond to enquiries and contact you about upcoming Dad Club programs.",
      "Your suburb or town helps us understand where people are interested in attending. Your stage of fatherhood helps us identify potentially relevant program options.",
      "Required fields allow us to process your registration. The message field is optional. You can browse the website without registering.",
    ],
  },
  {
    title: "Where registrations are stored",
    paragraphs: [
      "Registrations are stored in a Supabase database configured in the Sydney region. The website sends your form details through its server to that database.",
      "Choosing Sydney for the database does not mean all service providers process every type of information exclusively in Australia. Email delivery, security verification, support and operational services may involve overseas processing.",
      "Final hosting arrangements and relevant provider processing locations will be confirmed in this notice before public launch.",
    ],
  },
  {
    title: "Who can access registrations",
    paragraphs: [
      "The registration table is configured to block direct access by public website visitors. Administrative access is available through the project dashboard and authorised server credentials.",
      "Supabase processes information to provide the database service. People authorised to manage The Dad Club registrations may access details for that purpose.",
      "Registration details are not displayed publicly on the website.",
    ],
  },
  {
    title: "Confirmation emails through Resend",
    paragraphs: [
      "We use Resend to send an automatic confirmation after a new registration is saved.",
      "Our current email integration sends Resend your email address and the confirmation message. It does not include your name, suburb or town, stage of fatherhood or optional form message.",
      "The request also includes a technical identifier linked to the registration, used to help prevent duplicate email requests.",
      "Resend processes the recipient address, message content and sending information to provide email delivery. Delivery records may include acceptance, delivery, delay, bounce or complaint events.",
      "A confirmation email is not a booking confirmation. Replies are directed to hello@thedadclub.com.au and handled through our existing mailbox provider.",
      "Resend's privacy policy and data processing information are linked below.",
    ],
  },
  {
    title: "Spam prevention with Cloudflare Turnstile",
    paragraphs: [
      "The registration form uses Cloudflare Turnstile to help identify automated submissions. Your browser connects to Cloudflare to complete verification.",
      "Cloudflare processes technical information associated with the check, which may include your IP address, browser and device information and signals used to assess automated activity.",
      "The website sends the resulting verification token to Cloudflare for server-side validation before saving a registration. Our verification request does not include the personal details entered in the form.",
      "Further information is available in Cloudflare's privacy policy, linked below.",
    ],
  },
  {
    title: "Cookies, tracking and technical information",
    paragraphs: [
      "The registration feature does not add advertising trackers or website analytics cookies.",
      "Cloudflare's verification service processes technical information as described above. Email tracking settings will be checked and documented before public launch.",
      "Website requests include technical information such as IP addresses and browser information. Infrastructure logging and retention depend on the final hosting configuration and will be documented before public launch.",
    ],
  },
  {
    title: "Contact preferences",
    paragraphs: [
      "The form asks for your agreement to be contacted about your enquiry and upcoming programs. Registering interest does not book a place or commit you to a payment.",
      "You can withdraw your interest or ask us to stop contacting you by replying to our email or contacting hello@thedadclub.com.au.",
    ],
  },
  {
    title: "Retention and deletion",
    paragraphs: [
      "We retain registration information while managing your interest and related correspondence. A routine retention and deletion schedule will be confirmed before public launch.",
      "Email providers retain messages and operational records according to their service settings and retention arrangements. Removing a registration from our database does not automatically remove every copy held in email systems or backups.",
      "You can request deletion of your registration. We will explain any information that needs to be retained and applicable limitations.",
    ],
  },
  {
    title: "Access and corrections",
    paragraphs: [
      "You can ask to access or correct your registration details by emailing hello@thedadclub.com.au.",
      "We may need to verify your identity before providing information or making changes. Please provide only the information needed to explain your request.",
    ],
  },
  {
    title: "Privacy questions or complaints",
    paragraphs: [
      "If you have a concern about how your information has been handled, contact hello@thedadclub.com.au with a description of the issue.",
      "We will review your concern, respond and discuss appropriate next steps.",
    ],
  },
  {
    title: "Separate from app data and research",
    paragraphs: [
      "The website interest form does not access the profiles, dates, check-ins or saved cards stored locally by The Dad Club app.",
      "Registering interest does not enrol you in research. Any future research participation would require a separate process, appropriate ethics review, clear information and explicit informed consent.",
    ],
  },
  {
    title: "Changes to this notice",
    paragraphs: [
      "We will update this notice as website features and service arrangements change. The revision date appears at the top of this page.",
    ],
  },
];

const providers = [
  {
    label: "Supabase Privacy Policy",
    href: "https://supabase.com/privacy",
  },
  {
    label: "Cloudflare Privacy Policy",
    href: "https://www.cloudflare.com/privacypolicy/",
  },
  {
    label: "Resend Privacy Policy",
    href: "https://resend.com/legal/privacy-policy",
  },
  {
    label: "Resend Data Processing Addendum",
    href: "https://resend.com/legal/dpa",
  },
];

export default function WebsitePrivacyPage() {
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
          WEBSITE PRIVACY
        </h1>

        <p className="mt-4 text-sm text-[#52645A]">
          Development draft · Updated 15 October 2026
        </p>

        <div className="mt-8 rounded-2xl bg-[#E8EBDD] p-6 text-sm leading-relaxed">
          This notice describes the website currently being tested.
          Legal operator details, final hosting and mailbox provider
          arrangements, provider processing locations, email tracking
          settings and the retention schedule will be confirmed before
          public launch.
        </div>

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

        <section className="mt-10 rounded-[28px] bg-[#E8EBDD] p-7">
          <h2 className="text-xl font-black">
            Provider privacy information
          </h2>

          <ul className="mt-4 space-y-4 text-sm font-semibold">
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

        <a
          href="mailto:hello@thedadclub.com.au"
          className="mt-10 inline-block break-all font-semibold underline underline-offset-4"
        >
          hello@thedadclub.com.au
        </a>
      </main>

      <SiteFooter />
    </div>
  );
}