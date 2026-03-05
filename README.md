# Indiekit server for <https://adamsaunders.net>

Learn more at <https://getindiekit.com>

## Notes

Several tools like [IndieNews](https://news.indieweb.org/), [Bridgy](https://brid.gy/), and [Bridgy Fed](https://fed.brid.gy/) require a link with a webmention in order to function. It's difficult to add this link using IndieKit's syndication endpoint because the `mp-syndicate-to` property is not exposed to the template. As a workaround, I transform the `channel` property to add the appropriate `syndicate_to` property in the frontmatter to allow the [Jekyll Webmention.io](https://aarongustafson.github.io/jekyll-webmention_io/) plug-in to add these links and send these webmentions on my behalf. Ideally, I eventually should add this functionality as a syndication endpoint to IndieKit.