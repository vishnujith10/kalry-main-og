// ----------------- Imports -----------------
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const supabase = require("./supabaseClient");

// REST Routes
const foodLogsRoutes = require("./routes/foodLogs");
const exercisesRoutes = require("./routes/exercises");
const sleepLogsRoutes = require("./routes/sleepLogs");
const stepGoalRoutes = require("./routes/stepGoal");
const stepsRoutes = require("./routes/steps");

// GraphQL
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express4");

// ----------------- Setup Express -----------------
const app = express();
app.use(cors());
app.use(express.json());

// ----------------- Profile Upsert -----------------
app.post("/profile", async (req, res) => {
  try {
    const { id, ...profileData } = req.body;
    if (!id) return res.status(400).json({ error: "Missing user id" });

    const { data, error } = await supabase
      .from("user_profile")
      .upsert([{ id, ...profileData }], { onConflict: ["id"] });

    if (error) throw error;
    res.json({ message: "Profile upserted", data });
  } catch (err) {
    console.error("Profile upsert error:", err.message);
    res
      .status(500)
      .json({ error: "Profile upsert failed", details: err.message });
  }
});

// ----------------- Gemini Test -----------------
app.get("/test-gemini", async (req, res) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: "Hello" }] }] },
      { headers: { "Content-Type": "application/json" } }
    );
    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("Gemini test error:", err.message);
    res
      .status(500)
      .json({ error: "Gemini test failed", details: err.message });
  }
});

// ----------------- Analyze Food -----------------
app.post("/analyze-food", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing food description" });

    const prompt = `You are a nutrition expert. Give me the exact nutrition breakdown for "${text}". Consider it's a standard restaurant/home serving.

Return ONLY the values in this exact format:
Name: ${text}
Serving Size: 1 serving
Calories: [exact number] kcal
Protein: [exact number] g
Carbs: [exact number] g
Fats: [exact number] g`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json" } }
    );

    const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!result) throw new Error("No valid response from Gemini");

    const lines = result.split("\n");
    const data = {};
    lines.forEach((line) => {
      if (line.startsWith("Name:")) data.name = line.replace("Name:", "").trim();
      else if (line.startsWith("Serving Size:"))
        data.servingSize = line.replace("Serving Size:", "").trim();
      else if (line.startsWith("Calories:"))
        data.calories = parseInt(line.replace(/[^\d]/g, ""));
      else if (line.startsWith("Protein:"))
        data.protein = parseInt(line.replace(/[^\d]/g, ""));
      else if (line.startsWith("Carbs:"))
        data.carbs = parseInt(line.replace(/[^\d]/g, ""));
      else if (line.startsWith("Fats:"))
        data.fats = parseInt(line.replace(/[^\d]/g, ""));
    });

    res.json(data);
  } catch (err) {
    console.error("Food analysis error:", err.message);
    res.status(500).json({ error: "Failed to analyze food", details: err.message });
  }
});

// ----------------- REST APIs -----------------
app.use("/api/foodlogs", foodLogsRoutes);
app.use("/api/exercise", exercisesRoutes);
app.use("/api/sleeplogs", sleepLogsRoutes);
app.use("/api/step-goals", stepGoalRoutes);
app.use("/api/steps", stepsRoutes);

// ----------------- GraphQL Setup -----------------
async function setupGraphQL() {
  const typeDefs = `#graphql
    type Exercise {
      id: ID!
      name: String!
      type: String
      body_parts: String
      target_muscles: String
      secondary_muscles: String
      equipments: String
      instructions: String
      level: String
      gif_url: String
    }

    type Query {
      exercises: [Exercise!]!
      exercise(id: ID!): Exercise
    }
  `;

  const resolvers = {
    Query: {
      exercises: async () => {
        const { data, error } = await supabase.from("exercise").select("*"); // ✅ fixed table name
        if (error) throw new Error(error.message);
        return data;
      },
      exercise: async (_, { id }) => {
        const { data, error } = await supabase
          .from("exercise") // ✅ fixed table name
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    },
  };

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => ({ req, res, supabase }),
    })
  );
}

// ----------------- Error Handler -----------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 3000;

setupGraphQL().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🚀 GraphQL endpoint ready at http://localhost:${PORT}/graphql`);
  });
});
