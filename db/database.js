import { MongoClient } from "mongodb";

const url = "mongodb://localhost:27017";
const dbName = "vpn_client";
let db;

export async function connectDB() {
  const client = new MongoClient(url);
  await client.connect();
  db = client.db(dbName);
  console.log("Connected to MongoDB");

  await initializeCollections();
  return db;
}

// Инициализация коллекций с валидацией схем
async function initializeCollections() {
  const usersCollectionExists = await db
    .listCollections({ name: "users" })
    .hasNext();
  const codesCollectionExists = await db
    .listCollections({ name: "codes" })
    .hasNext();

  // Схема для коллекции users
  const userSchema = {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["username", "password", "status"],
        properties: {
          username: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          password: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          status: {
            bsonType: "string",
            enum: ["pending", "active"],
            description: "can only be 'pending' or 'active'",
          },
          code: {
            bsonType: "string",
            description: "code associated with user if applicable",
          },
        },
      },
    },
  };

  // Схема для коллекции codes
  const codeSchema = {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["code", "expiryDate", "status"],
        properties: {
          code: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          expiryDate: {
            bsonType: "date",
            description: "must be a date and is required",
          },
          status: {
            bsonType: "string",
            enum: ["pending", "used"],
            description: "can only be 'pending' or 'used'",
          },
        },
      },
    },
  };

  // Создаем коллекции с валидацией, если их нет
  if (!usersCollectionExists) {
    await db.createCollection("users", userSchema);
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    console.log("Created users collection with schema validation");
  }

  if (!codesCollectionExists) {
    await db.createCollection("codes", codeSchema);
    await db.collection("codes").createIndex({ code: 1 }, { unique: true });
    console.log("Created codes collection with schema validation");
  }
}

export { db };
