const express = require("express");
const { json, urlencoded } = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.post("/", (req, res) => {
  console.log(req.body);
  res.send("post request");
});

app.listen(3000, (err) => {
  if (err) console.error(err);
  console.log("server is listening on port 3000");
});
