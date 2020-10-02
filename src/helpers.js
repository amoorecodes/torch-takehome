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

// this function checks the cache to illiminate repetetive messages
function checkCache(name, [newDate], [newTime]) {
  let { delayed, date, time } = delayedLines[name];
  // console.log("info: ", delayed, date, time);
  // console.log("new info: ", newDate, newTime);
  // return delayedLines[line].delayed ? notify(line) : notify(line, "delayed");
  // check if line is alerady in cache
  if (delayed) {
    // check if delay message is recent
    if (date === newDate && time === newTime) {
      console.log("it is the same event...");
    } else {
      console.log("this is new update");
      // delayedLines[name][delayed] = true;
      // delayedLines[name][date] = newDate;
      // delayedLines[name][time] = newTime;
    }
  } else {
    console.log("adding to cache for the first time...");
    delayedLines[name].delayed = true;
    delayedLines[name].date = newDate;
    delayedLines[name].time = newTime;
    delayed = true;
    date = newDate;
    time = newTime;
  }

  console.log("after checking cache:\n", delayedLines[name]);
}

// helper function to get status of all subway lines

function checkStatus() {
  axios
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
      let feed = feedMessage.decode(data);
      const filtered = feed.entity.filter((message) => {
        // if ID has NYCT it is a delay report
        return message.id.includes("NYCT");
      });
      console.log("filtered", filtered.length);
      for (let message of filtered) {
        console.log(
          "checkStatus: ",
          message.alert.informedEntity[0].trip.routeId
        );
      }
      console.log(filtered[0]);
    })
    .catch(console.err);

  // the API returns an xml file, parse it to JSON
  //   xml2js.parseString(data, (err, { service }) => {
  //     if (err) console.error(err);
  //     // extract delayed routes
  //     const filtered = service.subway[0].line.filter(({ status }) => {
  //       // console.log(line.name);
  //       // return status.includes("DELAYS");
  //       // for debugging, sometimes there are no delays
  //       // which are lies, it is MTA after all
  //       return status.includes("PLANNED WORK");
  //     });
  //     // return filtered;
  //     // for each route, check if it is in a cache or not
  //     for (let { name, Date, Time, text } of filtered) {
  //       // console.log("linegroup: ", lineGroup);
  //       let line = identifyLine(name, text);
  //       checkCache(line, Date, Time);
  //     }
  //   });
  // })
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
      alerts: [],
      delayed: false,
      activePeriod: false,
    };
  }
}

createLinesCache();

module.exports = { notify, checkStatus, delayedLines };
