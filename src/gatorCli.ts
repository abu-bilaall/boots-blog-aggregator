import { readConfig, setUser } from "./config";
import {
  createUser,
  getAllUsers,
  deleteAllUsers,
} from "./lib/db/queries/users";

// command registry and its helper functions
type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
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
  console.log("db has been reset");
}

async function handlerUsers(cmdName: string, ...args: string[]) {
  const allUsers = await getAllUsers();
  const currentUser = readConfig().currentUserName;
  const others = allUsers.filter((user) => user !== currentUser);
  console.log(`* ${currentUser} (current)`);
  others.map((user) => console.log(`* ${user}`));
}

// command registers
const registry: CommandsRegisty = {};
registerCommand(registry, "login", handlerLogin);
registerCommand(registry, "register", handlerRegister);
registerCommand(registry, "reset", handlerReset);
registerCommand(registry, "users", handlerUsers);

export { runCommand, registry };
