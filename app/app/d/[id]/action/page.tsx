import { redirect } from "next/navigation";
import { toFileKey } from "@/lib/ids";

/** The action card is now an overlay on the disease page; old links keep working. */
export default async function ActionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ via?: string }> }) {
  const [{ id }, { via }] = await Promise.all([params, searchParams]);
  redirect(via ? `/d/${id}?compare=${toFileKey(decodeURIComponent(via))}` : `/d/${id}`);
}
