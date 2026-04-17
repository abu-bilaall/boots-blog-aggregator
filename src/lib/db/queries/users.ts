import { eq } from "drizzle-orm";
import { db } from "..";
import { users } from "../schema";

async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}

async function getUser(name: string) {
  const result = await db.select().from(users).where(eq(users.name, name));
  return result[0];
}

async function getAllUsers() {
  const result = await db.select().from(users);
  const addedUsers = result.map((user) => user.name);
  return addedUsers;
}

async function deleteAllUsers() {
  const result = await db.delete(users);
  return result[1];
}

export { createUser, getUser, getAllUsers, deleteAllUsers };
