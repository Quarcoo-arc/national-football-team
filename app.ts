import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose, { Schema, model } from "mongoose";
import passport from "passport";
import session from "express-session";
import connect_ensure_login from "connect-ensure-login";
import connect_sqlite3 from "connect-sqlite3";
import LocalStrategy from "passport-local";
import crypto from "crypto";
import db from "./db";

const SQLiteStore = connect_sqlite3(session);

const ensureLogIn = connect_ensure_login.ensureLoggedIn;

const ensureLoggedIn = ensureLogIn();

dotenv.config();

mongoose.connect(`mongodb://localhost:27017/ghana_black_stars`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const mogo_db = mongoose.connection;

const playerSchema = new Schema({
  name: String,
  age: Number,
  plays_abroad: Boolean,
  club: String,
  is_captain: Boolean,
  jersey_number: Number,
  position_of_play: String,
});

const Player = model("Player", playerSchema);

const app: Express = express();
const port = process.env.PORT;

app.use(bodyParser.json());

passport.use(
  new LocalStrategy(function verify(
    username: string,
    password: string,
    cb: Function
  ) {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      function (err, row) {
        if (err) {
          return cb(err);
        }
        if (!row) {
          return cb(null, false, {
            message: "Incorrect username or password.",
          });
        }

        crypto.pbkdf2(
          password,
          row.salt,
          310000,
          32,
          "sha256",
          function (err, hashedPassword) {
            if (err) {
              return cb(err);
            }
            if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
              return cb(null, false, {
                message: "Incorrect username or password.",
              });
            }
            return cb(null, row);
          }
        );
      }
    );
  })
);

app.use(passport.initialize());

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: "sessions.db", dir: "./var/db" }),
  })
);

app.use(passport.authenticate("session"));

passport.serializeUser(function (
  user: { id: any; username: string },
  cb: Function
) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user: {}, cb: Function) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Express + TypeScript Server" });
});

app.get("/players", ensureLoggedIn, (req: Request, res: Response) => {
  try {
    Player.find({}, (err: Error, players: Array<String>) => {
      if (err) {
        return res.send({
          success: false,
          error: err,
        });
      }
      const num_of_players = players.length;
      res.send({
        succes: true,
        num_of_players,
        players,
      });
    });
  } catch (error: any) {
    res.send({
      success: false,
      error: error.stack,
    });
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/login-success",
    failureRedirect: "/login",
    failureMessage: true,
  })
);

app.get("/login-success", (req, res) =>
  res.json({ message: "Successfully logged in!" })
);

app.get("/logout", (req: any, res, next) =>
  req.logout((err: Error) =>
    err ? next(err) : res.json({ message: "Successfully logged out!" })
  )
);

app.post("/signup", (req: any, res, next) => {
  let salt = crypto.randomBytes(16);
  crypto.pbkdf2(
    req.body.password,
    salt,
    310000,
    32,
    "sha256",
    function (err, hashedPassword) {
      if (err) {
        res.json({ err: err.stack, msg: "Error" });
        return next(err);
      }
      db.run(
        "INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)",
        [req.body.username, hashedPassword, salt],
        function (err: Error) {
          if (err) {
            res.json({ err: err.stack, msg: "Error" });
            return next(err);
          }
          let user = {
            id: this.lastID,
            username: req.body.username,
          };
          req.login(user, function (err: Error) {
            if (err) {
              res.json({ err: err.stack, msg: "Error" });
              return next(err);
            }
            res.json(user);
          });
        }
      );
    }
  );
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
