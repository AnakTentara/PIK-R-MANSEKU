import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'PIK-R MANSEKU — Pusat Informasi & Konseling Remaja (PIK Remaja) MAN 1 Muara Enim';
const DEFAULT_DESC = 'Pusat Informasi & Konseling Remaja (PIK-R MANSEKU) MAN 1 Muara Enim. Wadah konseling sebaya yang aman di Muara Enim, mengedukasi tentang kesehatan reproduksi, life skills, dan GenRe.';
const DEFAULT_KEYWORDS = 'PIK-R, PIK MAN, PIK, PIK-R MAN, PIK-R MUARA ENIM, MUARA ENIM, KONSELING, KONSELING MUARA ENIM, MANSEKU, PIK MANSEKU, PIK Remaja, Konseling Remaja Muara Enim, MAN 1 Muara Enim, Pusat Informasi Konseling Remaja, GenRe';
const DEFAULT_IMAGE = '/media/logos/logo_pik-r.png';
const BASE_URL = 'https://pikr-manseku.my.id';

/**
 * SEO Component to dynamically manage page-level metadata.
 * Can take raw HTML content for blogs and extract description/images automatically.
 */
export default function SEO({ title, description, keywords, image, type = 'website' }) {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Process Title
    const finalTitle = title ? `${title} | PIK-R MANSEKU` : DEFAULT_TITLE;
    document.title = finalTitle;

    // Helper to get or create meta tag in head
    const updateMetaTag = (attributeName, attributeValue, contentValue) => {
      if (contentValue === undefined || contentValue === null) return;
      let tag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attributeName, attributeValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', contentValue);
    };

    // Helper to get or create link tag in head
    const updateLinkTag = (rel, hrefValue) => {
      if (!hrefValue) return;
      let tag = document.querySelector(`link[rel="${rel}"]`);
      if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
      }
      tag.setAttribute('href', hrefValue);
    };

    // Helper to clean HTML string into a descriptive text
    const getCleanDescription = (raw) => {
      if (!raw) return DEFAULT_DESC;
      // If it looks like HTML, strip tags
      if (/<[a-z][\s\S]*>/i.test(raw)) {
        const clean = raw.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
        return clean.substring(0, 160) + (clean.length > 160 ? '...' : '');
      }
      return raw.substring(0, 160) + (raw.length > 160 ? '...' : '');
    };

    // Helper to find the first image URL inside HTML content
    const getFirstImageFromHtml = (rawHtml) => {
      if (!rawHtml) return null;
      const imgReg = /<img[^>]+src="([^">]+)"/i;
      const match = imgReg.exec(rawHtml);
      return match ? match[1] : null;
    };

    // 2. Process Description
    const finalDesc = getCleanDescription(description);

    // 3. Process Keywords
    const finalKeywords = keywords || DEFAULT_KEYWORDS;

    // 4. Process Image (extract from content HTML or use custom image or default logo)
    let processedImage = image;
    if (!processedImage && description) {
      processedImage = getFirstImageFromHtml(description);
    }
    if (!processedImage) {
      processedImage = DEFAULT_IMAGE;
    }

    // Ensure image is absolute
    const finalImage = processedImage.startsWith('http') 
      ? processedImage 
      : `${BASE_URL}${processedImage}`;

    // 5. Process canonical URL
    const finalUrl = `${BASE_URL}${pathname}`;

    // 6. Update Meta Tags
    updateMetaTag('name', 'description', finalDesc);
    updateMetaTag('name', 'keywords', finalKeywords);
    updateMetaTag('name', 'author', 'PIK-R MANSEKU');

    // OpenGraph Tags
    updateMetaTag('property', 'og:title', finalTitle);
    updateMetaTag('property', 'og:description', finalDesc);
    updateMetaTag('property', 'og:image', finalImage);
    updateMetaTag('property', 'og:url', finalUrl);
    updateMetaTag('property', 'og:type', type);
    updateMetaTag('property', 'og:site_name', 'PIK-R MANSEKU');
    updateMetaTag('property', 'og:locale', 'id_ID');

    // Twitter Card Tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', finalTitle);
    updateMetaTag('name', 'twitter:description', finalDesc);
    updateMetaTag('name', 'twitter:image', finalImage);

    // Canonical Tag
    updateLinkTag('canonical', finalUrl);

    // Dynamic JSON-LD Structured Data for rich search results
    let schemaScript = document.getElementById('jsonld-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'jsonld-schema';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    const schemaContent = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "PIK-R MANSEKU (Pusat Informasi & Konseling Remaja MAN 1 Muara Enim)",
      "alternateName": [
        "PIK-R MANSEKU",
        "PIK-R MAN 1 Muara Enim",
        "PIK MANSEKU",
        "PIK MAN",
        "PIK-R",
        "PIK-R MUARA ENIM",
        "KONSELING MUARA ENIM",
        "PIK Remaja Muara Enim"
      ],
      "description": finalDesc,
      "url": BASE_URL,
      "logo": `${BASE_URL}${DEFAULT_IMAGE}`,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Muara Enim",
        "addressRegion": "Sumatera Selatan",
        "addressCountry": "ID"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "areaServed": "ID"
      }
    };
    schemaScript.innerHTML = JSON.stringify(schemaContent);

  }, [title, description, keywords, image, type, pathname]);

  return null;
}
