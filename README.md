# Gutsy DevOps Dashboard

Gutsy is an app for an out-of-the-box DevOps Dashboard built on top of a
[DevOps JSON URI](/racker/devopsjson).

The goal is to reflect not only the most recent raw devops.json data,
but also to realize related links such as on-call rotations.

[Demo](http://gutsy.nodejitsu.com/)

## Crawl a devops.json endpoint

Save a devops.json endpoint to file using the crawler:

```
cp settings.js.example settings.js
mkdir fixtures
./bin/crawl
```

## Website

Run the web app:

```
npm start
```

Then go to: [http://localhost:3000](http://localhost:3000)

## Tests

```
npm test
```

In order for `--coverage` to work, you'll need to install [node-jscoverage](https://github.com/Kami/node-jscoverage ).

To run tests without installing jscoverage:

```
./bin/test-nocov
```
