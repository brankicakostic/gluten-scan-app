
// This file uses client-side rendering.
'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ScanLimiterContextType {
  scanCount: number;
  scanLimit: number;
  canScan: () => boolean;
  incrementScanCount: () => void;
  getRemainingScans: () => number;
  resetScanCount: () => void; // For testing/demonstration
}

const ScanLimiterContext = createContext<ScanLimiterContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_SCAN_COUNT = 'glutenScanCount';
const FREE_TIER_SCAN_LIMIT = 3;

export function ScanLimiterProvider({ children }: { children: ReactNode }) {
  const [scanCount, setScanCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const storedCount = localStorage.getItem(LOCAL_STORAGE_KEY_SCAN_COUNT);
      try {
        const count = storedCount ? parseInt(storedCount, 10) : 0;
        return isNaN(count) ? 0 : count;
      } catch (error) {
        console.error("Error parsing scan count from localStorage:", error);
        return 0;
      }
    }
    return 0;
  });
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_SCAN_COUNT, scanCount.toString());
    }
  }, [scanCount]);

  const canScan = useCallback(() => {
    return scanCount < FREE_TIER_SCAN_LIMIT;
  }, [scanCount]);

  const incrementScanCount = useCallback(() => {
    if (canScan()) {
      setScanCount((prevCount) => prevCount + 1);
    } else {
        // This case should ideally be prevented by UI disabling scan buttons
        console.warn("Attempted to increment scan count beyond limit.");
         toast({
            variant: "destructive",
            title: "Scan Limit Reached",
            description: "You have used all your free scans.",
        });
    }
  }, [canScan, toast]);

  const getRemainingScans = useCallback(() => {
    return Math.max(0, FREE_TIER_SCAN_LIMIT - scanCount);
  }, [scanCount]);

  const resetScanCount = useCallback(() => {
    // This is for development/testing or a potential admin feature.
    // In a real app, this would be a privileged operation.
    setScanCount(0);
    toast({
        title: "Scan Count Reset",
        description: `Your scan count has been reset. You have ${FREE_TIER_SCAN_LIMIT} scans available.`
    });
  }, [toast]);


  return (
    <ScanLimiterContext.Provider value={{ 
        scanCount, 
        scanLimit: FREE_TIER_SCAN_LIMIT, 
        canScan, 
        incrementScanCount, 
        getRemainingScans,
        resetScanCount 
    }}>
      {children}
    </ScanLimiterContext.Provider>
  );
}

export function useScanLimiter() {
  const context = useContext(ScanLimiterContext);
  if (context === undefined) {
    throw new Error('useScanLimiter must be used within a ScanLimiterProvider');
  }
  return context;
}
