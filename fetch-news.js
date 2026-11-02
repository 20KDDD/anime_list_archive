#!/usr/bin/env node
/* ============================================================================
   Cel Archive — news fetcher
   Runs in GitHub Actions (server-side, so no browser CORS limits and no API
   key). Pulls a few anime-news RSS feeds, merges + de-dupes them, and writes
   news.json at the repo root. Your site reads that file same-origin.

   ADD / REMOVE SOURCES: edit the FEEDS list below. Each feed that fails to load
   is just skipped, so a dead URL never breaks the build.

   Test the parser without network:   node scripts/fetch-news.js --selftest
   ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");

const FEEDS = [
  { url: "https://www.animenewsnetwork.com/all/rss.xml", source: "ANN" },
  { url: "https://www.animenewsnetwork.com/newsroom/rss.xml", source: "ANN" },
  // Add more RSS feeds here, e.g. a Crunchyroll or studio feed:
  // { url: "https://www.crunchyroll.com/news/rss", source: "Crunchyroll" },
];

const MAX_ITEMS = 60;
const SUMMARY_LEN = 220;

function decode(s) {
  return String(s == null ? "" : s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}
function stripTags(s) { return decode(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
function pick(block, tag) {
  const m = block.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "i"));
  return m ? m[1] : "";
}
function pickLink(block) {
  // RSS <link>url</link>, or Atom <link href="url"/>
  let m = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (m && m[1].trim()) return decode(m[1].trim());
  m = block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  return m ? decode(m[1]) : "";
}
function pickImage(block) {
  let m = block.match(/<enclosure[^>]*url="([^"]+)"[^>]*>/i)
    || block.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"[^>]*>/i)
    || block.match(/<img[^>]*src="([^"]+)"/i);
  return m ? decode(m[1]) : "";
}
function toISO(d) { const t = new Date(d); return isNaN(t) ? "" : t.toISOString(); }

function parseFeed(xml, source) {
  const items = [];
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) || [];
  for (const block of blocks) {
    const title = stripTags(pick(block, "title"));
    const link = pickLink(block);
    if (!title || !link) continue;
    const date = toISO(decode(pick(block, "pubDate") || pick(block, "updated") || pick(block, "published") || pick(block, "dc:date")));
    let summary = stripTags(pick(block, "description") || pick(block, "summary") || pick(block, "content"));
    if (summary.length > SUMMARY_LEN) summary = summary.slice(0, SUMMARY_LEN - 1).trimEnd() + "…";
    items.push({ title, link, source, date, summary, image: pickImage(block) });
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "CelArchiveNewsBot/1.0 (+github pages)", "Accept": "application/rss+xml, application/xml, text/xml, */*" },
    });
    if (!res.ok) { console.warn("skip", feed.url, res.status); return []; }
    const xml = await res.text();
    const items = parseFeed(xml, feed.source);
    console.log("ok  ", feed.url, items.length, "items");
    return items;
  } catch (e) { console.warn("fail", feed.url, e.message); return []; }
}

async function main() {
  const all = [];
  for (const feed of FEEDS) all.push(...await fetchFeed(feed));
  // de-dupe by link, keep the first (feeds listed by priority)
  const seen = {}, merged = [];
  for (const it of all) { const k = it.link; if (k && !seen[k]) { seen[k] = 1; merged.push(it); } }
  merged.sort((a, b) => (new Date(b.date) || 0) - (new Date(a.date) || 0));
  const out = { updated: new Date().toISOString(), count: Math.min(merged.length, MAX_ITEMS), items: merged.slice(0, MAX_ITEMS) };
  const dest = path.join(process.cwd(), "news.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log("wrote", dest, "with", out.items.length, "items");
  if (!out.items.length) console.warn("NOTE: no items — check the FEED urls are reachable.");
}

/* ---- self-test: parse a sample feed offline ---- */
if (process.argv.includes("--selftest")) {
  const sample = `<?xml version="1.0"?><rss><channel>
    <item><title><![CDATA[Solo Leveling Season 3 Delayed]]></title>
      <link>https://example.com/sl3</link><pubDate>Sat, 01 Nov 2026 18:00:00 +0000</pubDate>
      <description><![CDATA[<p>The studio announced a <b>delay</b> to 2027.</p>]]></description>
      <enclosure url="https://example.com/img.jpg" type="image/jpeg"/></item>
    <item><title>New Chainsaw Man Film</title><link>https://example.com/csm</link>
      <pubDate>Fri, 31 Oct 2026 12:00:00 +0000</pubDate><description>A sequel film is in production.</description></item>
  </channel></rss>`;
  console.log(JSON.stringify(parseFeed(sample, "ANN"), null, 2));
  process.exit(0);
}

main();
