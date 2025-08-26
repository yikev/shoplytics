// app/insights/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ForecastSpark from "@/components/ForecastSpark";
import SegmentsCard from "@/components/SegmentsCard"; // ✅ NOTE: SegmentsCard, not SegmentsPie
import { Grid, GridCol, Title, Space } from "@mantine/core";

export default async function InsightsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <Title order={2}>Insights</Title>
      <Space h="md" />
      <Grid>
        <GridCol span={{ base: 12, md: 8 }}>
          <ForecastSpark />
        </GridCol>
        <GridCol span={{ base: 12, md: 4 }}>
          <SegmentsCard />
        </GridCol>
      </Grid>
    </>
  );
}