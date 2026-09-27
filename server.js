const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (_request, response) => {
  response.json({
    message: "Hello from Docker!",
    runtime: process.version
  });
});

app.get("/health", (_request, response) => {
  response.status(200).send("ok");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Container lab listening on port ${port}`);
});