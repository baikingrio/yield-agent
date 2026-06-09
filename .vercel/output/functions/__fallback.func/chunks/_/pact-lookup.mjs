function findPactById(state, id) {
  return state.pacts.find((p) => p.id === id || p.coboPactId === id);
}

export { findPactById as f };
//# sourceMappingURL=pact-lookup.mjs.map
