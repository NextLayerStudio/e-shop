-- Add optional figúrka / kľúčenka variants with their own prices.

ALTER TABLE "Product"
  ADD COLUMN "hasVariants" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "figurkaPriceCents" INTEGER,
  ADD COLUMN "klucenkaPriceCents" INTEGER;
