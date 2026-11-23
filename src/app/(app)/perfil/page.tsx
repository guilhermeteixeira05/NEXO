import type { Metadata } from "next";
import { AvailabilityForm, PreferencesForm, ProfileForm } from "@/components/profile/ProfileForms";
import { PageHeader } from "@/components/ui/Misc";
import { getProfile, requireUser } from "@/lib/auth/session";
import { listAvailability } from "@/lib/profile/queries";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const availability = await listAvailability(supabase, user.id);
  const slots = availability.map((a) => ({ weekday: a.weekday, start: a.start_time.slice(0, 5), end: a.end_time.slice(0, 5) }));
  return (
    <>
      <PageHeader title="Perfil" subtitle="Essas informações ajudam o NEXO a personalizar planos e recomendações." />
      <div className="grid-2">
        <div className="stack stack--lg">
          <section className="panel">
            <ProfileForm profile={profile} email={user.email ?? ""} />
          </section>
          <section className="panel">
            <PreferencesForm profile={profile} />
          </section>
        </div>
        <section className="panel" id="disponibilidade" tabIndex={-1}>
          <AvailabilityForm initial={slots} />
        </section>
      </div>
    </>
  );
}
