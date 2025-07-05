
// This file uses client-side rendering.
'use client';

import type { Product } from '@/lib/products';
import { placeholderProducts } from '@/lib/products';
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface FavoritesContextType {
  favoriteProductIds: string[];
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  getFavoriteProducts: () => Product[];
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'glutenScanFavorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedFavorites = localStorage.getItem(LOCAL_STORAGE_KEY);
      try {
        return storedFavorites ? JSON.parse(storedFavorites) : [];
      } catch (error) {
        console.error("Error parsing favorites from localStorage:", error);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favoriteProductIds));
    }
  }, [favoriteProductIds]);

  const addFavorite = (productId: string) => {
    setFavoriteProductIds((prevIds) => {
      if (!prevIds.includes(productId)) {
        return [...prevIds, productId];
      }
      return prevIds;
    });
  };

  const removeFavorite = (productId: string) => {
    setFavoriteProductIds((prevIds) => prevIds.filter((id) => id !== productId));
  };

  const isFavorite = (productId: string) => {
    return favoriteProductIds.includes(productId);
  };

  const getFavoriteProducts = (): Product[] => {
    return placeholderProducts.filter(product => favoriteProductIds.includes(product.id));
  };

  return (
    <FavoritesContext.Provider value={{ favoriteProductIds, addFavorite, removeFavorite, isFavorite, getFavoriteProducts }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
