import type { Product } from "../types";

export const products: Product[] = [
  {
    id: "5",
    name: "Exterior Paint Set",
    price: 45.99,
    rating: 3.5,
    category: "Paint & Coatings",
    imageUrl:
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863678/stroyka/products/exterior-paint-set/1-paint-can.jpg",
    images: [
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863678/stroyka/products/exterior-paint-set/1-paint-can.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866570/stroyka/products/exterior-paint-set/2-paint-roller.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866573/stroyka/products/exterior-paint-set/3-painted-interior.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866578/stroyka/products/exterior-paint-set/4-painted-interior-alt.jpg",
    ],
    description:
      "Professional-grade exterior paint set designed to withstand harsh weather conditions. This premium paint offers excellent coverage, durability, and color retention. Perfect for residential and commercial applications.",
    technicalSpecs: [
      { label: "VOLUME", value: "5 gallons total" },
      { label: "TYPE", value: "100% Acrylic Latex" },
      { label: "COVERAGE", value: "400 sq ft per gallon" },
      { label: "FINISH", value: "Satin" },
      { label: "DRY TIME", value: "2-4 hours" },
      { label: "COLORS", value: "Assorted neutral tones" },
    ],
  },
  {
    id: "2",
    name: "Plywood Sheets",
    price: 52.99,
    rating: 4.5,
    category: "Wood & Lumber",
    imageUrl:
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863679/stroyka/products/plywood-sheets/1-plywood-board.jpg",
    images: [
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863679/stroyka/products/plywood-sheets/1-plywood-board.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794900110/stroyka/products/plywood-sheets/2-plywood-sheets.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794899897/stroyka/products/plywood-sheets/3-plywood-panels.jpg",
    ],
    description:
      "Versatile construction-grade plywood sheets suitable for a wide range of applications. These sheets are engineered for strength and dimensional stability, perfect for subfloors, roofing, walls, and general construction.",
    technicalSpecs: [
      { label: "DIMENSIONS", value: "4' x 8'" },
      { label: "THICKNESS", value: "3/4 inch" },
      { label: "GRADE", value: "CDX" },
      { label: "PLIES", value: "7-ply construction" },
      { label: "EXPOSURE", value: "Exterior grade" },
      { label: "VENEER", value: "Softwood" },
    ],
  },
  {
    id: "1",
    name: "Premium Cement Bags",
    price: 24.99,
    rating: 5.0,
    category: "Cement & Concrete",
    imageUrl:
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863679/stroyka/products/premium-cement-bags/1-cement-warehouse.jpg",
    images: [
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863679/stroyka/products/premium-cement-bags/1-cement-warehouse.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866575/stroyka/products/premium-cement-bags/2-concrete-site.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794899901/stroyka/products/premium-cement-bags/3-cement-bags.jpg",
    ],
    description:
      "High-quality Portland cement bags designed for heavy-duty construction projects. Our premium cement offers exceptional strength, durability, and workability. Ideal for foundations, structural work, and general concrete applications. Each bag contains precisely measured and tested cement that meets international quality standards.",
    technicalSpecs: [
      { label: "WEIGHT", value: "50 lbs per bag" },
      { label: "TYPE", value: "Portland Cement Type I/II" },
      { label: "COMPRESSIVE STRENGTH", value: "3500 PSI at 28 days" },
      { label: "SETTING TIME", value: "2-4 hours initial set" },
      { label: "COVERAGE", value: "Approximately 0.45 cubic feet" },
      { label: "STORAGE LIFE", value: "6 months in sealed bag" },
    ],
  },
  {
    id: "3",
    name: "Premium Lumber Planks",
    price: 89.99,
    rating: 4.5,
    category: "Wood & Lumber",
    imageUrl:
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863680/stroyka/products/premium-lumber-planks/1-lumber-stack.jpg",
    images: [
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863680/stroyka/products/premium-lumber-planks/1-lumber-stack.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866571/stroyka/products/premium-lumber-planks/2-carpentry-workshop.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866572/stroyka/products/premium-lumber-planks/3-miter-saw.jpg",
    ],
    description:
      "Premium kiln-dried lumber planks perfect for all your woodworking and construction needs. These high-grade wooden planks are carefully selected for strength and appearance. Suitable for framing, decking, furniture making, and various carpentry projects.",
    technicalSpecs: [
      { label: "DIMENSIONS", value: "2\" x 6\" x 8'" },
      { label: "WOOD TYPE", value: "Douglas Fir" },
      { label: "GRADE", value: "Premium Select" },
      { label: "MOISTURE CONTENT", value: "15% kiln-dried" },
      { label: "TREATMENT", value: "Pressure-treated option available" },
      { label: "QUANTITY", value: "Sold individually" },
    ],
  },
  {
    id: "4",
    name: "Red Clay Bricks",
    price: 0.89,
    rating: 4.0,
    category: "Bricks & Blocks",
    imageUrl:
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863681/stroyka/products/red-clay-bricks/1-brick-stack.jpg",
    images: [
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863681/stroyka/products/red-clay-bricks/1-brick-stack.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866576/stroyka/products/red-clay-bricks/2-brick-renovation.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794899965/stroyka/products/red-clay-bricks/3-brick-pallet.jpg",
    ],
    description:
      "Traditional red clay bricks manufactured to the highest standards. These durable bricks are perfect for walls, patios, pathways, and architectural features. Fire-hardened for exceptional strength and weather resistance.",
    technicalSpecs: [
      { label: "DIMENSIONS", value: "8\" x 4\" x 2.25\"" },
      { label: "MATERIAL", value: "Fire-hardened clay" },
      { label: "COMPRESSIVE STRENGTH", value: "3000+ PSI" },
      { label: "WATER ABSORPTION", value: "Less than 8%" },
      { label: "COLOR", value: "Classic red" },
      { label: "WEIGHT", value: "4.5 lbs per brick" },
    ],
  },
  {
    id: "6",
    name: "Steel I-Beams",
    price: 349.99,
    rating: 5.0,
    category: "Steel & Metal",
    imageUrl:
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863682/stroyka/products/steel-i-beams/1-steel-pipes.jpg",
    images: [
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863682/stroyka/products/steel-i-beams/1-steel-pipes.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866577/stroyka/products/steel-i-beams/2-metalwork.jpg",
      "https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866579/stroyka/products/steel-i-beams/3-welding.jpg",
    ],
    description:
      "Heavy-duty structural steel I-beams engineered for maximum load-bearing capacity. These professional-grade beams are essential for large construction projects, building frames, and structural support applications.",
    technicalSpecs: [
      { label: "LENGTH", value: "20 feet" },
      { label: "PROFILE", value: "W10x49" },
      { label: "MATERIAL", value: "ASTM A992 Grade 50 Steel" },
      { label: "WEIGHT", value: "980 lbs" },
      { label: "YIELD STRENGTH", value: "50 ksi" },
      { label: "FINISH", value: "Mill finish" },
    ],
  },
];
