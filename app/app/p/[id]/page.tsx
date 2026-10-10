import SymptomAtlas from "@/components/symptom/SymptomAtlas";
import { toNodeId } from "@/lib/ids";

export default async function SymptomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SymptomAtlas id={toNodeId(id)} />;
}
