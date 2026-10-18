import {
  LegalsPage,
  buildLegalsMetadata,
} from "@/app/(main)/legals/legals-page";

export const metadata = buildLegalsMetadata("en");

export default function Page() {
  return <LegalsPage locale="en" />;
}
