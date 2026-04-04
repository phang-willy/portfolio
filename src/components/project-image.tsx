"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PROJECT_IMAGE_FALLBACK_PATH } from "@/lib/project-image";

type ProjectImageBase = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

type ProjectImageFill = ProjectImageBase & {
  fill: true;
  sizes: string;
};

type ProjectImageFixed = ProjectImageBase & {
  fill?: false;
  width: number;
  height: number;
  loading?: "lazy" | "eager";
};

export type ProjectImageProps = ProjectImageFill | ProjectImageFixed;

export function ProjectImage(props: ProjectImageProps) {
  const { src, alt, className, priority } = props;
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const handleError = () => {
    setCurrentSrc((prev) =>
      prev === PROJECT_IMAGE_FALLBACK_PATH ? prev : PROJECT_IMAGE_FALLBACK_PATH,
    );
  };

  if (props.fill) {
    return (
      <Image
        src={currentSrc}
        alt={alt}
        fill
        sizes={props.sizes}
        priority={priority}
        className={className}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={props.width}
      height={props.height}
      loading={props.loading}
      priority={priority}
      className={className}
      onError={handleError}
    />
  );
}
