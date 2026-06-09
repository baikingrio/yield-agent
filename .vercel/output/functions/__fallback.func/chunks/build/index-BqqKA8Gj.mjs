import { _ as __nuxt_component_0 } from './PageAlert-CHrRkRzO.mjs';
import { defineComponent, ref, mergeProps, unref, computed, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { _ as __nuxt_component_0$1 } from './nuxt-link-2DNqPodY.mjs';
import { _ as __nuxt_component_1$1 } from './StatusChip-WeVUEFuP.mjs';
import { D as DASHBOARD_CREATE_STRATEGY, d as DASHBOARD_HISTORY, c as DASHBOARD_PACTS } from '../_/dashboard-routes.mjs';
import { N as NETWORK_LABELS } from '../_/app.mjs';
import { u as useRoute, d as useRouter, b as useAppStore, a as __nuxt_component_0$2 } from './server.mjs';
import { _ as __nuxt_component_1$2 } from './TxLink-CUSy3Ole.mjs';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
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
import 'perfect-debounce';

const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "WalletBar",
  __ssrInlineRender: true,
  props: {
    wallet: {},
    loading: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const copied = ref(false);
    const shortAddress = computed(() => {
      const a = props.wallet?.address;
      if (!a) return "—";
      return `${a.slice(0, 6)}…${a.slice(-4)}`;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        class: "rounded-lg border border-hairline bg-surface px-5 py-4",
        "aria-label": "Agent 钱包"
      }, _attrs))}>`);
      if (__props.loading && !__props.wallet) {
        _push(`<div class="animate-pulse space-y-3"><div class="h-4 w-48 rounded bg-surface-elevated"></div><div class="grid grid-cols-3 gap-4"><!--[-->`);
        ssrRenderList(3, (i) => {
          _push(`<div class="h-10 rounded bg-surface-elevated"></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else if (__props.wallet) {
        _push(`<!--[--><div class="flex flex-wrap items-center gap-3"><span class="text-xs text-muted">CAW Agent Wallet</span><button type="button" class="font-mono text-sm text-on-dark transition-colors hover:text-primary"${ssrRenderAttr("title", __props.wallet.address)}>${ssrInterpolate(unref(shortAddress))}</button>`);
        if (unref(copied)) {
          _push(`<span class="text-xs text-trading-up">已复制</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span class="rounded-sm bg-surface-elevated px-2 py-1 font-mono text-[0.65rem] text-muted-strong">测试网 USDC</span></div><p class="mt-3 text-xs leading-5 text-muted"> 资金由 EOA 转入 Agent Wallet（测试网）。Agent 只能在 Active Pact 的 maxSpend 与白名单 Recipe 内操作。 </p><dl class="mt-4 grid gap-4 sm:grid-cols-3"><div><dt class="text-xs text-muted">Agent Wallet 余额 (USDC)</dt><dd class="mt-1 font-mono text-sm text-on-dark">${ssrInterpolate(__props.wallet.totalAssetsUsdc.toLocaleString("zh-CN", { maximumFractionDigits: 2 }))}</dd></div><div><dt class="text-xs text-muted">当前 APY</dt><dd class="mt-1 font-mono text-sm text-on-dark">${ssrInterpolate(__props.wallet.currentApy)}%</dd></div><div><dt class="text-xs text-muted">累计收益 (USDC)</dt><dd class="mt-1 font-mono text-sm text-trading-up">${ssrInterpolate(__props.wallet.cumulativeYieldUsdc.toLocaleString("zh-CN", { maximumFractionDigits: 2 }))}</dd></div></dl><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dashboard/WalletBar.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$4, { __name: "DashboardWalletBar" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "StrategyList",
  __ssrInlineRender: true,
  props: {
    strategies: {},
    pacts: {},
    loading: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    function pactForStrategy(strategy) {
      return props.pacts?.find((p) => p.id === strategy.pactId || p.coboPactId === strategy.pactId);
    }
    const STATUS_LABELS = {
      active: "运行中",
      paused: "已暂停",
      completed: "已完成"
    };
    const STATUS_TONE = {
      active: "active",
      paused: "paused",
      completed: "neutral"
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_UiStatusChip = __nuxt_component_1$1;
      _push(`<section${ssrRenderAttrs(mergeProps({ "aria-labelledby": "strategies-heading" }, _attrs))}><h2 id="strategies-heading" class="text-base font-semibold text-on-dark">策略</h2>`);
      if (__props.loading && __props.strategies.length === 0) {
        _push(`<div class="mt-4 space-y-3"><!--[-->`);
        ssrRenderList(2, (i) => {
          _push(`<div class="h-20 animate-pulse rounded-lg bg-surface"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (__props.strategies.length === 0) {
        _push(`<div class="mt-4 rounded-lg border border-dashed border-hairline px-5 py-8 text-center"><p class="text-sm text-muted">尚无策略。创建第一条受 Pact 约束的策略。</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(DASHBOARD_CREATE_STRATEGY),
          class: "mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
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
        _push(`<ul class="mt-4 space-y-3"><!--[-->`);
        ssrRenderList(__props.strategies, (s) => {
          _push(`<li><button type="button" class="w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-left transition-colors hover:border-muted/50"><div class="flex flex-wrap items-start justify-between gap-2"><span class="text-sm font-medium text-on-dark">${ssrInterpolate(s.name)}</span><div class="flex flex-wrap items-center gap-2">`);
          if (pactForStrategy(s)?.status === "awaiting-approval") {
            _push(ssrRenderComponent(_component_UiStatusChip, {
              label: "待 Cobo App 审批",
              tone: "pending"
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(ssrRenderComponent(_component_UiStatusChip, {
            label: STATUS_LABELS[s.status],
            tone: STATUS_TONE[s.status]
          }, null, _parent));
          _push(`</div></div><p class="mt-2 font-mono text-xs text-muted">${ssrInterpolate(unref(NETWORK_LABELS)[s.network])} · 上限 ${ssrInterpolate(s.maxSpend)} ${ssrInterpolate(s.asset)}</p></button></li>`);
        });
        _push(`<!--]--></ul>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dashboard/StrategyList.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$3, { __name: "DashboardStrategyList" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "RecentLogsTable",
  __ssrInlineRender: true,
  props: {
    logs: {},
    loading: { type: Boolean }
  },
  setup(__props) {
    const TYPE_LABELS = {
      swap: "Swap",
      supply: "Supply",
      revenue: "Revenue Share",
      pact: "Pact / Policy"
    };
    function formatTime(ts) {
      return new Date(ts).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_UiTxLink = __nuxt_component_1$2;
      _push(`<section${ssrRenderAttrs(mergeProps({ "aria-labelledby": "recent-logs-heading" }, _attrs))}><div class="flex items-center justify-between gap-4"><h2 id="recent-logs-heading" class="text-base font-semibold text-on-dark">近期执行</h2>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(DASHBOARD_HISTORY),
        class: "text-xs font-medium text-primary no-underline hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` 查看全部 `);
          } else {
            return [
              createTextVNode(" 查看全部 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (__props.loading && __props.logs.length === 0) {
        _push(`<div class="mt-4 h-32 animate-pulse rounded-lg bg-surface"></div>`);
      } else if (__props.logs.length === 0) {
        _push(`<p class="mt-4 text-sm text-muted">暂无执行记录。</p>`);
      } else {
        _push(`<div class="mt-4 overflow-x-auto rounded-lg border border-hairline"><table class="w-full min-w-[520px] text-left text-sm"><thead><tr class="border-b border-hairline bg-surface text-xs text-muted"><th class="px-4 py-2.5 font-medium" scope="col">时间</th><th class="px-4 py-2.5 font-medium" scope="col">动作</th><th class="px-4 py-2.5 font-medium" scope="col">类型</th><th class="px-4 py-2.5 font-medium" scope="col">Tx</th><th class="px-4 py-2.5 font-medium" scope="col">状态</th></tr></thead><tbody><!--[-->`);
        ssrRenderList(__props.logs, (log) => {
          _push(`<tr class="border-b border-hairline last:border-0"><td class="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted">${ssrInterpolate(formatTime(log.timestamp))}</td><td class="px-4 py-2.5 text-body">${ssrInterpolate(log.action)}</td><td class="px-4 py-2.5 text-xs text-muted-strong">${ssrInterpolate(TYPE_LABELS[log.type])}</td><td class="px-4 py-2.5">`);
          _push(ssrRenderComponent(_component_UiTxLink, {
            hash: log.txHash,
            network: "base-sepolia"
          }, null, _parent));
          _push(`</td><td class="px-4 py-2.5 text-xs">${ssrInterpolate(log.status)}</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dashboard/RecentLogsTable.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$2, { __name: "DashboardRecentLogsTable" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "YieldChart",
  __ssrInlineRender: true,
  props: {
    series: {},
    loading: { type: Boolean },
    range: {}
  },
  emits: ["update:range"],
  setup(__props, { emit: __emit }) {
    Chart.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      Filler
    );
    const props = __props;
    const reducedMotion = ref(false);
    computed(() => {
      const points = props.series?.points ?? [];
      return {
        labels: points.map((p) => p.date.slice(5)),
        datasets: [
          {
            label: "累计收益 (USDC)",
            data: points.map((p) => p.cumulativeUsdc),
            borderColor: "#0ecb81",
            backgroundColor: "rgba(14, 203, 129, 0.08)",
            fill: true,
            tension: 0.25,
            pointRadius: 2,
            pointHoverRadius: 4
          }
        ]
      };
    });
    computed(() => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: reducedMotion.value ? false : { duration: 0 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `累计 ${ctx.parsed.y.toLocaleString("zh-CN")} USDC`
          }
        }
      },
      scales: {
        x: {
          grid: { color: "#2b3139" },
          ticks: { color: "#707a8a", maxTicksLimit: 7 }
        },
        y: {
          grid: { color: "#2b3139" },
          ticks: { color: "#707a8a" }
        }
      }
    }));
    const hasData = computed(() => {
      const pts = props.series?.points ?? [];
      return pts.length > 0 && pts.some((p) => p.cumulativeUsdc !== 0);
    });
    computed(() => (props.series?.points ?? []).slice(-3));
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_ClientOnly = __nuxt_component_0$2;
      _push(`<section${ssrRenderAttrs(mergeProps({
        "aria-labelledby": "yield-chart-heading",
        class: "rounded-lg border border-hairline bg-surface px-5 py-4"
      }, _attrs))}><div class="flex flex-wrap items-end justify-between gap-4"><div><h2 id="yield-chart-heading" class="text-base font-semibold text-on-dark">累计收益</h2>`);
      if (__props.series) {
        _push(`<p class="mt-1 font-mono text-xs text-muted"> 区间合计 ${ssrInterpolate(__props.series.totalUsdc.toLocaleString("zh-CN", { maximumFractionDigits: 2 }))} USDC </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="inline-flex rounded-md border border-hairline p-0.5" role="group" aria-label="时间范围"><button type="button" class="${ssrRenderClass([__props.range === "7d" ? "bg-surface-elevated text-on-dark" : "text-muted hover:text-body", "rounded-sm px-3 py-1 text-xs font-medium transition-colors"])}"> 7 日 </button><button type="button" class="${ssrRenderClass([__props.range === "30d" ? "bg-surface-elevated text-on-dark" : "text-muted hover:text-body", "rounded-sm px-3 py-1 text-xs font-medium transition-colors"])}"> 30 日 </button></div></div>`);
      if (__props.loading && !__props.series) {
        _push(`<div class="mt-4 h-48 animate-pulse rounded bg-surface-elevated"></div>`);
      } else if (!unref(hasData)) {
        _push(`<div class="mt-4 rounded-md border border-hairline bg-canvas px-4 py-5"><p class="text-sm text-body">收益同步尚未开启。</p><p class="mt-2 text-sm text-[var(--color-muted-strong)]"> 可在 `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(DASHBOARD_PACTS),
          class: "text-primary no-underline hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Pact 管理`);
            } else {
              return [
                createTextVNode("Pact 管理")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(` 查看链上仓位与赎回状态。 </p></div>`);
      } else {
        _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dashboard/YieldChart.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main$1, { __name: "DashboardYieldChart" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "控制台 · YieldAgent" });
    useRoute();
    useRouter();
    const store = useAppStore();
    const showCreated = ref(false);
    const initialLoading = ref(true);
    async function loadDashboard() {
      store.clearError();
      store.loading = true;
      try {
        await Promise.all([
          store.fetchWallet(),
          store.fetchStrategies(),
          store.fetchPacts(),
          store.fetchLogs({ limit: 10 }),
          store.fetchYieldSeries(void 0, { sync: true })
        ]);
      } finally {
        store.loading = false;
        initialLoading.value = false;
      }
    }
    async function onRangeChange(range) {
      await store.fetchYieldSeries(range);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiPageAlert = __nuxt_component_0;
      const _component_DashboardWalletBar = __nuxt_component_1;
      const _component_DashboardStrategyList = __nuxt_component_2;
      const _component_DashboardRecentLogsTable = __nuxt_component_3;
      const _component_DashboardYieldChart = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-5xl space-y-8" }, _attrs))}><header class="space-y-2"><div class="inline-flex rounded-full border border-hairline bg-surface px-3 py-1 font-mono text-xs text-muted-strong"> 测试网 · Agent Wallet </div><h1 class="text-2xl font-semibold text-on-dark">控制台</h1><p class="mt-2 max-w-prose text-sm text-muted"> 展示 CAW Agent Wallet 余额、Active Pact、执行日志与 tx hash。收益图为辅助信息；越权拒绝会出现在审计轨迹中。 </p></header>`);
      if (unref(showCreated)) {
        _push(`<div class="rounded-md border border-trading-up/30 bg-surface px-4 py-3 text-sm text-trading-up" role="status"> 策略已创建，可在下方列表或 Pact 管理中查看。 </div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(store).error) {
        _push(ssrRenderComponent(_component_UiPageAlert, {
          message: unref(store).error,
          onRetry: loadDashboard
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_DashboardWalletBar, {
        wallet: unref(store).wallet,
        loading: unref(initialLoading)
      }, null, _parent));
      _push(ssrRenderComponent(_component_DashboardStrategyList, {
        strategies: unref(store).strategies,
        pacts: unref(store).pacts,
        loading: unref(initialLoading)
      }, null, _parent));
      _push(ssrRenderComponent(_component_DashboardRecentLogsTable, {
        logs: unref(store).logs,
        loading: unref(initialLoading)
      }, null, _parent));
      _push(ssrRenderComponent(_component_DashboardYieldChart, {
        series: unref(store).yieldSeries,
        loading: unref(initialLoading),
        range: unref(store).yieldRange,
        "onUpdate:range": onRangeChange
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BqqKA8Gj.mjs.map
