import { b as useAppStore, f as useWalletConnect, a as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-2DNqPodY.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, createVNode, unref, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { D as DASHBOARD_CREATE_STRATEGY, a as DASHBOARD_HOME, c as DASHBOARD_PACTS, d as DASHBOARD_HISTORY } from '../_/dashboard-routes.mjs';
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

const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "LandingProductPreview",
  __ssrInlineRender: true,
  setup(__props) {
    const pactLines = [
      { label: "策略", value: "保守型 USDC 收益" },
      { label: "支出上限", value: "500 USDC" },
      { label: "网络", value: "Base Sepolia" },
      { label: "状态", value: "执行中", highlight: true }
    ];
    const recentActions = [
      { time: "今天 09:14", action: "Compound 存入 500 USDC", status: "成功", tone: "up" },
      { time: "昨天 18:02", action: "Pact 审批通过", status: "已激活", tone: "up" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<aside${ssrRenderAttrs(mergeProps({
        class: "overflow-hidden rounded-lg border border-hairline bg-surface lg:sticky lg:top-[calc(3.5rem+1.5rem)]",
        "aria-label": "产品界面预览"
      }, _attrs))}><div class="border-b border-hairline bg-canvas px-5 py-3"><div class="flex items-center justify-between gap-3"><p class="text-xs font-medium text-on-dark">控制台快照</p><span class="font-mono text-[0.65rem] text-[var(--color-muted-strong)]">测试网</span></div></div><div class="border-b border-hairline px-5 py-4"><p class="text-xs text-[var(--color-muted-strong)]">Agent Wallet 余额</p><p class="mt-1 font-mono text-xl font-medium text-on-dark">10,000 <span class="text-sm text-body">USDC</span></p><p class="mt-1 text-xs text-[var(--color-muted-strong)]">可用 · Base Sepolia</p></div><div class="border-b border-hairline px-5 py-4"><div class="flex items-center justify-between gap-2"><p class="text-sm font-semibold text-on-dark">当前 Pact</p><span class="rounded-sm bg-surface-elevated px-2 py-0.5 text-xs text-trading-up">执行中</span></div><dl class="mt-3 space-y-2"><!--[-->`);
      ssrRenderList(pactLines, (line) => {
        _push(`<div class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 text-xs"><dt class="text-[var(--color-muted-strong)]">${ssrInterpolate(line.label)}</dt><dd class="${ssrRenderClass([line.highlight ? "text-trading-up" : "text-body", "font-mono leading-5"])}">${ssrInterpolate(line.value)}</dd></div>`);
      });
      _push(`<!--]--></dl></div><div class="px-5 py-4"><p class="text-xs font-medium text-[var(--color-muted-strong)]">近期动作</p><ul class="mt-3 space-y-3" role="list"><!--[-->`);
      ssrRenderList(recentActions, (item) => {
        _push(`<li class="flex items-start justify-between gap-3 text-xs"><div class="min-w-0"><p class="text-body">${ssrInterpolate(item.action)}</p><p class="mt-0.5 font-mono text-[var(--color-muted-strong)]">${ssrInterpolate(item.time)}</p></div><span class="${ssrRenderClass(item.tone === "up" ? "text-trading-up" : "text-trading-down")}">${ssrInterpolate(item.status)}</span></li>`);
      });
      _push(`<!--]--></ul></div></aside>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/landing/LandingProductPreview.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$6, { __name: "LandingProductPreview" });
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "LandingWhySection",
  __ssrInlineRender: true,
  setup(__props) {
    const items = [
      {
        title: "资金隔离",
        body: "收益资金进入独立 Agent Wallet，与日常 EOA 分开管理。你只划入愿意自动化的那一部分 USDC。"
      },
      {
        title: "策略合约化",
        body: "每次运行以 Pact 约定支出上限、协议白名单、期限与分账。Agent 不能自行扩大权限或修改条款。"
      },
      {
        title: "执行可审计",
        body: "控制台与交易历史保留完整动作记录、状态变化与链上 tx hash，便于对账与复盘。"
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ "aria-labelledby": "landing-why-heading" }, _attrs))}><h2 id="landing-why-heading" class="text-base font-semibold text-on-dark"> 为什么需要 YieldAgent </h2><p class="mt-2 max-w-[65ch] text-sm text-[var(--color-muted-strong)]"> 手动管理多链 USDC 收益耗时且容易遗漏；把完整钱包交给 Agent 又风险过高。YieldAgent 在两者之间提供可审批、可追踪的自动化路径。 </p><div class="mt-8 grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-3"><!--[-->`);
      ssrRenderList(items, (item) => {
        _push(`<article class="bg-surface px-5 py-5"><h3 class="text-sm font-semibold text-on-dark">${ssrInterpolate(item.title)}</h3><p class="mt-2 text-pretty text-sm leading-6 text-body">${ssrInterpolate(item.body)}</p></article>`);
      });
      _push(`<!--]--></div></section>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/landing/LandingWhySection.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$5, { __name: "LandingWhySection" });
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "LandingHowItWorks",
  __ssrInlineRender: true,
  setup(__props) {
    const store = useAppStore();
    const { isConnected } = useWalletConnect();
    const showDashboardEntry = computed(
      () => isConnected.value || Boolean(store.preparation?.eoa.connected)
    );
    const steps = [
      {
        title: "准备 Agent 资金",
        body: "连接 EOA，在控制台创建 Agent Wallet 并转入用于自动化的 USDC。资金与主钱包隔离。",
        href: DASHBOARD_HOME,
        linkLabel: "前往控制台"
      },
      {
        title: "定义收益策略",
        body: "从保守型、平衡型模板出发，或用自然语言描述目标。提交前可预览完整 Pact 条款。",
        href: `${DASHBOARD_CREATE_STRATEGY}?template=conservative-usdc`,
        linkLabel: "创建策略"
      },
      {
        title: "审批 Pact",
        body: "在 Cobo Agentic Wallet App 中由钱包主人签署。未审批前 Agent 不会动用预算。",
        href: DASHBOARD_PACTS,
        linkLabel: "管理 Pact"
      },
      {
        title: "执行与监控",
        body: "Agent 在授权范围内自动执行 Recipe。你在控制台查看仓位、日志，必要时赎回或结束策略。",
        href: DASHBOARD_HOME,
        linkLabel: "打开控制台"
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<section${ssrRenderAttrs(mergeProps({ "aria-labelledby": "landing-how-heading" }, _attrs))}><h2 id="landing-how-heading" class="text-base font-semibold text-on-dark"> 如何使用 </h2><p class="mt-2 text-sm text-[var(--color-muted-strong)]"> 从首次接入到持续运行，流程固定且可在产品内逐步完成。 </p><ol class="mt-8 space-y-0 divide-y divide-hairline rounded-lg border border-hairline" role="list"><!--[-->`);
      ssrRenderList(steps, (step, index) => {
        _push(`<li class="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:gap-6"><span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-canvas font-mono text-xs text-primary" aria-hidden="true">${ssrInterpolate(index + 1)}</span><div class="min-w-0 flex-1"><h3 class="text-sm font-semibold text-on-dark">${ssrInterpolate(step.title)}</h3><p class="mt-1.5 text-pretty text-sm leading-6 text-body">${ssrInterpolate(step.body)}</p>`);
        if (unref(showDashboardEntry)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: step.href,
            class: "mt-3 inline-block text-sm font-medium text-primary no-underline hover:text-primary-active"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(step.linkLabel)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(step.linkLabel), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></li>`);
      });
      _push(`<!--]--></ol></section>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/landing/LandingHowItWorks.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main$4, { __name: "LandingHowItWorks" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "LandingFeatures",
  __ssrInlineRender: true,
  setup(__props) {
    const features = [
      {
        name: "策略模板",
        detail: "保守型、平衡型与自定义自然语言三种入口，降低首次配置成本。"
      },
      {
        name: "协议接入",
        detail: "按网络支持 Aave、Compound 等 Supply 类 Recipe，白名单在 Pact 中明示。"
      },
      {
        name: "Pact 全周期",
        detail: "创建、审批、执行、赎回与结束策略，状态在 Pact 管理中持续同步。"
      },
      {
        name: "风控拦截",
        detail: "超出白名单或预算的请求会被拒绝，原因写入日志，不会静默失败。"
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ "aria-labelledby": "landing-features-heading" }, _attrs))}><h2 id="landing-features-heading" class="text-base font-semibold text-on-dark"> 产品能力 </h2><p class="mt-2 max-w-[65ch] text-sm text-[var(--color-muted-strong)]"> 当前版本聚焦 USDC 收益自动化与 Pact 约束执行，适合个人与小型资金池的试点运行。 </p><dl class="mt-8 divide-y divide-hairline rounded-lg border border-hairline"><!--[-->`);
      ssrRenderList(features, (feature) => {
        _push(`<div class="grid gap-2 px-5 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6"><dt class="text-sm font-semibold text-on-dark">${ssrInterpolate(feature.name)}</dt><dd class="text-sm leading-6 text-body">${ssrInterpolate(feature.detail)}</dd></div>`);
      });
      _push(`<!--]--></dl></section>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/landing/LandingFeatures.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_5 = Object.assign(_sfc_main$3, { __name: "LandingFeatures" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "LandingControlSection",
  __ssrInlineRender: true,
  setup(__props) {
    const allowed = [
      "在 Pact 预算内执行已批准的 Supply Recipe",
      "按约定分账规则结算收益",
      "在授权网络（Base / Arbitrum Sepolia）上操作"
    ];
    const denied = [
      "支出超过 maxSpend 上限",
      "调用未列入白名单的协议或代币",
      "Pact 到期或终止后继续执行",
      "未经审批修改收益分账比例"
    ];
    const auditRows = [
      {
        time: "06-04 09:14",
        action: "Compound 存入 500 USDC",
        status: "成功",
        tone: "up"
      },
      {
        time: "06-03 21:08",
        action: "Swap 500 USDC → unknown token",
        status: "已拒绝",
        tone: "down"
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ "aria-labelledby": "landing-control-heading" }, _attrs))}><h2 id="landing-control-heading" class="text-base font-semibold text-on-dark"> 权限与风控 </h2><p class="mt-2 max-w-[65ch] text-sm text-[var(--color-muted-strong)]"> Pact 在链下由 Cobo Agentic Wallet 强制执行。允许与禁止动作在创建策略时即写入预览，执行阶段持续校验。 </p><div class="mt-8 grid gap-8 lg:grid-cols-2"><div class="space-y-6"><div><h3 class="text-xs font-semibold text-trading-up">允许 Agent</h3><ul class="mt-3 space-y-2.5" role="list"><!--[-->`);
      ssrRenderList(allowed, (item) => {
        _push(`<li class="flex gap-2.5 text-sm leading-6 text-body"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-trading-up" aria-hidden="true"></span><span>${ssrInterpolate(item)}</span></li>`);
      });
      _push(`<!--]--></ul></div><div><h3 class="text-xs font-semibold text-trading-down">不允许 Agent</h3><ul class="mt-3 space-y-2.5" role="list"><!--[-->`);
      ssrRenderList(denied, (item) => {
        _push(`<li class="flex gap-2.5 text-sm leading-6 text-body"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-trading-down" aria-hidden="true"></span><span>${ssrInterpolate(item)}</span></li>`);
      });
      _push(`<!--]--></ul></div></div><div class="rounded-lg border border-hairline"><div class="border-b border-hairline px-5 py-3"><p class="text-sm font-medium text-on-dark">执行记录示例</p><p class="mt-0.5 text-xs text-[var(--color-muted-strong)]">成功与拒绝均保留在同一审计流</p></div><div class="overflow-x-auto"><table class="w-full min-w-[400px] text-left text-sm"><thead><tr class="border-b border-hairline text-xs text-[var(--color-muted-strong)]"><th class="px-5 py-2.5 font-medium" scope="col">时间</th><th class="px-5 py-2.5 font-medium" scope="col">动作</th><th class="px-5 py-2.5 font-medium" scope="col">状态</th></tr></thead><tbody><!--[-->`);
      ssrRenderList(auditRows, (row) => {
        _push(`<tr class="border-b border-hairline last:border-0"><td class="whitespace-nowrap px-5 py-3 font-mono text-xs text-[var(--color-muted-strong)]">${ssrInterpolate(row.time)}</td><td class="px-5 py-3 text-body">${ssrInterpolate(row.action)}</td><td class="px-5 py-3"><span class="${ssrRenderClass(row.tone === "up" ? "text-trading-up" : "text-trading-down")}">${ssrInterpolate(row.status)}</span></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div></div></div></section>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/landing/LandingControlSection.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_6 = Object.assign(_sfc_main$2, { __name: "LandingControlSection" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "LandingSiteFooter",
  __ssrInlineRender: true,
  setup(__props) {
    const store = useAppStore();
    const { isConnected } = useWalletConnect();
    const showDashboardEntry = computed(
      () => isConnected.value || Boolean(store.preparation?.eoa.connected)
    );
    const links = [
      { to: DASHBOARD_HOME, label: "控制台" },
      { to: DASHBOARD_CREATE_STRATEGY, label: "创建策略" },
      { to: DASHBOARD_PACTS, label: "Pact 管理" },
      { to: DASHBOARD_HISTORY, label: "交易历史" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<footer${ssrRenderAttrs(mergeProps({ class: "border-t border-hairline pt-10" }, _attrs))}><div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p class="text-sm font-semibold text-on-dark">YieldAgent</p><p class="mt-2 max-w-[50ch] text-xs leading-5 text-[var(--color-muted-strong)]"> 基于 Cobo Agentic Wallet 的自主收益 Agent 平台。当前运行于 Base / Arbitrum Sepolia 测试网，不涉及主网资产。 </p></div>`);
      if (unref(showDashboardEntry)) {
        _push(`<nav class="flex flex-wrap gap-x-5 gap-y-2" aria-label="产品导航"><!--[-->`);
        ssrRenderList(links, (link) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: link.to,
            to: link.to,
            class: "text-sm text-[var(--color-muted-strong)] no-underline hover:text-body"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(link.label)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(link.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></nav>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></footer>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/landing/LandingSiteFooter.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_7 = Object.assign(_sfc_main$1, { __name: "LandingSiteFooter" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "YieldAgent · 链上 USDC 收益自动化",
      meta: [
        {
          name: "description",
          content: "在 Cobo Agentic Wallet 上运行自主收益策略。资金隔离、Pact 审批、执行可审计。"
        }
      ]
    });
    const store = useAppStore();
    ref(true);
    const { isConnected, busy, connectWallet } = useWalletConnect();
    computed(() => Boolean(store.preparation?.ready));
    const createStrategyHref = `${DASHBOARD_CREATE_STRATEGY}?template=conservative-usdc`;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_LandingProductPreview = __nuxt_component_2;
      const _component_LandingWhySection = __nuxt_component_3;
      const _component_LandingHowItWorks = __nuxt_component_4;
      const _component_LandingFeatures = __nuxt_component_5;
      const _component_LandingControlSection = __nuxt_component_6;
      const _component_LandingSiteFooter = __nuxt_component_7;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-7xl px-4 pb-16 pt-10 md:px-6 md:pb-24 md:pt-14" }, _attrs))}><section class="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,380px)] lg:items-start" aria-labelledby="landing-hero-heading"><div class="space-y-7"><p class="text-xs font-medium text-[var(--color-muted-strong)]"> 自主收益 Agent 平台 · 基于 Cobo Agentic Wallet </p><div class="space-y-4"><h1 id="landing-hero-heading" class="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-on-dark"> 链上 USDC 收益自动化，策略边界由你审批 </h1><p class="max-w-[65ch] text-pretty text-sm leading-6 text-body md:text-base"> 面向需要自动化收益、又不愿交出完整钱包权限的用户。资金进入独立 Agent Wallet，策略以 Pact 约定支出上限、协议白名单与运行期限；执行过程在控制台全程可查。 </p></div>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="h-10 w-32 animate-pulse rounded-md bg-surface"${_scopeId}></div>`);
          } else {
            return [
              createVNode("div", { class: "h-10 w-32 animate-pulse rounded-md bg-surface" })
            ];
          }
        })
      }, _parent));
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(_component_LandingProductPreview, null, null, _parent));
      _push(`</section><div class="mt-20 space-y-20 lg:mt-28 lg:space-y-24">`);
      _push(ssrRenderComponent(_component_LandingWhySection, null, null, _parent));
      _push(ssrRenderComponent(_component_LandingHowItWorks, null, null, _parent));
      _push(ssrRenderComponent(_component_LandingFeatures, null, null, _parent));
      _push(ssrRenderComponent(_component_LandingControlSection, null, null, _parent));
      _push(`<section class="rounded-lg border border-hairline bg-surface px-6 py-8 md:px-8" aria-label="注册使用"><div class="mx-auto max-w-2xl text-center"><h2 class="text-base font-semibold text-on-dark">开始管理你的第一条自动化收益策略</h2><p class="mt-2 text-sm text-[var(--color-muted-strong)]"> 连接钱包、在控制台完成 Agent 设置、创建策略并审批 Pact。推荐从保守型 USDC 模板开始。 </p><div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="h-10 w-32 animate-pulse rounded-md bg-surface"${_scopeId}></div>`);
          } else {
            return [
              createVNode("div", { class: "h-10 w-32 animate-pulse rounded-md bg-surface" })
            ];
          }
        })
      }, _parent));
      if (unref(isConnected)) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: createStrategyHref,
          class: "inline-flex h-10 w-full items-center justify-center rounded-md border border-hairline px-6 text-sm font-semibold text-on-dark no-underline transition-colors duration-150 hover:bg-surface-elevated sm:w-auto"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` 查看策略模板 `);
            } else {
              return [
                createTextVNode(" 查看策略模板 ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></section>`);
      _push(ssrRenderComponent(_component_LandingSiteFooter, null, null, _parent));
      _push(`</div></main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DMz2txXj.mjs.map
