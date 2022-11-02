import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { auth, requiresAuth } from "express-openid-connect";
import bodyParser from "body-parser";
import fetch from "cross-fetch";

dotenv.config();

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  routes: {
    login: "false",
    postLogoutRedirect: "/post-logout",
  },
};

const app: Express = express();
const port = process.env.PORT;

const jsonParser = bodyParser.json();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.get("/", (req: Request, res: Response) => {
  res.json(
    req.oidc.isAuthenticated()
      ? { message: "Express + TypeScript Server" }
      : { message: "Not logged in" }
  );
});

app.get("/login", (req, res) => res.oidc.login({ returnTo: "/profile" }));

app.get("/post-logout", (req, res) => res.json({ message: "Bye!" }));

app.get("/callback", (req, res) => {
  res.send("Returning...");
});

app.get("/profile", requiresAuth(), (req, res) => {
  res.json(req.oidc.user);
});

interface SignupPayload {
  client_id: String;
  email: String;
  password: String;
  connection: String;
}

type SignupRequest = Request<{}>;

app.post("/signup", jsonParser, async (req: any, res) => {
  try {
    //TODO: Work on this further... Take needed params from req.body
    // Place connection in .env?
    // Delete/Uninstall node-fetch

    if (!req.body.email) {
      return res.json({ error: "Please provide your email." });
    }
    if (!req.body.password) {
      return res.json({ error: "Please provide your password." });
    }
    const payload = {
      email: req.body?.email,
      password: req.body?.password,
      connection: process.env.CONNECTION,
      clientid: process.env.CLIENT_ID,
    };

    const result = await fetch(
      `${process.env.ISSUER_BASE_URL}/dbconnections/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const data = await result.json();
    res.json({ data, msg: "Data Came through" });
  } catch (error: any) {
    res.json({ err: error.stack, msg: "Error" });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
