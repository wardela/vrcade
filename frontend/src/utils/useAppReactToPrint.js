import { useReactToPrint as useBaseReactToPrint } from "react-to-print";
import { wrapReactToPrintOptions } from "./electronDocumentPrint";

export function useReactToPrint(options) {
  return useBaseReactToPrint(wrapReactToPrintOptions(options));
}
