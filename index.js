const express = require("express");
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
// app.use(express.urlencoded({extended:true}))
app.use(express.static('public'));

app.get("/", (req, res) => {
  res.render("index.ejs"); //static
})

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});

