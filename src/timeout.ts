export function timeout(ms: number) {
  let timeoutId: any;
  return {
    start(): Promise<never> {
      return new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Timeout'));
        }, ms);
      });
    },
    clear() {
      clearTimeout(timeoutId);
    },
  };
}
