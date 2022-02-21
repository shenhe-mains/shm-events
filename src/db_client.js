import pg from "pg";
import { config } from "./config.js";

export const db = new pg.Client(config.db_options);
