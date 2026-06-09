import { _ as __nuxt_component_0 } from './nuxt-link-2DNqPodY.mjs';
import { _ as __nuxt_component_0$1 } from './PageAlert-CHrRkRzO.mjs';
import { defineComponent, ref, computed, watch, mergeProps, unref, withCtx, createTextVNode, isRef, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrRenderAttr } from 'vue/server-renderer';
import { _ as __nuxt_component_1 } from './TxLink-CUSy3Ole.mjs';
import { d as DASHBOARD_HISTORY } from '../_/dashboard-routes.mjs';
import { u as useHead } from './composables-DVORXyvj.mjs';
import { u as useRoute, b as useAppStore } from './server.mjs';
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

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "LogTypeFilter",
  __ssrInlineRender: true,
  props: {
    modelValue: {}
  },
  emits: ["update:modelValue"],
  setup(__props, { emit: __emit }) {
    const options = [
      { value: "all", label: "全部" },
      { value: "swap", label: "Swap" },
      { value: "supply", label: "Supply" },
      { value: "revenue", label: "Revenue Share" },
      { value: "pact", label: "Pact / Policy" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "flex flex-wrap gap-2",
        role: "group",
        "aria-label": "日志类型筛选"
      }, _attrs))}><!--[-->`);
      ssrRenderList(options, (opt) => {
        _push(`<button type="button" class="${ssrRenderClass([
          __props.modelValue === opt.value ? "border-primary/50 bg-surface-elevated text-on-dark" : "border-hairline text-muted hover:text-body",
          "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
        ])}">${ssrInterpolate(opt.label)}</button>`);
      });
      _push(`<!--]--></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/history/LogTypeFilter.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$2, { __name: "HistoryLogTypeFilter" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "LogTimeline",
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
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiTxLink = __nuxt_component_1;
      if (__props.loading && __props.logs.length === 0) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))}><!--[-->`);
        ssrRenderList(4, (i) => {
          _push(`<div class="h-16 animate-pulse rounded-lg bg-surface"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (__props.logs.length === 0) {
        _push(`<p${ssrRenderAttrs(mergeProps({ class: "text-sm text-muted" }, _attrs))}>该筛选条件下暂无记录。</p>`);
      } else {
        _push(`<ol${ssrRenderAttrs(mergeProps({ class: "space-y-0" }, _attrs))}><!--[-->`);
        ssrRenderList(__props.logs, (log) => {
          _push(`<li class="grid gap-4 border-b border-hairline py-4 sm:grid-cols-[10rem_minmax(0,1fr)]"><time class="font-mono text-xs text-muted"${ssrRenderAttr("datetime", log.timestamp)}>${ssrInterpolate(formatTime(log.timestamp))}</time><div><p class="text-sm text-on-dark">${ssrInterpolate(log.action)}</p><p class="mt-1 text-xs text-muted">${ssrInterpolate(TYPE_LABELS[log.type])} · ${ssrInterpolate(log.status)}</p><p class="mt-2">`);
          _push(ssrRenderComponent(_component_UiTxLink, {
            hash: log.txHash,
            network: "base-sepolia"
          }, null, _parent));
          _push(`</p></div></li>`);
        });
        _push(`<!--]--></ol>`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/history/LogTimeline.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$1, { __name: "HistoryLogTimeline" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "history",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "交易历史 · YieldAgent" });
    const route = useRoute();
    const store = useAppStore();
    const filter = ref("all");
    const loading = ref(true);
    const pactIdFilter = computed(() => {
      const q = route.query.pactId;
      return typeof q === "string" ? q : void 0;
    });
    async function loadLogs() {
      loading.value = true;
      store.clearError();
      try {
        const query = {
          limit: 100,
          ...filter.value === "all" ? {} : { type: filter.value },
          ...pactIdFilter.value ? { pactId: pactIdFilter.value } : {}
        };
        await store.fetchLogs(query);
      } finally {
        loading.value = false;
      }
    }
    watch(filter, loadLogs);
    watch(pactIdFilter, loadLogs);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiPageAlert = __nuxt_component_0$1;
      const _component_HistoryLogTypeFilter = __nuxt_component_2;
      const _component_HistoryLogTimeline = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-3xl" }, _attrs))}><header class="mb-6"><h1 class="text-2xl font-semibold text-on-dark">交易历史</h1><p class="mt-2 text-sm text-muted">可审计执行轨迹，与控制台近期日志同源。</p>`);
      if (unref(pactIdFilter)) {
        _push(`<p class="mt-2 font-mono text-xs text-muted"> 筛选 Pact：${ssrInterpolate(unref(pactIdFilter))} `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(DASHBOARD_HISTORY),
          class: "ml-2 text-primary hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`清除筛选`);
            } else {
              return [
                createTextVNode("清除筛选")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</header>`);
      if (unref(store).error) {
        _push(ssrRenderComponent(_component_UiPageAlert, {
          message: unref(store).error,
          onRetry: loadLogs
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_HistoryLogTypeFilter, {
        modelValue: unref(filter),
        "onUpdate:modelValue": ($event) => isRef(filter) ? filter.value = $event : null,
        class: "mb-6"
      }, null, _parent));
      _push(ssrRenderComponent(_component_HistoryLogTimeline, {
        logs: unref(store).logs,
        loading: unref(loading)
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard/history.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=history-CeTLbctG.mjs.map
