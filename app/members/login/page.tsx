import type { Metadata } from "next";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import MemberLoginForm from "../../../components/MemberLoginForm";

export const metadata: Metadata = {
  title: "Member login | The Dad Club",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MemberLoginPage() {
  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main className="mx-auto max-w-xl px-5 py-16 md:py-24">
        <p className="mb-5 text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
          YOUR DAD CLUB MEMBERSHIP
        </p>

        <div className="rounded-[28px] border border-[#173A2C]/15 bg-white/50 p-6 sm:p-9">
          <MemberLoginForm />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}