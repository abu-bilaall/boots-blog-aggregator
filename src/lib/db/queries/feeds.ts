import { db } from "..";
import { feeds, users } from "../schema";
import { eq } from "drizzle-orm";

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

async function getAllFeedsWithTheirUsers() {
  const result = await db
    .select({ name: feeds.name, url: feeds.url, user: users.name })
    .from(feeds)
    .innerJoin(users, eq(users.id, feeds.userId));
  
  return result;
}

export { createFeed, deleteAllFeeds, getAllFeedsWithTheirUsers };
