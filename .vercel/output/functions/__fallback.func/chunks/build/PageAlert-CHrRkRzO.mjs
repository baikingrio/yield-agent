import { defineComponent, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PageAlert",
  __ssrInlineRender: true,
  props: {
    message: {}
  },
  emits: ["retry"],
  setup(__props, { emit: __emit }) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-trading-down/40 bg-surface px-4 py-3 text-sm text-body",
        role: "alert"
      }, _attrs))}><span>${ssrInterpolate(__props.message)}</span><button type="button" class="shrink-0 rounded-md border border-hairline px-3 py-1.5 text-xs font-medium text-on-dark transition-colors hover:bg-surface-elevated"> 重试 </button></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/PageAlert.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main, { __name: "UiPageAlert" });

export { __nuxt_component_0 as _ };
//# sourceMappingURL=PageAlert-CHrRkRzO.mjs.map
