-- CreateTable
CREATE TABLE "RouteRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "odometerStart" DOUBLE PRECISION,
    "odometerEnd" DOUBLE PRECISION,
    "notes" TEXT,
    "routeId" TEXT NOT NULL,
    "technicianId" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "RouteRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteRunExtraStop" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "routeRunId" TEXT NOT NULL,

    CONSTRAINT "RouteRunExtraStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RouteRun_routeId_idx" ON "RouteRun"("routeId");

-- CreateIndex
CREATE INDEX "RouteRun_companyId_idx" ON "RouteRun"("companyId");

-- AddForeignKey
ALTER TABLE "RouteRun" ADD CONSTRAINT "RouteRun_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteRun" ADD CONSTRAINT "RouteRun_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteRun" ADD CONSTRAINT "RouteRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteRunExtraStop" ADD CONSTRAINT "RouteRunExtraStop_routeRunId_fkey" FOREIGN KEY ("routeRunId") REFERENCES "RouteRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
