// This file centralizes the Product type definition.
export interface Product {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
  imageUrl: string;
  description: string;
  ingredientsText?: string;
  labelText?: string;
  hasAOECSLicense?: boolean;
  hasManufacturerStatement?: boolean;
  isVerifiedAdmin?: boolean;
  source?: string;
  tags?: string[];
  nutriScore?: string;
  isLactoseFree?: boolean;
  isSugarFree?: boolean;
  isPosno?: boolean;
  dataAiHint?: string;
  warning?: boolean;
  note?: string;
  stores?: string[];
  seriesAffected?: {
    lotNumbers: string[];
    expiry: string;
    finding: string;
    status: string;
    sourceLink?: string;
  };
}
