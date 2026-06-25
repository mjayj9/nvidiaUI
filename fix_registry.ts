import fs from 'fs';
import { modelRegistry } from './src/lib/modelRegistry';

// Provider → NVIDIA API prefix mapping
const providerPrefixMap: Record<string, string> = {
  'minimaxai': 'minimaxai',
  'google': 'google',
  'nvidia': 'nvidia',
  'stepfun-ai': 'stepfun-ai',
  'moonshotai': 'moonshotai',
  'mistralai': 'mistralai',
  'deepseek-ai': 'deepseek-ai',
  'z-ai': 'z-ai',
  'qwen': 'qwen',
  'bytedance': 'bytedance',
  'openai': 'openai',
  'meta': 'meta',
  'Sarvamai': 'sarvamai',
  'Stockmark': 'stockmark',
  'microsoft': 'microsoft',
  'Abacus.AI': 'abacusai',
  'upstage': 'upstage',
  'blackforestlabs': 'black-forest-labs',
  'stabilityai': 'stabilityai',
};

// FullName corrections: old → new (proper casing, abbreviations, etc.)
const fullNameFixes: Record<string, string> = {
  'Minimax M3': 'MiniMax M3 Preview',
  'Diffusiongemma 26B A4b It': 'DiffusionGemma 26B A4B IT',
  'Nemotron 3 Ultra 550B A55b': 'Nemotron 3 Ultra 550B A55B',
  'Cosmos3 Nano Reasoner': 'Cosmos3 Nano Reasoner',
  'Nemotron 3 Nano Omni 30B A3b Reasoning': 'Nemotron 3 Nano Omni 30B A3B Reasoning',
  'Deepseek V4 Flash': 'DeepSeek V4 Flash',
  'Deepseek V4 Pro': 'DeepSeek V4 Pro',
  'Glm 5.1': 'GLM 5.1',
  'Ising Calibration 1 35B A3b': 'Ising Calibration 1 35B A3B',
  'Minimax M2.7': 'MiniMax M2.7',
  'Gemma 4 31B It': 'Gemma 4 31B IT',
  'Mistral Small 4 119B 2603': 'Mistral Small 4 119B 2603',
  'Nemotron 3 Super 120B A12b': 'Nemotron 3 Super 120B A12B',
  'Qwen3.5 122B A10b': 'Qwen 3.5 122B A10B',
  'Gliner Pii': 'GLiNER PII',
  'Cosmos Transfer2.5 2B': 'Cosmos Transfer 2.5 2B',
  'Qwen3.5 397B A17b': 'Qwen 3.5 397B A17B',
  'Nemotron 3 Nano 30B A3b': 'Nemotron 3 Nano 30B A3B',
  'Riva Translate 4B Instruct V1_1': 'Riva Translate 4B Instruct v1.1',
  'Streampetr': 'StreamPETR',
  'Nemotron Nano 12B V2 Vl': 'Nemotron Nano 12B v2 VL',
  'Llama 3.1 Nemotron Safety Guard 8B V3': 'Llama 3.1 Nemotron Safety Guard 8B v3',
  'Qwen3 Next 80B A3b Instruct': 'Qwen3-Next 80B A3B Instruct',
  'Seed Oss 36B Instruct': 'Seed-OSS 36B Instruct',
  'Nvidia Nemotron Nano 9B V2': 'Nemotron Nano 9B v2',
  'Gpt Oss 20B': 'GPT-OSS 20B',
  'Gpt Oss 120B': 'GPT-OSS 120B',
  'Llama 3.3 Nemotron Super 49B V1.5': 'Llama 3.3 Nemotron Super 49B v1.5',
  'Sarvam M': 'Sarvam-M',
  'Gemma 3N E4b It': 'Gemma 3n E4B IT',
  'Gemma 3N E2b It': 'Gemma 3n E2B IT',
  'Magpie Tts Zeroshot': 'Magpie TTS Zero-Shot',
  'Sparsedrive': 'SparseDrive',
  'Bevformer': 'BEVFormer',
  'Llama 3.3 Nemotron Super 49B V1': 'Llama 3.3 Nemotron Super 49B v1',
  'Llama 3.1 Nemotron Nano 8B V1': 'Llama 3.1 Nemotron Nano 8B v1',
  'Nv Embedcode 7B V1': 'NV-EmbedCode 7B v1',
  'Phi 4 Mini Instruct': 'Phi-4 Mini Instruct',
  'Phi 4 Multimodal Instruct': 'Phi-4 Multimodal Instruct',
  'Llama 3.1 Nemotron Nano Vl 8B V1': 'Llama 3.1 Nemotron Nano VL 8B v1',
  'Esm2 650M': 'ESM2 650M',
  'Gemma 2 2B It': 'Gemma 2 2B IT',
  'Nv Embed V1': 'NV-Embed v1',
  'Solar 10.7b Instruct': 'Solar 10.7B Instruct',
  'Paligemma': 'PaLiGemma',
  'Rerank Qa Mistral 4B': 'Rerank QA Mistral 4B',
  'Esmfold': 'ESMFold',
  'Mixtral 8x7b Instruct V0.1': 'Mixtral 8x7B Instruct v0.1',
};

// Read the raw file content
let content = fs.readFileSync('src/lib/modelRegistry.ts', 'utf-8');

// 1. Add provider prefix to model IDs
let idFixCount = 0;
for (const model of modelRegistry) {
  if (model.id.includes('/')) continue; // already has prefix (image gen models)
  
  const prefix = providerPrefixMap[model.provider] || model.provider.toLowerCase();
  const newId = `${prefix}/${model.id}`;
  
  const oldPattern = `"id": "${model.id}"`;
  const newPattern = `"id": "${newId}"`;
  
  if (content.includes(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    idFixCount++;
  } else {
    console.warn(`WARNING: Could not find ID pattern for: ${model.id}`);
  }
}

// 2. Fix fullName values
let nameFixCount = 0;
for (const [oldName, newName] of Object.entries(fullNameFixes)) {
  if (oldName === newName) continue;
  const oldPattern = `"fullName": "${oldName}"`;
  const newPattern = `"fullName": "${newName}"`;
  
  if (content.includes(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    nameFixCount++;
  } else {
    console.warn(`WARNING: Could not find fullName pattern for: "${oldName}"`);
  }
}

// Write the updated file
fs.writeFileSync('src/lib/modelRegistry.ts', content, 'utf-8');

console.log(`\n✅ modelRegistry.ts updated successfully!`);
console.log(`   - ${idFixCount} model IDs fixed with provider prefix`);
console.log(`   - ${nameFixCount} fullName values corrected`);

// Print a sample of the changes
console.log('\n--- Sample updated models ---');
const updatedContent = fs.readFileSync('src/lib/modelRegistry.ts', 'utf-8');
const sampleIds = ['gpt-oss-20b', 'glm-5.1', 'deepseek-v4-flash', 'llama-3.1-70b-instruct', 'esm2-650m'];
for (const sid of sampleIds) {
  // Find the new id
  for (const m of modelRegistry) {
    if (m.id === sid) {
      const prefix = providerPrefixMap[m.provider] || m.provider.toLowerCase();
      const newId = `${prefix}/${m.id}`;
      const newFullName = fullNameFixes[m.fullName || ''] || m.fullName;
      console.log(`  ${m.id} → ${newId} (fullName: "${newFullName}")`);
    }
  }
}
