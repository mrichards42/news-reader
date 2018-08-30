# News Reader

A simple json feed reader designed to look similar to the Chrome Android start
page.

## Usage

Specify feeds in the query string, as `feed=<url>`

https://mrichards42.github.io/news-reader/?feed=https://www.npr.org/feeds/1001/feed.json

RSS feeds are fetched via [rss2json](https://rss2json.com)

https://mrichards42.github.io/news-reader/?feed=https://www.theguardian.com/us/rss

Multiple feeds are allowed:

https://mrichards42.github.io/news-reader/?feed=https://www.theguardian.com/us/rss&feed=https://www.npr.org/feeds/1001/feed.json
