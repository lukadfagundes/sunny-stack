-- CreateIndex
CREATE INDEX "monitoring_alerts_source_timestamp_idx" ON "monitoring_alerts"("source", "timestamp");
