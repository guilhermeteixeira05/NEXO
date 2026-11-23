import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/layout/PublicShell";
import { OnboardingWizard } from "@/components/profile/OnboardingWizard";
import { getProfile, requireUser } from "@/lib/auth/session";
import { listAvailability } from "@/lib/profile/queries";

export const metadata: Metadata = { title: "Configuração inicial" };

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  if (profile.onboarding_completed) redirect("/painel");
  const availability = await listAvailability(supabase, user.id);
  const initial =
    availability.length > 0
      ? availability.map((a) => ({ weekday: a.weekday, start: a.start_time.slice(0, 5), end: a.end_time.slice(0, 5) }))
      : [1, 2, 3, 4, 5].map((wd) => ({ weekday: wd, start: "19:00", end: "22:00" }));
  return (
    <PublicShell showAuthLinks={false}>
      <OnboardingWizard defaultName={profile.full_name} initialSlots={initial} />
    </PublicShell>
  );
}
