const axios = require("axios");
const GTFS = require("gtfs-realtime-bindings");
const xml2js = require("xml2js");

const feedMessage = GTFS.transit_realtime.FeedMessage;

// helper function to print updates
function notify(line, delayed) {
  if (delayed) {
    console.log(`Line ${line} is experiencing delays.`);
  } else {
    console.log(`Line ${line} is now recovered.`);
  }
}

// helper function to get status of all subway lines

function checkStatus() {
  axios
    .get("http://web.mta.info/status/serviceStatus.txt", {
      headers: {
        "x-api-key": process.env.API_KEY,
        "Content-Type": "text/plain",
      },
    })
    .then(({ data }) => {
      // the API returns an xml file, parse it to JSON
      xml2js.parseString(data, (err, { service }) => {
        if (err) console.error(err);
        // extract delayed routes
        const filtered = service.subway[0].line.filter(({ status }) => {
          // console.log(line.name);
          return status.includes("DELAYS");
        });
        console.log("filtered\n");
        console.log(filtered);
        // return filtered;
        // for each route, check if it is in a cache or not
        for (let { name } of filtered) {
          console.log(name);
          delayedLines[name[0]] ? notify(name[0]) : notify(name[0], "delayed");
        }
      });
    })
    .catch(console.err);
}

// cache object with delayed lines
const subwayLines = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "A",
  "C",
  "E",
  "B",
  "D",
  "F",
  "M",
  "G",
  "J",
  "Z",
  "L",
  "M",
  "N",
  "Q",
  "R",
  "S",
  "SIR",
];
const delayedLines = {};

function createLinesCache() {
  for (let item of subwayLines) {
    delayedLines[item] = false;
  }
}

createLinesCache();

module.exports = { notify, checkStatus, delayedLines };
