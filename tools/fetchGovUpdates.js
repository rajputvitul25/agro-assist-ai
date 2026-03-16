#!/usr/bin/env node
/**
 * Simple RSS fetcher that aggregates government RSS feeds and writes
 * a public/gov-updates.json file consumed by the frontend.
 *
 * Usage:
 *  node tools/fetchGovUpdates.js        # run once
 *  node tools/fetchGovUpdates.js --watch  # poll every 5 minutes
 */

import fs from "fs";
import path from "path";
import Parser from "rss-parser";

const OUT_PATH = path.resolve(process.cwd(), "public", "gov-updates.json");
const POLL_INTERVAL = 1000 * 60 * 5; // 5 minutes

const feeds = [
  // Official feeds (examples) - replace with authoritative feeds you prefer.
  // If a feed returns 404, the fetcher will skip it and continue.
  "https://pib.gov.in/Feeds/pressrelease.rss",
  "https://pib.gov.in/Feeds/PressRelese.rss",
  // Google News site-search RSS fallbacks (broader coverage across gov domains)
  "https://news.google.com/rss/search?q=site:gov.in+agriculture&hl=en-IN&gl=IN&ceid=IN:en",
  "https://news.google.com/rss/search?q=site:pib.gov.in&hl=en-IN&gl=IN&ceid=IN:en"
];

const parser = new Parser();

function normalizeItem(item) {
  const id = item.guid || item.link || item.title;
  return {
    id: String(id),
    title: item.title || "",
    description: item.contentSnippet || item.content || "",
    category: "announcement",
    state: "All States",
    datePublished: item.isoDate || item.pubDate || new Date().toISOString(),
    isUrgent: false,
    source: item.creator || item.author || "Government",
    link: item.link || undefined
  };
}

async function fetchOnce() {
  try {
    const allItems = [];
    for (const feedUrl of feeds) {
      try {
        const feed = await parser.parseURL(feedUrl);
        if (feed.items && feed.items.length) {
          for (const it of feed.items) {
            allItems.push(normalizeItem(it));
          }
        }
      } catch (e) {
        console.error(`Failed to fetch feed ${feedUrl}:`, e.message || e);
      }
    }

    // dedupe by link/title
    const map = new Map();
    for (const it of allItems) {
      const key = it.link || it.title;
      if (!map.has(key)) map.set(key, it);
    }

    const items = Array.from(map.values()).sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));

    const out = { lastUpdated: new Date().toISOString(), items };
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
    console.log(`Wrote ${items.length} updates to ${OUT_PATH}`);
  } catch (err) {
    console.error("Error fetching updates:", err);
  }
}

function startWatch() {
  console.log("Starting gov updates watcher. Poll interval:", POLL_INTERVAL / 1000, "s");
  fetchOnce();
  setInterval(fetchOnce, POLL_INTERVAL);
}

const args = process.argv.slice(2);
if (args.includes("--watch")) {
  startWatch();
} else {
  fetchOnce();
}
