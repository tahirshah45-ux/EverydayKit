import { useEffect } from 'react';
import type { ToolFaq } from '../lib/toolsCatalog';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: ToolFaq[];
  webApplication?: {
    name: string;
    description: string;
    applicationCategory: string;
  };
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonicalLink(href: string): void {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function SeoHead({
  title,
  description,
  path,
  breadcrumbs,
  faqs,
  webApplication,
}: SeoHeadProps) {
  useEffect(() => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://everydaykit.app';
    const canonicalUrl = `${origin}${path.startsWith('/') ? path : `/${path}`}`;

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('name', 'twitter:card', 'summary');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setCanonicalLink(canonicalUrl);

    const graph: Record<string, unknown>[] = [];

    if (webApplication) {
      graph.push({
        '@type': 'WebApplication',
        name: webApplication.name,
        description: webApplication.description,
        url: canonicalUrl,
        applicationCategory: webApplication.applicationCategory,
        operatingSystem: 'Any (Web Browser)',
        browserRequirements: 'Requires a modern browser with JavaScript enabled',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      });
    }

    if (breadcrumbs && breadcrumbs.length > 0) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          item: `${origin}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
        })),
      });
    }

    if (faqs && faqs.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      });
    }

    const scriptId = 'ek-structured-data';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (graph.length > 0) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': graph,
      });
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [title, description, path, breadcrumbs, faqs, webApplication]);

  return null;
}
