async function test() {
  const m = "meta/llama-3.2-90b-vision-instruct";
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: 'POST',
    headers: { "Authorization": "Bearer TEST", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: m,
      messages: [{ role: "user", content: "Hi" }]
    })
  });
  console.log(res.status, await res.text().then(t => t.slice(0, 50)));
}
test();
