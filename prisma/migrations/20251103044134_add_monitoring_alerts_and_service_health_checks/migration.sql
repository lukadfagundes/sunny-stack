-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('DEPLOYMENT', 'UPTIME_CHECK', 'ERROR', 'NOTIFICATION');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('operational', 'degraded', 'down');

-- CreateTable
CREATE TABLE "monitoring_alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_health_checks" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL,
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monitoring_alerts_severity_idx" ON "monitoring_alerts"("severity");

-- CreateIndex
CREATE INDEX "monitoring_alerts_source_idx" ON "monitoring_alerts"("source");

-- CreateIndex
CREATE INDEX "monitoring_alerts_acknowledged_idx" ON "monitoring_alerts"("acknowledged");

-- CreateIndex
CREATE INDEX "monitoring_alerts_timestamp_idx" ON "monitoring_alerts"("timestamp");

-- CreateIndex
CREATE INDEX "service_health_checks_serviceName_idx" ON "service_health_checks"("serviceName");

-- CreateIndex
CREATE INDEX "service_health_checks_status_idx" ON "service_health_checks"("status");

-- CreateIndex
CREATE INDEX "service_health_checks_lastChecked_idx" ON "service_health_checks"("lastChecked");
