import fs from "fs";
import { modelRegistry } from "./src/lib/modelRegistry";

// Read catalog text
const catalogText = fs.readFileSync("catalog_text.txt", "utf-8");

// Parse catalog models
const catalogModels = [];
const lines = catalogText.split("\n");
let currentModel = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const numMatch = line.match(/^(\d{3})\.\s+(.+)$/);
  if (numMatch) {
    if (currentModel) catalogModels.push(currentModel);
    currentModel = {
      num: numMatch[1],
      id: numMatch[2],
      providerId: "",
      providerName: "",
      description: "",
      classification: ""
    };
  } else if (currentModel) {
    if (line.startsWith("제공사 ID:")) {
      const parts = line.split("|");
      currentModel.providerId = parts[0].replace("제공사 ID:", "").trim();
      if (parts[1]) {
        currentModel.providerName = parts[1].replace("표시명:", "").trim();
      }
    } else if (line.startsWith("설명:")) {
      currentModel.description = line.replace("설명:", "").trim();
      // append subsequent lines until next block
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().match(/^\d{3}\./) && !lines[j].trim().startsWith("AI-readable") && !lines[j].trim().startsWith("--")) {
        if (lines[j].trim()) {
          currentModel.description += " " + lines[j].trim();
        }
        j++;
      }
      i = j - 1;
    } else if (line.startsWith("분류 / 수치 분류:")) {
      const parts = line.split("|");
      currentModel.classification = parts[0].replace("분류 / 수치 분류:", "").trim();
    }
  }
}
if (currentModel) catalogModels.push(currentModel);

console.log(`Found ${catalogModels.length} models in PDF catalog.`);
console.log(`Found ${modelRegistry.length} models in modelRegistry.ts.`);

// Find mismatches
console.log("\n--- Comparing Catalog IDs with Registry IDs ---");
const registryIds = new Set(modelRegistry.map(m => m.id));
const catalogIds = new Set(catalogModels.map(m => m.id));

const catalogOnly = catalogModels.filter(m => !registryIds.has(m.id));
const registryOnly = modelRegistry.filter(m => !catalogIds.has(m.id));

console.log(`\nModels in PDF Catalog but NOT in Registry: ${catalogOnly.length}`);
catalogOnly.forEach(m => console.log(`- [${m.num}] ${m.id} (${m.providerName})`));

console.log(`\nModels in Registry but NOT in PDF Catalog: ${registryOnly.length}`);
registryOnly.forEach(m => console.log(`- ${m.id} (${m.displayName})`));
