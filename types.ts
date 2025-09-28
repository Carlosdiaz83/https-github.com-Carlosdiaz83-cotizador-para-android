
export type PlanKey = '200' | '300' | '400' | '500' | 'POR APORTES';
export type AgeRangeKey = '01-29' | '30-39' | '40-49' | '50-59';

export type PlanPrices = {
  [key in AgeRangeKey]?: number;
} & {
  default?: number; 
};

export type PricingData = {
  [key in PlanKey]?: PlanPrices;
};
