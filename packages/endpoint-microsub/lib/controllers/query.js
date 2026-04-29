import { IndiekitError } from "@indiekit/error";
import { channelData } from "../channels.js";
import { ObjectId } from "mongodb";
import { feedData } from "../feeds.js";
import { entryData } from "../entries.js";
import e from "express";

export const queryController = async (req, res, next) => {
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
                content = await channelData.findAll(application);
                break;

            case "follow":
                if (!params.channel) {
                    throw new IndiekitError(
                        res.locals.__("BadRequestError.missingParameter", "channel")
                    );
                }
                content = await feedData.findAll(application, params.channel);
                break;

            case "timeline":
                const limit = params.limit ? parseInt(params.limit) : 20;
                content = await entryData.getTimeline(application, params.channel, params.before, params.after, limit);
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