import {
  ProjectDetailPage,
  generateProjectMetadata,
} from "@/app/(main)/projects/[id]/project-detail-page";

// Pas de pré-génération : un rafraîchissement relit Spring. Le JSON reste en cache 300 s en production.
export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  return generateProjectMetadata({ ...props, locale: "fr" });
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  return <ProjectDetailPage {...props} locale="fr" />;
}
