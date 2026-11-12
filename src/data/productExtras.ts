import type { TechnicalSpec } from "../types";

/** UI-only extras from last semester (specs/category), keyed by product title. */
export const productExtrasByTitle: Record<
  string,
  {
    category?: string;
    description?: string;
    images?: string[];
    technicalSpecs?: TechnicalSpec[];
  }
> = {
  "Exterior Paint Set": {
    category: "Paint & Coatings",
    technicalSpecs: [
      { label: "VOLUME", value: "5 gallons total" },
      { label: "TYPE", value: "100% Acrylic Latex" },
      { label: "COVERAGE", value: "400 sq ft per gallon" },
      { label: "FINISH", value: "Satin" },
      { label: "DRY TIME", value: "2-4 hours" },
      { label: "COLORS", value: "Assorted neutral tones" },
    ],
  },
  "Plywood Sheets": {
    category: "Wood & Lumber",
    technicalSpecs: [
      { label: "DIMENSIONS", value: "4' x 8'" },
      { label: "THICKNESS", value: "3/4 inch" },
      { label: "GRADE", value: "CDX" },
      { label: "PLIES", value: "7-ply construction" },
      { label: "EXPOSURE", value: "Exterior grade" },
      { label: "VENEER", value: "Softwood" },
    ],
  },
  "Premium Cement Bags": {
    category: "Cement & Concrete",
    technicalSpecs: [
      { label: "WEIGHT", value: "50 lbs per bag" },
      { label: "TYPE", value: "Portland Cement Type I/II" },
      { label: "COMPRESSIVE STRENGTH", value: "3500 PSI at 28 days" },
      { label: "SETTING TIME", value: "2-4 hours initial set" },
      { label: "COVERAGE", value: "Approximately 0.45 cubic feet" },
      { label: "STORAGE LIFE", value: "6 months in sealed bag" },
    ],
  },
  "Premium Lumber Planks": {
    category: "Wood & Lumber",
    technicalSpecs: [
      { label: "DIMENSIONS", value: '2" x 6" x 8\'' },
      { label: "WOOD TYPE", value: "Douglas Fir" },
      { label: "GRADE", value: "Premium Select" },
      { label: "MOISTURE CONTENT", value: "15% kiln-dried" },
      { label: "TREATMENT", value: "Pressure-treated option available" },
      { label: "QUANTITY", value: "Sold individually" },
    ],
  },
  "Red Clay Bricks": {
    category: "Bricks & Blocks",
    technicalSpecs: [
      { label: "DIMENSIONS", value: '8" x 4" x 2.25"' },
      { label: "MATERIAL", value: "Fire-hardened clay" },
      { label: "COMPRESSIVE STRENGTH", value: "3000+ PSI" },
      { label: "WATER ABSORPTION", value: "Less than 8%" },
      { label: "COLOR", value: "Classic red" },
      { label: "WEIGHT", value: "4.5 lbs per brick" },
    ],
  },
  "Steel I-Beams": {
    category: "Steel & Metal",
    technicalSpecs: [
      { label: "LENGTH", value: "20 feet" },
      { label: "PROFILE", value: "W10x49" },
      { label: "MATERIAL", value: "ASTM A992 Grade 50 Steel" },
      { label: "WEIGHT", value: "980 lbs" },
      { label: "YIELD STRENGTH", value: "50 ksi" },
      { label: "FINISH", value: "Mill finish" },
    ],
  },
};

export const SPEC_COLUMNS_BY_TITLE: Record<
  string,
  { left: string[]; right: string[] }
> = {
  "Plywood Sheets": {
    left: ["DIMENSIONS", "GRADE", "EXPOSURE"],
    right: ["THICKNESS", "PLIES", "VENEER"],
  },
  "Premium Cement Bags": {
    left: ["WEIGHT", "COMPRESSIVE STRENGTH", "COVERAGE"],
    right: ["TYPE", "SETTING TIME", "STORAGE LIFE"],
  },
  "Premium Lumber Planks": {
    left: ["DIMENSIONS", "GRADE", "TREATMENT"],
    right: ["WOOD TYPE", "MOISTURE CONTENT", "QUANTITY"],
  },
  "Red Clay Bricks": {
    left: ["DIMENSIONS", "COMPRESSIVE STRENGTH", "COLOR"],
    right: ["MATERIAL", "WATER ABSORPTION", "WEIGHT"],
  },
  "Steel I-Beams": {
    left: ["LENGTH", "MATERIAL", "YIELD STRENGTH"],
    right: ["PROFILE", "WEIGHT", "FINISH"],
  },
};
