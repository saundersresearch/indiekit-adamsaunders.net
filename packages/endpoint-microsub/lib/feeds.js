import { IndiekitError } from "@indiekit/error";
import { ObjectId } from "mongodb";
import { utils } from "./utils.js";
import { entryData } from "./entries.js";

export const feedData = {
    async follow(application, channel, url) {
        const feedCollection = application?.collections?.get("microsub-feeds");
        console.log("Creating feed with url:", url, "and channel:", channel);
        const query = { url: url, channel: channel };

        // Add current time for lastChecked and 30m for interval
        const now = new Date();
        const feedData = {
            ...query,
            lastChecked: now,
            lastUpdated: now,
            interval: 1 * 60 * 1000, // Start with 1 minutes interval
        };

        // Get etag from feed URL if possible, and add to query
        try {
            const response = await fetch(url);
            if (response.ok) {
                const etag = response.headers.get("etag");
                if (etag) {
                    feedData.etag = etag;
                }
            }
        } catch (error) {
            console.error("Error fetching feed for etag:", error);
        }

        const result = await feedCollection.findOneAndUpdate(
            query,
            { $setOnInsert: feedData },
            { upsert: true, returnDocument: "after" }
        );
        console.log("Result of findOneAndUpdate:", result);
        const doc = result.value ?? result;

        // Now, update entries for this feed
        const feedUid = doc._id.toString();
        await entryData.update(application, feedUid);

        return {
            status: 200,
            json: {
                type: "feed",
                url: doc.url,
            }
        };
    },
    
    async unfollow(application, channel, url) {
        const feedCollection = application?.collections?.get("microsub-feeds");
        const query = { url: url, channel: channel };
        await feedCollection.deleteOne(query);
        return {
            status: 200,
        };
    },

    // Return all feeds for a channel
    async findAll(application, channel) {
        const feedCollection = application?.collections?.get("microsub-feeds");
    
        let feeds = await feedCollection.find({ channel: channel }).toArray();

        // Need to return list "feeds" with "uid", "name", and "unread" 
        feeds = feeds.map(feed => ({
            type: "feed",
            url: feed.url,
        }));
        return {
            status: 200,
            json: {
                items: feeds,
            }
        };
    },

}