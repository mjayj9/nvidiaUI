import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

async function run() {
  try {
    const pdfPath = "c:/Users/admin/Desktop/Microsoft VS Code/nvidiaUI/AI_가독형_모델_카탈로그.pdf";
    console.log("Loading PDF from:", pdfPath);
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Create PDFParse instance with Uint8Array
    const uint8Array = new Uint8Array(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.byteLength);
    const parser = new pdf.PDFParse(uint8Array);
    console.log("Parser created. Calling getText()...");
    const textResult = await parser.getText();
    console.log("Text extracted successfully!");
    console.log("Keys in textResult:", Object.keys(textResult));
    console.log("Sample text length:", textResult.text ? textResult.text.length : "undefined");
    if (textResult.text) {
      console.log("First 500 chars:\n", textResult.text.substring(0, 500));
      fs.writeFileSync("catalog_text.txt", textResult.text, "utf-8");
      console.log("Saved full text to catalog_text.txt");
    }
  } catch (err) {
    console.error("Error during PDF parsing:", err);
  }
}

run();
