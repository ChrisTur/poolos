-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[],

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- Seed built-in roles
INSERT INTO "Role" ("id","createdAt","updatedAt","name","label","description","isBuiltIn","permissions") VALUES
(gen_random_uuid(), NOW(), NOW(), 'owner',      'Owner',      'Full access to all company features',             true, ARRAY['customers.view','customers.edit','messages.view','messages.send','schedule.view','schedule.log','routes.view','routes.manage','issues.view','issues.manage','equipment.view','equipment.manage','invoices.view','invoices.manage','estimates.view','estimates.manage','expenses.view','expenses.manage','reports.view','settings.company','settings.checklist','settings.payments','settings.team','settings.billing','support.view']),
(gen_random_uuid(), NOW(), NOW(), 'supervisor', 'Supervisor', 'Full access except billing and team management', true, ARRAY['customers.view','customers.edit','messages.view','messages.send','schedule.view','schedule.log','routes.view','routes.manage','issues.view','issues.manage','equipment.view','equipment.manage','invoices.view','invoices.manage','estimates.view','estimates.manage','expenses.view','expenses.manage','reports.view','settings.company','settings.checklist','support.view']),
(gen_random_uuid(), NOW(), NOW(), 'technician', 'Technician', 'Field work: schedule, routes, customers, issues', true, ARRAY['customers.view','schedule.view','schedule.log','routes.view','messages.view','issues.view','issues.manage','equipment.view','support.view']);
