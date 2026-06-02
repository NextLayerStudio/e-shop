-- Expand ProductCategory enum and migrate existing products.

CREATE TYPE "ProductCategory_new" AS ENUM (
  'FIGURKY',
  'PRIVESKY_MAGNETKY',
  'SPOLOCENSKE_HRY',
  'SKLADACKY_HLAVOLAMY',
  'INTERAKTIVNE_HRACKY',
  'NA_ORGANIZOVANIE',
  'OSTATNE'
);

ALTER TABLE "Product"
  ALTER COLUMN "category" DROP DEFAULT;

ALTER TABLE "Product"
  ALTER COLUMN "category" TYPE "ProductCategory_new"
  USING (
    CASE "category"::text
      WHEN 'PRAKTICKE' THEN 'NA_ORGANIZOVANIE'
      WHEN 'DEKORATIVNE' THEN 'FIGURKY'
      WHEN 'HRACKY' THEN 'INTERAKTIVNE_HRACKY'
      WHEN 'DOPLNKY' THEN 'PRIVESKY_MAGNETKY'
      WHEN 'INE' THEN 'OSTATNE'
      ELSE 'OSTATNE'
    END
  )::"ProductCategory_new";

ALTER TABLE "Product"
  ALTER COLUMN "category" SET DEFAULT 'OSTATNE';

DROP TYPE "ProductCategory";

ALTER TYPE "ProductCategory_new" RENAME TO "ProductCategory";
