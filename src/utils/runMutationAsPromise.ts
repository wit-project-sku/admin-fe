type MutationCallbacks = { onSuccess: () => void; onError: (err: unknown) => void };

/** Wraps react-query style mutations that only expose onSuccess/onError callbacks. */
export function runMutationAsPromise(run: (callbacks: MutationCallbacks) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    run({
      onSuccess: () => resolve(),
      onError: (err) => reject(err),
    });
  });
}
