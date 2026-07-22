import { argv } from "node:process";
import { runCommand, registry } from "./gatorCli";

async function main() {
  const validArgs = argv.slice(2);
  if (validArgs.length === 0) {
    console.log("No command was provided.");
    process.exit(1);
  }

  const [cmdName, ...args] = validArgs;
  try {
    await runCommand(registry, cmdName, ...args);
  } catch (error) {
    console.log((error as Error).message);
    process.exit(1);
  }

  process.exit(0);
}

main();
