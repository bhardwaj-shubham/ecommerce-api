import { config } from "../config/config.js";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  config.get("DB"),
  config.get("USER"),
  config.get("PASSWORD"),
  {
    host: config.get("HOST"),
    dialect: config.get("dialect"),
    port: config.get("port"),
    pool: config.get("pool"),
  }
);

// Database Sync
sequelize
  .sync()
  .then((r) => console.log("Database synced"))
  .catch((e) => console.log("Database could not connect", e.message));

export { sequelize };
