import { posts } from "../schema";
import { db } from "..";

async function createPost(
  title: string,
  url: string,
  feedId: string,
  description: string | null = null,
  publishedAt: string | null = null,
) {
  /***
   * Create a createPost function. This should insert a new post into the database.
   */
  const [result] = await db
    .insert(posts)
    .values({
      title,
      url,
      feedId,
      description,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    })
    .returning();

  return result;
}
