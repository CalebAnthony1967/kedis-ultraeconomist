import { useEffect, useRef } from 'react';
import { getShareableURL } from '../utils/exportUtils';

export function useShareableURL(filters, updateFilters) {
  const initialLoad = useRef(true);

  // Update URL when filters change
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    
    const url = getShareableURL(filters);
    window.history.replaceState({}, '', url);
  }, [filters]);

  // Read URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.size === 0) return;
    
    const parsedFilters = {};
    if (params.has('q')) parsedFilters.query = params.get('q');
    if (params.has('d')) parsedFilters.domainIds = params.get('d').split(',').filter(Boolean);
    if (params.has('sd')) parsedFilters.subdomainIds = params.get('sd').split(',').filter(Boolean);
    if (params.has('p')) parsedFilters.pillars = params.get('p').split(',').filter(Boolean);
    if (params.has('c')) parsedFilters.countyCodes = params.get('c').split(',').filter(Boolean);
    if (params.has('s')) parsedFilters.sourceMcdas = params.get('s').split(',').filter(Boolean);
    if (params.has('ys')) parsedFilters.yearStart = parseInt(params.get('ys'));
    if (params.has('ye')) parsedFilters.yearEnd = parseInt(params.get('ye'));
    if (params.has('sort')) parsedFilters.sortBy = params.get('sort');
    if (params.has('limit')) parsedFilters.limit = parseInt(params.get('limit'));
    
    updateFilters(parsedFilters);
  }, []);
}
