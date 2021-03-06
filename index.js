(function({root, feeds, templates}) {
  var DEFAULT_IMAGE = "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mO8/x8AAsMB4GQLJSgAAAAASUVORK5CYII="

  var domParser = new DOMParser();
  function unencodeHTML(s) {
    return domParser.parseFromString(s, 'text/html').body.textContent;
  }

  function niceDateFormat(d) {
    if (d.startOf('day').isSame(dayjs().startOf('day'))) {
      return d.format("h:mm a");
    } else if (d.startOf('week').isSame(dayjs().startOf('week'))) {
      return d.format("dddd @ h:mm a");
    } else {
      return d.format("YYYY-MM-DD hh:mm a");
    }
  }

  var postProcessors = [{
    // rss2json feeds
    match: f => f.feed && f.feed.url,
    process: f => {
      for (var k in f.feed) {
        f[k] = f[k] || f.feed[k];
      }
      return f;
    }
  }, {
    match: f => f.title && f.title.search(/NPR/),
    process: f => {
      f.items = f.items.map(item => {
        item.image = (item.image || item.thumbnail || '').replace(
          // Optional image type '-' 40-character hash?
          /(_slide|_wide|_custom)?\b(-[^-.]*)(.\w+)(\?.*)$/,
          '$2-s300$3'
        );
        return item;
      });
      return f;
    }
  }, {
    // Smoothing out differences between json and rss feeds
    match: f => true,
    process: f => {
      f.icon = f.icon || f.image;
      f.items = f.items
        .filter(item => item.title)
        .map(item => {
          item.url = item.url || item.link;
          item.date_published = item.date_published || item.pubDate;
          item.image = item.image || (item.enclosure && item.enclosure.link);
          if (item.image) {
            item.image = unencodeHTML(item.image);
          } else {
            item.image = DEFAULT_IMAGE;
          }
          // Formatting
          item.source_icon = f.icon;
          item.timestamp = niceDateFormat(dayjs(item.date_published));
          return item;
        });
      return f;
    }
  }];

  function postProcessFeed(feed) {
    return postProcessors.reduce(
      (f, {match, process}) => (match(f) ? process(f) : f),
      feed
    );
  }

  function displayFeedItems(root, items) {
    items.forEach(item => {
      root.insertAdjacentHTML("beforeend", templates.feedArticle(item));
    });
  }

  function mixFeedItems(feeds) {
    console.log(feeds)
    var result = []
    // Sort longest to shortest
    feeds = [].slice.apply(feeds).sort((a, b) => b.length - a.length);
    for (var i = 0; feeds.length > 0; ++i) {
      // Iterate backwards so we can pop off the shortest feeds as we go
      for (var j = feeds.length - 1; j >= 0; --j) {
        var item = feeds[j][i];
        if (item) {
          result.push(item);
        } else {
          feeds.pop();
        }
      }
    }
    return result;
  }

  var RSS_PROXY = "https://api.rss2json.com/v1/api.json?rss_url="

  function isJSON(url) {
    return url.match(/json$/i);
  }

  function fetchFeedItems(url) {
    if (! isJSON(url)) {
      url = RSS_PROXY + encodeURIComponent(url)
    }
    return fetch(url)
      .then(res => res.json())
      .then(postProcessFeed)
      .then(f => f.items || [])
      .catch(err => {
        console.error(err);
        return [];
      });
  }

  Promise.all(feeds.map(fetchFeedItems))
    .then(mixFeedItems)
    .then(items => displayFeedItems(root, items))
    .catch(console.error.bind(console));

})({
  root: document.getElementById("content"),
  feeds: document.location.search.match(/[?&]feed=[^&]*/g).map(s => s.split(/^.feed=/)[1]),
  templates: {
    feedArticle: Handlebars.compile(`
      <a href="{{url}}">
        <article>
          <div class="text-wrapper">
            <div class="headline">{{title}}</div>
            <div class="source-info">
              <img class="source-image" src="{{source_icon}}">
              <span class="date">{{timestamp}}</span>
            </div>
          </div>
          <img class="main-image" src="{{image}}">
        </article>
      </a>
    `),
  }
});
