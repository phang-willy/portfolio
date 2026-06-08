import {
  ProjectDetailPage,
  generateProjectMetadata,
  generateStaticParams,
} from "@/app/(main)/projects/[id]/project-detail-page";

export { generateStaticParams };

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  return generateProjectMetadata({ ...props, locale: "en" });
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  return <ProjectDetailPage {...props} locale="en" />;
}
