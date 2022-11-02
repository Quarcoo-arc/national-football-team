import sqlite3 from "sqlite3";
import mkdirp from "mkdirp";
import crypto from "crypto";

mkdirp.sync("./var/db");

let db = new sqlite3.Database("./var/db/users.db");

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users ( \
    id INTEGER PRIMARY KEY, \
    username TEXT UNIQUE, \
    hashed_password BLOB, \
    salt BLOB \
  )"
  );
  // create an initial user (username: alice, password: letmein)
  let salt = crypto.randomBytes(16);
  db.run(
    "INSERT OR IGNORE INTO users (username, hashed_password, salt) VALUES (?, ?, ?)",
    ["alice", crypto.pbkdf2Sync("letmein", salt, 310000, 32, "sha256"), salt]
  );
});

export default db;
