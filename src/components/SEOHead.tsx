import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  noIndex?: boolean;
}

const SEOHead = ({
  title,
  description,
  keywords,
  canonicalPath = "",
  ogImage = "https://storage.googleapis.com/gpt-engineer-file-uploads/GRBPgZNXXsa9fdf0PCKCvi4Cwzg2/social-images/social-1759524138247-companylogo2.PNG",
  ogType = "website",
  noIndex = false,
}: SEOHeadProps) => {
  const baseUrl = "https://stellarcdynamics.com";
  const fullUrl = `${baseUrl}${canonicalPath}`;
  const fullTitle = `${title} | Stellarc Dynamics`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Primary meta tags
    updateMetaTag("description", description);
    if (keywords) {
      updateMetaTag("keywords", keywords);
    }
    if (noIndex) {
      updateMetaTag("robots", "noindex, nofollow");
    } else {
      updateMetaTag("robots", "index, follow");
    }

    // Open Graph
    updateMetaTag("og:title", fullTitle, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:url", fullUrl, true);
    updateMetaTag("og:type", ogType, true);
    updateMetaTag("og:image", ogImage, true);

    // Twitter
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", ogImage);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);

    // Cleanup function not needed as we want tags to persist
  }, [fullTitle, description, keywords, fullUrl, ogImage, ogType, noIndex]);

  return null;
};

export default SEOHead;
