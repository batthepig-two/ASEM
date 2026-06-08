#!/usr/bin/env node
/**
 * Pushes the ARK Mutation Helper to GitHub (Batthepig-two/ASEM) in ONE commit.
 * Run: GITHUB_TOKEN=<token> node scripts/push-to-github.mjs
 * Or set GITHUB_TOKEN in env and just: node scripts/push-to-github.mjs
 */

import fs from "fs";
import path from "path";

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("ERROR: GITHUB_TOKEN env var is not set.");
  process.exit(1);
}

const OWNER = "Batthepig-two";
const REPO = "ASEM";
const BRANCH = "main";
const API = "https://api.github.com";

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "ARK-Mutation-Helper-Deploy/1.0",
};

async function ghFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { headers, ...opts });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`GitHub ${opts.method || "GET"} ${path} → ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// Collect all files to push
const ROOT = "/home/runner/workspace/artifacts/ark-mutation-helper";

function collectFiles(dir, base = "") {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".tsbuildinfo" || entry.name === "dist") continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, relPath));
    } else {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

// Files to include (curated list for clean standalone repo)
const INCLUDE_PATHS = [
  "src/",
  ".github/",
  "index.html",
  "tsconfig.json",
];

function shouldInclude(relPath) {
  return INCLUDE_PATHS.some((p) => relPath.startsWith(p) || relPath === p.replace(/\/$/, ""));
}

async function main() {
  console.log(`\n🦖 ARK Mutation Helper → GitHub (${OWNER}/${REPO})\n`);

  // 1. Create repo if needed
  console.log("Creating repo...");
  try {
    await ghFetch("/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name: REPO,
        description: "ARK: Survival Evolved/Ascended Mutation Helper — track breeding lines & mutations",
        private: false,
        auto_init: false,
      }),
    });
    console.log("✓ Repo created");
  } catch (e) {
    if (e.message.includes("already exists") || e.message.includes("name already exists")) {
      console.log("✓ Repo already exists");
    } else {
      throw e;
    }
  }

  // 2. Collect files
  const allFiles = collectFiles(ROOT);
  const files = allFiles.filter((f) => shouldInclude(f.relPath));

  // Also add package.json (from package.gh.json)
  files.push({ fullPath: path.join(ROOT, "package.gh.json"), relPath: "package.json" });
  files.push({ fullPath: path.join(ROOT, "vite.gh.config.ts"), relPath: "vite.config.ts" });

  console.log(`\nPreparing ${files.length} files...`);

  // 3. Create blobs
  const treeItems = [];
  for (const { fullPath, relPath } of files) {
    const content = fs.readFileSync(fullPath);
    const blob = await ghFetch(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({
        content: content.toString("base64"),
        encoding: "base64",
      }),
    });
    treeItems.push({ path: relPath, mode: "100644", type: "blob", sha: blob.sha });
    process.stdout.write(`  ✓ ${relPath}\n`);
  }

  // 4. Get or create base tree SHA
  let baseTreeSha = null;
  let parentSha = null;
  try {
    const ref = await ghFetch(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    parentSha = ref.object.sha;
    const commit = await ghFetch(`/repos/${OWNER}/${REPO}/git/commits/${parentSha}`);
    baseTreeSha = commit.tree.sha;
    console.log(`\nBase commit: ${parentSha.slice(0, 7)}`);
  } catch {
    console.log("\nNo existing commits — creating initial tree");
  }

  // 5. Create tree
  const treePayload = { tree: treeItems };
  if (baseTreeSha) treePayload.base_tree = baseTreeSha;
  const tree = await ghFetch(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify(treePayload),
  });

  // 6. Create commit
  const commitPayload = {
    message: "Initial commit: ARK Mutation Helper — breeding lines, mutation tracker, LocalStorage",
    tree: tree.sha,
  };
  if (parentSha) commitPayload.parents = [parentSha];
  const commit = await ghFetch(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify(commitPayload),
  });

  // 7. Update or create ref
  try {
    await ghFetch(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
  } catch {
    await ghFetch(`/repos/${OWNER}/${REPO}/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: commit.sha }),
    });
  }

  // 8. Enable GitHub Pages
  try {
    await ghFetch(`/repos/${OWNER}/${REPO}/pages`, {
      method: "POST",
      body: JSON.stringify({ source: { branch: BRANCH, path: "/" }, build_type: "workflow" }),
    });
    console.log("\n✓ GitHub Pages enabled (workflow)");
  } catch (e) {
    if (e.message.includes("409") || e.message.includes("already")) {
      console.log("\n✓ GitHub Pages already enabled");
    } else {
      console.log("\n⚠ Pages setup:", e.message.slice(0, 80));
    }
  }

  console.log(`\n✅ Done! Pushed ${files.length} files in 1 commit.`);
  console.log(`   Repo:  https://github.com/${OWNER}/${REPO}`);
  console.log(`   Pages: https://${OWNER.toLowerCase()}.github.io/${REPO}/`);
  console.log(`\n   GitHub Actions will deploy in ~2 minutes.`);
}

main().catch((e) => {
  console.error("\n❌ Error:", e.message);
  process.exit(1);
});
