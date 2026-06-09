import { _ as __nuxt_component_0 } from './PageAlert-CHrRkRzO.mjs';
import { defineComponent, ref, mergeProps, unref, watch, computed, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderDynamicModel } from 'vue/server-renderer';
import { u as useHead } from './composables-DVORXyvj.mjs';
import { b as useAppStore } from './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'pinia';
import 'vue-router';
import '@wagmi/vue/chains';
import '../_/app.mjs';
import 'perfect-debounce';

const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "SettingsForm",
  __ssrInlineRender: true,
  props: {
    settings: {},
    saving: { type: Boolean }
  },
  emits: ["save"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const network = ref("base-sepolia");
    const apiKey = ref("");
    const defaultAgentFee = ref(15);
    const userSplit = ref(85);
    const saved = ref(false);
    watch(
      () => props.settings,
      (s) => {
        if (!s) return;
        network.value = s.network;
        defaultAgentFee.value = s.defaultAgentFee;
        userSplit.value = s.userSplit;
      },
      { immediate: true }
    );
    watch(
      () => props.saving,
      (v, prev) => {
        if (prev && !v) saved.value = true;
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<form${ssrRenderAttrs(mergeProps({ class: "max-w-md space-y-5" }, _attrs))}><div><label for="settings-network" class="mb-1.5 block text-xs text-muted">默认网络</label><select id="settings-network" class="h-10 w-full rounded-md border border-hairline bg-surface px-3 text-sm text-on-dark"><option value="base-sepolia"${ssrIncludeBooleanAttr(Array.isArray(unref(network)) ? ssrLooseContain(unref(network), "base-sepolia") : ssrLooseEqual(unref(network), "base-sepolia")) ? " selected" : ""}>Base Sepolia 测试网</option><option value="arbitrum-sepolia"${ssrIncludeBooleanAttr(Array.isArray(unref(network)) ? ssrLooseContain(unref(network), "arbitrum-sepolia") : ssrLooseEqual(unref(network), "arbitrum-sepolia")) ? " selected" : ""}>Arbitrum Sepolia 测试网</option></select></div><div><label for="settings-api-key" class="mb-1.5 block text-xs text-muted">Cobo API Key</label><input id="settings-api-key"${ssrRenderAttr("value", unref(apiKey))} type="password" autocomplete="off" placeholder="Cobo Agent API Key（可从 CAW provision 或平台获得）" class="h-10 w-full rounded-md border border-hairline bg-surface px-3 font-mono text-sm text-on-dark placeholder:text-muted">`);
      if (__props.settings?.apiKeyConfigured) {
        _push(`<p class="mt-1 text-xs text-trading-up">已配置（会话内）</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label for="settings-fee" class="mb-1.5 block text-xs text-muted">默认 Agent 绩效费率 (%)</label><input id="settings-fee"${ssrRenderAttr("value", unref(defaultAgentFee))} type="number" min="0" max="30" class="h-10 w-full rounded-md border border-hairline bg-surface px-3 font-mono text-sm text-on-dark"></div><div><label for="settings-split" class="mb-1.5 block text-xs text-muted">默认用户分成 (%)</label><input id="settings-split"${ssrRenderAttr("value", unref(userSplit))} type="number" min="0" max="100" class="h-10 w-full rounded-md border border-hairline bg-surface px-3 font-mono text-sm text-on-dark"></div><div class="flex items-center gap-4"><button type="submit" class="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"${ssrIncludeBooleanAttr(__props.saving) ? " disabled" : ""}>${ssrInterpolate(__props.saving ? "保存中…" : "保存设置")}</button>`);
      if (unref(saved)) {
        _push(`<span class="text-sm text-trading-up">已保存</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></form>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/settings/SettingsForm.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$4, { __name: "SettingsForm" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "CawReadinessCard",
  __ssrInlineRender: true,
  props: {
    readiness: {},
    busy: { type: Boolean }
  },
  emits: ["refresh", "provision"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const agentName = ref("YieldAgent Dev");
    const modeLabel = computed(() => {
      switch (props.readiness?.pactMode) {
        case "pact-execution-ready":
          return "Pact execution ready";
        case "cobo-pact":
          return "可提交真实 Cobo Pact";
        case "local-draft":
        default:
          return "本地 Pact Draft";
      }
    });
    const apiKeyLabel = computed(() => {
      if (!props.readiness?.apiKeyConfigured) return "未配置";
      return props.readiness.apiKeySource === "settings" ? "已配置（会话内）" : "已配置（环境变量）";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "mt-8 rounded-lg border border-hairline bg-surface p-5" }, _attrs))}><div class="flex flex-wrap items-start justify-between gap-4"><div><p class="font-mono text-xs uppercase tracking-[0.2em] text-muted-strong">CAW Readiness</p><h2 class="mt-2 text-lg font-semibold text-on-dark">Cobo Agentic Wallet 接入状态</h2><p class="mt-1 text-sm leading-6 text-muted"> 检查当前会创建本地 Draft、提交真实 Cobo Pact，还是可执行 active Pact。敏感 Key 不会在前端展示。 </p></div><button type="button" class="h-9 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy) ? " disabled" : ""}> 刷新状态 </button></div>`);
      if (!__props.readiness) {
        _push(`<div class="mt-5 h-32 animate-pulse rounded-lg bg-surface-elevated"></div>`);
      } else {
        _push(`<div class="mt-5 space-y-5"><dl class="grid gap-3 sm:grid-cols-2"><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">CAW 环境</dt><dd class="mt-1 font-mono text-sm text-on-dark">${ssrInterpolate(__props.readiness.environment)} · ${ssrInterpolate(__props.readiness.apiBaseUrl)}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">Pact 模式</dt><dd class="mt-1 text-sm font-medium text-on-dark">${ssrInterpolate(unref(modeLabel))}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">API Key</dt><dd class="${ssrRenderClass([__props.readiness.apiKeyConfigured ? "text-trading-up" : "text-trading-down", "mt-1 text-sm"])}">${ssrInterpolate(unref(apiKeyLabel))}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">TSS Node ID</dt><dd class="${ssrRenderClass([__props.readiness.mainNodeConfigured ? "text-trading-up" : "text-muted", "mt-1 text-sm"])}">${ssrInterpolate(__props.readiness.mainNodeConfigured ? "已配置" : "未配置")}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">Agent ID</dt><dd class="mt-1 break-all font-mono text-sm text-on-dark">${ssrInterpolate(__props.readiness.agentId || "未 provision")}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">Agent Wallet</dt><dd class="mt-1 break-all font-mono text-sm text-on-dark">${ssrInterpolate(__props.readiness.agentWalletAddress || "未创建")}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">Funding</dt><dd class="${ssrRenderClass([__props.readiness.fundingReady ? "text-trading-up" : "text-muted", "mt-1 text-sm"])}">${ssrInterpolate(__props.readiness.fundingReady ? "测试网 USDC 已准备" : "未完成资金准备")}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">缺失项</dt><dd class="mt-1 text-sm text-body">${ssrInterpolate(__props.readiness.missing.length ? __props.readiness.missing.join("、") : "无")}</dd></div></dl><div class="rounded-md border border-primary/30 bg-primary/5 p-4"><p class="text-sm text-body">下一步：${ssrInterpolate(__props.readiness.nextAction)}</p><p class="mt-2 text-xs leading-5 text-muted"> 注意：TSS Node 按当前方案运行在这台 Hermes Agent 主机上；Vercel 只承载前端/无状态入口，必须通过远程 API 或 tunnel 调用该主机，不能假设 Vercel 内部有本机 TSS。 </p></div><div class="rounded-md border border-hairline p-4"><label for="caw-agent-name" class="mb-1.5 block text-xs text-muted">Provision Agent 名称</label><div class="flex flex-col gap-3 sm:flex-row"><input id="caw-agent-name"${ssrRenderAttr("value", unref(agentName))} type="text" class="h-10 flex-1 rounded-md border border-hairline bg-surface px-3 text-sm text-on-dark" placeholder="YieldAgent Dev"><button type="button" class="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-active disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy || !unref(agentName).trim()) ? " disabled" : ""}> Provision CAW Agent Key </button></div><p class="mt-2 text-xs leading-5 text-muted"> 这是外部副作用：会向当前 CAW API 环境创建 Agent credential。API Key 只保存在服务端会话内存，不会明文显示。 </p></div></div>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/settings/CawReadinessCard.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$3, { __name: "SettingsCawReadinessCard" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "CawOnboardCard",
  __ssrInlineRender: true,
  props: {
    status: {},
    busy: { type: Boolean }
  },
  emits: ["refresh", "start", "continue"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const agentName = ref("YieldAgent");
    const answerValues = ref({});
    const statusLabel = computed(() => {
      if (!props.status) return "未检查";
      if (props.status.phase === "active") return "已完成 onboard";
      if (props.status.needsInput) return "需要补充输入";
      if (props.status.phase === "running") return "onboard 进行中";
      if (props.status.phase === "error") return "onboard 异常";
      return props.status.healthy ? "CAW CLI 可用" : "CAW CLI 未就绪";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "mt-8 rounded-lg border border-hairline bg-surface p-5" }, _attrs))}><div class="flex flex-wrap items-start justify-between gap-4"><div><p class="font-mono text-xs uppercase tracking-[0.2em] text-muted-strong">CAW Onboard</p><h2 class="mt-2 text-lg font-semibold text-on-dark">Hermes Agent 主机 CAW Onboard</h2><p class="mt-1 text-sm leading-6 text-muted"> 这里调用运行在当前 Hermes Agent 主机上的 <code>caw</code> CLI，用于检查/推进 CAW Agent Wallet onboard。敏感输入只提交到服务端，不在前端展示 API Key。 </p></div><button type="button" class="h-9 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy) ? " disabled" : ""}> 刷新 onboard </button></div>`);
      if (!__props.status) {
        _push(`<div class="mt-5 h-28 animate-pulse rounded-lg bg-surface-elevated"></div>`);
      } else {
        _push(`<div class="mt-5 space-y-5"><dl class="grid gap-3 sm:grid-cols-2"><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">状态</dt><dd class="${ssrRenderClass([__props.status.phase === "active" ? "text-trading-up" : "text-on-dark", "mt-1 text-sm font-medium"])}">${ssrInterpolate(unref(statusLabel))}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">Wallet</dt><dd class="mt-1 break-all font-mono text-sm text-on-dark">${ssrInterpolate(__props.status.walletUuid || "未创建")}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">Agent</dt><dd class="mt-1 break-all font-mono text-sm text-on-dark">${ssrInterpolate(__props.status.agentName || "未设置")}${ssrInterpolate(__props.status.agentId ? ` · ${__props.status.agentId}` : "")}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">Pairing</dt><dd class="${ssrRenderClass([__props.status.walletPaired ? "text-trading-up" : "text-muted", "mt-1 text-sm"])}">${ssrInterpolate(__props.status.walletPaired ? "已配对" : "未配对")}</dd></div></dl>`);
        if (__props.status.lastError) {
          _push(`<div class="rounded-md border border-trading-down/30 bg-trading-down/5 p-4 text-sm text-trading-down">${ssrInterpolate(__props.status.lastError)}</div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.status.needsInput && __props.status.sessionId) {
          _push(`<div class="rounded-md border border-hairline p-4"><p class="mb-3 text-sm text-body">CAW onboard 需要补充以下输入：</p><div class="space-y-3"><!--[-->`);
          ssrRenderList(__props.status.prompts, (prompt) => {
            _push(`<label class="block"><span class="mb-1 block text-xs text-muted">${ssrInterpolate(prompt.label || prompt.id)}</span><input${ssrRenderDynamicModel(prompt.secret ? "password" : "text", unref(answerValues)[prompt.id], null)}${ssrRenderAttr("type", prompt.secret ? "password" : "text")} class="h-10 w-full rounded-md border border-hairline bg-surface px-3 text-sm text-on-dark"${ssrRenderAttr("placeholder", prompt.description || prompt.id)}></label>`);
          });
          _push(`<!--]--></div><button type="button" class="mt-4 h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-active disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy) ? " disabled" : ""}> 继续 onboard </button></div>`);
        } else if (__props.status.phase !== "active") {
          _push(`<div class="rounded-md border border-hairline p-4"><label for="onboard-agent-name" class="mb-1.5 block text-xs text-muted">Agent 名称</label><div class="flex flex-col gap-3 sm:flex-row"><input id="onboard-agent-name"${ssrRenderAttr("value", unref(agentName))} type="text" class="h-10 flex-1 rounded-md border border-hairline bg-surface px-3 text-sm text-on-dark" placeholder="YieldAgent"><button type="button" class="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-active disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy || !unref(agentName).trim()) ? " disabled" : ""}> 启动 / 继续 CAW onboard </button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.status.nextAction) {
          _push(`<p class="text-xs leading-5 text-muted">下一步：${ssrInterpolate(__props.status.nextAction)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/settings/CawOnboardCard.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$2, { __name: "SettingsCawOnboardCard" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "StrategyAgentReadinessCard",
  __ssrInlineRender: true,
  props: {
    readiness: {},
    pingResult: {},
    busy: { type: Boolean }
  },
  emits: ["refresh", "ping"],
  setup(__props, { emit: __emit }) {
    function modeLabel(mode) {
      return mode === "api" ? "远程 Hermes API" : "本机 Hermes CLI（仅开发）";
    }
    function providerLabel(provider) {
      return provider === "hermes" ? "Hermes Agent" : "Hermes Agent";
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "mt-8 rounded-lg border border-hairline bg-surface p-5" }, _attrs))}><div class="flex flex-wrap items-start justify-between gap-4"><div><p class="font-mono text-xs uppercase tracking-[0.2em] text-muted-strong">Strategy Agent</p><h2 class="mt-2 text-lg font-semibold text-on-dark">策略层：远程调用 Hermes Agent 主机</h2><p class="mt-1 text-sm leading-6 text-muted"> Hermes runtime 和 TSS Node 都运行在当前 Hermes Agent 主机上。前端最终部署到 Vercel，因此生产路径必须通过可远程访问的 Hermes API / tunnel 调用这台主机；Hermes 输出仍需经过确定性 validator 和 Pact 边界校验。 </p></div><div class="flex flex-wrap gap-2"><button type="button" class="h-9 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy) ? " disabled" : ""}> 刷新 Hermes 状态 </button><button type="button" class="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary hover:bg-primary-active disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy || !__props.readiness?.deploymentReady) ? " disabled" : ""}> 测试远程调用 </button></div></div>`);
      if (!__props.readiness) {
        _push(`<div class="mt-5 h-24 animate-pulse rounded-lg bg-surface-elevated"></div>`);
      } else {
        _push(`<div class="mt-5 space-y-4"><dl class="grid gap-3 sm:grid-cols-2"><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">Provider</dt><dd class="mt-1 text-sm font-medium text-on-dark">${ssrInterpolate(providerLabel(__props.readiness.provider))}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">调用方式</dt><dd class="mt-1 text-sm text-on-dark">${ssrInterpolate(modeLabel(__props.readiness.mode))}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">运行主机</dt><dd class="mt-1 text-sm text-on-dark">当前 Hermes Agent 主机</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">Vercel 可调用</dt><dd class="${ssrRenderClass([__props.readiness.deploymentReady ? "text-trading-up" : "text-trading-down", "mt-1 text-sm"])}">${ssrInterpolate(__props.readiness.deploymentReady ? "已配置远程 API" : "需要 API / tunnel")}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">CLI / API</dt><dd class="mt-1 break-all font-mono text-sm text-on-dark">${ssrInterpolate(__props.readiness.command || __props.readiness.endpoint || "未配置")}</dd></div><div class="rounded-md border border-hairline bg-surface-elevated p-3"><dt class="text-xs text-muted">Profile / Model</dt><dd class="mt-1 break-all font-mono text-sm text-on-dark">${ssrInterpolate(__props.readiness.profile)}${ssrInterpolate(__props.readiness.model ? ` · ${__props.readiness.model}` : "")}</dd></div></dl><div class="rounded-md border border-primary/30 bg-primary/5 p-4"><p class="text-sm text-body">下一步：${ssrInterpolate(__props.readiness.nextAction)}</p>`);
        if (__props.readiness.missing.length) {
          _push(`<p class="mt-2 text-xs text-trading-down"> 缺失：${ssrInterpolate(__props.readiness.missing.join("、"))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (__props.pingResult) {
          _push(`<div class="rounded-md border border-trading-up/30 bg-trading-up/5 p-4"><p class="text-sm font-medium text-trading-up">远程调用已返回</p><p class="mt-2 break-all font-mono text-xs leading-5 text-body">${ssrInterpolate(__props.pingResult.contentPreview)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/settings/StrategyAgentReadinessCard.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main$1, { __name: "SettingsStrategyAgentReadinessCard" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "settings",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "设置 · YieldAgent" });
    const store = useAppStore();
    const saving = ref(false);
    const cawBusy = ref(false);
    const strategyBusy = ref(false);
    const loading = ref(true);
    async function load() {
      loading.value = true;
      store.clearError();
      try {
        await Promise.all([
          store.fetchSettings(),
          store.fetchCawReadiness(),
          store.fetchCawOnboardStatus(),
          store.fetchStrategyAgentReadiness()
        ]);
      } finally {
        loading.value = false;
      }
    }
    async function handleSave(body) {
      saving.value = true;
      store.clearError();
      try {
        await store.updateSettings(body);
        await store.fetchCawReadiness();
      } finally {
        saving.value = false;
      }
    }
    async function refreshCawReadiness() {
      cawBusy.value = true;
      store.clearError();
      try {
        await store.fetchCawReadiness();
      } finally {
        cawBusy.value = false;
      }
    }
    async function provisionCawAgent(name) {
      cawBusy.value = true;
      store.clearError();
      try {
        await store.provisionCawAgent(name);
      } finally {
        cawBusy.value = false;
      }
    }
    async function refreshCawOnboardStatus() {
      cawBusy.value = true;
      store.clearError();
      try {
        await store.fetchCawOnboardStatus();
      } finally {
        cawBusy.value = false;
      }
    }
    async function startCawOnboard(agentName) {
      cawBusy.value = true;
      store.clearError();
      try {
        await store.startCawOnboard(agentName);
      } finally {
        cawBusy.value = false;
      }
    }
    async function continueCawOnboard(sessionId, answers) {
      cawBusy.value = true;
      store.clearError();
      try {
        await store.continueCawOnboard(sessionId, answers);
      } finally {
        cawBusy.value = false;
      }
    }
    async function refreshStrategyAgentReadiness() {
      strategyBusy.value = true;
      store.clearError();
      try {
        await store.fetchStrategyAgentReadiness();
      } finally {
        strategyBusy.value = false;
      }
    }
    async function pingStrategyAgent() {
      strategyBusy.value = true;
      store.clearError();
      try {
        await store.pingStrategyAgent();
      } finally {
        strategyBusy.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiPageAlert = __nuxt_component_0;
      const _component_SettingsForm = __nuxt_component_1;
      const _component_SettingsCawReadinessCard = __nuxt_component_2;
      const _component_SettingsCawOnboardCard = __nuxt_component_3;
      const _component_SettingsStrategyAgentReadinessCard = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-3xl" }, _attrs))}><header class="mb-6"><h1 class="text-2xl font-semibold text-on-dark">设置</h1><p class="mt-2 text-sm text-muted">测试网环境配置。API Key 可手动填入，也可在下方通过 CAW provision 创建；敏感凭证仅保存在服务端会话内存。</p></header>`);
      if (unref(store).error) {
        _push(ssrRenderComponent(_component_UiPageAlert, {
          message: unref(store).error,
          onRetry: load
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(loading)) {
        _push(`<div class="h-48 animate-pulse rounded-lg bg-surface"></div>`);
      } else {
        _push(ssrRenderComponent(_component_SettingsForm, {
          settings: unref(store).settings,
          saving: unref(saving),
          onSave: handleSave
        }, null, _parent));
      }
      if (!unref(loading)) {
        _push(ssrRenderComponent(_component_SettingsCawReadinessCard, {
          readiness: unref(store).cawReadiness,
          busy: unref(cawBusy),
          onRefresh: refreshCawReadiness,
          onProvision: provisionCawAgent
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (!unref(loading)) {
        _push(ssrRenderComponent(_component_SettingsCawOnboardCard, {
          status: unref(store).cawOnboardStatus,
          busy: unref(cawBusy),
          onRefresh: refreshCawOnboardStatus,
          onStart: startCawOnboard,
          onContinue: continueCawOnboard
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (!unref(loading)) {
        _push(ssrRenderComponent(_component_SettingsStrategyAgentReadinessCard, {
          readiness: unref(store).strategyAgentReadiness,
          "ping-result": unref(store).strategyAgentPing,
          busy: unref(strategyBusy),
          onRefresh: refreshStrategyAgentReadiness,
          onPing: pingStrategyAgent
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard/settings.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=settings-PIYEdStT.mjs.map
