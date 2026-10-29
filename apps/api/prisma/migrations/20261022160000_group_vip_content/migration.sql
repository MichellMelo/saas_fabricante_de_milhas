CREATE TABLE "GroupVipPost" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "summary" VARCHAR(300),
    "body" TEXT NOT NULL,
    "externalUrl" VARCHAR(2048),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroupVipPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupVipPost_isPublished_publishedAt_idx" ON "GroupVipPost"("isPublished", "publishedAt");
CREATE INDEX "GroupVipPost_authorId_createdAt_idx" ON "GroupVipPost"("authorId", "createdAt");

ALTER TABLE "GroupVipPost" ADD CONSTRAINT "GroupVipPost_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
