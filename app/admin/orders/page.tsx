import type { Metadata } from "next";
import { Suspense } from "react";
import PurchaseOrders, {
  type OrderSearchParams,
} from "../../../components/PurchaseOrders";

export const metadata: Metadata = {
  title: "Orders | The Dad Club Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersPage({
  searchParams,
}: {
  searchParams: OrderSearchParams;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F0E5] px-5 py-10 text-[#173A2C] md:px-10">
          <p className="mx-auto max-w-6xl font-bold">
            Loading orders…
          </p>
        </main>
      }
    >
      <PurchaseOrders searchParams={searchParams} />
    </Suspense>
  );
}