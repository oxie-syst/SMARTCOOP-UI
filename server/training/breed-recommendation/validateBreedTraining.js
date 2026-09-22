const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "breed_training_data.jsonl"
);

const content = fs.readFileSync(filePath, "utf8");

const lines = content
  .split("\n")
  .map(line => line.trim())
  .filter(Boolean);

let validCount = 0;
let errorCount = 0;

lines.forEach((line, index) => {
  try {
    const record = JSON.parse(line);

    if (!record.input || !record.output) {
      throw new Error("Missing input or output");
    }

    JSON.parse(record.output);

    console.log(`✅ Line ${index + 1}: Valid`);
    validCount++;
  } catch (error) {
    console.log(
      `❌ Line ${index + 1}: ${error.message}`
    );

    errorCount++;
  }
});

console.log("");
console.log(`Total records: ${lines.length}`);
console.log(`Valid records: ${validCount}`);
console.log(`Errors: ${errorCount}`);

if (errorCount === 0) {
  console.log("✅ Training dataset is valid.");
} else {
  console.log("❌ Fix the errors before training.");
}