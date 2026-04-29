import { entryData } from "./entries.js";

export const poll = {
    async pollFeeds(application) {
        const feedCollection = application?.collections?.get("microsub-feeds");
        const now = new Date();
        const feedsToPoll = await feedCollection.find({
            $where: function() {
                return new Date(this.lastChecked.getTime() + this.interval) <= new Date();
            }
        }).toArray();

        console.log(`Found ${feedsToPoll.length} feeds to poll`);
        
        for (const feed of feedsToPoll) {
            console.log(`Polling feed: ${feed.url}`);
            await entryData.update(application, feed._id.toString());
            await feedCollection.updateOne(
                { _id: feed._id },
                { $set: { lastChecked: now } }
            );

            // If feed has not updated, double interval, but not more than 24h
            const sinceLastUpdated = now.getTime() - new Date(feed.lastUpdated).getTime();
            if (sinceLastUpdated < feed.interval) {
                console.log("Feed has not updated since last check, increasing interval");
                const newInterval = Math.min(feed.interval * 2, 24 * 60 * 60 * 1000);
                await feedCollection.updateOne(
                    { _id: feed._id },
                    { $set: { interval: newInterval } }
                );
            } else {
                // If feed has updated, decrease interval by half, but not less than 5m
                console.log("Feed has updated since last check, decreasing interval");
                const newInterval = Math.max(feed.interval / 2, 5 * 60 * 1000);
                await feedCollection.updateOne(
                    { _id: feed._id },
                    { $set: { interval: newInterval } }
                );
            }
        }
        
    }
}