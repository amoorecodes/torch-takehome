const axios = require("axios");
const express = require("express");
const GTFS = require("gtfs-realtime-bindings");
const xml2js = require("xml2js");

// create router for updates
const router = express.Router();
const feedMessage = GTFS.transit_realtime.FeedMessage;

router.get("/", (req, res) => {
  res.send("Hello world");
});

router.get("/live", (req, res) => {
  axios
    .get(
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
      {
        headers: {
          "x-api-key": process.env.API_KEY,
          incrementality: "FULL_DATASET",
        },
        responseType: "arraybuffer",
      }
    )
    .then(({ data }) => {
      console.log(typeof data);
      console.log(data);

      const feed = feedMessage.decode(data);
      feed.entity.forEach((line) => {
        // console.log(line);
        if (line.tripUpdate) console.log(line.tripUpdate);
      });
      res.send(feed.entity);
    })

    .catch((err) => console.error(err));
});

router.get("/status", (req, res) => {
  axios
    .get("http://web.mta.info/status/serviceStatus.txt", {
      headers: {
        "x-api-key": process.env.API_KEY,
        "Content-Type": "text/plain",
      },
    })
    .then(({ data }) => {
      xml2js.parseString(data, (err, { service }) => {
        if (err) console.error(err);
        const filtered = service.subway[0].line.filter(({ status }) => {
          return status.includes("DELAYS");
        });
        res.send(filtered);
      });
    })
    .catch(console.err);
});

module.exports = router;
