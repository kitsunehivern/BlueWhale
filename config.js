import fs from "fs";
import YAML from "yaml";

const config = YAML.parse(fs.readFileSync("./config.yaml", "utf-8"));

export default config;
