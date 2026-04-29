import { IndiekitError } from "@indiekit/error";
import { ObjectId } from "mongodb";

export const channelData = {
    async create(application, name) {
        const channelCollection = application?.collections?.get("microsub-channels");
        console.log("Creating channel with name:", name);
        const result = await channelCollection.findOneAndUpdate(
            { name },
            { $setOnInsert: { name } },
            { upsert: true, returnDocument: "after" }
        );
        console.log("Result of findOneAndUpdate:", result);
        const doc = result.value ?? result;
        return {
            status: 200,
            json: {
                uid: doc._id.toString(),
                name: doc.name,
            }
        };
    },

    async update(application, uid, name) {
        const channelCollection = application?.collections?.get("microsub-channels");
        const newData = { name };
        const query = { _id: new ObjectId(uid) };
        await channelCollection.replaceOne(query, newData);
        return {
            status: 200,
            json: {
                uid: uid,
                name: name,
            }
        };
    },
    
    async delete(application, uid) {
        const channelCollection = application?.collections?.get("microsub-channels");
        const query = { _id: new ObjectId(uid) };
        await channelCollection.deleteOne(query);
        return {
            status: 200,
        };
    },

    async findAll(application) {
        const channelCollection = application?.collections?.get("microsub-channels");

        // Add notifications channel if not already there
        const result = await channelCollection.findOneAndUpdate(
            { name: "Notifications" },
            { $setOnInsert: { name: "Notifications" } },
            { upsert: true, returnDocument: "after" }
        );
        
        let channels = await channelCollection.find({}).toArray();

        // Need to return list "channels" with "uid", "name", and "unread" 
        channels = channels.map(channel => ({
            uid: channel._id.toString(),
            name: channel.name
        }));
        return {
            status: 200,
            json: {
                channels: channels,
            }
        };
    }
}