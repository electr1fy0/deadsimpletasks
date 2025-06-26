import express from "express";
let app = express();
import path from "path";

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(index.html);
});

app.listen(3000, () => {
  console.log("Jogging on 3k");
});
