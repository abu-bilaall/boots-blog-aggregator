import { db } from "..";
import { feeds, users, feedFollows } from "../schema";
import { and, eq } from "drizzle-orm";

async function createFeedFollow(userId: string, feedId: string) {
  const [newFeedFollow] = await db
    .insert(feedFollows)
    .values({ userId, feedId })
    .returning();

  const result = await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updateAt,
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feeds.id, newFeedFollow.id))
    .innerJoin(users, eq(users.id, newFeedFollow.userId));

  return result;
}

async function deleteFeedFollow(userId: string, feedId: string) {
  await db.delete(feedFollows).where(eq(feedFollows.feedId, feedId));
}

async function getFeedFollowsForUser(userId: string) {
  const result = await db
    .select({
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feeds.id, feedFollows.feedId))
    .innerJoin(users, eq(users.id, feedFollows.userId))
    .where(eq(feedFollows.userId, userId));

  return result.map((info) => info.feedName);
}

export { createFeedFollow, getFeedFollowsForUser, deleteFeedFollow };
