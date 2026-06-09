import { _ as __nuxt_component_1$1 } from './StatusChip-WeVUEFuP.mjs';
import { defineComponent, computed, watch, unref, ref, mergeProps, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderAttrs, ssrIncludeBooleanAttr, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderAttr } from 'vue/server-renderer';
import { _ as __nuxt_component_0$2 } from './PageAlert-CHrRkRzO.mjs';
import { _ as __nuxt_component_0$3 } from './nuxt-link-2DNqPodY.mjs';
import { _ as __nuxt_component_1$2 } from './TxLink-CUSy3Ole.mjs';
import { u as useRoute, b as useAppStore, n as navigateTo, c as __nuxt_component_1, a as __nuxt_component_0$4 } from './server.mjs';
import { a as DASHBOARD_HOME, D as DASHBOARD_CREATE_STRATEGY, b as DASHBOARD_SETTINGS } from '../_/dashboard-routes.mjs';
import { N as NETWORK_LABELS } from '../_/app.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'pinia';
import 'vue-router';
import '@wagmi/vue/chains';
import 'perfect-debounce';

const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "PrepStepIndicator",
  __ssrInlineRender: true,
  props: {
    steps: {},
    variant: { default: "full" }
  },
  setup(__props) {
    const props = __props;
    const allLabels = [
      { key: "eoa", label: "连接 EOA" },
      { key: "agent_wallet", label: "Agent Wallet" },
      { key: "funding", label: "注入资金" }
    ];
    const labels = computed(
      () => props.variant === "agent-only" ? allLabels.filter((item) => item.key !== "eoa") : allLabels
    );
    function tone(status) {
      if (status === "completed") return "active";
      if (status === "in_progress") return "pending";
      return "neutral";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiStatusChip = __nuxt_component_1$1;
      _push(`<ol${ssrRenderAttrs(mergeProps({
        class: "flex flex-wrap gap-2",
        "aria-label": "资金准备进度"
      }, _attrs))}><!--[-->`);
      ssrRenderList(unref(labels), (item, i) => {
        _push(`<li class="flex items-center gap-2"><span class="${ssrRenderClass([
          __props.steps?.[item.key] === "completed" ? "bg-primary text-on-primary" : "bg-surface-elevated text-muted-strong",
          "flex h-6 min-w-[1.5rem] items-center justify-center rounded-sm px-1 font-mono text-xs"
        ])}">${ssrInterpolate(i + 1)}</span><span class="${ssrRenderClass([__props.steps?.[item.key] === "completed" ? "text-on-dark" : "text-muted", "text-xs font-medium"])}">${ssrInterpolate(item.label)}</span>`);
        if (__props.steps) {
          _push(ssrRenderComponent(_component_UiStatusChip, {
            class: "!px-2 !py-0.5",
            label: __props.steps[item.key] === "completed" ? "完成" : __props.steps[item.key] === "in_progress" ? "进行中" : "待办",
            tone: tone(__props.steps[item.key])
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</li>`);
      });
      _push(`<!--]--></ol>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/wallet/PrepStepIndicator.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_0$1 = Object.assign(_sfc_main$5, { __name: "WalletPrepStepIndicator" });
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "PrepStepAgent",
  __ssrInlineRender: true,
  props: {
    prep: {},
    bootstrap: {},
    locked: { type: Boolean },
    busy: { type: Boolean },
    agentPolling: { type: Boolean },
    createLabel: {},
    bootstrapPhaseLabel: {},
    bootstrapMessage: {},
    coboConfigured: { type: Boolean }
  },
  emits: ["create", "import"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const copied = ref(false);
    function shortId(id) {
      return `${id.slice(0, 8)}…${id.slice(-4)}`;
    }
    function checklistDone(key) {
      const prep = props.prep;
      const boot = props.bootstrap;
      if (!prep) return false;
      switch (key) {
        case "tss":
          return boot?.tssOnline === true;
        case "bootstrap":
          return boot?.phase === "active" || boot?.phase === "pairing" || boot?.phase === "paired" || prep.steps.agent_wallet === "completed";
        case "address":
          return Boolean(prep.agentWallet.created && prep.agentWallet.address);
        case "pairing":
          return prep.agentWallet.pairing?.status === "paired";
        default:
          return false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiStatusChip = __nuxt_component_1$1;
      _push(`<section${ssrRenderAttrs(mergeProps({
        class: ["rounded-lg border border-hairline bg-surface p-5", __props.locked ? "opacity-60" : ""],
        "aria-labelledby": "step-agent-heading"
      }, _attrs))}><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="font-mono text-xs text-primary">步骤 2</p><h2 id="step-agent-heading" class="mt-2 text-base font-semibold text-on-dark">创建 CAW Agent Wallet</h2><p class="mt-2 max-w-prose text-sm leading-6 text-body"> 按 Cobo 官方流程：TSS Node 在线 → onboard/bootstrap → vault active → 生成配对码 → CAW App 配对。 </p></div>`);
      if (__props.prep) {
        _push(ssrRenderComponent(_component_UiStatusChip, {
          label: __props.prep.agentWallet.pairing?.status === "paired" ? "已完成" : __props.prep.steps.agent_wallet === "in_progress" || __props.agentPolling || __props.prep.agentWallet.created ? "进行中" : "待完成",
          tone: __props.prep.agentWallet.pairing?.status === "paired" ? "active" : __props.prep.steps.agent_wallet === "in_progress" || __props.agentPolling || __props.prep.agentWallet.created ? "pending" : "neutral"
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><ol class="mt-4 space-y-2 text-xs text-body"><li class="flex items-start gap-2"><span class="${ssrRenderClass(checklistDone("tss") ? "text-trading-up" : "text-muted")}">${ssrInterpolate(checklistDone("tss") ? "✓" : "○")}</span><span>TSS Node 在线（本机 <code>caw node start</code> 或远程 Hermes 主机）</span></li><li class="flex items-start gap-2"><span class="${ssrRenderClass(checklistDone("bootstrap") ? "text-trading-up" : "text-muted")}">${ssrInterpolate(checklistDone("bootstrap") ? "✓" : "○")}</span><span>Vault bootstrap 完成（${ssrInterpolate(__props.bootstrapPhaseLabel)}`);
      if (__props.bootstrap?.mode) {
        _push(`<!--[--> · ${ssrInterpolate(__props.bootstrap.mode)}<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`）</span></li><li class="flex items-start gap-2"><span class="${ssrRenderClass(checklistDone("address") ? "text-trading-up" : "text-muted")}">${ssrInterpolate(checklistDone("address") ? "✓" : "○")}</span><span>生成链上地址</span></li><li class="flex items-start gap-2"><span class="${ssrRenderClass(checklistDone("pairing") ? "text-trading-up" : "text-muted")}">${ssrInterpolate(checklistDone("pairing") ? "✓" : "○")}</span><span>CAW App 配对（仅 vault active 后输入配对码）</span></li></ol>`);
      if (__props.bootstrapMessage && (__props.busy || __props.agentPolling || __props.prep?.steps.agent_wallet === "in_progress" || __props.prep?.agentWallet.pairing?.status === "pairing")) {
        _push(`<p class="mt-3 rounded-md border border-primary/20 bg-canvas px-3 py-2 text-xs text-body">${ssrInterpolate(__props.bootstrapMessage)}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.prep?.agentWallet.created && __props.prep.agentWallet.address) {
        _push(`<div class="mt-4 space-y-2"><div class="flex flex-wrap items-center gap-3"><button type="button" class="font-mono text-sm text-primary hover:text-primary-active"${ssrRenderAttr("title", __props.prep.agentWallet.address)}>${ssrInterpolate(__props.prep.agentWallet.address.slice(0, 10))}…${ssrInterpolate(__props.prep.agentWallet.address.slice(-6))}</button>`);
        if (unref(copied)) {
          _push(`<span class="text-xs text-trading-up">已复制</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (__props.prep.agentWallet.coboWalletId) {
          _push(`<p class="font-mono text-xs text-muted"> CAW Wallet ID：${ssrInterpolate(shortId(__props.prep.agentWallet.coboWalletId))}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.prep.agentWallet.pairing?.status === "pairing") {
          _push(`<div class="rounded-md border border-primary/30 bg-canvas px-3 py-2 text-xs text-body"><p class="font-semibold text-on-dark">请到 CAW App 输入配对码</p>`);
          if (__props.prep.agentWallet.pairing.code) {
            _push(`<p class="mt-2 font-mono text-lg text-primary">${ssrInterpolate(__props.prep.agentWallet.pairing.code)}</p>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.prep.agentWallet.pairing.expiresAt) {
            _push(`<p class="mt-1 text-muted"> 过期时间：${ssrInterpolate(__props.prep.agentWallet.pairing.expiresAt)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.prep.agentWallet.pairing?.status === "paired") {
          _push(`<p class="text-xs text-trading-up"> 已完成 CAW App 配对 </p>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.prep.agentWallet.pairing?.status !== "paired") {
          _push(`<button type="button" class="inline-flex h-9 items-center justify-center rounded-md border border-hairline px-3 text-xs font-semibold text-on-dark transition-colors duration-150 hover:bg-surface-elevated disabled:opacity-50"${ssrIncludeBooleanAttr(__props.locked || __props.busy || __props.agentPolling) ? " disabled" : ""}>${ssrInterpolate(__props.createLabel)}</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="mt-4 flex flex-wrap gap-3"><button type="button" class="inline-flex h-10 items-center justify-center rounded-md border border-hairline px-4 text-sm font-semibold text-on-dark transition-colors duration-150 hover:bg-surface-elevated disabled:opacity-50"${ssrIncludeBooleanAttr(__props.locked || __props.busy || __props.agentPolling) ? " disabled" : ""}>${ssrInterpolate(__props.createLabel)}</button><button type="button" class="inline-flex h-10 items-center justify-center rounded-md border border-hairline px-4 text-sm font-semibold text-muted transition-colors duration-150 hover:bg-surface-elevated hover:text-on-dark disabled:opacity-50"${ssrIncludeBooleanAttr(__props.locked || __props.busy || __props.agentPolling) ? " disabled" : ""}> 导入已 onboard 钱包 </button></div>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/wallet/PrepStepAgent.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$4, { __name: "WalletPrepStepAgent" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "PrepStepFund",
  __ssrInlineRender: true,
  props: {
    prep: {},
    locked: { type: Boolean },
    busy: { type: Boolean },
    depositLabel: {},
    networkLabel: {},
    depositAmount: {},
    coboConfigured: { type: Boolean }
  },
  emits: ["deposit", "update:depositAmount"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const amount = computed({
      get: () => props.depositAmount,
      set: (v) => emit("update:depositAmount", v)
    });
    const copied = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiStatusChip = __nuxt_component_1$1;
      const _component_NuxtLink = __nuxt_component_0$3;
      const _component_UiTxLink = __nuxt_component_1$2;
      const _component_ClientOnly = __nuxt_component_0$4;
      _push(`<section${ssrRenderAttrs(mergeProps({
        class: ["rounded-lg border border-hairline bg-surface p-5", __props.locked ? "opacity-60" : ""],
        "aria-labelledby": "step-fund-heading"
      }, _attrs))}><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="font-mono text-xs text-primary">步骤 3</p><h2 id="step-fund-heading" class="mt-2 text-base font-semibold text-on-dark">注入测试网 USDC</h2><p class="mt-2 max-w-prose text-sm leading-6 text-body"> 从 EOA 向 Agent Wallet 发起链上 USDC 转账。服务端将校验交易回执，并通过 Cobo 同步余额。 </p></div>`);
      if (__props.prep) {
        _push(ssrRenderComponent(_component_UiStatusChip, {
          label: __props.prep.funding.status === "ready" ? "已注资" : __props.prep.steps.funding === "in_progress" ? "转入中" : "待完成",
          tone: __props.prep.funding.status === "ready" ? "active" : __props.prep.steps.funding === "in_progress" ? "pending" : "neutral"
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (!__props.coboConfigured) {
        _push(`<p class="mt-4 rounded-md border border-trading-down/30 bg-canvas px-3 py-2 text-xs text-trading-down"> 需要 Cobo API Key 才能校验余额。 `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(DASHBOARD_SETTINGS),
          class: "font-medium text-primary hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`前往设置`);
            } else {
              return [
                createTextVNode("前往设置")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</p>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.prep?.funding.status === "ready") {
        _push(`<div class="mt-4 space-y-2 text-sm"><p class="font-mono text-on-dark"> 已注入 ${ssrInterpolate(__props.prep.funding.depositedUsdc.toLocaleString("zh-CN"))} USDC </p>`);
        if (__props.prep.funding.lastTxHash) {
          _push(`<p class="text-xs text-muted"> Tx： `);
          _push(ssrRenderComponent(_component_UiTxLink, {
            hash: __props.prep.funding.lastTxHash,
            network: __props.prep.network
          }, null, _parent));
          _push(`</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<form class="mt-4 space-y-4">`);
        if (__props.prep?.agentWallet.address) {
          _push(`<div class="rounded-md bg-canvas px-3 py-2 text-xs"><span class="text-muted">收款地址（Agent Wallet）</span><div class="mt-1 flex flex-wrap items-center gap-2"><button type="button" class="font-mono text-body hover:text-primary">${ssrInterpolate(__props.prep.agentWallet.address.slice(0, 10))}…${ssrInterpolate(__props.prep.agentWallet.address.slice(-6))}</button>`);
          if (unref(copied)) {
            _push(`<span class="text-trading-up">已复制</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div><label for="deposit-amount" class="mb-1.5 block text-xs text-muted-strong">金额 (USDC)</label><input id="deposit-amount"${ssrRenderAttr("value", unref(amount))} type="number" min="10" max="10000" step="1" class="h-10 w-full max-w-xs rounded-md border border-hairline bg-canvas px-3 font-mono text-sm text-on-dark"${ssrIncludeBooleanAttr(__props.locked || __props.busy) ? " disabled" : ""}></div><div><span class="text-xs text-muted-strong">网络</span><p class="mt-1 text-sm text-body">${ssrInterpolate(__props.networkLabel)}</p></div>`);
        _push(ssrRenderComponent(_component_ClientOnly, null, {
          fallback: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<p class="text-sm text-muted"${_scopeId}>加载钱包转账…</p>`);
            } else {
              return [
                createVNode("p", { class: "text-sm text-muted" }, "加载钱包转账…")
              ];
            }
          })
        }, _parent));
        _push(`</form>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/wallet/PrepStepFund.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$3, { __name: "WalletPrepStepFund" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "PrepSummary",
  __ssrInlineRender: true,
  props: {
    prep: {},
    networkLabel: {}
  },
  setup(__props) {
    function shortAddr(addr) {
      if (!addr) return "—";
      return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
    }
    function shortId(id) {
      if (!id) return "—";
      return `${id.slice(0, 8)}…${id.slice(-4)}`;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_WalletPrepStepIndicator = __nuxt_component_0$1;
      _push(`<aside${ssrRenderAttrs(mergeProps({
        class: "rounded-lg border border-hairline bg-surface lg:sticky lg:top-[calc(3.5rem+1.5rem)]",
        "aria-labelledby": "prep-summary-heading"
      }, _attrs))}><div class="border-b border-hairline px-5 py-4"><h2 id="prep-summary-heading" class="text-base font-semibold text-on-dark">准备摘要</h2><p class="mt-1 text-xs text-muted-strong">Agent Wallet 余额不等于 Pact 可花上限。</p></div><dl class="space-y-4 px-5 py-4 text-sm"><div><dt class="text-xs text-muted">网络</dt><dd class="mt-1 text-body">${ssrInterpolate(__props.networkLabel)}</dd></div><div><dt class="text-xs text-muted">用户 EOA</dt><dd class="mt-1 font-mono text-xs text-on-dark">${ssrInterpolate(shortAddr(__props.prep?.eoa.address ?? null))}</dd></div><div><dt class="text-xs text-muted">Agent Wallet</dt><dd class="mt-1 font-mono text-xs text-on-dark">${ssrInterpolate(__props.prep?.agentWallet.created ? shortAddr(__props.prep.agentWallet.address) : "未创建")}</dd></div>`);
      if (__props.prep?.agentWallet.coboWalletId) {
        _push(`<div><dt class="text-xs text-muted">CAW Wallet ID</dt><dd class="mt-1 font-mono text-xs text-muted">${ssrInterpolate(shortId(__props.prep.agentWallet.coboWalletId))}</dd></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div><dt class="text-xs text-muted">可用余额</dt><dd class="mt-1 font-mono text-sm text-trading-up">${ssrInterpolate(__props.prep?.funding.availableUsdc?.toLocaleString("zh-CN") ?? "0")} USDC </dd></div>`);
      if (__props.prep?.ready) {
        _push(`<div class="rounded-md border border-trading-up/30 bg-canvas px-3 py-2 text-xs text-trading-up"> Agent Wallet 已就绪，可继续创建 Pact 策略。 </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</dl><div class="border-t border-hairline px-5 py-4">`);
      _push(ssrRenderComponent(_component_WalletPrepStepIndicator, {
        steps: __props.prep?.steps
      }, null, _parent));
      _push(`</div></aside>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/wallet/PrepSummary.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_5 = Object.assign(_sfc_main$2, { __name: "WalletPrepSummary" });
function useUsdcTransferStub() {
  const transferError = ref(null);
  const isWriting = ref(false);
  return {
    transferUsdc: async () => {
      throw new Error("链上转账仅可在浏览器中执行");
    },
    isWriting,
    transferError
  };
}
function useUsdcTransfer() {
  {
    return useUsdcTransferStub();
  }
}
const BOOTSTRAP_PHASE_LABELS = {
  idle: "待开始",
  tss_check: "检查 TSS Node",
  bootstrapping: "Vault 初始化中",
  active: "钱包已激活",
  pairing: "等待 CAW App 配对",
  paired: "配对完成",
  failed: "初始化失败"
};
const MAX_AGENT_POLL_ATTEMPTS = 24;
const AGENT_POLL_INTERVAL_MS = 5e3;
function useWalletPreparation() {
  const store = useAppStore();
  const { transferUsdc, isWriting, transferError } = useUsdcTransfer();
  const prep = computed(() => store.preparation);
  const bootstrap = computed(() => store.agentBootstrap ?? prep.value?.agentBootstrap ?? null);
  const busy = ref(false);
  const agentPolling = ref(false);
  const depositPhase = ref("idle");
  const depositAmount = ref("500");
  const pageError = ref(null);
  const bootstrapPhaseLabel = computed(() => {
    const phase = bootstrap.value?.phase ?? "idle";
    return BOOTSTRAP_PHASE_LABELS[phase] ?? phase;
  });
  const bootstrapMessage = computed(() => bootstrap.value?.message ?? null);
  const createAgentLabel = computed(() => {
    if (busy.value || agentPolling.value) return "初始化中…";
    if (prep.value?.steps.agent_wallet === "in_progress") return "继续初始化";
    if (prep.value?.agentWallet.created) return "重新生成配对码";
    return "创建 Agent Wallet";
  });
  const depositLabel = computed(() => {
    const amt = depositAmount.value || "500";
    if (depositPhase.value === "signing") return "请在钱包中确认转账…";
    if (depositPhase.value === "confirming") return "确认到账中…";
    return `转入 ${amt} USDC`;
  });
  const coboConfigured = computed(
    () => store.settings?.apiKeyConfigured ?? false
  );
  function stepLocked(step) {
    const p = prep.value;
    if (!p) return true;
    if (step === "eoa") return false;
    if (step === "agent_wallet") return p.steps.eoa !== "completed";
    if (step === "funding") return p.steps.agent_wallet !== "completed";
    return true;
  }
  let pollTimer = null;
  function stopAgentPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    agentPolling.value = false;
  }
  async function pollAgentUntilDone(attempt = 0) {
    if (attempt >= MAX_AGENT_POLL_ATTEMPTS) {
      stopAgentPolling();
      pageError.value = "初始化耗时较长，请确认 TSS Node 在线后点击「继续初始化」";
      return;
    }
    try {
      const response = await store.pollAgentWalletStatus();
      if (response.done && prep.value?.agentWallet.pairing?.status === "paired") {
        stopAgentPolling();
        void Promise.all([store.fetchWallet(), store.fetchSettings(), store.fetchCawReadiness()]);
        return;
      }
    } catch {
      pageError.value = store.error;
      stopAgentPolling();
      return;
    }
    agentPolling.value = true;
    pollTimer = setTimeout(() => {
      void pollAgentUntilDone(attempt + 1);
    }, AGENT_POLL_INTERVAL_MS);
  }
  async function init() {
    pageError.value = null;
    store.clearError();
    busy.value = true;
    try {
      await Promise.all([store.fetchPreparation(), store.fetchSettings()]);
      const needsBootstrapPoll = prep.value?.steps.agent_wallet === "in_progress";
      const needsPairingPoll = Boolean(
        prep.value?.agentWallet.address && prep.value?.agentWallet.pairing?.status !== "paired"
      );
      if (needsBootstrapPoll || needsPairingPoll) {
        void pollAgentUntilDone();
      }
    } catch {
      pageError.value = store.error;
    } finally {
      busy.value = false;
    }
  }
  async function runCreateAgent() {
    if (stepLocked("agent_wallet")) return;
    if (prep.value?.agentWallet.pairing?.status === "paired") return;
    pageError.value = null;
    stopAgentPolling();
    busy.value = true;
    try {
      await store.createAgentWallet();
      if (prep.value?.steps.agent_wallet !== "completed") {
        await pollAgentUntilDone();
      }
    } catch {
      pageError.value = store.error;
    } finally {
      busy.value = false;
    }
  }
  async function runImportAgent() {
    if (stepLocked("agent_wallet")) return;
    pageError.value = null;
    stopAgentPolling();
    busy.value = true;
    try {
      await store.importAgentWalletFromCli();
    } catch {
      pageError.value = store.error;
    } finally {
      busy.value = false;
    }
  }
  async function runDeposit() {
    if (stepLocked("funding") || prep.value?.funding.status === "ready") return;
    const amount = Number(depositAmount.value);
    if (Number.isNaN(amount) || amount < 10 || amount > 1e4) {
      pageError.value = "请输入 10–10,000 USDC";
      return;
    }
    if (!coboConfigured.value) {
      pageError.value = "请先在设置页配置 Cobo API Key";
      return;
    }
    pageError.value = null;
    depositPhase.value = "signing";
    busy.value = true;
    try {
      const info = await store.fetchDepositInfo(amount);
      const txHash = await transferUsdc(info);
      depositPhase.value = "confirming";
      await store.depositToAgentWallet(amount, txHash);
    } catch {
      pageError.value = transferError.value || store.error;
    } finally {
      depositPhase.value = "idle";
      busy.value = false;
    }
  }
  async function runReset() {
    stopAgentPolling();
    pageError.value = null;
    busy.value = true;
    try {
      await store.resetPreparation();
      depositAmount.value = "500";
    } catch {
      pageError.value = store.error;
    } finally {
      busy.value = false;
    }
  }
  const continueUrl = `${DASHBOARD_CREATE_STRATEGY}?template=conservative-usdc`;
  return {
    store,
    prep,
    bootstrap,
    busy,
    agentPolling,
    depositPhase,
    depositAmount,
    pageError,
    createAgentLabel,
    depositLabel,
    bootstrapPhaseLabel,
    bootstrapMessage,
    coboConfigured,
    isWriting,
    networkLabel: computed(
      () => prep.value ? NETWORK_LABELS[prep.value.network] : NETWORK_LABELS["base-sepolia"]
    ),
    stepLocked,
    init,
    runCreateAgent,
    runImportAgent,
    runDeposit,
    runReset,
    continueUrl
  };
}
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "DashboardOnboarding",
  __ssrInlineRender: true,
  setup(__props) {
    const {
      prep,
      busy,
      depositAmount,
      pageError,
      createAgentLabel,
      depositLabel,
      bootstrap,
      bootstrapPhaseLabel,
      bootstrapMessage,
      agentPolling,
      coboConfigured,
      networkLabel,
      stepLocked,
      init,
      runCreateAgent,
      runImportAgent,
      runDeposit,
      continueUrl,
      store
    } = useWalletPreparation();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_WalletPrepStepIndicator = __nuxt_component_0$1;
      const _component_UiPageAlert = __nuxt_component_0$2;
      const _component_WalletPrepStepAgent = __nuxt_component_2;
      const _component_WalletPrepStepFund = __nuxt_component_3;
      const _component_NuxtLink = __nuxt_component_0$3;
      const _component_WalletPrepSummary = __nuxt_component_5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><header class="flex flex-wrap items-end justify-between gap-4"><div class="space-y-3"><p class="font-mono text-xs text-muted-strong">测试网 · Agent Wallet 设置</p><h1 class="text-balance text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight tracking-[-0.03em] text-on-dark"> 完成 Agent Wallet 设置 </h1><p class="max-w-[65ch] text-sm leading-6 text-body"> EOA 已连接。请创建 Agent Wallet 并注入测试网 USDC，完成后即可创建受 Pact 约束的策略。 </p>`);
      if (unref(prep)) {
        _push(ssrRenderComponent(_component_WalletPrepStepIndicator, {
          steps: unref(prep).steps,
          variant: "agent-only"
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><button type="button" class="h-9 shrink-0 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-50"${ssrIncludeBooleanAttr(unref(busy)) ? " disabled" : ""}> 重置设置 </button></header>`);
      if (unref(pageError) || unref(store).error) {
        _push(ssrRenderComponent(_component_UiPageAlert, {
          message: unref(pageError) || unref(store).error || "",
          onRetry: unref(init)
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (!unref(prep) && unref(busy)) {
        _push(`<div class="h-48 animate-pulse rounded-lg bg-surface"></div>`);
      } else {
        _push(`<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start"><div class="space-y-5">`);
        _push(ssrRenderComponent(_component_WalletPrepStepAgent, {
          prep: unref(prep),
          bootstrap: unref(bootstrap),
          locked: unref(stepLocked)("agent_wallet"),
          busy: unref(busy),
          "agent-polling": unref(agentPolling),
          "create-label": unref(createAgentLabel),
          "bootstrap-phase-label": unref(bootstrapPhaseLabel),
          "bootstrap-message": unref(bootstrapMessage),
          "cobo-configured": unref(coboConfigured),
          onCreate: unref(runCreateAgent),
          onImport: unref(runImportAgent)
        }, null, _parent));
        _push(ssrRenderComponent(_component_WalletPrepStepFund, {
          prep: unref(prep),
          locked: unref(stepLocked)("funding"),
          busy: unref(busy),
          "deposit-label": unref(depositLabel),
          "network-label": unref(networkLabel),
          "deposit-amount": unref(depositAmount),
          "cobo-configured": unref(coboConfigured),
          "onUpdate:depositAmount": ($event) => depositAmount.value = $event,
          onDeposit: unref(runDeposit)
        }, null, _parent));
        _push(`<footer class="rounded-lg border border-hairline bg-surface px-5 py-4">`);
        if (!unref(prep)?.ready) {
          _push(`<p class="text-sm text-muted"> 完成上方两步后，控制台将展示策略与执行数据。 </p>`);
        } else {
          _push(`<p class="text-sm text-trading-up"> Agent Wallet 已就绪。下一步：选择模板并确认 Pact 边界。 </p>`);
        }
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(continueUrl),
          class: [
            "mt-4 inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-semibold no-underline transition-colors duration-150",
            unref(prep)?.ready ? "bg-primary text-on-primary hover:bg-primary-active" : "pointer-events-none bg-[var(--color-primary-disabled)] text-muted"
          ],
          "aria-disabled": !unref(prep)?.ready,
          onClick: (e) => {
            if (!unref(prep)?.ready) e.preventDefault();
          }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` 创建策略 `);
            } else {
              return [
                createTextVNode(" 创建策略 ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</footer></div>`);
        _push(ssrRenderComponent(_component_WalletPrepSummary, {
          prep: unref(prep),
          "network-label": unref(networkLabel)
        }, null, _parent));
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dashboard/DashboardOnboarding.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main$1, { __name: "DashboardOnboarding" });
function useDashboardPoll() {
  useAppStore();
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const store = useAppStore();
    useWalletPreparation();
    const preparationReady = computed(() => Boolean(store.preparation?.ready));
    useDashboardPoll();
    watch(
      [preparationReady, () => route.path],
      ([ready, path]) => {
        if (!ready && path !== DASHBOARD_HOME) {
          void navigateTo(DASHBOARD_HOME, { replace: true });
        }
      },
      { immediate: true }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_DashboardOnboarding = __nuxt_component_0;
      const _component_NuxtPage = __nuxt_component_1;
      if (!unref(preparationReady)) {
        _push(ssrRenderComponent(_component_DashboardOnboarding, _attrs, null, _parent));
      } else {
        _push(ssrRenderComponent(_component_NuxtPage, _attrs, null, _parent));
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=dashboard-Br1QtETT.mjs.map
