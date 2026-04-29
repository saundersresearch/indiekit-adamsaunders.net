import process from "node:process";
import * as dotenv from "dotenv";
import { getPostTemplate } from "./lib/post-template.js";

dotenv.config();

const config = {
    application: {
        locale: "en",
        mongodbUrl: process.env.MONGO_URL,
        //...(process.env.RAILWAY_ENVIRONMENT && {
        //    url: `https://${process.env.RAILWAY_STATIC_URL}`,
        //}),
        name: "Adam Saunders IndieKit",
        themeColor: "#1B92B0",
        timeZone: process.env.TZ,
    },
    plugins: [
        "@indiekit/preset-jekyll",
        "@indiekit/store-github",
        "endpoint-microsub"
    ],
    publication: {
        me: process.env.PUBLICATION_URL,
        postTemplate: getPostTemplate,
        // See README.md
        channels: {
            default: {
                name: "Default",
            },
            mastodon: {
                name: "Mastodon via Bridgy",
            },
            bluesky: {
                name: "Bluesky via Bridgy",
            },
            bridgy_fed: {
                name: "Bridgy Fed",
            },
            indienews: {
                name: "IndieNews"
            }
        },
        enrichPostData: true,
        postTypes: {
            article: {
                post: {
                    path: "_posts/{yyyy}-{MM}-{dd}-{slug}.md",
                    url: "posts/{yyyy}/{MM}/{dd}/{slug}",
                },
                media: {
                    path: "assets/images/posts/{filename}.{ext}",
                    url: "assets/images/posts/{filename}.{ext}",
                }
            },
            bookmark: {
                post: {
                    path: "_notes/{t}.md",
                    url: "notes/{yyyy}/{MM}/{dd}/{t}",
                },
                media: {
                    path: "assets/images/notes/{filename}.{ext}",
                    url: "assets/images/notes/{filename}.{ext}",
                }
            },
            like: {
                post: {
                    path: "_notes/{t}.md",
                    url: "notes/{yyyy}/{MM}/{dd}/{t}",
                },
                media: {
                    path: "assets/images/notes/{filename}.{ext}",
                    url: "assets/images/notes/{filename}.{ext}",
                }
            },
            note: {
                post: {
                    path: "_notes/{t}.md",
                    url: "notes/{yyyy}/{MM}/{dd}/{t}",
                },
                media: {
                    path: "assets/images/notes/{filename}.{ext}",
                    url: "assets/images/notes/{filename}.{ext}",
                }
            },
            photo: {
                post: {
                    path: "_notes/{t}.md",
                    url: "notes/{yyyy}/{MM}/{dd}/{t}",
                },
                media: {
                    path: "assets/images/notes/{filename}.{ext}",
                    url: "assets/images/notes/{filename}.{ext}",
                }
            },
            reply: {
                post: {
                    path: "_notes/{t}.md",
                    url: "notes/{yyyy}/{MM}/{dd}/{t}",
                },
                media: {
                    path: "assets/images/notes/{filename}.{ext}",
                    url: "assets/images/notes/{filename}.{ext}",
                }
            },
            repost: {
                post: {
                    path: "_notes/{t}.md",
                    url: "notes/{yyyy}/{MM}/{dd}/{t}",
                },
                media: {
                    path: "assets/images/notes/{filename}.{ext}",
                    url: "assets/images/notes/{filename}.{ext}",
                }
            },
        },
    },
    "@indiekit/store-github": {
        user: process.env.GITHUB_USER,
        repo: process.env.GITHUB_REPO,
        branch: process.env.GITHUB_BRANCH,
        token: process.env.GITHUB_TOKEN,
    },
    "endpoint-microsub": {
        mountPath: "/microsub"
    }
};

export default config;
