/**
 * Seed script for the know3D e-shop.
 * Run with: npm run db:seed
 *
 * Creates a small set of demo products (no images attached – upload your own
 * via the admin panel at /admin/produkty/<id>).
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = [
    {
      slug: "articulated-manta-ray",
      name: "Articulated Manta Ray",
      shortDescription: "Pohyblivá 3D vytlačená manta s realistickou textúrou.",
      description:
        "Detailne vytlačená pohyblivá manta. Skvelá ako dekorácia aj ako hračka.",
      priceCents: 1999,
      stock: 12,
      category: "PRIVESKY_MAGNETKY" as const,
      isFeaturedHome: true,
      isHitOfWeek: false,
    },
    {
      slug: "bad-bunnies",
      name: "Bad Bunnies",
      shortDescription: "Sada farebných zajačikov vytlačených na 3D tlačiarni.",
      description: "Sada zábavných farebných zajačikov. Ideálne ako darček.",
      priceCents: 2358,
      stock: 7,
      category: "INTERAKTIVNE_HRACKY" as const,
      isFeaturedHome: true,
    },
    {
      slug: "brutalny-portal",
      name: "Brutálny portál",
      shortDescription: "Detailný model brutalistickej architektúry.",
      description:
        "Náš najobľúbenejší architektonický model. Ručne maľovaný a leštený.",
      priceCents: 4899,
      stock: 3,
      category: "PRIVESKY_MAGNETKY" as const,
      isFeaturedHome: true,
      isHitOfWeek: true,
    },
    {
      slug: "wall-hook",
      name: "Wall hook",
      shortDescription: "Praktický nástenný háčik z odolného PETG.",
      description:
        "Praktický nástenný háčik – vďaka 3D tlači si môžeš vybrať farbu aj dizajn.",
      priceCents: 1233,
      stock: 50,
      category: "NA_ORGANIZOVANIE" as const,
      isFeaturedHome: true,
    },
    {
      slug: "puzzle-shelf",
      name: "Puzzle shelf!",
      shortDescription: "Modulárna polička v tvare puzzle.",
      description:
        "Skladaj si vlastné poličky. Každý kus pasuje k susednému ako puzzle.",
      priceCents: 5899,
      stock: 8,
      category: "NA_ORGANIZOVANIE" as const,
      isFeaturedHome: true,
    },
    {
      slug: "no-evil-alien-collection",
      name: "No Evil ~ Alien Collection",
      shortDescription:
        "Zberateľská sada troch mimozemšťanov v štýle 'see no evil'.",
      description: "Tri vytlačené figúrky s detailným tieňovaním.",
      priceCents: 2277,
      stock: 5,
      category: "PRIVESKY_MAGNETKY" as const,
      isFeaturedHome: true,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: p,
      update: p,
    });
  }

  console.log(`Seeded ${products.length} produktov.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
