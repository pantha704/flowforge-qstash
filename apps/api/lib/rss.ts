/**
 * Minimal RSS/Atom/JSON Feed parser (no extra deps).
 * Good enough for demos and common public feeds.
 */

export type FeedItem = {
  guid: string;
  title: string;
  link: string;
  description: string;
  publishedAt?: string;
};

function stripCdata(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? stripCdata(m[1] || "") : "";
}

function attrValue(block: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*/?>`, "i");
  const m = block.match(re);
  return m?.[1] || "";
}

export function parseFeed(body: string, contentType = ""): FeedItem[] {
  const trimmed = body.trim();

  // JSON Feed
  if (
    contentType.includes("json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[")
  ) {
    try {
      const data = JSON.parse(trimmed);
      const items = Array.isArray(data) ? data : data.items || data.entries || [];
      return (items as Record<string, unknown>[]).map((item, i) => {
        const title = String(item.title || item.name || `Item ${i + 1}`);
        const link = String(item.url || item.link || item.permalink || "");
        const guid = String(item.id || item.guid || link || title);
        const description = String(
          item.summary || item.content_text || item.content_html || item.description || ""
        ).slice(0, 2000);
        return {
          guid,
          title,
          link,
          description: stripCdata(description),
          publishedAt: item.date_published
            ? String(item.date_published)
            : item.published
              ? String(item.published)
              : undefined,
        };
      });
    } catch {
      // fall through to XML
    }
  }

  // RSS <item>
  const rssItems = body.match(/<item[\s\S]*?<\/item>/gi) || [];
  if (rssItems.length > 0) {
    return rssItems.map((block, i) => {
      const title = tagValue(block, "title") || `Item ${i + 1}`;
      const link = tagValue(block, "link") || attrValue(block, "link", "href");
      const guid = tagValue(block, "guid") || link || title;
      const description =
        tagValue(block, "description") ||
        tagValue(block, "content:encoded") ||
        "";
      const publishedAt = tagValue(block, "pubDate") || undefined;
      return { guid, title, link, description, publishedAt };
    });
  }

  // Atom <entry>
  const atomEntries = body.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  return atomEntries.map((block, i) => {
    const title = tagValue(block, "title") || `Entry ${i + 1}`;
    const link = attrValue(block, "link", "href") || tagValue(block, "link");
    const guid = tagValue(block, "id") || link || title;
    const description =
      tagValue(block, "summary") || tagValue(block, "content") || "";
    const publishedAt =
      tagValue(block, "updated") || tagValue(block, "published") || undefined;
    return { guid, title, link, description, publishedAt };
  });
}

export async function fetchFeedItems(feedUrl: string): Promise<FeedItem[]> {
  const res = await fetch(feedUrl, {
    headers: {
      "User-Agent": "FlowForgeRSS/1.0 (+https://github.com/pantha704/flowforge-qstash)",
      Accept: "application/rss+xml, application/atom+xml, application/json, application/xml, text/xml, */*",
    },
    // Avoid hanging free serverless
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    throw new Error(`Feed fetch failed: HTTP ${res.status}`);
  }
  const text = await res.text();
  return parseFeed(text, res.headers.get("content-type") || "");
}
