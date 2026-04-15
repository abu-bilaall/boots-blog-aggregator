import { XMLParser } from "fast-xml-parser";

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

function isRSSItem(item: unknown): item is RSSItem {
  return (
    typeof item === "object" &&
    item != null &&
    "title" in item &&
    typeof (item as RSSItem).title === "string" &&
    "link" in item &&
    typeof (item as RSSItem).link === "string" &&
    "description" in item &&
    typeof (item as RSSItem).description === "string" &&
    "pubDate" in item &&
    typeof (item as RSSItem).pubDate === "string"
  );
}

function isRSSFeed(feed: unknown): feed is RSSFeed {
  return (
    typeof feed === "object" &&
    feed !== null &&
    "channel" in feed &&
    typeof (feed as RSSFeed).channel === "object"
  );
}

function validateFeedData(feed: unknown) {
  if (!isRSSFeed(feed)) {
    throw new Error("RSSFeed error: feed is not valid RSSFeed data object.");
  }

  if (!(feed.channel.title && typeof feed.channel.title === "string")) {
    throw new Error("RSSFeed error: channel.title is not present/valid.");
  } else if (!(feed.channel.link && typeof feed.channel.link === "string")) {
    throw new Error("RSSFeed error: channel.link is not present/valid.");
  } else if (
    !(feed.channel.description && typeof feed.channel.description === "string")
  ) {
    throw new Error("RSSFeed error: channel.description is not present/valid.");
  }

  const rawItem = (feed.channel as any).item;
  const items: RSSItem[] = Array.isArray(rawItem)
    ? rawItem.filter(isRSSItem)
    : isRSSItem(rawItem)
      ? [rawItem]
      : [];

  return {
    channel: {
      title: feed.channel.title,
      link: feed.channel.link,
      description: feed.channel.description,
      item: items,
    },
  } satisfies RSSFeed;
}

async function fetchFeed(feedURL: string) {
  const response = await fetch(feedURL, { headers: { "User-Agent": "gator" } });
  if (!response.ok) {
    throw new Error(`${response.status} error. Please, try again`);
  }

  const data = await response.text();
  const xmlparser = new XMLParser();
  const { rss } = xmlparser.parse(data);
  const feed = validateFeedData(rss);
  return feed;
}

export { fetchFeed };
