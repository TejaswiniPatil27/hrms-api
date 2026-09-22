-- Replace the legacy enum with a managed employment-status lookup table.
CREATE TABLE "employment_statuses" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employment_statuses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "employment_statuses_code_check" CHECK ("code" IN ('ACTIVE', 'ON_NOTICE', 'RESIGNED', 'RELIEVED', 'TERMINATED')),
    CONSTRAINT "employment_statuses_label_check" CHECK ("label" IN ('Active', 'On Notice', 'Resigned', 'Relieved', 'Terminated'))
);

INSERT INTO "employment_statuses" ("code", "label", "updatedAt")
VALUES
    ('ACTIVE', 'Active', CURRENT_TIMESTAMP),
    ('ON_NOTICE', 'On Notice', CURRENT_TIMESTAMP),
    ('RESIGNED', 'Resigned', CURRENT_TIMESTAMP),
    ('RELIEVED', 'Relieved', CURRENT_TIMESTAMP),
    ('TERMINATED', 'Terminated', CURRENT_TIMESTAMP);

ALTER TABLE "employees"
    ADD COLUMN "employmentStatusId" INTEGER,
    ADD COLUMN "reportingManagerId" INTEGER,
    ADD COLUMN "personalEmail" VARCHAR(200),
    ADD COLUMN "officialRoleEmail" VARCHAR(200),
    ADD COLUMN "exitDate" TIMESTAMP(3),
    ADD COLUMN "profilePhoto" TEXT,
    ADD COLUMN "remarks" TEXT;

UPDATE "employees" AS employee
SET "employmentStatusId" = employment_status.id
FROM "employment_statuses" AS employment_status
WHERE employment_status."code" = CASE employee."status"::TEXT
    WHEN 'ACTIVE' THEN 'ACTIVE'
    WHEN 'INACTIVE' THEN 'TERMINATED'
    WHEN 'ONLEAVE' THEN 'ACTIVE'
    WHEN 'SEPARATED' THEN 'RELIEVED'
END;

ALTER TABLE "employees"
    ALTER COLUMN "employmentStatusId" SET NOT NULL,
    DROP COLUMN "status";

DROP TYPE "EmployeeStatus";

CREATE TABLE "employee_documents" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "documentType" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employment_statuses_code_key" ON "employment_statuses"("code");
CREATE UNIQUE INDEX "employment_statuses_label_key" ON "employment_statuses"("label");
CREATE INDEX "employees_employmentStatusId_idx" ON "employees"("employmentStatusId");
CREATE INDEX "employees_reportingManagerId_idx" ON "employees"("reportingManagerId");
CREATE INDEX "employee_documents_employeeId_idx" ON "employee_documents"("employeeId");

ALTER TABLE "employees"
    ADD CONSTRAINT "employees_employmentStatusId_fkey"
        FOREIGN KEY ("employmentStatusId") REFERENCES "employment_statuses"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "employees_reportingManagerId_fkey"
        FOREIGN KEY ("reportingManagerId") REFERENCES "employees"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "employees_reportingManagerId_check"
        CHECK ("reportingManagerId" IS NULL OR "reportingManagerId" <> "id");

ALTER TABLE "employee_documents"
    ADD CONSTRAINT "employee_documents_employeeId_fkey"
        FOREIGN KEY ("employeeId") REFERENCES "employees"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
