import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { problemsService } from '../services/problemsService';

/**
 * useProblems - Hook for the problems list page with filter/search/pagination.
 */
export function useProblems() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [problems, setProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);

  const search = searchParams.get('search') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const category = searchParams.get('category') || '';

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (search) params.search = search;
      if (difficulty) params.difficulty = difficulty;
      if (category) params.category = category;

      const data = await problemsService.getProblems(params);
      setProblems(data.results || data || []);
      setCount(data.count || 0);
    } catch {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty, category]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  useEffect(() => {
    problemsService.getCategories().then((data) => {
      setCategories(data.results || data || []);
    }).catch(() => {});
  }, []);

  const setFilter = (key, value) => {
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };

  return {
    problems, loading, count, page, setPage,
    search, difficulty, category,
    categories,
    setFilter,
  };
}
