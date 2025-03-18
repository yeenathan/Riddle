const express = require("express");
const pg = require("pg");
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'));

async function dbInit() {
  const client = new pg.Client({
    database: "mydb",
  });
  await client.connect();
  const result = await client.query("SELECT * FROM public.riddle WHERE date<now()"); //gets all riddles up to today

  const all = result.rows;
  const today = all[all.length-1];

  return {all: all, today: today};
}

app.get("/", async (req, res) => {
  const data = await dbInit();
  res.render("index.ejs", {all: data.all, today: data.today}); //static
})

app.post("/submit", async (req, res) => {
  const data = await dbInit();
  const answer = req.body["answer"];
  const correctAnswer = data.today["answer"];
  res.render("index.ejs", {today: data.today, answered: answer.toLowerCase() === correctAnswer.toLowerCase()});
})

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});

