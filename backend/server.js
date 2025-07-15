const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
let filepath = path.join(__dirname, "../database/database.db");

app.use(express());

app.get("/home", (req, res) => {
  res.send("welcome to my website mowa");
});

const initializeServerAndDatabase = async () => {
  try {
    db = await open({
      filename: filepath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("app is listening to port 3000");
    });
  } catch (err) {
    console.log(err);
  }
};


initializeServerAndDatabase();
