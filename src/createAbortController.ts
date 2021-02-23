export function createAbortController() {
  if ((window as any).AbortController) {
    return new AbortController();
  }

  return {
    abort: () => {},
    signal: undefined,
  } as any;
}
