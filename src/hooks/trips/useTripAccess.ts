import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  fetchTripAccessFromApi,
  fetchPurchaseStatusFromApi,
  shouldSkipAccessFetch,
  type TripAccessInfo,
  type PurchaseInfo
} from '@/lib/trips/trip-access';


interface UseTripAccessReturn {
  accessInfo: TripAccessInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTripAccess(tripId: string | null): UseTripAccessReturn {
  const { data: session, status } = useSession();
  const [accessInfo, setAccessInfo] = useState<TripAccessInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccessInfo = useCallback(async () => {
    // Use pure function to determine if we should skip
    if (shouldSkipAccessFetch(tripId, status)) {
      if (!tripId) {
        setAccessInfo(null);
      }
      return;
    }

    setLoading(true);
    setError(null);

    // Use pure function for API call
    const result = await fetchTripAccessFromApi(tripId!);

    if (result.success) {
      setAccessInfo(result.data!);
      setError(null);
    } else {
      setError(result.error!);
      setAccessInfo(null);
    }

    setLoading(false);
  }, [tripId, status]);

  useEffect(() => {
    fetchAccessInfo();
  }, [tripId, status, session?.user?.id, fetchAccessInfo]);

  return {
    accessInfo,
    loading,
    error,
    refetch: fetchAccessInfo
  };
}

export function usePurchaseStatus(tripId: string | null) {
  const { data: session, status } = useSession();
  const [purchaseInfo, setPurchaseInfo] = useState<PurchaseInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseStatus = useCallback(async () => {
    // Use pure function to determine if we should skip
    if (shouldSkipAccessFetch(tripId, status)) {
      return;
    }

    setLoading(true);
    setError(null);

    // Use pure function for API call
    const result = await fetchPurchaseStatusFromApi(tripId!);

    if (result.success) {
      setPurchaseInfo(result.data!);
      setError(null);
    } else {
      setError(result.error!);
      setPurchaseInfo(null);
    }

    setLoading(false);
  }, [tripId, status]);

  useEffect(() => {
    fetchPurchaseStatus();
  }, [tripId, status, session?.user?.id, fetchPurchaseStatus]);

  return {
    purchaseInfo,
    loading,
    error,
    refetch: fetchPurchaseStatus
  };
}