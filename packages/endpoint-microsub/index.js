import express from "express";
import { actionController } from "./lib/controllers/action.js";
import { queryController } from "./lib/controllers/query.js";
import { poll } from "./lib/poll.js";
import cron from "node-cron";

const defaults = { mountPath: "/microsub" };
const router = express.Router();

export default class MicrosubEndpoint {
  name = "Microsub endpoint";

  constructor(options = {}) {
    this.options = { ...defaults, ...options };
    this.mountPath = this.options.mountPath;
  }

  get routes() {
    // Have blank routers for now
    router.get("/", queryController);
    router.post("/", actionController);

    return router;
  }

  async setupDatabase(application) {
    const channelCollection = application?.collections?.get("microsub-channels");
    const feedCollection = application?.collections?.get("microsub-feeds");
    const entryCollection = application?.collections?.get("microsub-entries");

    // Create indexes for collections
    await channelCollection.createIndex({ name: 1 }, { unique: true });
    await feedCollection.createIndex({ url: 1 }, { unique: true });
    await entryCollection.createIndex({ url: 1 }, { unique: true });

    // Add validators
    await application.database.command({
      collMod: "microsub-channels",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name"],
          properties: {
            name: {
              bsonType: "string",
              description: "Channel name is required and must be a string",
            },
          },
        },
      }
    });

    await application.database.command({
      collMod: "microsub-feeds",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["url", "channel", "lastChecked", "interval", "lastUpdated"],
          properties: {
            url: {
              bsonType: "string",
              description: "Feed URL is required and must be a string",
            },
            channel: {
              bsonType: "string",
              description: "Channel name is required and must be a string",
            },
            lastChecked: {
              bsonType: "date",
              description: "Last checked time for feed",
            },
            lastUpdated: {
              bsonType: "date",
              description: "Last updated time for feed",
            },
            interval: {
              bsonType: "int",
              description: "Polling interval for feed in milliseconds",
            },
          },
        },
      }
    });

    await application.database.command({
      collMod: "microsub-entries",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["url", "feed"],
          properties: {
            url: {
              bsonType: "string",
              description: "Entry URL is required and must be a string",
            },
            feed: {
              bsonType: "objectId",
              description: "Feed ID is required and must be an ObjectId",
            },
            item: {
              bsonType: "object",
              description: "Original feed item data",
            },
            _is_read: {
              bsonType: "bool",
              description: "Whether entry has been read",
            },
          },
        },
      }
    });
  }

  init(Indiekit) {
      Indiekit.addCollection("microsub-channels");
      Indiekit.addCollection("microsub-feeds");
      Indiekit.addCollection("microsub-entries");
      Indiekit.addEndpoint(this);

      // Set up database
      this.setupDatabase(Indiekit);

      // Add polling job
      cron.schedule("*/1 * * * *", async () => {
        console.log("Polling feeds...");
        await poll.pollFeeds(Indiekit);
      });

      // Only mount if microsub endpoint not already configured
      if(!Indiekit.config.application.microsubEndpoint) {
      Indiekit.config.application.microsubEndpoint = this.mountPath;
    }
  }
}