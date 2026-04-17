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
  await db.delete(feeds);
}

async function getAllFeedsWithTheirUsers() {
  const result = await db
    .select({ name: feeds.name, url: feeds.url, user: users.name })
    .from(feeds)
    .innerJoin(users, eq(users.id, feeds.userId));

  return result;
}

async function getFeed(feedUrl: string) {
  const result = await db.select().from(feeds).where(eq(feeds.url, feedUrl));
  return result[0];
}

export { createFeed, deleteAllFeeds, getAllFeedsWithTheirUsers, getFeed };
