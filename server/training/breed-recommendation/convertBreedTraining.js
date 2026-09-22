const fs = require("fs");
const path = require("path");

const inputFile = path.join(
  __dirname,
  "breed_training_data.jsonl"
);

const outputFile = path.join(
  __dirname,
  "breed_vertex_training.jsonl"
);

const content = fs.readFileSync(inputFile, "utf8");

const lines = content
  .split("\n")
  .map(line => line.trim())
  .filter(Boolean);

const converted = lines.map((line, index) => {
  const record = JSON.parse(line);

  if (!record.input || !record.output) {
    throw new Error(
      `Invalid training record at line ${index + 1}`
    );
  }

  return JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: record.input
          }
        ]
      },
      {
        role: "model",
        parts: [
          {
            text: record.output
          }
        ]
      }
    ]
  });
});

fs.writeFileSync(
  outputFile,
  converted.join("\n"),
  "utf8"
);

console.log("");
console.log("✅ Vertex AI dataset created successfully.");
console.log(`Original records: ${lines.length}`);
console.log(`Converted records: ${converted.length}`);
console.log("");
console.log(`Output: ${outputFile}`);