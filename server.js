import express from "express";
import cors from "cors";
import { Resend } from "resend";

const app = express();
const PORT = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage
const subscribers = [];
const submissions = []; // For community screenshots

// --- TEST SUBSCRIBER (REMOVE LATER) ---
subscribers.push({
  email: "your@email.com",
  crystal: true,
  cookie: true,
  all: false
});
console.log("Test subscriber added!");

// --- SUBSCRIBE ENDPOINT ---
app.post("/subscribe", (req, res) => {
  const { email, crystal, cookie } = req.body;
  if (!email) return res.status(400).send("No email");

  subscribers.push({
    email,
    crystal: crystal === "on" || crystal === true,
    cookie: cookie === "on" || cookie === true,
    all: false
  });

  console.log("New subscriber:", subscribers[subscribers.length - 1]);
  res.send({ success: true });
});

// --- ADMIN SEND EMAIL ---
app.post("/admin/send", async (req, res) => {
  const { type, gold, crystalAmount, stock } = req.body;
  if (!type) return res.status(400).send("Missing type");

  const targets = subscribers.filter(s =>
    s.all || (type === "crystal" && s.crystal) || (type === "cookie" && s.cookie)
  );

  let sentCount = 0;

  for (const sub of targets) {
    try {
      await resend.emails.send({
        from: "TDX Alerts <noreply@example.com>",
        to: sub.email,
        subject: `TDX ${type.toUpperCase()} Conversion!`,
        html: `<p>Gold: ${gold}</p>
               <p>Crystals: ${crystalAmount}</p>
               <p>Stock: ${stock}</p>`
      });
      sentCount++;
    } catch (err) {
      console.error("Failed to send email to", sub.email, err);
    }
  }

  res.send({ sent: sentCount });
});

// --- COMMUNITY SUBMISSIONS ---
app.post("/submit", (req, res) => {
  const { user, type, imageUrl } = req.body;
  if (!user || !type || !imageUrl) return res.status(400).send("Missing data");

  const submission = {
    user,
    type,
    imageUrl,
    verified: false
  };

  submissions.push(submission);
  console.log("New submission:", submission);
  res.send({ success: true });
});

// --- ADMIN VERIFY SUBMISSION ---
app.post("/admin/verify", (req, res) => {
  const { index, verified } = req.body;
  if (submissions[index] == null) return res.status(404).send("Submission not found");

  submissions[index].verified = verified;
  res.send({ success: true, submission: submissions[index] });
});

// --- GET SUBMISSIONS (for Webflow display) ---
app.get("/submissions", (req, res) => {
  res.send(submissions);
});

// --- START SERVER ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
