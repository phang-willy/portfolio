"use client";

import { useEffect } from "react";
import { HttpErrorView } from "@/components/http-error-view";

type AppError = Error & { status?: number; statusCode?: number };

function readStatus(error: AppError): number {
  if (
    typeof error.status === "number" &&
    error.status >= 100 &&
    error.status <= 599
  ) {
    return error.status;
  }
  if (
    typeof error.statusCode === "number" &&
    error.statusCode >= 100 &&
    error.statusCode <= 599
  ) {
    return error.statusCode;
  }
  return 500;
}

export default function EnErrorBoundaryPage({ error }: { error: AppError }) {
  const status = readStatus(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <HttpErrorView
      status={status}
      message={error.message || undefined}
      locale="en"
    />
  );
}
