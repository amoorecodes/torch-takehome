const express = require("express");

const { checkStatus, delayedLines } = require("../helpers");

// create router for updates
const router = express.Router();

// endpoint for developing, enables requesting delayed statuses
router.get("/live", async (req, res) => {
  let delayed = await checkStatus(null, true);
  res.send(delayed);
});

router.get("/status/:lineName", async (req, res) => {
  // SINCE WE UPDATE CACHE EVERY SECOND, WE COULD JUST RETRIEVE THE STATUS FROM THERE
  delayedLines.delayed.has(req.params.lineName)
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
  res.status(500).send("We have encountered an error. Please try again.");
});

module.exports = router;
