CREATE TYPE "public"."monthly_charge_status" AS ENUM('Draft', 'Approved', 'PartiallyPaid', 'Paid', 'Overdue', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('BankTransfer', 'Cash', 'Card', 'Other');--> statement-breakpoint
CREATE TABLE "monthly_charges" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"property_id" varchar(64) NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"contract_id" varchar(64) NOT NULL,
	"billing_month" varchar(7) NOT NULL,
	"due_date" date NOT NULL,
	"base_rent_won" integer NOT NULL,
	"adjustment_won" integer DEFAULT 0 NOT NULL,
	"billed_won" integer NOT NULL,
	"received_won" integer DEFAULT 0 NOT NULL,
	"outstanding_won" integer NOT NULL,
	"status" "monthly_charge_status" NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" varchar(255),
	"cancelled_at" timestamp with time zone,
	"cancelled_by" varchar(255),
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"receipt_id" varchar(64) NOT NULL,
	"charge_id" varchar(64) NOT NULL,
	"amount_won" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_receipts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"property_id" varchar(64) NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"received_date" date NOT NULL,
	"amount_won" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"reference" varchar(160),
	"memo" text,
	"recorded_by" varchar(255) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"voided_at" timestamp with time zone,
	"voided_by" varchar(255),
	"void_reason" text
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "billing_day" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "due_day" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "billing_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_charges" ADD CONSTRAINT "monthly_charges_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_charges" ADD CONSTRAINT "monthly_charges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_charges" ADD CONSTRAINT "monthly_charges_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_receipt_id_payment_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."payment_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_charge_id_monthly_charges_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."monthly_charges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_charges_contract_month_unique" ON "monthly_charges" USING btree ("contract_id","billing_month");--> statement-breakpoint
CREATE INDEX "monthly_charges_property_month_idx" ON "monthly_charges" USING btree ("property_id","billing_month");--> statement-breakpoint
CREATE INDEX "monthly_charges_tenant_month_idx" ON "monthly_charges" USING btree ("tenant_id","billing_month");--> statement-breakpoint
CREATE INDEX "payment_allocations_receipt_idx" ON "payment_allocations" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_charge_idx" ON "payment_allocations" USING btree ("charge_id");--> statement-breakpoint
CREATE INDEX "payment_receipts_property_tenant_idx" ON "payment_receipts" USING btree ("property_id","tenant_id");