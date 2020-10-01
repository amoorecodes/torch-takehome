const express = require("express");
const { json, urlencoded } = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const GTFS = require("gtfs-realtime-bindings");
const feedMessage = GTFS.transit_realtime.FeedMessage;
const xml2js = require("xml2js");
const { clearConfigCache } = require("prettier");

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

app.get("/live", (req, res) => {
  axios
    .get(
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
      {
        headers: {
          "x-api-key": "DsvxK2iJ03DRLmCr6QTP1Bkyjyiapfb8wVK7e5Eh",
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

app.get("/status", (req, res) => {
  axios
    .get("http://web.mta.info/status/serviceStatus.txt", {
      headers: {
        "x-api-key": "DsvxK2iJ03DRLmCr6QTP1Bkyjyiapfb8wVK7e5Eh",
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

app.listen(3000, (err) => {
  if (err) console.error(err);
  console.log("server is listening on port 3000");
});
