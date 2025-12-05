export interface OverviewCardProps {
  title: string;
  value: string | number;
  variant?: string; // or union type if you know variants
}

export interface ProviderCardStats {
  delivered: number;
  pending: number;
  rto: number;
}

export interface ProviderCardProps {
  title: string;
  color: string;
  stats: ProviderCardStats;
  href: string;
}
