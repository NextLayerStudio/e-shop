-- Figúrky nie sú samostatná kategória — zlúčenie do PRIVESKY_MAGNETKY (figúrky, prívesky, magnetky).

CREATE TYPE "ProductCategory_new" AS ENUM (
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
      WHEN 'FIGURKY' THEN 'PRIVESKY_MAGNETKY'
      ELSE "category"::text
    END
  )::"ProductCategory_new";

ALTER TABLE "Product"
  ALTER COLUMN "category" SET DEFAULT 'OSTATNE';

DROP TYPE "ProductCategory";

ALTER TYPE "ProductCategory_new" RENAME TO "ProductCategory";
