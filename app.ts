import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose, { Schema, model } from "mongoose";
import createError from "http-errors";
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
  name: { type: String, required: true },
  age: { type: Number, min: 14, max: 45, required: true },
  plays_abroad: { type: Boolean, default: false },
  club: { type: String, default: undefined },
  is_captain: { type: Boolean, default: false },
  jersey_number: { type: Number, min: 1, max: 99, required: true },
  position_of_play: { type: Number, min: 1, max: 11, required: true },
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
        return res.json({
          success: false,
          error: err,
        });
      }
      const num_of_players = players.length;
      res.json({
        succes: true,
        num_of_players,
        players,
      });
    });
  } catch (error: any) {
    res.status(404);
    res.json({
      success: false,
      error: error.stack,
    });
  }
});

app.post("/players", ensureLoggedIn, (req, res) => {
  try {
    if (
      !req.body.name ||
      !req.body.age ||
      !req.body.jersey_number ||
      !req.body.position_of_play
    ) {
      res.status(400);
      return res.json({
        success: false,
        error: "Request is missing required fields!",
      });
    }

    const player = new Player({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      age: req.body.age,
      plays_abroad: req.body.plays_abroad || false,
      club: req.body.club,
      is_captain: req.body.is_captain || false,
      jersey_number: req.body.jersey_number,
      position_of_play: req.body.position_of_play,
    });

    player.save((err) => {
      if (err) {
        res.status(500);
        return res.json({
          success: false,
          error: err,
        });
      }
      res.status(200);
      return res.json({
        success: true,
        message: "Player created successfully",
        player,
      });
    });
  } catch (error: any) {
    res.status(404);
    res.json({
      success: false,
      error: error,
    });
  }
});

app.patch("/players/:id", ensureLoggedIn, (req, res) => {
  try {
    if (!req.params.id) {
      res.status(400);
      res.json({
        success: false,
        error: '"id" parameter absent!',
      });
    }

    if (!req.body) {
      res.status(400);
      res.json({
        success: false,
        error: "Request body absent!",
      });
    }

    Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" },
      (err: Error, doc: any) => {
        if (err) {
          res.status(400);
          return res.json({
            success: false,
            error: err,
          });
        }
        return res.json({
          success: true,
          player: doc,
        });
      }
    );
  } catch (error) {
    res.status(404);
    res.json({
      success: false,
      error,
    });
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/login-success",
    failureRedirect: "/login-failure",
    failureMessage: true,
  })
);

app.get("/login-failure", (req, res) =>
  res.json({ succcess: false, error: { message: "Login failed!" } })
);

app.get("/login-success", (req, res) =>
  res.json({ message: "Successfully logged in!" })
);

app.get("/logout", (req: any, res, next) =>
  req.logout((err: Error) =>
    err
      ? res.status(400) &&
        res.json({ error: err, message: "Something went wrong!" })
      : res.json({ message: "Successfully logged out!" })
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
        res.status(400);
        return res.json({ success: false, error: err });
      }
      db.run(
        "INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)",
        [req.body.username, hashedPassword, salt],
        function (err: Error) {
          if (err) {
            res.status(400);
            return res.json({ success: false, error: err });
          }
          let user = {
            id: this.lastID,
            username: req.body.username,
          };
          req.login(user, function (err: Error) {
            if (err) {
              res.status(400);
              return res.json({ success: false, error: err });
            }
            res.json(user);
          });
        }
      );
    }
  );
});

app.use((req, res, next) => next(createError(401)));

app.use((err: any, req: Request, res: Response, next: any) => {
  res.locals.message = err.message;
  res.locals.error = err;
  res.status(err.status || 500);
  res.json({ success: false, error: err });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
