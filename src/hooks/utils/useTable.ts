import { useState, useCallback, useMemo } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;
export type SortField = string;

export interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

export interface FilterState {
  [key: string]: boolean;
}

export interface TableUtilities {
  // Sorting
  sortState: SortState;
  handleSort: (field: string) => void;
  getSortIcon: (field: string) => React.ElementType;
  applySorting: <T extends Record<string, unknown>>(data: T[]) => T[];
  resetSort: () => void;
  
  // Filtering
  filterState: FilterState;
  toggleFilter: (key: string) => void;
  setFilter: (key: string, value: boolean) => void;
  clearFilters: () => void;
  applyFilters: <T extends Record<string, unknown>>(data: T[], filterFn: (item: T, filters: FilterState) => boolean) => T[];
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  getPaginatedData: <T>(data: T[]) => {
    items: T[];
    totalPages: number;
    startIndex: number;
    endIndex: number;
    totalItems: number;
  };
  
  // Selection
  selectedItems: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  getSelectedCount: () => number;
  
  // Export utilities
  exportToCSV: <T extends Record<string, unknown>>(data: T[], filename: string, headers?: Record<string, string>) => void;
  
  // Utility
  resetAll: () => void;
}

/**
 * Hook for managing table operations like sorting, filtering, pagination, and selection
 * Provides a complete set of utilities for data table management
 */
export function useTable(initialItemsPerPage: number = 10): TableUtilities {
  // Sorting state
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: null
  });

  // Filtering state
  const [filterState, setFilterState] = useState<FilterState>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Sorting operations
  const handleSort = useCallback((field: string) => {
    setSortState(prev => {
      if (prev.field === field) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { field: null, direction: null };
        }
      }
      return { field, direction: 'asc' };
    });
    
    // Reset to first page when sorting changes
    setCurrentPage(1);
  }, []);

  const getSortIcon = useCallback((field: string) => {
    if (sortState.field !== field) {
      return ArrowUpDown;
    }
    return sortState.direction === 'asc' ? ChevronUp : ChevronDown;
  }, [sortState]);

  const applySorting = useCallback(<T extends Record<string, unknown>>(data: T[]): T[] => {
    if (!sortState.field || !sortState.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortState.field!];
      const bValue = b[sortState.field!];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortState.direction === 'asc' ? comparison : -comparison;
      }

      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortState.direction === 'asc' ? comparison : -comparison;
      }

      // Fallback to string comparison
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [sortState]);

  const resetSort = useCallback(() => {
    setSortState({ field: null, direction: null });
  }, []);

  // Filtering operations
  const toggleFilter = useCallback((key: string) => {
    setFilterState(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const setFilter = useCallback((key: string, value: boolean) => {
    setFilterState(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({});
    setCurrentPage(1);
  }, []);

  const applyFilters = useCallback(<T extends Record<string, unknown>>(
    data: T[], 
    filterFn: (item: T, filters: FilterState) => boolean
  ): T[] => {
    return data.filter(item => filterFn(item, filterState));
  }, [filterState]);

  // Pagination operations
  const handleSetCurrentPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const handleSetItemsPerPage = useCallback((count: number) => {
    setItemsPerPage(Math.max(1, count));
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  const getPaginatedData = useCallback(<T>(data: T[]) => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const items = data.slice(startIndex, endIndex);

    return {
      items,
      totalPages,
      startIndex,
      endIndex,
      totalItems
    };
  }, [currentPage, itemsPerPage]);

  // Selection operations
  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedItems(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  const getSelectedCount = useCallback(() => {
    return selectedItems.size;
  }, [selectedItems]);

  // Export utilities
  const exportToCSV = useCallback(<T extends Record<string, unknown>>(
    data: T[], 
    filename: string, 
    headers?: Record<string, string>
  ) => {
    if (data.length === 0) return;

    const keys = Object.keys(data[0]);
    const csvHeaders = keys.map(key => headers?.[key] || key).join(',');
    
    const csvRows = data.map(item => 
      keys.map(key => {
        const value = item[key];
        // Handle values that might contain commas or quotes
        const stringValue = String(value || '');
        return stringValue.includes(',') || stringValue.includes('"') 
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : stringValue;
      }).join(',')
    );

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // Reset all state
  const resetAll = useCallback(() => {
    setSortState({ field: null, direction: null });
    setFilterState({});
    setCurrentPage(1);
    setSelectedItems(new Set());
  }, []);

  return {
    // Sorting
    sortState,
    handleSort,
    getSortIcon,
    applySorting,
    resetSort,
    
    // Filtering
    filterState,
    toggleFilter,
    setFilter,
    clearFilters,
    applyFilters,
    
    // Pagination
    currentPage,
    itemsPerPage,
    setCurrentPage: handleSetCurrentPage,
    setItemsPerPage: handleSetItemsPerPage,
    getPaginatedData,
    
    // Selection
    selectedItems,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedCount,
    
    // Export
    exportToCSV,
    
    // Utility
    resetAll
  };
}
