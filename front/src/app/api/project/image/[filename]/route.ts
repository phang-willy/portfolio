import { NextResponse } from "next/server";

import {
  getBackendApiUrl,
  PORTFOLIO_DATA_REVALIDATE_SECONDS,
} from "@/lib/api/backend";

const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,200}$/;

type ImageRouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(_request: Request, context: ImageRouteContext) {
  const { filename } = await context.params;
  if (!SAFE_FILENAME.test(filename) || filename.includes("..")) {
    return new NextResponse(null, { status: 404 });
  }

  let backend: string;
  try {
    backend = getBackendApiUrl();
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  let response: Response;
  try {
    response = await fetch(
      `${backend}/api/project/image/${encodeURIComponent(filename)}`,
      { next: { revalidate: PORTFOLIO_DATA_REVALIDATE_SECONDS } },
    );
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  if (!response.ok || !response.body) {
    return new NextResponse(null, {
      status: response.status === 404 ? 404 : 502,
    });
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": `public, max-age=${PORTFOLIO_DATA_REVALIDATE_SECONDS}`,
    },
  });
}
