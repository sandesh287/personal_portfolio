import { useEffect } from "react";

import { env } from "@/config/env";

interface SeoMetadataProps {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  siteName?: string;
  jsonLd?: Record<string, unknown>;
}

export function SeoMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  siteName = env.VITE_APP_NAME,
  jsonLd,
}: SeoMetadataProps) {
  useEffect(() => {
    const canonicalUrl = new URL(path, env.VITE_SITE_URL).toString();
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:site_name", siteName);
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setOptionalMeta("property", "og:image", image);
    setOptionalMeta("name", "twitter:image", image);
    setCanonical(canonicalUrl);
    setJsonLd(jsonLd);

    return () => setJsonLd(undefined);
  }, [description, image, jsonLd, path, siteName, title, type]);

  return null;
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

function setOptionalMeta(attribute: "name" | "property", key: string, content?: string | null) {
  if (content) {
    setMeta(attribute, key, content);
    return;
  }
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.append(element);
  }
  element.href = href;
}

function setJsonLd(value?: Record<string, unknown>) {
  const id = "portfolio-structured-data";
  document.getElementById(id)?.remove();
  if (!value) return;
  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.text = JSON.stringify(value).replace(/</g, "\\u003c");
  document.head.append(script);
}
