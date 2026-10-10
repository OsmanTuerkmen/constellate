import DiseaseAtlas from "@/components/disease/DiseaseAtlas";
import { toNodeId } from "@/lib/ids";

export default async function DiseasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DiseaseAtlas id={toNodeId(id)} />;
}
