import { Suspense } from "react";
import type { Metadata } from "next";
import FacilitatorApplications, {
  type ApplicationSearchParams,
} from "../../../components/FacilitatorApplications";

export const metadata: Metadata = {
  title: "Facilitator applications | The Dad Club",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FacilitatorApplicationsPage({
  searchParams,
}: {
  searchParams: ApplicationSearchParams;
}) {
  return (
    <div className="min-h-screen bg-[#F4F0E5]">
      <Suspense
        fallback={
          <main className="mx-auto max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">
            <p role="status" className="text-lg font-bold">
              Loading facilitator applications…
            </p>
          </main>
        }
      >
        <FacilitatorApplications searchParams={searchParams} />
      </Suspense>
    </div>
  );
}