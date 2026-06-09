function toPublicSettings(settings) {
  var _a;
  const { coboApiKey: _key, ...publicSettings } = settings;
  return {
    ...publicSettings,
    apiKeyConfigured: publicSettings.apiKeyConfigured || Boolean((_a = process.env.AGENT_WALLET_API_KEY) == null ? void 0 : _a.trim())
  };
}

export { toPublicSettings as t };
//# sourceMappingURL=settings.mjs.map
