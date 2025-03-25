const express = require("express");
const pg = require("pg");
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'));

async function getClient() {
  const client = new pg.Client({
    user: "postgres",
    password: "**********",
    host: "localhost",
    port: 5432,
    database: "riddles",
  });
  await client.connect();
  return client;
}

async function dbInit() {
  const client = await getClient();
  
  try {
    const result = await client.query("SELECT * FROM public.riddle WHERE date<now()"); 
    const all = result.rows;
    const today = all[all.length-1];
    return {all: all, today: today};
  } finally {
    client.end();
  }
}

async function getHistory() {
  const client = await getClient();
  
  try {
    const result = await client.query(`
      SELECT id, date, riddle, status FROM public.history ORDER BY id ASC
    `);
    return result.rows;
  } finally {
    client.end();
  }
}

async function recordAnswer(status, riddleText) {
  const client = await getClient();
  
  try {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; 
    
    await client.query(
      "INSERT INTO public.history (date, status, riddle) VALUES ($1, $2, $3)",
      [formattedDate, status, riddleText]
    );
  } finally {
    client.end();
  }
}

app.get("/", async (req, res) => {
  const data = await dbInit();
  res.render("index.ejs", {all: data.all, today: data.today}); //static
});

app.get("/history", async (req, res) => {
  try {
    const historyData = await getHistory();
    res.render("history.ejs", { history: historyData });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.render("history.ejs", { history: [] }); 
  }
});

app.post("/submit", async (req, res) => {
  const data = await dbInit();
  const answer = req.body["answer"];
  const correctAnswer = data.today["answer"];
  const riddleText = data.today.riddle;
  const isCorrect = answer.toLowerCase() === correctAnswer.toLowerCase();
  
  await recordAnswer(isCorrect, riddleText);
  
  res.render("index.ejs", {all: data.all, today: data.today, answered: isCorrect});
});

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});