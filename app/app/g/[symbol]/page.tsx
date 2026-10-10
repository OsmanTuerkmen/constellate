import GeneAtlas from "@/components/gene/GeneAtlas";

export default async function GenePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <GeneAtlas symbol={decodeURIComponent(symbol)} />;
}
