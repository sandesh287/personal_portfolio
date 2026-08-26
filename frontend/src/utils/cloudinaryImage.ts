interface ResponsiveCloudinaryImageOptions {
  widths: readonly number[];
  sizes: string;
}

interface ResponsiveImageAttributes {
  src: string;
  srcSet?: string;
  sizes?: string;
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

  if (!isCloudinaryImageUrl(sourceUrl) || widths.length === 0) {
    return { src: sourceUrl };
  }

  const largestWidth = widths.at(-1);
  if (largestWidth === undefined) {
    return { src: sourceUrl };
  }

  return {
    src: buildCloudinaryImageUrl(sourceUrl, largestWidth),
    srcSet: widths
      .map((width) => `${buildCloudinaryImageUrl(sourceUrl, width)} ${width}w`)
      .join(", "),
    sizes: options.sizes,
  };
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
