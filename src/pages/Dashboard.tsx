import React from 'react';
import ProductionDashboard from '../components/ProductionDashboard';

interface DashboardProps {
  onNavigateToMemorial: () => void;
}

export default function Dashboard({ onNavigateToMemorial }: DashboardProps) {
  return <ProductionDashboard onNavigateToMemorial={onNavigateToMemorial} />;
}