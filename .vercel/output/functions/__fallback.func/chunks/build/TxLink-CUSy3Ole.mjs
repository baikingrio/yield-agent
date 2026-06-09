import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "TxLink",
  __ssrInlineRender: true,
  props: {
    hash: {},
    network: {}
  },
  setup(__props) {
    const props = __props;
    const explorerUrl = computed(() => {
      const hash = props.hash;
      if (props.network === "arbitrum-sepolia") {
        return `https://sepolia.arbiscan.io/tx/${hash}`;
      }
      return `https://sepolia.basescan.org/tx/${hash}`;
    });
    const shortHash = computed(() => {
      const h = props.hash;
      if (h.length <= 14) return h;
      return `${h.slice(0, 8)}…${h.slice(-6)}`;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<a${ssrRenderAttrs(mergeProps({
        href: unref(explorerUrl),
        target: "_blank",
        rel: "noopener noreferrer",
        class: "font-mono text-xs text-primary no-underline hover:text-primary-active hover:underline"
      }, _attrs))}>${ssrInterpolate(unref(shortHash))}</a>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/TxLink.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "UiTxLink" });

export { __nuxt_component_1 as _ };
//# sourceMappingURL=TxLink-CUSy3Ole.mjs.map
