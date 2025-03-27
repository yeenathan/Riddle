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
    database: "riddles",
    port: 5432,
    password: "Ulu8916!2",
    user: "postgres"
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

    const attemptsResult = await client.query(
      "SELECT COUNT(*) as attempts FROM public.history WHERE date = $1 AND riddle = $2",
      [today.date, today.question]
    );
    const currentAttempts = parseInt(attemptsResult.rows[0].attempts);

    console.log("dbInit result:", { 
      all, 
      today, 
      alreadyAnsweredCorrectly, 
      currentAttempts 
    });

    return {
      all: all,
      today: today,
      alreadyAnsweredCorrectly: alreadyAnsweredCorrectly,
      currentAttempts: currentAttempts || 0
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
    });

    // converts the date to the local timezone
    await client.query(
      "INSERT INTO public.history (date, status, riddle) VALUES (now() AT TIME ZONE 'America/Los_Angeles', $1, $2)",
      [status, riddleText]
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

  const showFormAnyway = req.query.override === "true"; 
  const hideForm = (data.alreadyAnsweredCorrectly && !showFormAnyway) || 
                   (data.currentAttempts >= 3 && !showFormAnyway);

  res.render("index.ejs", {
    all: data.all,
    today: data.today,
    alreadyAnsweredCorrectly: data.alreadyAnsweredCorrectly,
    showForm: !hideForm,
    answered: null,
    currentAttempts: data.currentAttempts || 0
  });
});

app.get("/history", async (req, res) => {
  console.log("GET /history called");
  try {
    const historyData = await getHistory();
    res.render("history.ejs", { history: historyData });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.render("history.ejs", { history: [] });
  }
});

app.post("/submit", async (req, res) => {
  console.log("POST /submit called");
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
    currentAttempts: data.currentAttempts
  });

  await recordAnswer(isCorrect, riddleText);

  const currentAttempts = (data.currentAttempts || 0) + 1;
  const showForm = currentAttempts < 3;

  res.render("index.ejs", {
    all: data.all,
    today: data.today,
    answered: isCorrect,
    alreadyAnsweredCorrectly: data.alreadyAnsweredCorrectly,
    showForm: showForm,
    currentAttempts: currentAttempts
  });  
});

app.post("/clear-history", async (req, res) => {
  console.log("POST /clear-history called");
  await clearHistory();
  res.redirect("/history");
});

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
