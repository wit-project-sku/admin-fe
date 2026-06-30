import { DashboardCommerceOverview } from '../features/dashboard/DashboardCommerceOverview';

/** Role-scoped landing page for ROLE_USER — surfaces only the 위드마켓 overview. */
export default function WithMarketDashboardPage() {
  return <DashboardCommerceOverview />;
}
