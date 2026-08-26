import type { CSSProperties } from "react";

interface ResponsiveCloudinaryImageOptions {
  widths: readonly number[];
  sizes: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  placeholderUrl?: string | null;
  placeholderFit?: CSSProperties["backgroundSize"];
}

interface ResponsiveImageAttributes {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
}

const CLOUDINARY_HOSTNAME = "res.cloudinary.com";
const IMAGE_UPLOAD_PATH = "/image/upload/";

export function getResponsiveImageAttributes(
  sourceUrl: string,
  options: ResponsiveCloudinaryImageOptions,
): ResponsiveImageAttributes {
  const widths = [...new Set(options.widths)]
    .filter((width) => Number.isInteger(width) && width > 0)
    .sort((first, second) => first - second);

  const metadataAttributes = getImageMetadataAttributes(sourceUrl, options);

  if (!isCloudinaryImageUrl(sourceUrl) || widths.length === 0) {
    return { src: sourceUrl, ...metadataAttributes };
  }

  const largestWidth = widths.at(-1);
  if (largestWidth === undefined) {
    return { src: sourceUrl, ...metadataAttributes };
  }

  return {
    src: buildCloudinaryImageUrl(sourceUrl, largestWidth),
    srcSet: widths
      .map((width) => `${buildCloudinaryImageUrl(sourceUrl, width)} ${width}w`)
      .join(", "),
    sizes: options.sizes,
    ...metadataAttributes,
  };
}

function getImageMetadataAttributes(
  sourceUrl: string,
  options: ResponsiveCloudinaryImageOptions,
): Pick<ResponsiveImageAttributes, "width" | "height" | "style"> {
  const hasDimensions =
    Number.isInteger(options.imageWidth) &&
    Number.isInteger(options.imageHeight) &&
    Number(options.imageWidth) > 0 &&
    Number(options.imageHeight) > 0;
  const placeholderUrl =
    options.placeholderUrl ??
    (isCloudinaryImageUrl(sourceUrl) ? buildCloudinaryPlaceholderUrl(sourceUrl) : null);

  return {
    ...(hasDimensions
      ? { width: Number(options.imageWidth), height: Number(options.imageHeight) }
      : {}),
    ...(placeholderUrl
      ? {
          style: {
            backgroundImage: `url("${placeholderUrl}")`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: options.placeholderFit ?? "cover",
          },
        }
      : {}),
  };
}

function buildCloudinaryPlaceholderUrl(sourceUrl: string): string {
  const url = new URL(sourceUrl);
  const uploadPathIndex = url.pathname.indexOf(IMAGE_UPLOAD_PATH);
  const assetPath = url.pathname.slice(uploadPathIndex + IMAGE_UPLOAD_PATH.length);
  const transformation = "c_limit,w_32/e_blur:1000/f_auto/q_auto:low";
  url.pathname = `${url.pathname.slice(0, uploadPathIndex)}${IMAGE_UPLOAD_PATH}${transformation}/${assetPath}`;
  return url.toString();
}

export function isCloudinaryImageUrl(sourceUrl: string): boolean {
  try {
    const url = new URL(sourceUrl);
    return url.hostname === CLOUDINARY_HOSTNAME && url.pathname.includes(IMAGE_UPLOAD_PATH);
  } catch {
    return false;
  }
}

function buildCloudinaryImageUrl(sourceUrl: string, width: number): string {
  const url = new URL(sourceUrl);
  const uploadPathIndex = url.pathname.indexOf(IMAGE_UPLOAD_PATH);
  const assetPath = url.pathname.slice(uploadPathIndex + IMAGE_UPLOAD_PATH.length);
  const transformation = `c_limit,w_${width}/f_auto/q_auto`;
  url.pathname = `${url.pathname.slice(0, uploadPathIndex)}${IMAGE_UPLOAD_PATH}${transformation}/${assetPath}`;
  return url.toString();
}
