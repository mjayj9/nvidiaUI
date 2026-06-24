async function test() {
  const models = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-3-medium"
  ]
  
  for (const m of models) {
    console.log("testing", m);
    const res = await fetch("https://integrate.api.nvidia.com/v1/images/generations", {
      method: "POST",
      headers: { 
        "Authorization": "Bearer TEST", 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ prompt: "A beautiful sunset over the mountains", model: m })
    });
    console.log(res.status, await res.text());
  }
}
test();
