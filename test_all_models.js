import fs from 'fs';

const fileContent = fs.readFileSync('src/models.ts', 'utf8');
const idRegex = /id:\s*"([^"]+)"/g;
let match;
const ids = [];
while ((match = idRegex.exec(fileContent)) !== null) {
  ids.push(match[1]);
}

async function test() {
  for (const m of ids) {
    // Only check if we think it's text/coding/reasoning/tool-calling
    // We can just check all, if it's 404 we print it.
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: 'POST',
      headers: { "Authorization": "Bearer TEST", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: m,
        messages: [{ role: "user", content: "Hi" }]
      })
    });
    const status = res.status;
    const text = await res.text();
    if (status === 404 || status === 410) {
      console.log("FAILED to find chat endpoint:", m, status, text.slice(0, 50));
    }
  }
}
test();
