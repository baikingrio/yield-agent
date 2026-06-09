import { _ as __nuxt_component_0 } from './AppNav-BX2cY-m2.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-2DNqPodY.mjs';
import { defineComponent, computed, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderSlot, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
import { a as DASHBOARD_HOME, D as DASHBOARD_CREATE_STRATEGY, c as DASHBOARD_PACTS, d as DASHBOARD_HISTORY, b as DASHBOARD_SETTINGS } from '../_/dashboard-routes.mjs';
import { b as useAppStore, u as useRoute } from './server.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "DashboardSidebar",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const items = [
      { to: DASHBOARD_HOME, label: "概览", exact: true },
      { to: DASHBOARD_CREATE_STRATEGY, label: "创建策略" },
      { to: DASHBOARD_PACTS, label: "Pact 管理" },
      { to: DASHBOARD_HISTORY, label: "交易历史" },
      { to: DASHBOARD_SETTINGS, label: "设置" }
    ];
    function isActive(to, exact) {
      if (exact) return route.path === to;
      return route.path === to || route.path.startsWith(`${to}/`);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<nav${ssrRenderAttrs(mergeProps({
        class: "w-full shrink-0 border-b border-hairline bg-surface px-3 py-4 md:w-56 md:border-b-0 md:border-r md:py-6",
        "aria-label": "控制台导航"
      }, _attrs))}><ul class="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"><!--[-->`);
      ssrRenderList(items, (item) => {
        _push(`<li class="shrink-0 md:shrink">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: item.to,
          class: [
            "block rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors duration-150",
            isActive(item.to, item.exact) ? "bg-primary/10 text-on-dark" : "text-muted hover:bg-surface-elevated hover:text-body"
          ]
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(item.label)}`);
            } else {
              return [
                createTextVNode(toDisplayString(item.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></nav>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dashboard/DashboardSidebar.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$1, { __name: "DashboardSidebar" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const store = useAppStore();
    const preparationReady = computed(() => Boolean(store.preparation?.ready));
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppNav = __nuxt_component_0;
      const _component_DashboardSidebar = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex min-h-dvh flex-col bg-canvas" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_AppNav, { variant: "dashboard" }, null, _parent));
      _push(`<div class="flex min-h-0 flex-1 flex-col md:flex-row">`);
      if (unref(preparationReady)) {
        _push(ssrRenderComponent(_component_DashboardSidebar, null, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<main class="min-w-0 flex-1 px-4 py-6 md:px-6 md:py-8">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=dashboard-CLQ-_WJY.mjs.map
