(function({root, feeds, templates}) {

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
    match: f => (f.author && f.author.name === "NPR"),
    process: f => {
      f.items = f.items.map(item => {
        item.image = (item.image || '').replace(
          // Optional image type '-' 40-character hash?
          /(_slide|_wide|_custom)?\b(-[^-.]*)(.\w+)$/,
          '$2-s300$3'
        );
        item.timestamp = niceDateFormat(dayjs(item.date_published));
        item.source_icon = f.icon;
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

  function displayFeed(root, feed) {
    feed.items.forEach(item => {
      root.insertAdjacentHTML("beforeend", templates.feedArticle(item));
    });
  }

  feeds.forEach(url => {
    fetch(url)
      .then(res => res.json())
      .then(postProcessFeed)
      .then(feed => displayFeed(root, feed))
    .catch(console.error.bind(console));
  });

})({
  root: document.getElementById("content"),
  feeds: document.location.search.match(/[?&]feed=[^&]*/g).map(s => s.split('=')[1]),
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
