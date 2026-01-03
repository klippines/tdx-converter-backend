import express from "express";
import cors from "cors";
import { Resend } from "resend";

const app = express();
const PORT = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IN-MEMORY SUBSCRIBERS
const subscribers = [];

// Add this near the top, below `const subscribers = [];`
subscribers.push({
  email: "your@email.com",
  crystal: true,
  cookie: true,
  all: false
});
console.log("Test subscriber added!");


// SUBSCRIBE ENDPOINT (Webflow-compatible)
app.post("/subscribe", (req, res) => {
  const { email, crystal, cookie } = req.body;
  if (!email) return res.status(400).send("No email");

  subscribers.push({
    email,
    crystal: crystal === "on" || crystal === true,
    cookie: cookie === "on" || cookie === true,
    all: false
  });

  console.log("New subscriber:", subscribers[ subscribers.length - 1 ]);
  res.send({ success: true });
});

// ADMIN SEND EMAIL
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
        html: `<p>Gold: ${gold}</p><p>Crystals: ${crystalAmount}</p><p>Stock: ${stock}</p>`
      });
      sentCount++;
    } catch (err) {
      console.error("Failed to send email to", sub.email, err);
    }
  }

  res.send({ sent: sentCount });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
