CREATE TABLE "ProductContent" (
  "id" TEXT NOT NULL,
  "product" "ProductType" NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "summary" VARCHAR(300),
  "body" TEXT NOT NULL,
  "externalUrl" VARCHAR(2048),
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductContent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductContent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ProductContent_product_isPublished_publishedAt_idx" ON "ProductContent"("product", "isPublished", "publishedAt");
CREATE INDEX "ProductContent_authorId_createdAt_idx" ON "ProductContent"("authorId", "createdAt");
