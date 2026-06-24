async function test() {
  const payload = {
    text_prompts: [
      { text: "A beautiful sunset over the mountains" }
    ],
    seed: 0,
    sampler: "K_EULER_ANCESTRAL",
    steps: 50
  };
  
  const res = await fetch("https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium", {
    method: "POST",
    headers: { 
      "Authorization": "Bearer TEST", 
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload)
  });
  console.log(res.status, await res.text());
}
test();
