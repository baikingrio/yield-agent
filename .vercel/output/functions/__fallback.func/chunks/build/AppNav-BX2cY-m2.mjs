import { _ as __nuxt_component_0$1 } from './nuxt-link-2DNqPodY.mjs';
import { b as useAppStore, f as useWalletConnect, a as __nuxt_component_0$2 } from './server.mjs';
import { defineComponent, computed, mergeProps, withCtx, createTextVNode, unref, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { a as DASHBOARD_HOME } from '../_/dashboard-routes.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "AppWalletStatus",
  __ssrInlineRender: true,
  setup(__props) {
    const {
      isConnected,
      connectedNetworkLabel,
      expectedNetwork,
      networkMismatch,
      busy,
      displayAddress,
      displayLabel,
      connectWallet,
      disconnectWallet,
      NETWORK_LABELS
    } = useWalletConnect();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0$2;
      _push(ssrRenderComponent(_component_ClientOnly, _attrs, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="inline-block h-9 w-20 animate-pulse rounded-md bg-surface"${_scopeId}></span>`);
          } else {
            return [
              createVNode("span", { class: "inline-block h-9 w-20 animate-pulse rounded-md bg-surface" })
            ];
          }
        })
      }, _parent));
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppWalletStatus.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$1, { __name: "AppWalletStatus" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "AppNav",
  __ssrInlineRender: true,
  props: {
    variant: { default: "landing" }
  },
  setup(__props) {
    const store = useAppStore();
    const { isConnected } = useWalletConnect();
    const showDashboardEntry = computed(
      () => isConnected.value || Boolean(store.preparation?.eoa.connected)
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_AppWalletStatus = __nuxt_component_1;
      _push(`<header${ssrRenderAttrs(mergeProps({ class: "sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-4 border-b border-hairline bg-canvas px-4 md:gap-8 md:px-6" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "shrink-0 text-sm font-semibold text-primary no-underline hover:text-primary-active"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` YieldAgent `);
          } else {
            return [
              createTextVNode(" YieldAgent ")
            ];
          }
        }),
        _: 1
      }, _parent));
      if (__props.variant === "landing") {
        _push(`<nav class="flex min-w-0 flex-1 items-center justify-end gap-2" aria-label="落地页导航">`);
        if (unref(showDashboardEntry)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: unref(DASHBOARD_HOME),
            class: "hidden h-9 shrink-0 items-center justify-center rounded-md border border-hairline px-3 text-sm font-semibold text-body no-underline transition-colors duration-150 hover:bg-surface-elevated sm:inline-flex md:px-4"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` 控制台 `);
              } else {
                return [
                  createTextVNode(" 控制台 ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(ssrRenderComponent(_component_AppWalletStatus, null, null, _parent));
        _push(`</nav>`);
      } else {
        _push(`<div class="flex min-w-0 flex-1 justify-end">`);
        _push(ssrRenderComponent(_component_AppWalletStatus, null, null, _parent));
        _push(`</div>`);
      }
      _push(`</header>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppNav.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main, { __name: "AppNav" });

export { __nuxt_component_0 as _ };
//# sourceMappingURL=AppNav-BX2cY-m2.mjs.map
