import { readConfig, setUser } from "./config";
import { fetchFeed } from "./rss";
import { Feed, User } from "lib/db/schema";

import {
  createUser,
  getAllUsers,
  deleteAllUsers,
  getUser,
} from "./lib/db/queries/users";

import {
  createFeed,
  deleteAllFeeds,
  getAllFeedsWithTheirUsers,
  getFeed,
} from "lib/db/queries/feeds";
import {
  createFeedFollow,
  deleteFeedFollow,
  getFeedFollowsForUser,
} from "lib/db/queries/feedFollows";

// command registry and its helper functions
type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;
type CommandsRegisty = Record<string, CommandHandler>;

function registerCommand(
  registry: CommandsRegisty,
  cmdName: string,
  handler: CommandHandler,
) {
  registry[cmdName] = handler;
}

async function runCommand(
  registry: CommandsRegisty,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];
  await handler(cmdName, ...args);
}

function printFeed(feed: Feed, user: User) {
  console.log(`
Feed added successfully!

Feed Details:
-------------
\tName: ${feed.name}
\tURL: ${feed.url}
\tID: ${feed.id}
\tCreated At: ${feed.createdAt.toISOString()}
\tUpdated At: ${feed.updatedAt.toISOString()}

User:
-----
\tName: ${user.name}
\tID: ${user.id}
`);
}

function isHttpUrl(url: string): boolean {
  try {
    const validUrl = new URL(url);
    return validUrl.protocol === "http:" || validUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const userName = readConfig().currentUserName;
    const user = await getUser(userName);
    if (!user) {
      throw new Error(`User ${userName} not found`);
    }

    return await handler(cmdName, user, ...args);
  };
}

// command handlers
async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  const userName = args[0];
  const users = await getAllUsers();
  if (!users.find((user) => user === userName)) {
    throw new Error("user cannot be found");
  }

  setUser(userName);
  console.log(`${userName} logged in and is now the current user.`);
}

async function handlerRegister(cmdName: string, ...args: string[]) {
  if (args.length === 0) {
    throw new Error("username must be specified");
  }

  try {
    const user = await createUser(args[0]);
    setUser(user.name);
    console.log(`${user.name} account has been created.

${user.name} details:
-------------
ID: ${user.id}
Name: ${user.name}
Created At: ${user.createdAt.toISOString()}
Updated At: ${user.updatedAt.toISOString()}
`);
  } catch (error) {
    throw new Error("user has already registered");
  }
}

async function handlerReset(cmdName: string, ...args: string[]) {
  await deleteAllUsers();
  await deleteAllFeeds();
  console.log("db has been reset");
}

async function handlerUsers(cmdName: string, ...args: string[]) {
  const allUsers = await getAllUsers();
  const currentUser = readConfig().currentUserName;
  const others = allUsers.filter((user) => user !== currentUser);
  console.log(`* ${currentUser} (current)`);
  others.map((user) => console.log(`* ${user}`));
}

async function handlerAgg(cmdName: string, ...args: string[]) {
  if (args.length === 0) {
    throw new Error("feed must be specified");
  }

  try {
    const feed = await fetchFeed(args[0]);
    // const feed = await fetchFeed("https://www.wagslane.dev/index.xml");

    const itemsFormatted = feed.channel.item
      .map((item, index) => {
        return `\tItem ${index + 1}:
\t\tTitle: ${item.title}
\t\tDescription: ${item.description}
\t\tLink: ${item.link}`;
      })
      .join("\n\n");

    console.log(`${feed.channel.title} has been fetched successfully.

${feed.channel.title} details:
-------------
Title: ${feed.channel.title}
Description: ${feed.channel.description}
Link: ${feed.channel.link}
Item:
${itemsFormatted}
`);
  } catch (error) {
    throw error;
  }
}

async function handlerAddFeed(cmdName: string, user: User, ...args: string[]) {
  if (args.length < 2) {
    throw new Error("Name and URL of the feed must be specified.");
  }

  const feedName = args[0];
  const feedUrl = args[1];

  if (!isHttpUrl(feedUrl)) {
    throw new Error(
      'Invalid URL. See example: \'addfeed "feed name" "https://gator.cli/"\'',
    );
  }

  try {
    const userId = user.id;
    const feed = await createFeed(feedName, feedUrl, userId);
    const feedId = feed.id;
    await createFeedFollow(userId, feedId);
    printFeed(feed, user);
  } catch (error) {
    console.log(error);
    throw new Error(`${args[0]} has already been added`);
  }
}

async function handlerFeeds() {
  const feedsData = await getAllFeedsWithTheirUsers();
  console.log(
    `We found a total of ${feedsData.length} ${feedsData.length > 1 ? "feeds" : "feed"}...\n`,
  );
  feedsData.forEach((feed, index) => {
    console.log(`Feed #${index + 1}`);
    console.log(`Name: ${feed.name}`);
    console.log(`URL: ${feed.url}`);
    console.log(`User: ${feed.user}`);
    console.log("-------------------");
  });
}

async function handlerFollow(cmdName: string, user: User, ...args: string[]) {
  if (args.length === 0) {
    throw new Error("the url to be followed must be specified");
  }

  const feedUrl = args[0];

  if (!isHttpUrl(feedUrl)) {
    throw new Error("URL is not valid");
  }

  const { id: feedId, name: feedName } = await getFeed(feedUrl);
  const userId = user.id;
  const followInfo = await createFeedFollow(userId, feedId);

  console.log(`Current user: ${user.name}`);
  console.log(`You're now following ${feedName}`);
}

async function handlerUnfollow(cmdName: string, user: User, ...args: string[]) {
  if (args.length === 0) {
    throw new Error("the url to be followed must be specified");
  }

  const feedUrl = args[0];

  if (!isHttpUrl(feedUrl)) {
    throw new Error("URL is not valid");
  }

  try {
    const feedId = (await getFeed(feedUrl)).id;
    const userId = user.id;
    await deleteFeedFollow(userId, feedId);
  } catch (error) {
    throw new Error(`Feed ${feedUrl} does not exist`);
  }
}

async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  const followingFeeds = await getFeedFollowsForUser(user.id);

  console.log(`Current user: ${user.name}`);
  if (followingFeeds.length === 0) {
    console.log(`You are not following any feeds.`);
    return;
  }

  console.log(`You are following ${followingFeeds.length} feed(s):`);
  followingFeeds.forEach((feed, index) => {
    console.log(`${index + 1}. ${feed}`);
  });
}

// command registers
const registry: CommandsRegisty = {};
registerCommand(registry, "login", handlerLogin);
registerCommand(registry, "register", handlerRegister);
registerCommand(registry, "reset", handlerReset);
registerCommand(registry, "users", handlerUsers);
registerCommand(registry, "agg", handlerAgg);
registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
registerCommand(registry, "feeds", handlerFeeds);
registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));

export { runCommand, registry };
