-- CreateTable
CREATE TABLE "urls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ping_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "urlId" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" INTEGER NOT NULL,
    CONSTRAINT "ping_requests_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "urls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ping_requests_urlId_key" ON "ping_requests"("urlId");

-- CreateIndex
CREATE INDEX "ping_requests_urlId_idx" ON "ping_requests"("urlId");
