import { parseExpense } from "./src/parser/parseExpense";

const input = "comida parrilla coreana 163000";
const result = parseExpense(input);

console.log("Input:", input);
console.log("Result:", JSON.stringify(result, null, 2));

if (result.success) {
    console.log("✅ Success!");
} else {
    console.log("❌ Failure!");
}
