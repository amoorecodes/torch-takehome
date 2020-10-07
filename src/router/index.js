const express = require("express");

const { checkStatus, delayedLines, getUptime } = require("../helpers");

// create router for updates
const router = express.Router();

// endpoint for developing, enables requesting delayed statuses
router.get("/live", async (req, res) => {
  try {
    let delayed = await checkStatus();
    res.send(delayed);
  } catch (err) {
    res
      .status(500)
      .send("We have encountered an error while requesting delay information");
  }
});

// route to check if a line is delayed or not
router.get("/status/:lineName", async (req, res) => {
  try {
    // SINCE WE UPDATE CACHE EVERY SECOND, WE COULD JUST RETRIEVE THE STATUS FROM THERE
    delayedLines.delayed.has(req.params.lineName.toUpperCase())
      ? res.send(`Line ${req.params.lineName} is currently delayed`)
      : res.send(`Line ${req.params.lineName} operates as expected.`);
    /*
  // IN CASE YOU WOULD WANT TO SEND A REQUEST ON HITTING THE ENDPOINT
  await checkStatus(req.params.lineName)
  .then((data) => {
    data.length
    ? res.send(`Line ${req.params.lineName} is currently delayed`)
    : res.send(`Line ${req.params.lineName} operates as expected.`);
  })
  .catch(console.error);
  */

    // just in case return 500
  } catch (error) {
    res
      .status(500)
      .send(`We have encountered an error. Please try again.\n${error}`);
  }
});

router.get("/uptime/:lineName", async (req, res) => {
  try {
    console.log("sending uptime");
    const uptime = await getUptime(req.params.lineName.toUpperCase());
    res.send({ uptime });
  } catch (err) {
    req
      .status(500)
      .send("We had an error trying to get uptime. Please try again. ", err);
  }
});

module.exports = router;
