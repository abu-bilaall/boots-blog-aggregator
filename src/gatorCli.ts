import { setUser } from "./config";

// command registry and its helper functions
type CommandHandler = (cmdName: string, ...args: string[]) => void;
type CommandsRegisty = Record<string, CommandHandler>;

function registerCommand(
  registry: CommandsRegisty,
  cmdName: string,
  handler: CommandHandler,
) {
  registry[cmdName] = handler;
}

function runCommad(
  registry: CommandsRegisty,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];
  handler(cmdName, ...args);
}

// command handlers
function handlerLogin(cmdName: string, ...args: string[]): void {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  const userName = args[0];
  setUser(userName);
  console.log(`${userName} has been set as the username.`);
}

// command registers
const registry: CommandsRegisty = {};
registerCommand(registry, "login", handlerLogin);

export { runCommad, registry};
