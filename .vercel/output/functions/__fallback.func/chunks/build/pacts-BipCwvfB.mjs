import { _ as __nuxt_component_0 } from './PageAlert-CHrRkRzO.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-2DNqPodY.mjs';
import { _ as __nuxt_component_1 } from './StatusChip-WeVUEFuP.mjs';
import { defineComponent, ref, computed, watch, mergeProps, unref, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderComponent, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { _ as __nuxt_component_1$1 } from './PactAppApprovalGuide-2PxKvmE4.mjs';
import { u as useRoute, d as useRouter, b as useAppStore, e as extractApiErrorMessage, a as __nuxt_component_0$2 } from './server.mjs';
import { _ as __nuxt_component_1$2 } from './TxLink-CUSy3Ole.mjs';
import { D as DASHBOARD_CREATE_STRATEGY, c as DASHBOARD_PACTS, a as DASHBOARD_HOME, d as DASHBOARD_HISTORY } from '../_/dashboard-routes.mjs';
import { u as useHead } from './composables-DVORXyvj.mjs';
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
import '../_/app.mjs';
import 'perfect-debounce';

const intervalError = "[nuxt] `setInterval` should not be used on the server. Consider wrapping it with an `onNuxtReady`, `onBeforeMount` or `onMounted` lifecycle hook, or ensure you only call it in the browser by checking `false`.";
const setInterval = (() => {
  console.error(intervalError);
});
const FILTER_TABS = [
  "active",
  "awaiting-approval",
  "completed",
  "rejected",
  "expired",
  "all"
];
function isPactFilterTab(value) {
  return typeof value === "string" && FILTER_TABS.includes(value);
}
function normalizeCoboStatus(pact) {
  return String(pact.coboStatus ?? "").toUpperCase();
}
function pactMatchesFilter(pact, tab) {
  switch (tab) {
    case "active":
      return pact.status === "active";
    case "awaiting-approval":
      return pact.status === "awaiting-approval" || pact.status === "pending";
    case "completed":
      return pact.status === "completed";
    case "rejected":
      return normalizeCoboStatus(pact) === "REJECTED";
    case "expired":
      return normalizeCoboStatus(pact) === "EXPIRED";
    default:
      return true;
  }
}
function pactListFetchStatus(tab) {
  if (tab === "active") return "active";
  if (tab === "completed") return "completed";
  return void 0;
}
function pactDisplayStatusLabel(pact) {
  const cobo = normalizeCoboStatus(pact);
  if (cobo === "REJECTED") return "已拒绝";
  if (cobo === "EXPIRED") return "已过期";
  const labels = {
    pending: "待处理",
    active: "执行中",
    completed: "已完成",
    terminated: "已终止",
    "awaiting-approval": "待审批"
  };
  return labels[pact.status];
}
function pactDisplayStatusTone(pact) {
  const cobo = normalizeCoboStatus(pact);
  if (cobo === "REJECTED" || cobo === "EXPIRED") return "error";
  const tones = {
    pending: "pending",
    active: "active",
    completed: "neutral",
    terminated: "error",
    "awaiting-approval": "paused"
  };
  return tones[pact.status];
}
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "PactList",
  __ssrInlineRender: true,
  props: {
    pacts: {},
    selectedId: {}
  },
  emits: ["select"],
  setup(__props, { emit: __emit }) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiStatusChip = __nuxt_component_1;
      _push(`<ul${ssrRenderAttrs(mergeProps({
        class: "space-y-2",
        role: "listbox",
        "aria-label": "Pact 列表"
      }, _attrs))}><!--[-->`);
      ssrRenderList(__props.pacts, (p) => {
        _push(`<li><button type="button" role="option"${ssrRenderAttr("aria-selected", p.id === __props.selectedId)} class="${ssrRenderClass([
          p.id === __props.selectedId ? "border-primary/50 bg-surface-elevated" : "border-hairline bg-surface hover:border-muted/50",
          "w-full rounded-lg border px-3 py-3 text-left transition-colors"
        ])}"><p class="line-clamp-2 text-sm text-on-dark">${ssrInterpolate(p.intent)}</p><div class="mt-2 flex flex-wrap items-center justify-between gap-2">`);
        _push(ssrRenderComponent(_component_UiStatusChip, {
          label: unref(pactDisplayStatusLabel)(p),
          tone: unref(pactDisplayStatusTone)(p)
        }, null, _parent));
        _push(`<span class="font-mono text-xs text-muted">≤ ${ssrInterpolate(p.maxSpend)} USDC</span></div><p class="mt-1 text-[0.65rem] text-muted">${ssrInterpolate(p.submissionMode === "cobo" ? "Cobo" : "本地 Draft")} `);
        if (p.status === "awaiting-approval") {
          _push(`<span class="text-[var(--color-status-pending)]"> · → 去 Cobo App 批准 </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p></button></li>`);
      });
      _push(`<!--]--></ul>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/pacts/PactList.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$2, { __name: "PactsPactList" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "PactDetail",
  __ssrInlineRender: true,
  props: {
    pact: {},
    strategy: {},
    recentLogs: {},
    busy: { type: Boolean },
    executing: { type: Boolean },
    executeError: {},
    waitingSeconds: {},
    pairingReady: { type: Boolean },
    gasStatus: {},
    fundingGas: { type: Boolean },
    eoaConnected: { type: Boolean },
    yieldPosition: {},
    redeeming: { type: Boolean },
    redeemError: {}
  },
  emits: ["refresh", "approveLocal", "execute", "fundGas", "redeem", "simulateDenial", "terminate"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const store = useAppStore();
    const isCoboPact = computed(() => props.pact?.submissionMode === "cobo");
    computed(() => props.pact?.submissionMode === "local-draft");
    const network = computed(() => props.strategy?.network ?? "base-sepolia");
    computed(() => store.walletPreparation.agentWallet.address);
    const gasFaucetUrl = computed(
      () => network.value === "arbitrum-sepolia" ? "https://faucet.quicknode.com/arbitrum/sepolia" : "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
    );
    const canRefresh = computed(() => isCoboPact.value && props.pact?.status === "awaiting-approval");
    const canApproveLocal = computed(
      () => false
    );
    const canExecute = computed(() => {
      if (!props.pact || props.pact.submissionMode !== "cobo" || props.pact.status !== "active") return false;
      return !props.pact.firstExecutionCompleted || !props.pact.firstExecutionTxHash?.trim();
    });
    const gasReady = computed(() => props.gasStatus?.ready ?? true);
    const needsGas = computed(() => canExecute.value && props.gasStatus && !props.gasStatus.ready);
    const canSimulateDenial = computed(
      () => props.pact?.submissionMode === "cobo" && props.pact?.status === "active"
    );
    const canWithdrawCoboPact = computed(
      () => isCoboPact.value && props.pact && ["pending", "awaiting-approval"].includes(props.pact.status)
    );
    const hasDepositedFunds = computed(
      () => Boolean(props.pact?.firstExecutionCompleted && props.pact?.firstExecutionTxHash?.trim())
    );
    const canRedeem = computed(() => {
      if (!isCoboPact.value || !hasDepositedFunds.value || props.pact?.redeemCompleted) return false;
      if (!props.yieldPosition?.redeemable) return false;
      return props.pact?.status === "active" || props.pact?.status === "terminated";
    });
    const showOwnerRevokeGuide = computed(
      () => isCoboPact.value && props.pact?.status === "active"
    );
    const showTerminatedRedeemGuide = computed(
      () => isCoboPact.value && props.pact?.status === "terminated" && hasDepositedFunds.value && !props.pact.redeemCompleted
    );
    const canTerminate = computed(() => {
      if (!props.pact || ["terminated", "completed"].includes(props.pact.status)) return false;
      if (isCoboPact.value) return false;
      return true;
    });
    const detailLines = computed(() => {
      if (!props.pact) return [];
      const p = props.pact;
      return [
        ...props.strategy ? [{ label: "关联策略", value: props.strategy.name }] : [],
        ...props.strategy ? [{ label: "网络", value: props.strategy.network }] : [],
        { label: "意图", value: p.intent },
        { label: "支出上限", value: `${p.maxSpend} USDC` },
        { label: "允许 Recipe", value: p.whitelist.join("、") },
        { label: "期限", value: `${p.durationDays} 天（测试网）` },
        {
          label: "收益分账",
          value: `用户 ${p.userSplitPercent}% · Agent ${100 - p.userSplitPercent}%`
        },
        { label: "Agent 绩效费", value: `${p.agentFeePercent}%` },
        { label: "提交模式", value: p.submissionMode === "cobo" ? "Cobo Pact" : "本地 Draft" },
        ...p.coboPactId ? [{ label: "Cobo Pact ID", value: p.coboPactId }] : [],
        ...p.coboStatus ? [{ label: "Cobo 状态", value: p.coboStatus }] : [],
        ...p.submissionMessage ? [{ label: "状态说明", value: p.submissionMessage }] : [],
        ...p.status === "active" ? [{ label: "执行凭证", value: p.executionCredentialStored ? "已缓存" : "待同步" }] : []
      ];
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiStatusChip = __nuxt_component_1;
      const _component_PactsPactAppApprovalGuide = __nuxt_component_1$1;
      const _component_ClientOnly = __nuxt_component_0$2;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_UiTxLink = __nuxt_component_1$2;
      if (!__props.pact) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "rounded-lg border border-dashed border-hairline px-5 py-12 text-center text-sm text-muted" }, _attrs))}> 选择左侧 Pact 查看详情 </div>`);
      } else {
        _push(`<article${ssrRenderAttrs(mergeProps({ class: "rounded-lg border border-hairline bg-surface" }, _attrs))}><header class="border-b border-hairline px-5 py-4"><div class="flex items-start justify-between gap-3"><h2 class="text-base font-semibold text-on-dark">Pact 详情</h2>`);
        _push(ssrRenderComponent(_component_UiStatusChip, {
          label: unref(pactDisplayStatusLabel)(__props.pact)
        }, null, _parent));
        _push(`</div><p class="mt-1 font-mono text-xs text-muted">ID: ${ssrInterpolate(__props.pact.id)}</p></header>`);
        if (__props.pact.status === "awaiting-approval") {
          _push(`<div class="border-b border-hairline px-5 py-4">`);
          _push(ssrRenderComponent(_component_PactsPactAppApprovalGuide, {
            pact: __props.pact,
            "submission-message": __props.pact.submissionMessage,
            "waiting-seconds": __props.waitingSeconds,
            "pairing-ready": __props.pairingReady
          }, null, _parent));
          _push(`</div>`);
        } else if (__props.pact.status === "active") {
          _push(`<div class="space-y-3 border-b border-hairline px-5 py-4">`);
          if (unref(needsGas)) {
            _push(`<div class="space-y-2 rounded-md border border-trading-down/30 bg-canvas px-3 py-2 text-xs text-body"><p> Agent Wallet 需要 ${ssrInterpolate(__props.gasStatus?.nativeTokenLabel ?? "测试 ETH")} 支付 Gas（${ssrInterpolate(__props.gasStatus?.networkLabel)} 余额 ${ssrInterpolate(__props.gasStatus?.ethBalance ?? "0")} ETH，至少 ${ssrInterpolate(__props.gasStatus?.minEth)} ETH）。 </p>`);
            if (__props.gasStatus?.wrongChainHint) {
              _push(`<p class="text-trading-down">${ssrInterpolate(__props.gasStatus.wrongChainHint.message)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="flex flex-wrap gap-2">`);
            _push(ssrRenderComponent(_component_ClientOnly, null, {
              fallback: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<span class="text-muted"${_scopeId}>加载钱包…</span>`);
                } else {
                  return [
                    createVNode("span", { class: "text-muted" }, "加载钱包…")
                  ];
                }
              })
            }, _parent));
            _push(`<a${ssrRenderAttr("href", unref(gasFaucetUrl))} class="inline-flex h-8 items-center rounded-md border border-hairline px-3 text-xs text-primary hover:underline" target="_blank" rel="noopener noreferrer"> 打开水龙头 </a><button type="button" class="inline-flex h-8 items-center rounded-md border border-hairline px-3 font-mono text-xs"> 复制 Agent 地址 </button></div>`);
            if (!__props.eoaConnected) {
              _push(`<p class="text-trading-down"> 请先在 `);
              _push(ssrRenderComponent(_component_NuxtLink, {
                to: unref(DASHBOARD_HOME),
                class: "text-primary underline"
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(`控制台`);
                  } else {
                    return [
                      createTextVNode("控制台")
                    ];
                  }
                }),
                _: 1
              }, _parent));
              _push(` 或 Header 连接 EOA。 </p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.executing) {
            _push(`<p class="text-sm text-muted" role="status"> 正在执行首次 Recipe… </p>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.executeError) {
            _push(`<p class="text-sm text-trading-down" role="alert">${ssrInterpolate(__props.executeError)}</p>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.pact.firstExecutionCompleted && __props.pact.firstExecutionTxHash) {
            _push(`<p class="text-sm text-trading-up"> 首次 Recipe 已完成 </p>`);
          } else if (__props.pact.firstExecutionCompleted && !__props.pact.firstExecutionTxHash) {
            _push(`<p class="text-sm text-trading-down" role="alert"> 上次执行未获得链上确认，请点击下方按钮重试 </p>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.pact.firstExecutionTxHash) {
            _push(ssrRenderComponent(_component_UiTxLink, {
              hash: __props.pact.firstExecutionTxHash,
              network: unref(network),
              class: "block break-all text-xs"
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          if (__props.pact.redeemTxHash) {
            _push(`<p class="text-sm text-trading-up"> 赎回已完成 `);
            _push(ssrRenderComponent(_component_UiTxLink, {
              hash: __props.pact.redeemTxHash,
              network: unref(network),
              class: "ml-1 break-all text-xs"
            }, null, _parent));
            _push(`</p>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.yieldPosition?.redeemable && !__props.pact.redeemCompleted) {
            _push(`<p class="text-xs text-muted"> 协议仓位：约 ${ssrInterpolate(__props.yieldPosition.suppliedUsdc.toLocaleString("zh-CN"))} USDC（${ssrInterpolate(__props.yieldPosition.protocol)}） </p>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.redeemError) {
            _push(`<p class="text-sm text-trading-down" role="alert">${ssrInterpolate(__props.redeemError)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else if (__props.pact.status === "terminated" && unref(hasDepositedFunds)) {
          _push(`<div class="space-y-3 border-b border-hairline px-5 py-4">`);
          if (__props.pact.redeemTxHash) {
            _push(`<p class="text-sm text-trading-up"> 赎回已完成 `);
            _push(ssrRenderComponent(_component_UiTxLink, {
              hash: __props.pact.redeemTxHash,
              network: unref(network),
              class: "ml-1 text-xs"
            }, null, _parent));
            _push(`</p>`);
          } else if (unref(showTerminatedRedeemGuide)) {
            _push(`<p class="text-sm text-body"> 此 Pact 已在 App 撤销。撤销不会自动取回 Compound 存款，请尝试下方「赎回至 Agent Wallet」。 </p>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.yieldPosition?.redeemable && !__props.pact.redeemCompleted) {
            _push(`<p class="text-xs text-muted"> 协议仓位：约 ${ssrInterpolate(__props.yieldPosition.suppliedUsdc.toLocaleString("zh-CN"))} USDC（${ssrInterpolate(__props.yieldPosition.protocol)}） </p>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.redeemError) {
            _push(`<p class="text-sm text-trading-down" role="alert">${ssrInterpolate(__props.redeemError)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<dl class="divide-y divide-hairline px-5"><!--[-->`);
        ssrRenderList(unref(detailLines), (line) => {
          _push(`<div class="grid gap-1 py-3 sm:grid-cols-[7rem_1fr]"><dt class="text-xs text-muted">${ssrInterpolate(line.label)}</dt><dd class="text-sm text-body">${ssrInterpolate(line.value)}</dd></div>`);
        });
        _push(`<!--]--></dl>`);
        if (__props.recentLogs?.length) {
          _push(`<section class="border-t border-hairline px-5 py-4"><h3 class="text-xs font-semibold text-muted">最近活动</h3><ul class="mt-2 space-y-2"><!--[-->`);
          ssrRenderList(__props.recentLogs, (log) => {
            _push(`<li class="text-xs text-body"><span class="text-muted">${ssrInterpolate(log.timestamp.slice(0, 19))}</span> — ${ssrInterpolate(log.action)} <span class="text-muted">（${ssrInterpolate(log.status)}）</span></li>`);
          });
          _push(`<!--]--></ul>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `${unref(DASHBOARD_HISTORY)}?pactId=${__props.pact.id}`,
            class: "mt-3 inline-block text-xs font-medium text-primary hover:underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` 查看完整历史 `);
              } else {
                return [
                  createTextVNode(" 查看完整历史 ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(showOwnerRevokeGuide)) {
          _push(`<div class="border-t border-hairline px-5 py-4 text-sm text-body" role="note"><p class="font-medium text-on-dark">撤销生效中的 Pact</p><p class="mt-2 text-muted"> 若已执行存入，请先点击「赎回至 Agent Wallet」，再在 App 撤销。 Agent 无法代你 revoke。请打开 Cobo Agentic Wallet App → 本 Pact 详情 → 撤销； 完成后回到此页点击「刷新状态」同步。 </p><button type="button" class="mt-3 h-10 rounded-md border border-hairline px-4 text-sm font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy) ? " disabled" : ""}>${ssrInterpolate(__props.busy ? "刷新中…" : "我已在 App 撤销，刷新状态")}</button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex flex-wrap gap-3 border-t border-hairline px-5 py-4">`);
        if (unref(canRefresh)) {
          _push(`<button type="button" class="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy || __props.executing) ? " disabled" : ""}>${ssrInterpolate(__props.busy ? "刷新中…" : "我已批准，刷新状态")}</button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(canApproveLocal)) {
          _push(`<button type="button" class="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy) ? " disabled" : ""}> 本地模拟批准 </button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(canExecute)) {
          _push(`<button type="button" class="h-10 rounded-md border border-primary/50 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy || __props.executing || !unref(gasReady)) ? " disabled" : ""}>${ssrInterpolate(__props.executing ? "执行中…" : unref(gasReady) ? "执行首次 Recipe" : "需先充值 Gas")}</button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(canRedeem)) {
          _push(`<button type="button" class="h-10 rounded-md border border-trading-up/40 px-4 text-sm font-medium text-trading-up transition-colors hover:bg-trading-up/10 disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy || __props.executing || __props.redeeming) ? " disabled" : ""}>${ssrInterpolate(__props.redeeming ? "赎回中…" : "赎回至 Agent Wallet")}</button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(canSimulateDenial)) {
          _push(`<button type="button" class="h-10 rounded-md border border-hairline px-4 text-sm font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy || __props.executing) ? " disabled" : ""}> 模拟越权请求 </button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(canWithdrawCoboPact)) {
          _push(`<button type="button" class="h-10 rounded-md border border-hairline px-4 text-sm font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy || __props.executing) ? " disabled" : ""}> 撤回待审批 Pact </button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(canTerminate)) {
          _push(`<button type="button" class="h-10 rounded-md border border-hairline px-4 text-sm font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-50"${ssrIncludeBooleanAttr(__props.busy || __props.executing) ? " disabled" : ""}> 终止 Pact </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></article>`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/pacts/PactDetail.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$1, { __name: "PactsPactDetail" });
function useAgentGasFundingStub() {
  return {
    fundAgentGas: async () => {
      throw new Error("Gas 充值仅可在浏览器中执行");
    },
    funding: ref(false),
    fundingError: ref(null),
    eoaConnected: ref(false)
  };
}
function useAgentGasFunding() {
  return useAgentGasFundingStub();
}
const POLL_MS = 4e3;
const MAX_POLL_ATTEMPTS = 75;
function usePactManagement() {
  const route = useRoute();
  const router = useRouter();
  const store = useAppStore();
  const { fundAgentGas, funding: fundingGas, fundingError: gasFundingError, eoaConnected } = useAgentGasFunding();
  const busy = ref(false);
  const gasStatus = ref(null);
  const loading = ref(true);
  const actionBanner = ref(null);
  const executeError = ref("");
  const executing = ref(false);
  const redeeming = ref(false);
  const redeemError = ref("");
  const yieldPosition = ref(null);
  const pollAttempt = ref(0);
  const waitingSeconds = ref(0);
  const autoExecuteAttempted = ref(false);
  let pollTimer = null;
  let waitingTimer = null;
  let pollAborted = false;
  const statusFilter = computed(() => {
    const q = route.query.status;
    if (isPactFilterTab(q)) return q;
    return "active";
  });
  const filteredPacts = computed(
    () => store.pacts.filter((p) => pactMatchesFilter(p, statusFilter.value))
  );
  const awaitingCount = computed(
    () => store.pacts.filter((p) => pactMatchesFilter(p, "awaiting-approval")).length
  );
  const selectedId = computed({
    get: () => resolveSelectedId(route.query.id, store.pacts),
    set: (id) => {
      router.replace({
        path: DASHBOARD_PACTS,
        query: {
          ...statusFilter.value !== "all" ? { status: statusFilter.value } : {},
          id
        }
      });
    }
  });
  const selectedPact = computed(
    () => store.pacts.find((p) => p.id === selectedId.value) ?? store.pacts.find((p) => p.coboPactId === selectedId.value) ?? null
  );
  const selectedStrategy = computed(() => {
    if (!selectedPact.value) return null;
    return store.strategies.find((s) => s.id === selectedPact.value.strategyId) ?? null;
  });
  function resolveSelectedId(queryId, pacts) {
    if (typeof queryId !== "string" || !queryId) {
      return pacts[0]?.id ?? null;
    }
    if (pacts.some((p) => p.id === queryId || p.coboPactId === queryId)) {
      const match = pacts.find((p) => p.id === queryId || p.coboPactId === queryId);
      return match?.id ?? queryId;
    }
    return queryId;
  }
  function clearPollTimer() {
    pollAborted = true;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    if (waitingTimer) {
      clearInterval(waitingTimer);
      waitingTimer = null;
    }
    pollAttempt.value = 0;
    waitingSeconds.value = 0;
  }
  function setStatusFilter(tab) {
    router.replace({
      path: DASHBOARD_PACTS,
      query: {
        ...tab !== "all" ? { status: tab } : {},
        ...selectedId.value ? { id: selectedId.value } : {}
      }
    });
  }
  async function tryAutoExecute(pactId) {
    const pact = store.pacts.find((p) => p.id === pactId);
    if (!pact || pact.submissionMode !== "cobo" || pact.status !== "active") return;
    if (pact.firstExecutionCompleted && pact.firstExecutionTxHash?.trim()) return;
    if (autoExecuteAttempted.value && executeError.value) return;
    if (executing.value) return;
    await refreshGasStatus();
    if (gasStatus.value && !gasStatus.value.ready) {
      executeError.value = gasStatus.value.wrongChainHint?.message ?? `Agent Wallet 需要至少 ${gasStatus.value.minEth} ${gasStatus.value.nativeTokenLabel}（${gasStatus.value.networkLabel} 当前 ${gasStatus.value.ethBalance} ETH）`;
      actionBanner.value = { tone: "error", message: executeError.value };
      autoExecuteAttempted.value = true;
      return;
    }
    autoExecuteAttempted.value = true;
    executing.value = true;
    executeError.value = "";
    try {
      const result = await store.executePact(pactId);
      actionBanner.value = {
        tone: "success",
        message: `首次 Recipe 已执行，tx：${result.txHash || "已提交"}`
      };
      clearPollTimer();
    } catch (e) {
      executeError.value = extractApiErrorMessage(e, "Recipe 执行失败");
      actionBanner.value = {
        tone: "error",
        message: executeError.value
      };
    } finally {
      executing.value = false;
    }
  }
  async function handlePactAfterSync(pact) {
    if (!pact) return;
    if (pact.status === "active" && pact.submissionMode === "cobo" && (!pact.firstExecutionCompleted || !pact.firstExecutionTxHash?.trim())) {
      clearPollTimer();
      await tryAutoExecute(pact.id);
      return;
    }
    if (pact.status === "terminated") {
      clearPollTimer();
      actionBanner.value = {
        tone: "error",
        message: pact.submissionMessage || "Pact 已被拒绝或终止。"
      };
      return;
    }
    if (pact.status === "awaiting-approval") {
      schedulePoll(pact.id, pollAttempt.value);
    }
  }
  function schedulePoll(pactId, attempt = 0) {
    if (pollAborted) return;
    if (attempt >= MAX_POLL_ATTEMPTS) {
      actionBanner.value = {
        tone: "info",
        message: "等待 App 审批超时。若已在 App 中批准，请点击「我已批准，刷新状态」。"
      };
      return;
    }
    pollAttempt.value = attempt;
    pollTimer = setTimeout(async () => {
      if (pollAborted) return;
      try {
        const pact = await store.syncPact(pactId);
        if (pact?.status === "active") {
          await handlePactAfterSync(pact);
          return;
        }
        if (pact?.status === "terminated") {
          await handlePactAfterSync(pact);
          return;
        }
        schedulePoll(pactId, attempt + 1);
      } catch {
        schedulePoll(pactId, attempt + 1);
      }
    }, POLL_MS);
  }
  function startWaitingClock() {
    if (waitingTimer) return;
    waitingSeconds.value = 0;
    waitingTimer = setInterval();
  }
  function maybeStartPolling(pact) {
    if (!pact || pact.status !== "awaiting-approval") {
      clearPollTimer();
      return;
    }
    pollAborted = false;
    startWaitingClock();
    schedulePoll(pact.id, pollAttempt.value);
  }
  async function load(options) {
    loading.value = true;
    store.clearError();
    actionBanner.value = null;
    try {
      await store.fetchPreparation().catch(() => {
      });
      await store.fetchStrategies();
      await store.fetchPacts(pactListFetchStatus(statusFilter.value), { sync: options?.sync ?? true });
      const qid = route.query.id;
      if (typeof qid === "string") {
        await store.fetchPact(qid).catch(() => {
        });
      }
      const pact = selectedPact.value;
      if (pact) {
        autoExecuteAttempted.value = false;
        executeError.value = "";
        if (pact.status === "active" && (!pact.firstExecutionCompleted || !pact.firstExecutionTxHash?.trim())) {
          await tryAutoExecute(pact.id);
        } else {
          maybeStartPolling(pact);
        }
      }
    } finally {
      loading.value = false;
    }
  }
  async function refreshStatus() {
    if (!selectedId.value) return;
    busy.value = true;
    store.clearError();
    try {
      const pact = await store.syncPact(selectedId.value);
      await store.fetchPacts(pactListFetchStatus(statusFilter.value));
      if (pact?.status === "active") {
        actionBanner.value = {
          tone: "success",
          message: "Pact 已激活。"
        };
      }
      await handlePactAfterSync(pact);
    } catch (e) {
      actionBanner.value = {
        tone: "error",
        message: extractApiErrorMessage(e, "同步状态失败")
      };
    } finally {
      busy.value = false;
    }
  }
  async function approveLocalDraft() {
    if (!selectedId.value) return;
    busy.value = true;
    try {
      await store.approvePact(selectedId.value);
      await store.fetchPacts();
      actionBanner.value = { tone: "success", message: "本地 Pact 已批准。" };
    } catch (e) {
      actionBanner.value = {
        tone: "error",
        message: extractApiErrorMessage(e, "批准失败")
      };
    } finally {
      busy.value = false;
    }
  }
  async function refreshYieldPosition(pactId) {
    const id = pactId ?? selectedId.value;
    if (!id) {
      yieldPosition.value = null;
      return;
    }
    try {
      const snapshot = await store.fetchPactPosition(id);
      yieldPosition.value = snapshot;
    } catch {
      yieldPosition.value = null;
    }
  }
  async function runRedeemFunds() {
    if (!selectedId.value) return;
    redeeming.value = true;
    redeemError.value = "";
    try {
      const result = await store.redeemPact(selectedId.value);
      await refreshYieldPosition(selectedId.value);
      actionBanner.value = {
        tone: result.amountUsdc > 0 ? "success" : "info",
        message: result.amountUsdc > 0 ? `已赎回 ${result.amountUsdc} USDC 至 Agent Wallet，tx：${result.txHash || "已提交"}` : result.action
      };
    } catch (e) {
      redeemError.value = extractApiErrorMessage(e, "赎回失败");
      actionBanner.value = { tone: "error", message: redeemError.value };
    } finally {
      redeeming.value = false;
    }
  }
  async function refreshGasStatus() {
    try {
      gasStatus.value = await store.fetchAgentGasStatus();
    } catch {
      gasStatus.value = null;
    }
  }
  async function runFundAgentGas() {
    if (!gasStatus.value) {
      await refreshGasStatus();
    }
    const status = gasStatus.value;
    if (!status) {
      actionBanner.value = { tone: "error", message: "无法读取 Agent Wallet Gas 状态" };
      return;
    }
    try {
      await fundAgentGas(status.agentAddress, status.network, status.recommendedFundEth);
      await refreshGasStatus();
      executeError.value = "";
      actionBanner.value = {
        tone: "success",
        message: "Gas 已充值，请点击「执行首次 Recipe」重试。"
      };
    } catch (e) {
      const message = gasFundingError.value || extractApiErrorMessage(e, "Gas 充值失败");
      actionBanner.value = { tone: "error", message };
    }
  }
  async function retryExecute() {
    if (!selectedId.value) return;
    await refreshGasStatus();
    if (gasStatus.value && !gasStatus.value.ready) {
      executeError.value = gasStatus.value.wrongChainHint?.message ?? `Agent Wallet 需要至少 ${gasStatus.value.minEth} ${gasStatus.value.nativeTokenLabel}（${gasStatus.value.networkLabel} 当前 ${gasStatus.value.ethBalance} ETH）`;
      actionBanner.value = { tone: "error", message: executeError.value };
      return;
    }
    autoExecuteAttempted.value = false;
    executing.value = true;
    executeError.value = "";
    try {
      const result = await store.executePact(selectedId.value);
      actionBanner.value = {
        tone: "success",
        message: `首次 Recipe 已执行，tx：${result.txHash || "已提交"}`
      };
    } catch (e) {
      executeError.value = extractApiErrorMessage(e, "Recipe 执行失败");
      actionBanner.value = { tone: "error", message: executeError.value };
      if (executeError.value.includes("测试 ETH")) {
        await refreshGasStatus();
      }
    } finally {
      executing.value = false;
    }
  }
  async function simulateDenial() {
    if (!selectedId.value) return;
    busy.value = true;
    try {
      const result = await store.simulatePactDenial(selectedId.value);
      actionBanner.value = {
        tone: "info",
        message: result.reason
      };
    } catch (e) {
      actionBanner.value = {
        tone: "error",
        message: extractApiErrorMessage(e, "越权模拟失败")
      };
    } finally {
      busy.value = false;
    }
  }
  async function terminateSelected() {
    if (!selectedId.value || !selectedPact.value) return;
    const isWithdraw = ["pending", "awaiting-approval"].includes(selectedPact.value.status) && selectedPact.value.submissionMode === "cobo";
    const confirmed = (void 0).confirm(
      isWithdraw ? "确定撤回此待审批 Pact？将拒绝 Cobo 审批请求，Agent 需重新提交。" : "确定终止此 Pact？本地 draft 将立即标记为已终止。"
    );
    if (!confirmed) return;
    busy.value = true;
    clearPollTimer();
    try {
      await store.terminatePact(selectedId.value);
      await store.fetchPacts();
      actionBanner.value = { tone: "info", message: "Pact 已终止。" };
    } catch (e) {
      actionBanner.value = {
        tone: "error",
        message: extractApiErrorMessage(e, "终止失败")
      };
    } finally {
      busy.value = false;
    }
  }
  function selectPact(id) {
    clearPollTimer();
    autoExecuteAttempted.value = false;
    executeError.value = "";
    redeemError.value = "";
    actionBanner.value = null;
    selectedId.value = id;
    const pact = store.pacts.find((p) => p.id === id);
    maybeStartPolling(pact ?? null);
  }
  watch(selectedPact, (pact) => {
    if (pact?.status === "awaiting-approval" && !pollTimer && !pollAborted) {
      maybeStartPolling(pact);
    }
    if (pact?.firstExecutionCompleted && pact.firstExecutionTxHash) {
      void refreshYieldPosition(pact.id);
    } else {
      yieldPosition.value = null;
    }
    if (pact?.status === "active") {
      void refreshGasStatus();
    } else {
      gasStatus.value = null;
    }
  });
  watch(statusFilter, (next, prev) => {
    if (next === prev) return;
    void load();
  });
  return {
    store,
    busy,
    loading,
    actionBanner,
    executeError,
    executing,
    pollAttempt,
    waitingSeconds,
    statusFilter,
    filteredPacts,
    awaitingCount,
    selectedId,
    selectedPact,
    selectedStrategy,
    setStatusFilter,
    load,
    refreshStatus,
    approveLocalDraft,
    retryExecute,
    runFundAgentGas,
    runRedeemFunds,
    simulateDenial,
    terminateSelected,
    selectPact,
    gasStatus,
    fundingGas,
    eoaConnected,
    yieldPosition,
    redeeming,
    redeemError
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "pacts",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Pact 管理 · YieldAgent" });
    const {
      store,
      busy,
      loading,
      actionBanner,
      executeError,
      executing,
      waitingSeconds,
      statusFilter,
      filteredPacts,
      awaitingCount,
      selectedId,
      selectedPact,
      selectedStrategy,
      load,
      refreshStatus,
      approveLocalDraft,
      retryExecute,
      runFundAgentGas,
      runRedeemFunds,
      simulateDenial,
      terminateSelected,
      selectPact,
      gasStatus,
      fundingGas,
      eoaConnected,
      yieldPosition,
      redeeming,
      redeemError
    } = usePactManagement();
    const pactLogs = ref([]);
    const pairingReady = computed(
      () => store.preparation?.agentWallet.pairing?.status === "paired"
    );
    const filterTabs = [
      { key: "active", label: "执行中" },
      { key: "awaiting-approval", label: "待审批" },
      { key: "completed", label: "已完成" },
      { key: "rejected", label: "已拒绝" },
      { key: "expired", label: "已过期" },
      { key: "all", label: "全部" }
    ];
    async function loadPactLogs(pactId) {
      if (!pactId) {
        pactLogs.value = [];
        return;
      }
      try {
        pactLogs.value = await $fetch("/api/logs", {
          query: { pactId, limit: 5 }
        });
      } catch {
        pactLogs.value = [];
      }
    }
    watch(selectedId, (id) => {
      void loadPactLogs(id);
    }, { immediate: true });
    watch(actionBanner, () => {
      if (selectedId.value) void loadPactLogs(selectedId.value);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiPageAlert = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_PactsPactList = __nuxt_component_2;
      const _component_PactsPactDetail = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-6xl" }, _attrs))}><header class="mb-6"><h1 class="text-2xl font-semibold text-on-dark">Pact 管理</h1><p class="mt-2 text-sm text-muted"> 管理 CAW Pact 生命周期；待审批项需在 Cobo App 由主人批准。 </p></header>`);
      if (unref(awaitingCount) > 0 && unref(statusFilter) !== "awaiting-approval") {
        _push(`<div class="mb-4 rounded-lg border border-[var(--color-status-pending)]/40 bg-surface px-4 py-3 text-sm text-body" role="status"> 有 ${ssrInterpolate(unref(awaitingCount))} 条 Pact 等待 Cobo App 审批。 <button type="button" class="ml-1 font-medium text-primary hover:underline"> 查看待审批 </button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(actionBanner)) {
        _push(`<div class="${ssrRenderClass([{
          "border-trading-up/40 text-trading-up": unref(actionBanner).tone === "success",
          "border-trading-down/40 text-trading-down": unref(actionBanner).tone === "error",
          "border-hairline text-body": unref(actionBanner).tone === "info"
        }, "mb-4 rounded-lg border px-4 py-3 text-sm"])}" role="status">${ssrInterpolate(unref(actionBanner).message)}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(store).error) {
        _push(ssrRenderComponent(_component_UiPageAlert, {
          message: unref(store).error,
          onRetry: ($event) => unref(load)()
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Pact 状态筛选"><!--[-->`);
      ssrRenderList(filterTabs, (tab) => {
        _push(`<button type="button" role="tab" class="${ssrRenderClass([
          unref(statusFilter) === tab.key ? "border-primary bg-primary/10 text-on-dark" : "border-hairline text-muted hover:text-body",
          "rounded-full border px-3 py-1.5 text-sm transition-colors"
        ])}"${ssrRenderAttr("aria-selected", unref(statusFilter) === tab.key)}>${ssrInterpolate(tab.label)}</button>`);
      });
      _push(`<!--]--></div>`);
      if (unref(loading)) {
        _push(`<div class="h-64 animate-pulse rounded-lg bg-surface"></div>`);
      } else if (unref(filteredPacts).length === 0) {
        _push(`<div class="rounded-lg border border-dashed border-hairline px-5 py-12 text-center"><p class="text-sm text-muted">${ssrInterpolate(unref(store).pacts.length === 0 ? "尚无 Pact。完成钱包准备后创建策略，并在 Cobo App 审批通过后即可在此管理。" : "暂无符合筛选条件的 Pact。")}</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(DASHBOARD_CREATE_STRATEGY),
          class: "mt-4 inline-block text-sm font-medium text-primary hover:underline"
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
        _push(`</div>`);
      } else {
        _push(`<div class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">`);
        _push(ssrRenderComponent(_component_PactsPactList, {
          pacts: unref(filteredPacts),
          "selected-id": unref(selectedId),
          onSelect: unref(selectPact)
        }, null, _parent));
        _push(ssrRenderComponent(_component_PactsPactDetail, {
          pact: unref(selectedPact),
          strategy: unref(selectedStrategy),
          "recent-logs": unref(pactLogs),
          busy: unref(busy),
          executing: unref(executing),
          "execute-error": unref(executeError),
          "waiting-seconds": unref(waitingSeconds),
          "pairing-ready": unref(pairingReady),
          "gas-status": unref(gasStatus),
          "funding-gas": unref(fundingGas),
          "eoa-connected": unref(eoaConnected),
          "yield-position": unref(yieldPosition),
          redeeming: unref(redeeming),
          "redeem-error": unref(redeemError),
          onRefresh: unref(refreshStatus),
          onApproveLocal: unref(approveLocalDraft),
          onExecute: unref(retryExecute),
          onFundGas: unref(runFundAgentGas),
          onRedeem: unref(runRedeemFunds),
          onSimulateDenial: unref(simulateDenial),
          onTerminate: unref(terminateSelected)
        }, null, _parent));
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard/pacts.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=pacts-BipCwvfB.mjs.map
