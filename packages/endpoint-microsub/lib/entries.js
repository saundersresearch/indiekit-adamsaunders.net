import { IndiekitError } from "@indiekit/error";
import { ObjectId } from "mongodb";
import { utils } from "./utils.js";
import { getCursor } from "@indiekit/util"

export const entryData = {
    // Add entries from feed
    async update(application, feedUid, cache = true) {
        const feedCollection = application?.collections?.get("microsub-feeds");
        const entryCollection = application?.collections?.get("microsub-entries");
        const query = { _id: new ObjectId(feedUid) };
        const feedRecord = await feedCollection.findOne(query);
        if (!feedRecord) {
            throw new IndiekitError(
                res.locals.__("NotFoundError.record", "feed")
            );
        }

        // Check if etag is present and if so, add If-None-Match header to request
        if (feedRecord.etag && cache) {
            try {
                const response = await fetch(feedRecord.url, {
                    headers: {
                        "If-None-Match": feedRecord.etag,
                    },
                });
                if (response.status === 304) {
                    console.log("Feed has not changed since last check, skipping update.");
                    return;
                } else if (response.ok) {
                    const newEtag = response.headers.get("etag");
                    if (newEtag) {
                        await feedCollection.updateOne(
                            { _id: feedRecord._id },
                            { $set: { etag: newEtag } }
                        );
                    }
                }
            } catch (error) {
                console.error("Error fetching feed for etag check:", error);
            }
        }

        // Get feed as jf2
        console.log("Getting feed for feedUid", feedUid, "with feedRecord", feedRecord);
        const feed = await utils.convertFeed(feedRecord.url);

        // Update lastChecked for feed
        await feedCollection.updateOne(
            { _id: feedRecord._id },
            { $set: { lastChecked: new Date(), lastUpdated: new Date() } }
        );

        // Loop over items 
        for (const item of feed) {
            // If item does not have published, use current date
            if (!item.published) {
                item.published = new Date();
            }
            // Add entry to collection if not already there
            const url = item.url || "";
            const entryQuery = { url: url, feed: new ObjectId(feedUid) };
            console.log({ entryQuery, item, is_read: false });
            await entryCollection.findOneAndUpdate(
                entryQuery,
                { $setOnInsert: { url: url, feed: new ObjectId(feedUid), _is_read: false, ...item } },
                { upsert: true }
            );
        }
    },

    async markRead(application, channel, entry, lastReadEntry) {
        const entryCollection = application?.collections?.get("microsub-entries");
        const feedsCollection = application?.collections?.get("microsub-feeds");
        if (!channel) {
            throw new IndiekitError(
                res.locals.__("BadRequestError.missingParameter", "channel")
            );
        }
        const feeds = await feedsCollection.find({ channel: channel }).toArray();
        // if lastReadEntry is provided, mark all entries up to and including that entry as read
        if (lastReadEntry) {
            const lastReadEntryRecord = await entryCollection.findOne({ _id: new ObjectId(lastReadEntry) });
            if (!lastReadEntryRecord) {
                throw new IndiekitError(
                    res.locals.__("NotFoundError.record", "entry")
                );
            }
            const query = { feed: { $in: feeds.map(feed => feed._id) }, published: { $lte: lastReadEntryRecord.published } };
            await entryCollection.updateMany(query, { $set: { _is_read: true } });
        }
        const entries = Array.isArray(entry) ? entry : [entry];
        const entryIds = entries.map(entry => new ObjectId(entry));
        const query = { feed: { $in: feeds.map(feed => feed._id) }, _id: { $in: entryIds } };
        await entryCollection.updateMany(query, { $set: { _is_read: true } });
        return {
            status: 200,
        };
    },

    async markUnread(application, channel, entry) {
        const entryCollection = application?.collections?.get("microsub-entries");
        const feedsCollection = application?.collections?.get("microsub-feeds");
        if (!channel) {
            throw new IndiekitError(
                res.locals.__("BadRequestError.missingParameter", "channel")
            );
        }
        const feeds = await feedsCollection.find({ channel: channel }).toArray();
        const entries = Array.isArray(entry) ? entry : [entry];
        const entryIds = entries.map(entry => new ObjectId(entry));
        const query = { feed: { $in: feeds.map(feed => feed._id) }, _id: { $in: entryIds } };
        await entryCollection.updateMany(query, { $set: { _is_read: false } });
        return {
            status: 200,
        };
    },

    async getTimeline(application, channel, before, after, limit) {
        const entryCollection = application?.collections?.get("microsub-entries");
        const feedsCollection = application?.collections?.get("microsub-feeds");
        if (!channel) {
            throw new IndiekitError(
                res.locals.__("BadRequestError.missingParameter", "channel")
            );
        }
        const cursor = await getCursor(entryCollection, after, before, limit);

        // Filter by channel and sort by published date descending
        const feeds = await feedsCollection.find({ channel: channel }).toArray();
        const feedIds = feeds.map(feed => feed._id);
        cursor.items = await entryCollection.find({ feed: { $in: feedIds } }).sort({ published: -1 }).toArray();

        // Remove feed from items
        cursor.items = cursor.items.map(item => {
            const { feed, ...rest } = item;
            return rest;
        });

        let response = {
            status: 200,
            json: { items: cursor.items }
        };

        if (cursor.items && cursor.items.length > 0) {
            response.json.before = cursor.firstItem;
        }

        if (cursor.hasNext) {
            response.json.after = cursor.lastItem;
        }

        return response;
    }
}