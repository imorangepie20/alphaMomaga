import { KpiCard } from "@/components/dashboards/shared/kpi-card";

export function RealEstateKpis() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Portfolio Value"
        value="₩2.8B"
        delta="+8.4%"
        trend="up"
      />
      <KpiCard
        label="Occupancy Rate"
        value="94.2%"
        delta="+1.6%"
        trend="up"
      />
      <KpiCard
        label="Monthly Rent"
        value="₩128M"
        delta="-2.1%"
        trend="down"
      />
      <KpiCard
        label="Overdue Units"
        value="7"
        delta="+3"
        trend="up"
      />
    </div>
  );
}
