import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser, { json } from "body-parser";
import passport from "passport";
import session from "express-session";
import LocalStrategy from "passport-local";
import crypto from "crypto";
import db from "./db";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

const jsonParser = bodyParser.json();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

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

app.use(passport.initialize());

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  })
);

app.use(passport.authenticate("session"));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Express + TypeScript Server" });
});

app.post(
  "/login",
  jsonParser,
  passport.authenticate("local", {
    successRedirect: "/login-success",
    failureRedirect: "/login",
    failureMessage: true,
  })
);

app.get("/login-success", (req, res) =>
  res.json({ message: "Successfully logged in!" })
);

app.get("/logout", jsonParser, (req: any, res, next) =>
  req.logout((err: Error) =>
    err ? next(err) : res.json({ message: "Successfully logged out!" })
  )
);

app.post("/signup", jsonParser, (req: any, res, next) => {
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
