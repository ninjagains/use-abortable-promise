export function createAbortController(): AbortController {
  if ((window as any).AbortController) {
    return new AbortController();
  }

  return {
    abort: () => {},
    signal: undefined,
  } as any;
}
