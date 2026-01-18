import { tafqeet } from "./Tafqeet";

/*
 Converts number with decimals to:
 "خمسة دنانير و ثلاثون قرشاً"
*/
export function moneyTafqeet(amount) {
  if (!amount) return "";

  const num = Number(amount).toFixed(3); // 0.000 → full precision
  const [intPart, decRaw] = num.split(".");
  const dec = String(Math.round(Number("0." + decRaw) * 100)).padStart(2, "0"); // convert 3 decimals → 2 decimals

  let text = "";

  // Integer part
  if (parseInt(intPart) > 0) {
    text += `${tafqeet(intPart)} دينار`;
    if (parseInt(intPart) !== 1) text += "اً"; // add tanween only when plural-ish
  }

  // Decimals (0–99 only)
  if (parseInt(dec) > 0) {
    if (text.length > 0) text += " و ";
    text += `${tafqeet(dec)} قرشاً`;
  }

  return text;
}
