import { Suspense } from "react";
import { VenuePage } from "@/components/venue/VenuePage";

export const metadata = { title: "Enter the venue · FrontRow" };

async function Venue({ params }: { params: PageProps<"/show/[id]">["params"] }) {
  const { id } = await params;
  // key: a fresh venue (enter sequence, scroll) per show.
  return <VenuePage key={id} id={id} />;
}

export default function Page({ params }: PageProps<"/show/[id]">) {
  return (
    <Suspense fallback={<div className="h-svh" />}>
      <Venue params={params} />
    </Suspense>
  );
}
