import { db } from "..";
import { feeds } from "../schema";

async function createFeed(feedName: string, feedUrl: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({ name: feedName, url: feedUrl, userId: userId })
    .returning();
  return result;
}

async function deleteAllFeeds() {
  const result = await db.delete(feeds);
  return result[1];
}

export { createFeed, deleteAllFeeds };
