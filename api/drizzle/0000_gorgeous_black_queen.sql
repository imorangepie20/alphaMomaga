CREATE TYPE "public"."contract_status" AS ENUM('Upcoming', 'Active', 'Expired', 'Terminated');--> statement-breakpoint
CREATE TYPE "public"."inspection_priority" AS ENUM('Routine', 'Urgent');--> statement-breakpoint
CREATE TYPE "public"."inspection_status" AS ENUM('Pending', 'Scheduled', 'InReview', 'Completed');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('Pending', 'Scheduled', 'InProgress', 'Completed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('Paid', 'Pending', 'Overdue', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('Occupied', 'Active', 'Pending');--> statement-breakpoint
CREATE TYPE "public"."tenant_payment_status" AS ENUM('Paid', 'Pending', 'Overdue');--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"property_id" varchar(64) NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"unit" varchar(40) NOT NULL,
	"monthly_rent_won" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "contract_status" NOT NULL,
	"terminated_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"property_id" varchar(64) NOT NULL,
	"type" varchar(120) NOT NULL,
	"scheduled_date" date NOT NULL,
	"status" "inspection_status" NOT NULL,
	"priority" "inspection_priority" NOT NULL,
	"completed_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"property_id" varchar(64) NOT NULL,
	"task" text NOT NULL,
	"due_date" date NOT NULL,
	"status" "maintenance_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"property_id" varchar(64) NOT NULL,
	"contract_id" varchar(64) NOT NULL,
	"amount_won" integer NOT NULL,
	"due_date" date NOT NULL,
	"status" "payment_status" NOT NULL,
	"paid_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"location" varchar(200) NOT NULL,
	"type" varchar(80) NOT NULL,
	"occupancy" integer NOT NULL,
	"status" "property_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"property_id" varchar(64) NOT NULL,
	"unit" varchar(40) NOT NULL,
	"rent_won" integer NOT NULL,
	"status" "tenant_payment_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;