// load envirenmental variables
require("dotenv").config();

// imports
const express = require("express");
const { json, urlencoded } = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const router = require("./router/index.js");
const { checkStatus, delayedLines } = require("./helpers");

// create server
const app = express();

// enable middleware
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(router);

// initiate first status check
checkStatus(null, true);
/* 
  enable continuous status check. 
  API for status updates is not dynamic. Results are updated every minute, 
  therefore interval of ~10 seconds is appropriate, but can be changed to a smaller value
*/
// setInterval(checkStatus, 10000);

// dev
// setTimeout(() => console.log("delayed: ", delayedLines), 1000);
// setTimeout(checkStatus, 5000);

// start the server
app.listen(3000, (err) => {
  if (err) console.error(err);
  console.log("server is listening on port 3000");
});
