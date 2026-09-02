import { KpiCard } from "@/components/dashboards/shared/kpi-card";

export function RealEstateKpis() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="자산 포트폴리오 가치"
        value="₩2.8B"
        delta="+8.4%"
        trend="up"
      />
      <KpiCard
        label="평균 점유율"
        value="94.2%"
        delta="+1.6%"
        trend="up"
      />
      <KpiCard
        label="월 임대료"
        value="₩128M"
        delta="-2.1%"
        trend="down"
      />
      <KpiCard
        label="연체 세대"
        value="7"
        delta="+3"
        trend="up"
      />
    </div>
  );
}
