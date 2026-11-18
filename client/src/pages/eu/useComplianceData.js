import { useEffect, useState } from "react";

export function useComplianceData(loader) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState({
    loader: null,
    refreshKey: -1,
    data: null,
    error: null,
  });
  const currentResult =
    result.loader === loader && result.refreshKey === refreshKey ? result : null;

  useEffect(() => {
    let active = true;

    loader()
      .then((data) => {
        if (active) setResult({ loader, refreshKey, data, error: null });
      })
      .catch((error) => {
        if (active) setResult({ loader, refreshKey, data: null, error });
      });

    return () => {
      active = false;
    };
  }, [loader, refreshKey]);

  return {
    data: currentResult?.data ?? null,
    error: currentResult?.error ?? null,
    loading: currentResult === null,
    reload: () => setRefreshKey((current) => current + 1),
  };
}