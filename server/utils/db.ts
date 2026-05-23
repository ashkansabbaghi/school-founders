// Unstorage (./data/founders/{id}) coexists with flat JSON collections
// (./data/*.json) used by the financial domain helpers.
export function useDb() {
  return useStorage('db')
}
