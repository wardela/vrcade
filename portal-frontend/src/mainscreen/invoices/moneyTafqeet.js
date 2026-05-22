import { tafqeet } from "./Tafqeet";

export function moneyTafqeet(amount) {
  if (!amount) return "";

  const num = Number(amount).toFixed(3);
  const [intPart, decRaw] = num.split(".");
  const dec = String(Math.round(Number(`0.${decRaw}`) * 100)).padStart(2, "0");

  let text = "";

  if (parseInt(intPart, 10) > 0) {
    text += `${tafqeet(intPart)} دينار`;
    if (parseInt(intPart, 10) !== 1) text += "اً";
  }

  if (parseInt(dec, 10) > 0) {
    if (text.length > 0) text += " و ";
    text += `${tafqeet(dec)} قرشاً`;
  }

  return text;
}
