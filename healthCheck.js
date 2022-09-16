const http = require("http");

// const options = {
//   host: "localhost",
//   port: "3030",
//   path: "/healthcheck.json",
//   timeout: 5000,
// };
const options = {
  host: "http://www.steempunks.xyz",
  port: "3030",
  path: "/healthcheck.json",
  timeout: 5000,
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode == 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on("error", function (err) {
  console.log("ERROR");
  process.exit(1);
});

request.end();
