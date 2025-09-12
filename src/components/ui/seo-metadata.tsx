import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { metaConfig } from '@/config/environment';

interface SEOMetadataProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  structuredData?: Record<string, any>;
}

/**
 * Enhanced SEO Metadata Component
 * Automatically updates page metadata for better SEO
 */
export function SEOMetadata({
  title,
  description = metaConfig.description,
  keywords = metaConfig.keywords,
  ogImage = metaConfig.ogImage,
  structuredData
}: SEOMetadataProps) {
  const location = useLocation();
  
  const pageTitle = title ? `${title} - ${metaConfig.title}` : metaConfig.title;
  const canonicalUrl = metaConfig.canonical(location.pathname);

  useEffect(() => {
    // Update title
    document.title = pageTitle;

    // Update meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Open Graph tags
    updateMetaTag('og:title', pageTitle, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', ogImage, 'property');
    updateMetaTag('og:url', canonicalUrl, 'property');
    updateMetaTag('og:type', 'website', 'property');
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:site', metaConfig.twitterHandle, 'name');
    updateMetaTag('twitter:title', pageTitle, 'name');
    updateMetaTag('twitter:description', description, 'name');
    updateMetaTag('twitter:image', ogImage, 'name');
    
    // Canonical URL
    updateLinkTag('canonical', canonicalUrl);
    
    // Structured data
    if (structuredData) {
      updateStructuredData(structuredData);
    }
  }, [pageTitle, description, keywords, ogImage, canonicalUrl, structuredData]);

  return null;
}

function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  element.setAttribute('href', href);
}

function updateStructuredData(data: Record<string, any>) {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}