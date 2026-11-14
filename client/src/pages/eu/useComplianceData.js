import { useEffect, useState } from "react";

export function useComplianceData(loader) {
  const [result, setResult] = useState({ loader: null, data: null, error: null });
  const currentResult = result.loader === loader ? result : null;

  useEffect(() => {
    let active = true;

    loader()
      .then((data) => {
        if (active) setResult({ loader, data, error: null });
      })
      .catch((error) => {
        if (active) setResult({ loader, data: null, error });
      });

    return () => {
      active = false;
    };
  }, [loader]);

  return {
    data: currentResult?.data ?? null,
    error: currentResult?.error ?? null,
    loading: currentResult === null,
  };
}