import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Resend } from "resend";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const resend = new Resend(process.env.RESEND_API_KEY);

let subscribers = [];
let submissions = [];

// Subscribe
app.post("/subscribe", (req, res) => {
  const { email, crystal, cookie, all } = req.body;
  if (!email) return res.status(400).send("No email");

  subscribers.push({ email, crystal, cookie, all });
  res.send({ success: true });
});

// Admin send
app.post("/admin/send", async (req, res) => {
  const { type, gold, crystalAmount, stock } = req.body;

  const targets = subscribers.filter(s =>
    s.all || (type === "crystal" && s.crystal) || (type === "cookie" && s.cookie)
  );

  for (const user of targets) {
    await resend.emails.send({
      from: "TDX Alerts <alerts@resend.dev>",
      to: user.email,
      subject: `TDX ${type.toUpperCase()} Converter LIVE`,
      html: `
        <h2>${type.toUpperCase()} Converter</h2>
        <p>Gold: ${gold}</p>
        <p>Amount: ${crystalAmount}</p>
        <p>Stock: ${stock}</p>
        <b>Available for 1 hour</b>
      `
    });
  }

  res.send({ sent: targets.length });
});

// Submissions
app.post("/submit", (req, res) => {
  submissions.push({
    id: Date.now(),
    ...req.body,
    verified: false
  });
  res.send({ success: true });
});

app.get("/submissions", (req, res) => {
  res.send(submissions);
});

app.post("/admin/verify", (req, res) => {
  const sub = submissions.find(s => s.id === req.body.id);
  if (sub) sub.verified = true;
  res.send({ success: true });
});

app.listen(3000, () => console.log("Server running"));
