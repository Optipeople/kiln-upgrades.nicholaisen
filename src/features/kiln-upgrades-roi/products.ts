export type KilnProduct = {
  id: string;
  name: string;
  size: string;
  image: string;
};

// Placeholder kiln types — replace with the actual product catalogue.
export const PRODUCTS: readonly KilnProduct[] = [
  { id: "Lumber Kiln — Small",      name: "", size: "20 m³ chamber",   image: "/products/lumber-kiln-small.svg" },
  { id: "Lumber Kiln — Medium",     name: "", size: "60 m³ chamber",   image: "/products/lumber-kiln-medium.svg" },
  { id: "Lumber Kiln — Large",      name: "", size: "120 m³ chamber",  image: "/products/lumber-kiln-large.svg" },
  { id: "Pre-Drying Chamber",       name: "", size: "200 m³ chamber",  image: "/products/predrying-chamber.svg" },
  { id: "Veneer Dryer",             name: "", size: "Continuous, 1.6 m wide", image: "/products/veneer-dryer.svg" },
  { id: "Steam Conditioning Kiln",  name: "", size: "40 m³ chamber",   image: "/products/steam-kiln.svg" },
  { id: "Brick Tunnel Kiln",        name: "", size: "80 m long",       image: "/products/brick-tunnel-kiln.svg" },
  { id: "Ceramic Shuttle Kiln",     name: "", size: "12 m³ chamber",   image: "/products/ceramic-kiln.svg" },
  { id: "Continuous Drying Line",   name: "", size: "Modular, 30 m",   image: "/products/continuous-line.svg" },
];
