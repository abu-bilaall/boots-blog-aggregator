import os from "node:os";
import path from "node:path";
import fs from "node:fs";

type GatorConfig = {
  dbUrl: string;
  currentUserName: string;
};

function setUser(user: string): void {
  const cfg = readConfig();
  const config = {
    db_url: cfg.dbUrl,
    current_username: user,
  };

  fs.writeFileSync(getConfigFilePath(), JSON.stringify(config), "utf-8");
}

function getConfigFilePath(): string {
  const home = os.homedir();
  return path.join(home, ".gatorconfig.json");
}

function validateConfig(rawConfig: any): GatorConfig {
  if (!(typeof rawConfig === "object" && rawConfig !== null)) {
    throw new Error("not valid config");
  }

  if (
    !(
      typeof rawConfig.db_url === "string" &&
      typeof rawConfig.current_username === "string"
    )
  ) {
    throw new Error("db_url or current_username is not valid");
  }

  const dbUrl: string = rawConfig.db_url;
  const currentUserName: string = rawConfig.current_username;
  return { dbUrl, currentUserName };
}

function readConfig(): GatorConfig {
  const configFile = getConfigFilePath();
  const configJSON = fs.readFileSync(configFile, "utf-8");

  const configContent = validateConfig(JSON.parse(configJSON));
  return configContent;
}

export { setUser, readConfig };
