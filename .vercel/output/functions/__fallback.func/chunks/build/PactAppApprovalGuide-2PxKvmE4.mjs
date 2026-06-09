import { _ as __nuxt_component_0 } from './nuxt-link-2DNqPodY.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { a as DASHBOARD_HOME } from '../_/dashboard-routes.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PactAppApprovalGuide",
  __ssrInlineRender: true,
  props: {
    pact: {},
    submissionMessage: {},
    waitingSeconds: {},
    pairingReady: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    ref(false);
    const copied = ref(null);
    const pactId = computed(() => props.pact.coboPactId || props.pact.id);
    const intentPreview = computed(() => {
      const lines = props.pact.intent.split("\n").filter(Boolean);
      return lines.slice(0, 2).join(" · ") || props.pact.intent;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<section${ssrRenderAttrs(mergeProps({
        class: "rounded-lg border border-primary/30 bg-surface-elevated/40 px-4 py-4",
        role: "status",
        "aria-live": "polite",
        "aria-atomic": "true"
      }, _attrs))}><h3 class="text-sm font-semibold text-on-dark"> 请在 Cobo App 中批准此 Pact </h3><p class="mt-2 text-xs leading-5 text-muted">${ssrInterpolate(__props.submissionMessage || "Pact 已提交成功，需钱包主人在 App 内批准后才能激活与执行。这是正常流程，不是系统故障。")}</p>`);
      if (__props.pairingReady === false) {
        _push(`<p class="mt-3 rounded-md border border-trading-down/40 bg-surface px-3 py-2 text-xs text-trading-down" role="alert"> Agent Wallet 尚未与 App 配对。 `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(DASHBOARD_HOME),
          class: "font-medium text-primary hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` 请先在控制台完成 App 配对 `);
            } else {
              return [
                createTextVNode(" 请先在控制台完成 App 配对 ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</p>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.waitingSeconds != null && __props.waitingSeconds > 0) {
        _push(`<p class="mt-3 text-xs text-muted"> 正在等待 App 审批…（已等待 ${ssrInterpolate(__props.waitingSeconds)} 秒，每 4 秒自动刷新） </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<p class="mt-3 text-xs text-body"><span class="text-muted">对照意图：</span>${ssrInterpolate(unref(intentPreview))}</p><ol class="mt-4 list-decimal space-y-2 pl-4 text-xs leading-5 text-body"><li> 打开手机 <strong class="font-medium text-on-dark">Cobo Agentic Wallet App</strong> （须与当前 Agent Wallet <strong class="font-medium text-on-dark">已配对</strong> 的同一主人账号）。 </li><li> 进入 <strong class="font-medium text-on-dark">待审批 / Pending Approvals</strong>，按上方意图摘要找到本条 Pact。 </li><li> 打开详情，核对 Policy 与支出上限（≤ ${ssrInterpolate(__props.pact.maxSpend)} USDC），点击 <strong class="font-medium text-on-dark">批准 / Approve</strong>。 </li><li> 回到本页：系统会自动刷新；也可点击下方 <strong class="font-medium text-on-dark">「我已批准，刷新状态」</strong>。 </li></ol><div class="mt-4 space-y-2"><div class="flex flex-wrap items-center gap-2"><span class="font-mono text-[0.7rem] text-muted break-all">Pact ID：${ssrInterpolate(unref(pactId))}</span><button type="button" class="rounded border border-hairline px-2 py-0.5 text-[0.65rem] text-body hover:bg-surface">${ssrInterpolate(unref(copied) === "pact" ? "已复制" : "复制")}</button></div>`);
      if (__props.pact.approvalId) {
        _push(`<div class="flex flex-wrap items-center gap-2"><span class="font-mono text-[0.7rem] text-muted break-all">Approval ID：${ssrInterpolate(__props.pact.approvalId)}</span><button type="button" class="rounded border border-hairline px-2 py-0.5 text-[0.65rem] text-body hover:bg-surface">${ssrInterpolate(unref(copied) === "approval" ? "已复制" : "复制")}</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><details class="mt-4 text-xs text-body"><summary class="cursor-pointer text-muted hover:text-on-dark"> App 里找不到？ </summary><ul class="mt-2 list-disc space-y-1 pl-4 leading-5 text-muted"><li>确认 App 登录账号 = 创建 Agent Wallet 的钱包主人。</li><li>在 App 内手动打开 Pending 列表，勿仅依赖推送通知。</li><li>若已批准但本页仍等待，点「我已批准，刷新状态」或稍等自动轮询。</li><li>仍无效时，复制上方 Pact ID 便于排查。</li></ul></details><details class="mt-2 text-xs"><summary class="cursor-pointer text-muted hover:text-on-dark"> 开发者 / CLI </summary><p class="mt-2 font-mono text-[0.65rem] text-muted break-all"> caw pact show --pact-id ${ssrInterpolate(unref(pactId))}</p></details></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/pacts/PactAppApprovalGuide.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "PactsPactAppApprovalGuide" });

export { __nuxt_component_1 as _ };
//# sourceMappingURL=PactAppApprovalGuide-2PxKvmE4.mjs.map
