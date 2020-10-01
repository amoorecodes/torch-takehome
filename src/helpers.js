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

// this function helps you parse the API for the line that has delays
// API itself return delayed name as a line group and only specifies the exact line in a text message
function identifyLine([lineGroup], [message]) {
  // SIR is a line of itself
  if (lineGroup === "SIR") return lineGroup;
  // create a list of all lines in group
  const lines = lineGroup.split("");
  for (let line of lines) {
    // console.log(line);
    // check if line is mentioned in delayed message
    if (message.includes(`[${line}]`)) return line;
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
          // return status.includes("DELAYS");
          // for debugging, sometimes there are no delays
          // which are lies, it is MTA after all
          return status.includes("PLANNED WORK");
        });
        console.log("filtered\n");
        // console.log(filtered);
        // return filtered;
        // for each route, check if it is in a cache or not
        for (let lineGroup of filtered) {
          let line = identifyLine(lineGroup.name, lineGroup.text);
          delayedLines[line] ? notify(line) : notify(line, "delayed");
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
