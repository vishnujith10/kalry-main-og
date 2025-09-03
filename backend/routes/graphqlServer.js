// ----------------- Imports -----------------
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express4");

const supabase = require("../supabaseClient");

// ----------------- GraphQL Schema & Resolvers -----------------
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

// ----------------- Start GraphQL Server -----------------
async function startGraphQLServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => ({ req, res, supabase }),
    })
  );

  const PORT = process.env.GRAPHQL_PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 GraphQL server ready at http://localhost:${PORT}/graphql`);
  });
}

module.exports = { startGraphQLServer };

