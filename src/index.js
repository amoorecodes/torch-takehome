// load envirenmental variables
require("dotenv").config();

// imports
const express = require("express");
const { json, urlencoded } = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const router = require("./router/index.js");
const { checkStatus } = require("./helpers");

// create server
const app = express();

// enable middleware
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(router);

// enable middleware for development
// app.use(morgan("dev"));

// initiate first status check
checkStatus();
/* 
  enable continuous status check. 
  Checks every second against the API, notifies if a line became delayed or back to normal service
*/
setInterval(checkStatus, 1000);

// start the server
app.listen(3000, (err) => {
  if (err) console.error(err);
  console.log("server is listening on port 3000");
});
