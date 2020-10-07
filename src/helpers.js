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
  let delayedLines = {};
  // iterate through all "DELAYED" alerts
  for (let { alert } of newInfo) {
    // single alert can affect several lines
    for (let entity of alert.informedEntity) {
      let { routeId } = entity;
      // sometimes subway alerts includes bus lines, if they function as a shuttle
      // only include the actual subway lines
      if (cache[routeId]) {
        // store currently delayed line in an object for later removal
        delayedLines[routeId] = true;

        if (!cache.delayed.has(routeId)) {
          // add line to delayed set, add it's delay start and total times
          cache.delayed.add(routeId);
          // incoming time format is epoch
          cache[routeId].lastDelayed = alert.activePeriod[0]?.start?.low * 1000;
          notify(routeId, true);
        }
      }
    }
  }

  // check if line is in delayed cache but not in the API response
  for (let line of cache.delayed) {
    if (!Object.keys(delayedLines).includes(line)) {
      notify(line);
      // remove from delayed set, update total/current delay times
      cache.delayed.delete(line);
      updateDelayedTime(line, cache);
      cache[line].lastDelayed = false;
    }
  }
}

// function to update delayed times in cache
function updateDelayedTime(line, cache) {
  let now = Date.now();
  let { lastDelayed, totalDelayed } = cache[line];

  // if we have some delayed time and it is currently delayed
  if (totalDelayed && lastDelayed) {
    cache[line].totalDelayed += +Math.abs(now - lastDelayed);
    // if it is currently delayed for the first time
  } else if (lastDelayed) {
    cache[line].totalDelayed = Math.abs(lastDelayed - cache.startTime);
  }
}

// function to calculate uptime
async function getUptime(line) {
  try {
    let now = Date.now();
    let totalTimeUp = now - delayedLines.startTime;
    let totalDelayed = 0;
    delayedLines[line].lastDelayed
      ? (totalDelayed += Math.abs(now - delayedLines[line].lastDelayed))
      : delayedLines[line].totalDelayed;
    return 1 - totalDelayed / totalTimeUp;
  } catch (err) {
    console.error("Couldn not get uptime:\n", err);
  }
}

// helper function to get status of all subway lines
async function checkStatus(specificLine, linesOnly) {
  try {
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
        // get all delayed routes
        const filtered = feed.entity.filter((message) => {
          // over the weekend the results have changed and now they have "Delays" under delayed line
          return (
            // different objects have different structure
            // one time it broke the app by not having headerText :shrug:
            message.alert?.headerText?.translation[0]?.text === "Delays"
          );
        });

        // filter delays for specific line, if requested
        return specificLine
          ? filtered.filter(({ alert }) => {
              for (let message in alert.informedEntity) {
                return message.trip.routeId.includes(specificLine);
              }
            })
          : filtered;
      })
      .catch(console.err);

    updateCache(delayedLines, delayed);

    return delayed;
  } catch (err) {
    console.error(err);
  }
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

// function to create cache from scratch
function createLinesCache() {
  delayedLines["startTime"] = Date.now();
  for (let item of subwayLines) {
    delayedLines[item] = {
      lastDelayed: false,
      totalDelayed: 0,
    };
  }
  delayedLines["delayed"] = new Set();
}

createLinesCache();

module.exports = { notify, checkStatus, delayedLines, getUptime };
