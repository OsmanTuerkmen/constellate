"use client";

import { useRouter } from "next/navigation";
import { restartTour } from "./Tour";

export default function RestartTour() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        restartTour();
        router.push("/d/MONDO_0009499?tour=1");
      }}
      className="inline-flex h-10 items-center rounded-full border border-line px-4 text-[15px] font-medium hover:bg-surface-2"
    >
      Restart the tour
    </button>
  );
}
