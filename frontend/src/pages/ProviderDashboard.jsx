import PlacementTabs from "../components/PlacementTabs";

export default function ProviderDashboard({ orgType }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <PlacementTabs orgType={orgType} />
    </div>
  );
}
