const axios = require("axios");
const GTFS = require("gtfs-realtime-bindings");

const feedMessage = GTFS.transit_realtime.FeedMessage;

// helper function to print updates
function notify(line, delayed) {
  if (delayed) {
    console.log(`Line ${line} is experiencing delays.`);
  } else {
    console.log(`Line ${line} is now recovered.`);
  }
}

// this function updates cache with new lines
function updateCache(cache, newInfo) {
  // check if line is in delayed cache now but not in the API response
  for (let line of cache) {
    if (!newInfo.includes(line)) {
      notify(line);
      cache.delete(line);
    }
  }

  // check if a line delayed for the first time
  for (let line of newInfo) {
    if (!cache.has(line)) {
      cache.add(line);
      notify(line, true);
    }
  }
}

// helper function to get status of all subway lines
async function checkStatus(specificLine, linesOnly) {
  // make a request to MTA api
  const delayed = await axios
    .get(
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts",
      {
        headers: {
          "x-api-key": process.env.API_KEY,
        },
        responseType: "arraybuffer",
      }
    )
    .then(({ data }) => {
      // decode GTFS stream
      let feed = feedMessage.decode(data);
      // return feed;
      // get all delayed routes
      const filtered = feed.entity.filter((message) => {
        // if ID has NYCT it is a delay report
        // return message.id.includes("NYCT");

        // over the weekend the results have changed and now they have "Delays" under delayed line
        return message.alert.headerText.translation[0].text === "Delays";

        // dev -> planned work
      });

      // if requested to only give the line names, strip all extra information
      if (linesOnly) {
        let delayedLines = filtered.reduce((prev, curr) => {
          for (let { routeId } of curr.alert.informedEntity) {
            if (routeId) prev.push(routeId);
            return prev;
          }
        }, []);
        return delayedLines;
      }

      // if no line provided, return all delayed lines
      return specificLine
        ? filtered.filter((message) =>
            message.alert.informedEntity[0].trip.routeId.includes(specificLine)
          )
        : filtered;
    })
    .catch(console.err);

  updateCache(delayedLines.delayed, delayed);

  return delayed;
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
  "SI",
];
const delayedLines = {};

function createLinesCache() {
  for (let item of subwayLines) {
    delayedLines[item] = {
      // alerts: [],
      delayed: false,
      activePeriod: false,
    };
  }
  delayedLines["delayed"] = new Set();
}

createLinesCache();

module.exports = { notify, checkStatus, delayedLines };
