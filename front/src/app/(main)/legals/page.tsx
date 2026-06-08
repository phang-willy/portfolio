import {
  LegalsPage,
  buildLegalsMetadata,
} from "@/app/(main)/legals/legals-page";

export const metadata = buildLegalsMetadata("fr");

export default function Page() {
  return <LegalsPage locale="fr" />;
}
