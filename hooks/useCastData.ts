// hooks/useCastData.ts
import { useState, useEffect, useCallback } from 'react';
import { CastMember } from '@/types/cast';
import { getCastAndCrew } from '@/lib/sanity';

export function useCastData() {
  const [castMembers, setCastMembers] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Move fetchCastData outside useEffect so it can be reused
  const fetchCastData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCastAndCrew();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setCastMembers(data);
      } else {
        console.error('getCastAndCrew did not return an array:', data);
        setCastMembers([]);
        setError('Invalid data format received');
      }
    } catch (error) {
      console.error('Error fetching cast data:', error);
      setCastMembers([]);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCastData();
  }, [fetchCastData]);

  // Retry function for error recovery - now it can access fetchCastData
  const retry = () => {
    setError(null);
    fetchCastData();
  };

  // Helper to filter cast vs crew
  const cast = castMembers.filter(person =>
    person.role.toLowerCase().includes('samara') ||
    person.role.toLowerCase().includes('boyfriend') ||
    person.role.toLowerCase().includes('mom')
  );

  const crew = castMembers.filter(person =>
    !person.role.toLowerCase().includes('samara') &&
    !person.role.toLowerCase().includes('boyfriend') &&
    !person.role.toLowerCase().includes('mom')
  );

  return {
    // Raw data
    castMembers,
    loading,
    error,

    // Filtered data
    cast,
    crew,

    // Actions
    retry,

    // Computed values
    hasData: castMembers.length > 0,
    isEmpty: !loading && castMembers.length === 0,
    hasCast: cast.length > 0,
    hasCrew: crew.length > 0,
  };
}