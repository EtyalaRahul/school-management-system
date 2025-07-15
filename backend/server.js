const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET="vK#4Ff$7u*G8zX!dN1@eR6^qW3LpB@Zm"


let db = null;
let filepath = path.join(__dirname, "../database/database.db");

app.use(express.json());



const initializeServerAndDatabase = async () => {
  try {
    db = await open({
      filename: filepath,
      driver: sqlite3.Database,
    });
    await db.run(`
      CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )
    `);
    app.listen(3000, () => {
      console.log("App is listening on port 3000");
    });
  } catch (err) {
    console.log(err);
  }
};

app.post("/admin-register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.get("SELECT * FROM admin WHERE username = ?", [
      username,
    ]);
    if (user) {
      res.status(400).send("User already exists with this username");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.run("INSERT INTO admin (username, password) VALUES (?, ?)", [
        username,
        hashedPassword,
      ]);
      res.send("User creation success");
    }
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});

app.post("/admin-login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.get("SELECT * FROM admin WHERE username = ?", [
      username,
    ]);
    if (!user) {
      res.status(400).send("User not exists with given details");
    } else {
      const isPasswordMatched = await bcrypt.compare(password, user.password);
      if (isPasswordMatched) {
        const payload = { username };
        const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
        res.send({ jwtToken });
      } else {
        res.status(400).send("Invalid user credentials");
      }
    }
  } catch (err) {
    res.status(500).send(`Error: ${err}`);
  }
});

const authentication = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  let token;
  if (authHeader !== undefined) {
    token = authHeader.split(" ")[1];
  }
  if (token === undefined) {
    res.status(401).send("Invalid JWT token");
  } else {
    jwt.verify(token, JWT_SECRET, (error, payload) => {
      if (error) {
        res.status(401).send("Invalid JWT token");
      } else {
        req.user = payload;
        next();
      }
    });
  }
};
app.get("/home", authentication, (req, res) => {
  res.send(`Welcome ${req.user.username} to your dashboard`);
});

initializeServerAndDatabase();
