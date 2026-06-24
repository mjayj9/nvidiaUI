async function test() {
  const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
    headers: { "Authorization": "Bearer TEST" }
  });
  const data = await res.json();
  const found = data.data.find(m => m.id.includes("flux") || m.id.includes("schnell"));
  console.log(found);
}
test();
