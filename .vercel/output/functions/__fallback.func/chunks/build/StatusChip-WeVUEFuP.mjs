import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "StatusChip",
  __ssrInlineRender: true,
  props: {
    label: {},
    tone: {}
  },
  setup(__props) {
    const props = __props;
    const toneClass = computed(() => {
      switch (props.tone ?? "neutral") {
        case "active":
          return "text-trading-up";
        case "pending":
          return "text-[var(--color-status-pending)]";
        case "paused":
          return "text-[var(--color-status-paused)]";
        case "error":
          return "text-trading-down";
        default:
          return "text-muted-strong";
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<span${ssrRenderAttrs(mergeProps({
        class: ["inline-flex shrink-0 rounded-sm bg-surface-elevated px-2.5 py-1 text-xs font-medium", unref(toneClass)]
      }, _attrs))}>${ssrInterpolate(__props.label)}</span>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/StatusChip.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "UiStatusChip" });

export { __nuxt_component_1 as _ };
//# sourceMappingURL=StatusChip-WeVUEFuP.mjs.map
