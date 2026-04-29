import { IndiekitError } from "@indiekit/error";
import { ObjectId } from "mongodb";
import { mf2tojf2 } from "@paulrobertlloyd/mf2tojf2";
import { load } from "cheerio";
import { getCanonicalUrl } from "@indiekit/util";

export const utils = {
    async findFeeds(url) {
        let canonicalUrl = getCanonicalUrl("", url);
        if (!canonicalUrl.startsWith("http")) {
            canonicalUrl = "https://" + canonicalUrl;
        }
        console.log("Canonical URL:", canonicalUrl);
        const response = await fetch(canonicalUrl);
        const html = await response.text();
        const $ = load(html);
        let feeds = [];
        $('link[rel="alternate"]').each((_, el) => {
            const type = $(el).attr("type");
            const href = $(el).attr("href");

            if (type?.includes("rss") || type?.includes("atom") || type?.includes("json") || type?.includes("mf2+html")) {
                feeds.push(new URL(href, canonicalUrl).href);
            }
        });

        return feeds;
    },

    async detectFeedType(url) {
        const response = await fetch(url);
        const contentType = response.headers.get("Content-Type");

        if (contentType.includes("application/rss+xml")) {
            return "rss";
        } else if (contentType.includes("application/atom+xml")) {
            return "atom";
        } else if (contentType.includes("application/json")) {
            return "jsonfeed";
        } else {
            // Otherwise, need to inspect text
            const text = await response.text();
            if (text.includes("<rss")) {
                return "rss";
            } else if (text.includes("<feed")) {
                return "atom";
            } else if (text.includes("jsonfeed")) {
                return "jsonfeed";
            }
            return "html";
        }
    },

    async convertFeed(url) {
        // Get URL and see if it is RSS, Atom, JSON feed, or h-feed
        const feedType = await this.detectFeedType(url);
        console.log("Detected feed type:", feedType);

        // Ask Granary to convert it to jf2
        const response = await fetch(`https://granary.io/url?input=${feedType}&output=mf2-json&url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new IndiekitError(`Granary error: ${response.statusText}`);
        }
        const mf2 = await response.json();
        console.log("MF2 from Granary:", mf2);
        const jf2 = mf2tojf2(mf2);
        console.log("JF2:", jf2);
        return jf2.children || [];
    },
}