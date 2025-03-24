const express = require("express");
const pg = require("pg");
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getClient() {
  const client = new pg.Client({
    host: "localhost",
  });
  await client.connect();
  return client;
}

async function dbInit() {
  const client = await getClient();

  try {
    const result = await client.query(
      "SELECT * FROM public.riddle WHERE date<now()"
    );
    const all = result.rows;
    const today = all[all.length - 1];

    const historyResult = await client.query(
      "SELECT * FROM public.history WHERE date = $1 AND status = true",
      [today.date]
    );
    const alreadyAnsweredCorrectly = historyResult.rows.length > 0;

    console.log("dbInit result:", { all, today, alreadyAnsweredCorrectly }); // Added logging

    return {
      all: all,
      today: today,
      alreadyAnsweredCorrectly: alreadyAnsweredCorrectly,
    };
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
    const formattedDate = today.toISOString().split("T")[0];

    console.log("Inserting into history:", {
      formattedDate,
      status,
      riddleText,
    }); // Added logging

    await client.query(
      "INSERT INTO public.history (date, status, riddle) VALUES ($1, $2, $3)",
      [formattedDate, status, riddleText]
    );
  } finally {
    client.end();
  }
}

async function clearHistory() {
  const client = await getClient();

  try {
    await client.query("TRUNCATE public.history RESTART IDENTITY");
    console.log("History table cleared and ID sequence reset");
  } finally {
    client.end();
  }
}

app.get("/", async (req, res) => {
  console.log("GET / called");
  const data = await dbInit();

  const showFormAnyway = req.query.override === "true"; // <== toggle
  const hideForm = data.alreadyAnsweredCorrectly && !showFormAnyway;

  res.render("index.ejs", {
    all: data.all,
    today: data.today,
    alreadyAnsweredCorrectly: data.alreadyAnsweredCorrectly,
    showForm: !hideForm,
    answered: null,
  });
});


app.get("/history", async (req, res) => {
  console.log("GET /history called"); // Added logging
  try {
    const historyData = await getHistory();
    res.render("history.ejs", { history: historyData });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.render("history.ejs", { history: [] });
  }
});

app.post("/submit", async (req, res) => {
  console.log("POST /submit called"); // Added logging
  const data = await dbInit();
  const answer = req.body["answer"];
  const correctAnswer = data.today["answer"];
  const riddleText = data.today.question;
  const isCorrect = answer.toLowerCase() === correctAnswer.toLowerCase();

  console.log("Submitting answer:", {
    answer,
    correctAnswer,
    riddleText,
    isCorrect,
  }); // Added logging

  await recordAnswer(isCorrect, riddleText);

  res.render("index.ejs", {
    all: data.all,
    today: data.today,
    answered: isCorrect,
    alreadyAnsweredCorrectly: data.alreadyAnsweredCorrectly,
    showForm: true
  });  
});

app.post("/clear-history", async (req, res) => {
  console.log("POST /clear-history called"); // Added logging
  await clearHistory();
  res.redirect("/history");
});

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
