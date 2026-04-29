import { IndiekitError } from "@indiekit/error";
import { channelData } from "../channels.js";
import { feedData } from "../feeds.js";
import { entryData } from "../entries.js";
import { utils } from "../utils.js";

export const actionController = async (req, res, next) => {
    const params = {
        ...req.query,
        ...req.body,
    };
    const { application } = req.app.locals;

    console.log("Action:", params.action);
    let content;

    try {
        switch (params.action) {
            case "channels":
                // If method=delete, we are deleting
                if (params.method === "delete") {
                    content = await channelData.delete(application, params.channel);
                }
                // If params.channel, we are updating
                else if (params.channel) {
                    content = await channelData.update(
                        application,
                        params.channel,
                        params.name
                    );
                }
                // If nothing else, we are adding
                else {
                    content = await channelData.create(application, params.name);
                }
                break;

            case "follow":
                if (!params.url || !params.channel) {
                    throw new IndiekitError(
                        res.locals.__("BadRequestError.missingParameter", "url or channel")
                    );
                }
                content = await feedData.follow(application, params.channel, params.url);
                break;

            case "unfollow":
                content = await feedData.unfollow(application, params.channel, params.url);
                break;

            case "preview":
                if (!params.url) {
                    throw new IndiekitError(
                        res.locals.__("BadRequestError.missingParameter", "url")
                    );
                }
                let jf2 = await utils.convertFeed(params.url);
                content = {
                    status: 200,
                    json: {
                        items: jf2,
                    }
                };
                break;

            case "search":
                if (!params.query) {
                    throw new IndiekitError(
                        res.locals.__("BadRequestError.missingParameter", "url")
                    );
                }
                console.log("Searching for feeds at URL:", params.query);
                const feeds = await utils.findFeeds(params.query);
                content = {
                    status: 200,
                    json: {
                        items: feeds.map(url => ({
                            type: "feed",
                            url,
                        })),
                    }
                };
                break;
            
            case "timeline":
                if (!params.channel || !params.method) {
                    throw new IndiekitError(
                        res.locals.__("BadRequestError.missingParameter", "channel or method")
                    );
                }
                if (params.method == "mark_read") {
                    content = await entryData.markRead(application, params.channel, params.entry, params.last_read_entry);
                } else if (params.method == "mark_unread") {
                    content = await entryData.markUnread(application, params.channel, params.entry);
                }
                break;

            default:
                throw new IndiekitError(
                    res.locals.__("NotImplementedError.action", params.action)
                );
        }

        console.log("Content:", content);
        res.status(content.status).json(content.json);

    } catch (error) {
        let nextError = error;

        if (error.name === "NotFoundError") {
            nextError = IndiekitError.notFound(
                res.locals.__("NotFoundError.record", error.message)
            );
        }

        if (error.name === "NotImplementedError") {
            nextError = IndiekitError.notImplemented(
                res.locals.__("NotImplementedError.action", error.message)
            );
        }

        return next(nextError);
    }
};