import type { FoodResult } from "./types";

export const JEN_FOODS: FoodResult[] = [
  // Protein – tierisch
  { id: "jen-haehnchen", name: "Hähnchen", per100g: { calories: 165, protein: 31, carbs: 0, fat: 4 }, source: "jen" },
  { id: "jen-putenbrust", name: "Putenbrust", per100g: { calories: 104, protein: 24, carbs: 0, fat: 1 }, source: "jen" },
  { id: "jen-lachs", name: "Lachs", per100g: { calories: 208, protein: 20, carbs: 0, fat: 13 }, source: "jen" },
  { id: "jen-thunfisch-dose", name: "Thunfisch Dose (in Wasser)", per100g: { calories: 116, protein: 26, carbs: 0, fat: 1 }, source: "jen" },
  { id: "jen-thunfisch-steak", name: "Thunfisch Steak", per100g: { calories: 144, protein: 23, carbs: 0, fat: 5 }, source: "jen" },
  { id: "jen-sardinen", name: "Sardinen (Dose)", per100g: { calories: 191, protein: 21, carbs: 0, fat: 12 }, source: "jen" },
  { id: "jen-eier", name: "Eier", per100g: { calories: 155, protein: 13, carbs: 1, fat: 11 }, stueck_g: 60, source: "jen" },
  { id: "jen-hackfleisch", name: "Hackfleisch", per100g: { calories: 254, protein: 17, carbs: 0, fat: 21 }, source: "jen" },
  { id: "jen-steak", name: "Steak (Rind)", per100g: { calories: 217, protein: 26, carbs: 0, fat: 12 }, source: "jen" },
  { id: "jen-salami", name: "Salami", per100g: { calories: 425, protein: 18, carbs: 2, fat: 38 }, source: "jen" },
  { id: "jen-muscheln", name: "Muscheln", per100g: { calories: 86, protein: 12, carbs: 5, fat: 2 }, source: "jen" },
  { id: "jen-meeresfruechte", name: "Meeresfrüchte-Mix", per100g: { calories: 90, protein: 17, carbs: 2, fat: 2 }, source: "jen" },

  // Protein – Milchprodukte
  { id: "jen-skyr", name: "Skyr", per100g: { calories: 63, protein: 11, carbs: 4, fat: 0 }, source: "jen" },
  { id: "jen-joghurt", name: "Joghurt", per100g: { calories: 60, protein: 4, carbs: 5, fat: 3 }, source: "jen" },
  { id: "jen-magerquark", name: "Magerquark", per100g: { calories: 67, protein: 12, carbs: 4, fat: 0 }, source: "jen" },
  { id: "jen-huettenkaese", name: "Hüttenkäse", per100g: { calories: 98, protein: 12, carbs: 3, fat: 4 }, source: "jen" },
  { id: "jen-feta", name: "Feta-Käse", per100g: { calories: 264, protein: 14, carbs: 4, fat: 21 }, source: "jen" },
  { id: "jen-kaese", name: "Käse (Gouda)", per100g: { calories: 356, protein: 25, carbs: 2, fat: 28 }, source: "jen" },
  { id: "jen-kefir", name: "Kefir", per100g: { calories: 65, protein: 3, carbs: 5, fat: 4 }, source: "jen" },
  { id: "jen-kuhmilch", name: "Kuhmilch", per100g: { calories: 64, protein: 3, carbs: 5, fat: 4 }, source: "jen" },

  // Protein – pflanzlich
  { id: "jen-tofu", name: "Tofu", per100g: { calories: 76, protein: 8, carbs: 2, fat: 5 }, source: "jen" },
  { id: "jen-seitan", name: "Seitan", per100g: { calories: 370, protein: 75, carbs: 14, fat: 2 }, source: "jen" },
  { id: "jen-sojachunks", name: "Sojachunks", per100g: { calories: 340, protein: 52, carbs: 30, fat: 1 }, source: "jen" },
  { id: "jen-eiweissp", name: "Eiweißpulver", per100g: { calories: 380, protein: 75, carbs: 8, fat: 6 }, source: "jen" },
  { id: "jen-proteinriegel", name: "Proteinriegel", per100g: { calories: 360, protein: 28, carbs: 38, fat: 8 }, source: "jen" },

  // Kohlenhydrate – Getreide
  { id: "jen-haferflocken", name: "Haferflocken", per100g: { calories: 368, protein: 13, carbs: 66, fat: 7 }, source: "jen" },
  { id: "jen-hafermehl", name: "Hafermehl", per100g: { calories: 375, protein: 13, carbs: 67, fat: 7 }, source: "jen" },
  { id: "jen-reis", name: "Reis (gekocht)", per100g: { calories: 130, protein: 3, carbs: 28, fat: 0 }, source: "jen" },
  { id: "jen-quinoa", name: "Quinoa (gekocht)", per100g: { calories: 120, protein: 4, carbs: 21, fat: 2 }, source: "jen" },
  { id: "jen-couscous", name: "Couscous (gekocht)", per100g: { calories: 112, protein: 4, carbs: 23, fat: 0 }, source: "jen" },
  { id: "jen-pasta", name: "Pasta (gekocht)", per100g: { calories: 158, protein: 6, carbs: 31, fat: 1 }, source: "jen" },
  { id: "jen-reisnudeln", name: "Reisnudeln (gekocht)", per100g: { calories: 108, protein: 2, carbs: 25, fat: 0 }, source: "jen" },
  { id: "jen-lasagne", name: "Lasagne (Nudeln)", per100g: { calories: 158, protein: 6, carbs: 31, fat: 1 }, source: "jen" },
  { id: "jen-bolo-do-caco", name: "Bolo Do Caco", per100g: { calories: 245, protein: 7, carbs: 50, fat: 2 }, source: "jen" },
  { id: "jen-saatenbrot", name: "Saatenbrot", per100g: { calories: 260, protein: 9, carbs: 38, fat: 8 }, source: "jen" },
  { id: "jen-wraps", name: "Wraps Vollkorn-Weizen", per100g: { calories: 290, protein: 9, carbs: 54, fat: 4 }, source: "jen" },

  // Kohlenhydrate – Hülsenfrüchte
  { id: "jen-linsen", name: "Linsen (gekocht)", per100g: { calories: 116, protein: 9, carbs: 20, fat: 0 }, source: "jen" },
  { id: "jen-bohnen", name: "Bohnen (gekocht)", per100g: { calories: 127, protein: 9, carbs: 23, fat: 1 }, source: "jen" },
  { id: "jen-kichererbsen", name: "Kichererbsen (gekocht)", per100g: { calories: 164, protein: 9, carbs: 27, fat: 3 }, source: "jen" },
  { id: "jen-erbsen", name: "Erbsen", per100g: { calories: 81, protein: 5, carbs: 14, fat: 0 }, source: "jen" },

  // Kohlenhydrate – Knollen
  { id: "jen-kartoffeln", name: "Kartoffeln (gekocht)", per100g: { calories: 77, protein: 2, carbs: 17, fat: 0 }, source: "jen" },
  { id: "jen-suesskartoffeln", name: "Süßkartoffeln", per100g: { calories: 86, protein: 2, carbs: 20, fat: 0 }, source: "jen" },

  // Fette
  { id: "jen-avocado", name: "Avocado", per100g: { calories: 160, protein: 2, carbs: 9, fat: 15 }, source: "jen" },
  { id: "jen-nussmus", name: "Nussmus", per100g: { calories: 614, protein: 21, carbs: 22, fat: 54 }, source: "jen" },
  { id: "jen-nussmix", name: "Nussmix", per100g: { calories: 607, protein: 15, carbs: 22, fat: 55 }, source: "jen" },
  { id: "jen-leinsamen", name: "Leinsamen", per100g: { calories: 534, protein: 18, carbs: 29, fat: 42 }, source: "jen" },
  { id: "jen-chiasamen", name: "Chiasamen", per100g: { calories: 486, protein: 17, carbs: 42, fat: 31 }, source: "jen" },
  { id: "jen-leinoel", name: "Leinöl", per100g: { calories: 884, protein: 0, carbs: 0, fat: 100 }, source: "jen" },
  { id: "jen-olivenoel", name: "Olivenöl", per100g: { calories: 884, protein: 0, carbs: 0, fat: 100 }, source: "jen" },
  { id: "jen-butter", name: "Butter", per100g: { calories: 717, protein: 1, carbs: 0, fat: 81 }, source: "jen" },

  // Gemüse
  { id: "jen-brokkoli", name: "Brokkoli", per100g: { calories: 34, protein: 3, carbs: 7, fat: 0 }, source: "jen" },
  { id: "jen-blumenkohl", name: "Blumenkohl", per100g: { calories: 25, protein: 2, carbs: 5, fat: 0 }, source: "jen" },
  { id: "jen-rosenkohl", name: "Rosenkohl", per100g: { calories: 43, protein: 3, carbs: 9, fat: 0 }, source: "jen" },
  { id: "jen-paprika", name: "Paprika", per100g: { calories: 31, protein: 1, carbs: 6, fat: 0 }, source: "jen" },
  { id: "jen-gurke", name: "Gurke", per100g: { calories: 16, protein: 1, carbs: 4, fat: 0 }, source: "jen" },
  { id: "jen-tomate", name: "Tomate", per100g: { calories: 18, protein: 1, carbs: 4, fat: 0 }, source: "jen" },
  { id: "jen-moehren", name: "Möhren", per100g: { calories: 41, protein: 1, carbs: 10, fat: 0 }, source: "jen" },
  { id: "jen-rote-beete", name: "Rote Beete", per100g: { calories: 43, protein: 2, carbs: 10, fat: 0 }, source: "jen" },
  { id: "jen-zucchini", name: "Zucchini", per100g: { calories: 17, protein: 1, carbs: 3, fat: 0 }, source: "jen" },
  { id: "jen-aubergine", name: "Aubergine", per100g: { calories: 25, protein: 1, carbs: 6, fat: 0 }, source: "jen" },
  { id: "jen-lauch", name: "Lauch", per100g: { calories: 31, protein: 2, carbs: 7, fat: 0 }, source: "jen" },
  { id: "jen-sellerie", name: "Sellerie", per100g: { calories: 16, protein: 1, carbs: 3, fat: 0 }, source: "jen" },
  { id: "jen-rettich", name: "Rettich", per100g: { calories: 16, protein: 1, carbs: 3, fat: 0 }, source: "jen" },
  { id: "jen-salat", name: "Salat", per100g: { calories: 15, protein: 1, carbs: 2, fat: 0 }, source: "jen" },
  { id: "jen-suppengemuese", name: "Suppengemüse", per100g: { calories: 35, protein: 2, carbs: 7, fat: 0 }, source: "jen" },

  // Obst
  { id: "jen-banane", name: "Banane", per100g: { calories: 89, protein: 1, carbs: 23, fat: 0 }, stueck_g: 120, source: "jen" },
  { id: "jen-apfel", name: "Apfel", per100g: { calories: 52, protein: 0, carbs: 14, fat: 0 }, stueck_g: 180, source: "jen" },
  { id: "jen-beeren", name: "Beeren (gemischt)", per100g: { calories: 57, protein: 1, carbs: 14, fat: 0 }, source: "jen" },
  { id: "jen-erdbeeren", name: "Erdbeeren", per100g: { calories: 32, protein: 1, carbs: 8, fat: 0 }, source: "jen" },
  { id: "jen-pfirsich", name: "Pfirsich", per100g: { calories: 39, protein: 1, carbs: 10, fat: 0 }, stueck_g: 150, source: "jen" },
  { id: "jen-papaya", name: "Papaya", per100g: { calories: 43, protein: 1, carbs: 11, fat: 0 }, stueck_g: 150, source: "jen" },
  { id: "jen-mango", name: "Mango", per100g: { calories: 60, protein: 1, carbs: 15, fat: 0 }, stueck_g: 200, source: "jen" },
  { id: "jen-kiwi", name: "Kiwi", per100g: { calories: 61, protein: 1, carbs: 15, fat: 1 }, stueck_g: 80, source: "jen" },
  { id: "jen-orange", name: "Orange", per100g: { calories: 47, protein: 1, carbs: 12, fat: 0 }, stueck_g: 150, source: "jen" },
  { id: "jen-ananas", name: "Ananas", per100g: { calories: 50, protein: 1, carbs: 13, fat: 0 }, stueck_g: 150, source: "jen" },
  { id: "jen-wassermelone", name: "Wassermelone", per100g: { calories: 30, protein: 1, carbs: 8, fat: 0 }, stueck_g: 300, source: "jen" },
  { id: "jen-grapefruit", name: "Grapefruit", per100g: { calories: 42, protein: 1, carbs: 11, fat: 0 }, stueck_g: 230, source: "jen" },
  { id: "jen-zitrone", name: "Zitrone", per100g: { calories: 29, protein: 1, carbs: 9, fat: 0 }, stueck_g: 80, source: "jen" },
  { id: "jen-limette", name: "Limette", per100g: { calories: 30, protein: 1, carbs: 11, fat: 0 }, stueck_g: 60, source: "jen" },

  // Sonstiges
  { id: "jen-tomatensauce", name: "Tomatensauce", per100g: { calories: 29, protein: 2, carbs: 6, fat: 0 }, source: "jen" },
  { id: "jen-tomatenmark", name: "Tomatenmark", per100g: { calories: 82, protein: 5, carbs: 18, fat: 1 }, source: "jen" },
  { id: "jen-sojasosse", name: "Sojasoße", per100g: { calories: 53, protein: 8, carbs: 5, fat: 0 }, source: "jen" },
  { id: "jen-senf", name: "Senf", per100g: { calories: 66, protein: 4, carbs: 6, fat: 3 }, source: "jen" },
  { id: "jen-ketchup", name: "Ketchup", per100g: { calories: 112, protein: 2, carbs: 27, fat: 0 }, source: "jen" },
  { id: "jen-honig", name: "Honig", per100g: { calories: 304, protein: 0, carbs: 82, fat: 0 }, source: "jen" },
  { id: "jen-zimt", name: "Zimt", per100g: { calories: 247, protein: 4, carbs: 81, fat: 1 }, source: "jen" },
  { id: "jen-schokolade", name: "85% Schokolade", per100g: { calories: 570, protein: 7, carbs: 30, fat: 43 }, source: "jen" },
  { id: "jen-kaffee", name: "Kaffee (schwarz)", per100g: { calories: 2, protein: 0, carbs: 0, fat: 0 }, source: "jen" },
  { id: "jen-tee", name: "Tee (ungesüßt)", per100g: { calories: 1, protein: 0, carbs: 0, fat: 0 }, source: "jen" },
];
