import { defineComponent, computed, mergeProps, unref, withCtx, createTextVNode, ref, reactive, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { _ as __nuxt_component_0$1 } from './nuxt-link-2DNqPodY.mjs';
import { _ as __nuxt_component_1 } from './PactAppApprovalGuide-2PxKvmE4.mjs';
import { _ as __nuxt_component_1$1 } from './TxLink-CUSy3Ole.mjs';
import { a as DASHBOARD_HOME, c as DASHBOARD_PACTS } from '../_/dashboard-routes.mjs';
import { u as useHead } from './composables-DVORXyvj.mjs';
import { N as NETWORK_LABELS, M as MIN_MAX_SPEND_USDC, a as MAX_MAX_SPEND_USDC } from '../_/app.mjs';
import { p as parseNumericField } from '../_/numeric-field.mjs';
import { b as useAppStore, u as useRoute, e as extractApiErrorMessage } from './server.mjs';
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

const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "StepIndicator",
  __ssrInlineRender: true,
  props: {
    activeIndex: {}
  },
  setup(__props) {
    const props = __props;
    const steps = ["资金", "策略", "预览", "审批", "执行", "审计"];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<ol${ssrRenderAttrs(mergeProps({
        class: "flex flex-wrap gap-x-3 gap-y-2 text-xs font-medium text-muted",
        "aria-label": "创建策略进度"
      }, _attrs))}><!--[-->`);
      ssrRenderList(steps, (step, i) => {
        _push(`<li class="flex items-center gap-2"${ssrRenderAttr("aria-current", i === props.activeIndex ? "step" : void 0)}><span class="${ssrRenderClass([
          i < props.activeIndex ? "bg-surface-elevated text-trading-up" : i === props.activeIndex ? "bg-primary text-on-primary" : "bg-surface text-muted-strong",
          "flex h-6 w-6 items-center justify-center rounded-sm text-[0.65rem] transition-colors duration-150"
        ])}">${ssrInterpolate(i + 1)}</span><span class="${ssrRenderClass(i === props.activeIndex ? "text-on-dark" : "")}">${ssrInterpolate(step)}</span>`);
        if (i < steps.length - 1) {
          _push(`<span class="hidden text-hairline sm:inline" aria-hidden="true">/</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</li>`);
      });
      _push(`<!--]--></ol>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/create-strategy/StepIndicator.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main$3, { __name: "CreateStrategyStepIndicator" });
const controlClass = "h-11 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-on-dark transition-colors focus:border-primary/60 disabled:opacity-60";
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "StrategyForm",
  __ssrInlineRender: true,
  props: {
    form: {},
    errors: {},
    disabled: { type: Boolean },
    nlOpen: { type: Boolean },
    nlText: {},
    nlFilled: { type: Boolean },
    nlParsing: { type: Boolean },
    availableBalanceLabel: {},
    preparationNetworkLabel: {},
    networkMismatch: { type: Boolean },
    agentSplit: {}
  },
  emits: ["update:nlOpen", "update:nlText", "parseNl", "clearNl"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const riskOptions = [
      { value: "conservative", label: "保守", hint: "仅允许 Aave / Compound Supply" },
      { value: "balanced", label: "平衡", hint: "Supply 为主，允许小幅仓位调整" },
      { value: "aggressive", label: "激进", hint: "额外允许测试网 Uniswap 兑换" }
    ];
    const monoControlClass = `${controlClass} font-mono`;
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><details class="group rounded-lg border border-hairline bg-surface"${ssrIncludeBooleanAttr(props.nlOpen) ? " open" : ""}><summary class="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-on-dark [&amp;::-webkit-details-marker]:hidden"><span class="flex items-center justify-between gap-2"><span class="flex items-center gap-2"><span class="inline-block text-muted transition-transform duration-150 group-open:rotate-90" aria-hidden="true">›</span> 用自然语言描述（可选） </span><span class="text-xs font-normal text-muted">辅助填充表单</span></span></summary><div class="space-y-3 border-t border-hairline px-5 pb-5 pt-4"><label class="sr-only" for="nl-input">策略描述</label><textarea id="nl-input" rows="3"${ssrIncludeBooleanAttr(props.disabled) ? " disabled" : ""} class="w-full resize-y rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-on-dark placeholder:text-muted focus:border-primary/60 disabled:opacity-60" placeholder="例如：在 Base 链保守耕作 500 USDC，支出上限 500，目标 APY 8%">${ssrInterpolate(props.nlText)}</textarea><div class="flex flex-wrap gap-2"><button type="button" class="inline-flex h-11 items-center justify-center rounded-md bg-surface-elevated px-4 text-sm font-semibold text-body transition-colors hover:bg-hairline disabled:opacity-50"${ssrIncludeBooleanAttr(props.disabled || props.nlParsing || !props.nlText.trim()) ? " disabled" : ""}>${ssrInterpolate(props.nlParsing ? "解析中…" : "解析并填入表单")}</button>`);
      if (props.nlFilled) {
        _push(`<button type="button" class="inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-elevated hover:text-body"${ssrIncludeBooleanAttr(props.disabled) ? " disabled" : ""}> 清除已解析字段 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (props.nlFilled) {
        _push(`<p class="text-xs text-body">已根据描述更新表单字段。</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></details><section class="rounded-lg border border-hairline bg-surface p-5" aria-labelledby="strategy-params-heading"><p class="font-mono text-xs text-muted-strong">Pact 参数</p><h2 id="strategy-params-heading" class="mt-2 text-base font-semibold text-on-dark"> 策略配置 </h2><p class="mt-2 max-w-prose text-sm leading-6 text-body"> 填写后将同步到右侧 Pact 预览。支出上限不能超过 Agent Wallet 可用余额。 </p><fieldset${ssrIncludeBooleanAttr(props.disabled) ? " disabled" : ""} class="mt-6 disabled:opacity-70"><section class="space-y-4" aria-labelledby="network-heading"><h3 id="network-heading" class="text-sm font-semibold text-on-dark">网络与资产</h3><div class="grid gap-4 sm:grid-cols-2"><div><label for="network" class="mb-1.5 block text-xs text-muted-strong">网络</label><select id="network" class="${ssrRenderClass(controlClass)}"><option value="base-sepolia"${ssrIncludeBooleanAttr(Array.isArray(props.form.network) ? ssrLooseContain(props.form.network, "base-sepolia") : ssrLooseEqual(props.form.network, "base-sepolia")) ? " selected" : ""}>Base Sepolia 测试网</option><option value="arbitrum-sepolia"${ssrIncludeBooleanAttr(Array.isArray(props.form.network) ? ssrLooseContain(props.form.network, "arbitrum-sepolia") : ssrLooseEqual(props.form.network, "arbitrum-sepolia")) ? " selected" : ""}>Arbitrum Sepolia 测试网</option></select></div><div><span class="mb-1.5 block text-xs text-muted-strong">资产</span><p class="flex h-11 items-center rounded-md border border-hairline bg-canvas px-3 font-mono text-sm text-on-dark">${ssrInterpolate(props.form.asset)}</p></div>`);
      if (props.networkMismatch && props.preparationNetworkLabel) {
        _push(`<div class="sm:col-span-2"><p class="rounded-md border border-trading-down/30 bg-canvas px-3 py-2 text-xs text-trading-down"> 当前 Agent Wallet 注资在 ${ssrInterpolate(props.preparationNetworkLabel)}，与所选网络不一致。 </p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="sm:col-span-2"><label for="target-apy" class="mb-1.5 block text-xs text-muted-strong"> 目标 APY（可选） </label><input id="target-apy"${ssrRenderAttr("value", props.form.targetApy)} type="text" inputmode="decimal" class="${ssrRenderClass([monoControlClass, "sm:max-w-xs"])}"${ssrRenderAttr("aria-invalid", !!props.errors.targetApy)}${ssrRenderAttr("aria-describedby", props.errors.targetApy ? "target-apy-error" : "target-apy-hint")}>`);
      if (props.errors.targetApy) {
        _push(`<p id="target-apy-error" class="mt-1 text-xs text-trading-down">${ssrInterpolate(props.errors.targetApy)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></section><section class="mt-6 space-y-4 border-t border-hairline pt-6" aria-labelledby="risk-heading"><h3 id="risk-heading" class="text-sm font-semibold text-on-dark">风险与限额</h3><div><span class="mb-2 block text-xs text-muted-strong">风险级别</span><div class="flex flex-wrap gap-2" role="radiogroup" aria-label="风险级别"><!--[-->`);
      ssrRenderList(riskOptions, (opt) => {
        _push(`<label class="${ssrRenderClass([props.form.riskLevel === opt.value ? "border-primary text-on-dark" : "border-hairline bg-canvas text-body", "inline-flex h-11 cursor-pointer items-center rounded-md border px-4 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-surface-elevated"])}"><input${ssrIncludeBooleanAttr(ssrLooseEqual(props.form.riskLevel, opt.value)) ? " checked" : ""} type="radio" class="sr-only"${ssrRenderAttr("value", opt.value)}> ${ssrInterpolate(opt.label)}</label>`);
      });
      _push(`<!--]--></div><p class="mt-2 text-xs text-muted">${ssrInterpolate(riskOptions.find((o) => o.value === props.form.riskLevel)?.hint)}</p></div><div><label for="max-spend" class="mb-1.5 block text-xs text-muted-strong"> 最大支出（${ssrInterpolate(props.form.asset)}） </label><input id="max-spend"${ssrRenderAttr("value", props.form.maxSpend)} type="text" inputmode="decimal" class="${ssrRenderClass([monoControlClass, "sm:max-w-xs"])}"${ssrRenderAttr("aria-invalid", !!props.errors.maxSpend)}${ssrRenderAttr("aria-describedby", props.errors.maxSpend ? "max-spend-error" : "max-spend-hint")}>`);
      if (props.errors.maxSpend) {
        _push(`<p id="max-spend-error" class="mt-1 text-xs text-trading-down">${ssrInterpolate(props.errors.maxSpend)}</p>`);
      } else {
        _push(`<p id="max-spend-hint" class="mt-1 text-xs text-muted"> Agent Wallet 可用余额：${ssrInterpolate(props.availableBalanceLabel)}</p>`);
      }
      _push(`</div></section><section class="mt-6 space-y-4 border-t border-hairline pt-6" aria-labelledby="fees-heading"><h3 id="fees-heading" class="text-sm font-semibold text-on-dark">费率与收益分账</h3><div class="grid gap-4 sm:grid-cols-2"><div><label for="agent-fee" class="mb-1.5 block text-xs text-muted-strong"> Agent 绩效费率（%） </label><input id="agent-fee"${ssrRenderAttr("value", props.form.agentFee)} type="text" inputmode="decimal" class="${ssrRenderClass(monoControlClass)}"${ssrRenderAttr("aria-invalid", !!props.errors.agentFee)}${ssrRenderAttr("aria-describedby", props.errors.agentFee ? "agent-fee-error" : "agent-fee-hint")}>`);
      if (props.errors.agentFee) {
        _push(`<p id="agent-fee-error" class="mt-1 text-xs text-trading-down">${ssrInterpolate(props.errors.agentFee)}</p>`);
      } else {
        _push(`<p id="agent-fee-hint" class="mt-1 text-xs text-muted"> 从策略收益中扣除的服务费，与下方收益分账独立计算。 </p>`);
      }
      _push(`</div><div><label for="user-split" class="mb-1.5 block text-xs text-muted-strong"> 用户分成（%） </label><input id="user-split"${ssrRenderAttr("value", props.form.userSplit)} type="text" inputmode="decimal" class="${ssrRenderClass(monoControlClass)}"${ssrRenderAttr("aria-invalid", !!props.errors.userSplit)}${ssrRenderAttr("aria-describedby", props.errors.userSplit ? "user-split-error" : "user-split-hint")}>`);
      if (props.errors.userSplit) {
        _push(`<p id="user-split-error" class="mt-1 text-xs text-trading-down">${ssrInterpolate(props.errors.userSplit)}</p>`);
      } else {
        _push(`<p id="user-split-hint" class="mt-1 text-xs text-muted"> Agent 分得 ${ssrInterpolate(props.agentSplit)}%，与用户分成合计 100%。 </p>`);
      }
      _push(`</div></div></section></fieldset></section></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/create-strategy/StrategyForm.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$2, { __name: "CreateStrategyForm" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "PactPreview",
  __ssrInlineRender: true,
  props: {
    lines: {},
    pipeline: {},
    formValid: { type: Boolean },
    preparationReady: { type: Boolean },
    canSubmit: { type: Boolean },
    network: {},
    submitting: { type: Boolean },
    demoTxHash: {},
    pipelineError: {},
    pactSubmissionMessage: {},
    coboPactId: {},
    approvalId: {},
    approvalRefreshing: { type: Boolean },
    intentText: {},
    maxSpend: {},
    pairingReady: { type: Boolean },
    allowedActions: {},
    deniedActions: {},
    executionStep: {},
    executionSteps: {}
  },
  emits: ["submit", "reset", "refreshApproval", "simulateFail"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const showPipelinePanel = computed(
      () => ["submitting", "awaiting-approval", "executing", "success", "failed"].includes(props.pipeline)
    );
    const statusChip = computed(() => {
      if (!props.preparationReady && !showPipelinePanel.value) {
        return { label: "待 Agent 设置", class: "text-[var(--color-status-pending)]" };
      }
      switch (props.pipeline) {
        case "awaiting-approval":
          return { label: "等待审批", class: "text-[var(--color-status-pending)]" };
        case "executing":
          return { label: "执行中", class: "text-[var(--color-status-paused)]" };
        case "success":
          return { label: "Pact 已生效", class: "text-trading-up" };
        case "failed":
          return { label: "已拒绝", class: "text-trading-down" };
        case "preview-ready":
          return { label: "可提交", class: "text-trading-up" };
        default:
          return { label: "未完成", class: "text-muted-strong" };
      }
    });
    const pipelineLiveMode = computed(
      () => props.pipeline === "failed" ? "assertive" : "polite"
    );
    const failureHeading = computed(() => {
      const err = String(props.pipelineError ?? "").toLowerCase();
      if (err.includes("api key") || err.includes("invalid_api_key")) {
        return "创建失败：Cobo 凭证无效";
      }
      if (err.includes("recipe slug") || err.includes("recipe_slugs")) {
        return "创建失败：Recipe 配置无效";
      }
      if (err.includes("denied") || err.includes("拒绝") || err.includes("越权") || err.includes("not allowed")) {
        return "已拒绝：超出 Pact 权限边界";
      }
      if (err.includes("超时") || err.includes("timeout")) {
        return "等待审批超时";
      }
      if (err.includes("local draft") || err.includes("本地 draft") || err.includes("未接 cobo")) {
        return "创建失败：未连接 Cobo";
      }
      return "创建策略失败";
    });
    const approvalGuidePact = computed(() => ({
      id: props.coboPactId || "pending",
      strategyId: "",
      intent: props.intentText,
      status: "awaiting-approval",
      maxSpend: Number(props.maxSpend) || 0,
      whitelist: props.allowedActions,
      durationDays: 7,
      agentFeePercent: 0,
      userSplitPercent: 0,
      submissionMode: "cobo",
      coboPactId: props.coboPactId || void 0,
      approvalId: props.approvalId || void 0
    }));
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_PactsPactAppApprovalGuide = __nuxt_component_1;
      const _component_UiTxLink = __nuxt_component_1$1;
      _push(`<aside${ssrRenderAttrs(mergeProps({
        class: "flex flex-col rounded-lg bg-surface lg:sticky lg:top-[calc(3.5rem+1.5rem)] lg:max-h-[calc(100dvh-5rem)] lg:self-start",
        "aria-labelledby": "pact-preview-heading"
      }, _attrs))}><div class="border-b border-hairline px-5 py-4"><div class="flex items-start justify-between gap-3"><h2 id="pact-preview-heading" class="text-base font-semibold text-on-dark">Pact 预览</h2><span class="${ssrRenderClass([unref(statusChip).class, "shrink-0 rounded-sm bg-surface-elevated px-2.5 py-1 text-xs font-medium"])}">${ssrInterpolate(unref(statusChip).label)}</span></div><p class="mt-1 text-xs text-muted">批准前先确认资金来源、Pact 预算，以及 Agent 能做什么 / 不能做什么。</p>`);
      if (props.formValid && !props.preparationReady && !unref(showPipelinePanel)) {
        _push(`<p class="mt-2 text-xs text-body"> 表单已填写，但需先完成 `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(DASHBOARD_HOME),
          class: "text-primary no-underline hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`控制台 Agent 设置`);
            } else {
              return [
                createTextVNode("控制台 Agent 设置")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(` 后才能提交 Pact。 </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">`);
      if (!props.formValid && !unref(showPipelinePanel)) {
        _push(`<p class="text-sm text-muted">请填写必填项以生成 Pact 边界。</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<dl class="space-y-3"><!--[-->`);
      ssrRenderList(props.lines, (line) => {
        _push(`<div class="grid gap-0.5"><dt class="text-xs font-medium text-muted-strong">${ssrInterpolate(line.label)}</dt><dd class="${ssrRenderClass([line.label === "意图" ? "" : "font-mono text-[0.8125rem]", "text-sm text-body"])}">${ssrInterpolate(line.value)}</dd></div>`);
      });
      _push(`<!--]--></dl>`);
      if (props.formValid) {
        _push(`<section class="space-y-3 border-t border-hairline pt-4" aria-labelledby="allowed-heading"><h3 id="allowed-heading" class="text-xs font-semibold text-trading-up"> 允许 Agent </h3><ul class="space-y-2 text-sm text-body"><!--[-->`);
        ssrRenderList(props.allowedActions, (item) => {
          _push(`<li class="flex gap-2"><span aria-hidden="true">✅</span><span>${ssrInterpolate(item)}</span></li>`);
        });
        _push(`<!--]--></ul></section>`);
      } else {
        _push(`<!---->`);
      }
      if (props.formValid) {
        _push(`<section class="space-y-3 border-t border-hairline pt-4" aria-labelledby="denied-heading"><h3 id="denied-heading" class="text-xs font-semibold text-trading-down"> 不允许 Agent </h3><ul class="space-y-2 text-sm text-body"><!--[-->`);
        ssrRenderList(props.deniedActions, (item) => {
          _push(`<li class="flex gap-2"><span aria-hidden="true">❌</span><span>${ssrInterpolate(item)}</span></li>`);
        });
        _push(`<!--]--></ul></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(showPipelinePanel)) {
        _push(`<div class="border-t border-hairline px-5 py-4"${ssrRenderAttr("aria-live", unref(pipelineLiveMode))} aria-atomic="true">`);
        if (props.pipeline === "submitting") {
          _push(`<div class="text-sm text-muted" role="status"> 正在提交 Pact… </div>`);
        } else if (props.pipeline === "awaiting-approval") {
          _push(ssrRenderComponent(_component_PactsPactAppApprovalGuide, {
            pact: unref(approvalGuidePact),
            "submission-message": props.pactSubmissionMessage,
            "pairing-ready": props.pairingReady
          }, null, _parent));
        } else if (props.pipeline === "executing") {
          _push(`<div class="space-y-2" role="status"><p class="text-sm font-medium text-on-dark">正在执行 Recipe</p><ul class="space-y-1 text-xs text-muted"><!--[-->`);
          ssrRenderList(props.executionSteps, (label, i) => {
            _push(`<li class="${ssrRenderClass(i <= props.executionStep ? "text-body" : "")}">${ssrInterpolate(i < props.executionStep ? "✓" : i === props.executionStep ? "→" : "○")} ${ssrInterpolate(label)}</li>`);
          });
          _push(`<!--]--></ul></div>`);
        } else if (props.pipeline === "success") {
          _push(`<div class="space-y-2" role="status"><p class="text-sm font-medium text-trading-up">执行完成</p><p class="text-xs text-muted">首次 Recipe 已记入测试网审计日志。</p>`);
          if (props.demoTxHash) {
            _push(ssrRenderComponent(_component_UiTxLink, {
              hash: props.demoTxHash,
              network: props.network,
              class: "block break-all text-xs"
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else if (props.pipeline === "failed") {
          _push(`<div class="space-y-2" role="alert"><p class="text-sm font-medium text-trading-down">${ssrInterpolate(unref(failureHeading))}</p><p class="text-xs text-body">${ssrInterpolate(props.pipelineError)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-auto space-y-2 border-t border-hairline p-5">`);
      if (!unref(showPipelinePanel)) {
        _push(`<!--[--><button type="button" class="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:cursor-not-allowed disabled:bg-[var(--color-primary-disabled)] disabled:text-muted"${ssrIncludeBooleanAttr(!props.canSubmit || props.submitting) ? " disabled" : ""}> 创建 Pact </button><button type="button" class="flex h-11 w-full items-center justify-center rounded-md border border-hairline bg-transparent text-sm font-semibold text-body hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"${ssrIncludeBooleanAttr(!props.formValid) ? " disabled" : ""}> 模拟越权请求 </button><!--]-->`);
      } else if (props.pipeline === "success") {
        _push(`<!--[-->`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(DASHBOARD_HOME),
          class: "flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` 返回控制台 `);
            } else {
              return [
                createTextVNode(" 返回控制台 ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<button type="button" class="flex h-11 w-full items-center justify-center rounded-md border border-hairline bg-transparent text-sm font-semibold text-body hover:bg-surface-elevated"> 再建一条策略 </button><!--]-->`);
      } else if (props.pipeline === "failed") {
        _push(`<button type="button" class="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary hover:bg-primary-active"> 修改策略 </button>`);
      } else if (props.pipeline === "awaiting-approval") {
        _push(`<!--[--><button type="button" class="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:cursor-not-allowed disabled:opacity-50"${ssrIncludeBooleanAttr(props.approvalRefreshing) ? " disabled" : ""}>${ssrInterpolate(props.approvalRefreshing ? "刷新中…" : "我已批准，刷新状态")}</button>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: props.coboPactId ? `${unref(DASHBOARD_PACTS)}?id=${props.coboPactId}` : unref(DASHBOARD_PACTS),
          class: "flex h-11 w-full items-center justify-center rounded-md border border-hairline text-sm font-medium text-body no-underline hover:bg-surface-elevated"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` 在 Pact 管理页查看 `);
            } else {
              return [
                createTextVNode(" 在 Pact 管理页查看 ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></aside>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/create-strategy/PactPreview.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$1, { __name: "CreateStrategyPactPreview" });
const RISK_LABELS = {
  conservative: "保守型收益",
  balanced: "平衡型收益",
  aggressive: "激进型收益"
};
const DEFAULT_FORM = {
  network: "base-sepolia",
  asset: "USDC",
  targetApy: "",
  riskLevel: "conservative",
  maxSpend: "500",
  agentFee: "15",
  userSplit: "85"
};
const TEMPLATE_PRESETS = {
  "conservative-usdc": {
    title: "保守型 USDC 收益",
    description: "首次体验推荐：最多 500 USDC，只允许 Aave / Compound Supply。",
    nlText: "我想在 Base Sepolia 上用 500 USDC 做一个保守收益策略，只允许 Aave 和 Compound，期限 7 天，收益 85% 给我，15% 给 Agent。",
    form: { ...DEFAULT_FORM, riskLevel: "conservative", maxSpend: "500", targetApy: "8" }
  },
  "balanced-supply": {
    title: "平衡型收益策略",
    description: "允许小额调整，但仍受预算、白名单协议和期限限制。",
    nlText: "我想在 Arbitrum Sepolia 上用 800 USDC 做一个平衡收益策略，允许小额兑换后存入 Aave 或 Compound，收益 88% 给我，12% 给 Agent。",
    form: { ...DEFAULT_FORM, network: "arbitrum-sepolia", riskLevel: "balanced", maxSpend: "800", agentFee: "12", userSplit: "88" }
  },
  custom: {
    title: "自定义策略",
    description: "用自然语言描述目标，系统先生成 Pact Preview。",
    nlText: "",
    form: { ...DEFAULT_FORM }
  }
};
const STRATEGY_TEMPLATES = Object.entries(TEMPLATE_PRESETS).map(([key, value]) => ({
  key,
  title: value.title,
  description: value.description
}));
function useCreateStrategy() {
  const route = useRoute();
  const store = useAppStore();
  const queryTemplate = Array.isArray(route.query.template) ? route.query.template[0] : route.query.template;
  const initialTemplate = queryTemplate && queryTemplate in TEMPLATE_PRESETS ? queryTemplate : "conservative-usdc";
  const selectedTemplateKey = ref(initialTemplate);
  const form = reactive({ ...TEMPLATE_PRESETS[initialTemplate].form });
  const nlOpen = ref(initialTemplate !== "custom");
  const nlText = ref(TEMPLATE_PRESETS[initialTemplate].nlText);
  const nlFilled = ref(false);
  const errors = reactive({});
  const pipeline = ref("preview-ready");
  const executionStep = ref(0);
  const demoTxHash = ref("");
  const pipelineError = ref("");
  const pactSubmissionMessage = ref("");
  const coboPactId = ref("");
  const createdPactId = ref("");
  const approvalId = ref("");
  const approvalRefreshing = ref(false);
  const nlParsing = ref(false);
  const agentSplit = computed(() => {
    const user = Number(form.userSplit);
    if (Number.isNaN(user)) return "—";
    return String(Math.max(0, Math.min(100, 100 - user)));
  });
  const intentSummary = computed(() => {
    const risk = RISK_LABELS[form.riskLevel];
    const apy = form.targetApy.trim() ? `，目标 APY ${form.targetApy}%` : "";
    return `${risk} · ${form.asset}（${NETWORK_LABELS[form.network]}）${apy}`;
  });
  const allowedActions = computed(() => {
    const base = [
      `资金来自 Agent Wallet，本次 Pact 最多允许 ${form.maxSpend || "—"} ${form.asset}`,
      `在 ${NETWORK_LABELS[form.network]} 执行`,
      "调用 Aave Supply / Compound Supply",
      `收益分账：用户 ${form.userSplit}% · Agent ${agentSplit.value}%`
    ];
    if (form.riskLevel === "aggressive") base.push("执行小额 Uniswap 兑换（测试网）");
    return base;
  });
  const deniedActions = computed(() => [
    `使用超过 ${form.maxSpend || "—"} ${form.asset} 的资金`,
    "调用非白名单协议或未知 token",
    "在 Pact 终止或过期后继续执行",
    "更改用户确认过的收益分账比例"
  ]);
  const fundingSourceLabel = computed(() => {
    const prep = store.preparation;
    if (!prep?.ready) return "未完成 Agent Wallet 设置";
    return "EOA → Agent Wallet（测试网）";
  });
  const availableBalanceLabel = computed(() => {
    const prep = store.preparation;
    if (!prep?.ready) return "—";
    return `${prep.funding.availableUsdc.toLocaleString("zh-CN")} ${form.asset}`;
  });
  const preparationNetworkLabel = computed(() => {
    const prep = store.preparation;
    if (!prep?.ready) return null;
    return NETWORK_LABELS[prep.network];
  });
  const networkMismatch = computed(() => {
    const prep = store.preparation;
    return !!prep?.ready && form.network !== prep.network;
  });
  const previewLines = computed(() => [
    { label: "意图", value: intentSummary.value },
    { label: "资金来源", value: fundingSourceLabel.value },
    { label: "Agent Wallet 余额", value: availableBalanceLabel.value },
    { label: "支出上限", value: `${form.maxSpend || "—"} ${form.asset}` },
    { label: "网络", value: NETWORK_LABELS[form.network] },
    {
      label: "允许 Recipe",
      value: form.riskLevel === "aggressive" ? "Aave 存入、Compound 存入、Uniswap 兑换" : "Aave 存入、Compound 存入"
    },
    { label: "期限", value: "7 天（测试网）" },
    {
      label: "收益分账",
      value: `用户 ${form.userSplit}% · Agent ${agentSplit.value}%`
    },
    { label: "Agent 绩效费", value: `${form.agentFee}%` }
  ]);
  const isFormValid = computed(() => validateForm(false));
  const stepIndex = computed(() => {
    const map = {
      configure: 1,
      "preview-ready": 2,
      submitting: 3,
      "awaiting-approval": 3,
      executing: 4,
      success: 5,
      failed: 5
    };
    return map[pipeline.value];
  });
  function validateForm(setErrors = true) {
    const next = {};
    const spend = parseNumericField(form.maxSpend);
    const fee = parseNumericField(form.agentFee);
    const user = parseNumericField(form.userSplit);
    if (store.preparation?.ready && form.network !== store.preparation.network) {
      next.maxSpend = "策略网络必须与 Agent Wallet 注资网络一致";
    }
    if (spend === null || spend < MIN_MAX_SPEND_USDC || spend > MAX_MAX_SPEND_USDC) {
      next.maxSpend = `请输入 ${MIN_MAX_SPEND_USDC}–${MAX_MAX_SPEND_USDC.toLocaleString("en-US")} USDC`;
    } else if (store.preparation?.ready) {
      const available = store.preparation.funding.availableUsdc;
      if (spend > available) {
        next.maxSpend = `不能超过 Agent Wallet 可用余额（${available} USDC）`;
      }
    }
    if (fee === null || fee < 0 || fee > 30) {
      next.agentFee = "请输入 0–30%";
    }
    if (user === null || user < 0 || user > 100) {
      next.userSplit = "请输入 0–100%";
    }
    if (form.targetApy.trim()) {
      const apy = parseNumericField(form.targetApy);
      if (apy === null || apy < 0 || apy > 100) {
        next.targetApy = "请输入 0–100，或留空";
      }
    }
    if (setErrors) {
      Object.keys(errors).forEach((k) => delete errors[k]);
      Object.assign(errors, next);
    }
    return Object.keys(next).length === 0;
  }
  watch(
    form,
    () => {
      validateForm(true);
      if (["configure", "preview-ready"].includes(pipeline.value)) {
        pipeline.value = isFormValid.value ? "preview-ready" : "configure";
      }
    },
    { deep: true }
  );
  async function parseNlIntoForm() {
    if (!nlText.value.trim() || nlParsing.value) return;
    nlParsing.value = true;
    try {
      const limits = {
        availableUsdc: store.preparation?.funding.availableUsdc ?? 0,
        network: store.preparation?.network ?? form.network
      };
      const result = await store.parseStrategyText(nlText.value, limits);
      form.network = result.proposal.network;
      form.asset = result.proposal.asset;
      form.targetApy = result.proposal.targetApy ?? "";
      form.riskLevel = result.proposal.riskLevel;
      form.maxSpend = result.proposal.maxSpend;
      form.agentFee = result.proposal.agentFee;
      form.userSplit = result.proposal.userSplit;
      nlFilled.value = true;
      validateForm(true);
      pipeline.value = isFormValid.value ? "preview-ready" : "configure";
    } catch (e) {
      errors.maxSpend = extractApiErrorMessage(e, "自然语言解析失败");
      pipeline.value = "configure";
    } finally {
      nlParsing.value = false;
    }
  }
  function applyTemplate(key) {
    selectedTemplateKey.value = key;
    const preset = TEMPLATE_PRESETS[key];
    Object.assign(form, { ...preset.form });
    nlText.value = preset.nlText;
    nlOpen.value = key !== "custom";
    nlFilled.value = key !== "custom";
    validateForm(true);
    pipeline.value = isFormValid.value ? "preview-ready" : "configure";
  }
  function clearNlFill() {
    nlFilled.value = false;
    Object.assign(form, { ...DEFAULT_FORM });
    validateForm(true);
    pipeline.value = "configure";
  }
  let pollTimer = null;
  let pollAborted = false;
  function clearPollTimer() {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    pollAborted = true;
  }
  const executionSteps = [
    "Strategy Agent 生成收益策略",
    "校验 Pact allowlist / max spend",
    "Executor Agent 执行 Aave Supply",
    "Revenue Agent 写入收益与分账日志"
  ];
  async function runFirstExecution(pactId) {
    pipeline.value = "executing";
    executionStep.value = 0;
    try {
      executionStep.value = 1;
      const result = await store.executePact(pactId);
      executionStep.value = executionSteps.length - 1;
      demoTxHash.value = result.txHash;
      pipeline.value = "success";
      await store.fetchLogs({ limit: 10 });
    } catch (e) {
      pipeline.value = "failed";
      pipelineError.value = extractApiErrorMessage(e, "Recipe 执行失败");
    }
  }
  function schedulePactPoll(pactId, attempt = 0) {
    const maxAttempts = 75;
    pollAborted = false;
    const poll = async () => {
      if (pollAborted) return;
      if (attempt >= maxAttempts) {
        pipeline.value = "failed";
        pipelineError.value = "等待 Cobo 审批超时，请在 Cobo App 完成审批后从 Pact 管理页同步状态。";
        return;
      }
      try {
        const pact = await store.syncPact(pactId);
        if (pact.status === "active") {
          await runFirstExecution(pactId);
          return;
        }
        if (pact.status === "terminated") {
          pipeline.value = "failed";
          pipelineError.value = pact.submissionMessage || "Pact 已被拒绝或终止。";
          return;
        }
        pipeline.value = "awaiting-approval";
        pollTimer = setTimeout(() => schedulePactPoll(pactId, attempt + 1), 4e3);
      } catch {
        pollTimer = setTimeout(() => schedulePactPoll(pactId, attempt + 1), 4e3);
      }
    };
    void poll();
  }
  async function submitPact() {
    if (!validateForm(true) || pipeline.value === "submitting") return;
    clearPollTimer();
    pollAborted = false;
    pipeline.value = "submitting";
    pipelineError.value = "";
    pactSubmissionMessage.value = "";
    coboPactId.value = "";
    createdPactId.value = "";
    approvalId.value = "";
    demoTxHash.value = "";
    if (!store.preparation?.ready) {
      pipeline.value = "failed";
      pipelineError.value = "请先在控制台完成 Agent Wallet 设置，再创建 Pact 策略。";
      return;
    }
    if (networkMismatch.value) {
      pipeline.value = "failed";
      pipelineError.value = "策略网络必须与 Agent Wallet 注资网络一致。";
      return;
    }
    try {
      const result = await store.createStrategy({
        network: form.network,
        asset: form.asset,
        targetApy: form.targetApy.trim() || void 0,
        riskLevel: form.riskLevel,
        maxSpend: form.maxSpend,
        agentFee: form.agentFee,
        userSplit: form.userSplit
      });
      pactSubmissionMessage.value = result.pact.submissionMessage ?? "";
      coboPactId.value = result.pact.coboPactId ?? result.pact.id;
      createdPactId.value = result.pact.id;
      approvalId.value = result.pact.approvalId ?? "";
      if (result.pact.submissionMode === "local-draft") {
        pipeline.value = "failed";
        pipelineError.value = result.pact.submissionMessage || "当前为本地 draft 模式，未接 Cobo，无法完成生产流程。请配置 CAW 后重试。";
        return;
      }
      if (result.pact.status === "active") {
        await runFirstExecution(result.pact.id);
        return;
      }
      pipeline.value = "awaiting-approval";
      schedulePactPoll(result.pact.id);
    } catch (e) {
      pipeline.value = "failed";
      pipelineError.value = extractApiErrorMessage(e, "创建策略失败，请重试。");
    }
  }
  async function refreshApprovalStatus() {
    const pactId = createdPactId.value || coboPactId.value;
    if (!pactId || approvalRefreshing.value) return;
    approvalRefreshing.value = true;
    try {
      const pact = await store.syncPact(pactId);
      if (!pact) return;
      pactSubmissionMessage.value = pact.submissionMessage ?? pactSubmissionMessage.value;
      if (pact.status === "active") {
        await runFirstExecution(pactId);
        return;
      }
      if (pact.status === "terminated") {
        pipeline.value = "failed";
        pipelineError.value = pact.submissionMessage || "Pact 已被拒绝或终止。";
        return;
      }
      pipeline.value = "awaiting-approval";
    } catch (e) {
      pipelineError.value = extractApiErrorMessage(e, "同步审批状态失败，请稍后重试。");
    } finally {
      approvalRefreshing.value = false;
    }
  }
  async function simulateFailure() {
    const pactId = createdPactId.value || coboPactId.value;
    if (!pactId) {
      pipeline.value = "failed";
      pipelineError.value = "请先创建 Pact，再模拟越权请求。";
      return;
    }
    try {
      const result = await store.simulatePactDenial(pactId);
      pipeline.value = "failed";
      pipelineError.value = result.reason;
      await store.fetchLogs({ limit: 10 });
    } catch (e) {
      pipeline.value = "failed";
      pipelineError.value = extractApiErrorMessage(e, "越权模拟失败");
    }
  }
  function resetToEdit() {
    clearPollTimer();
    pipeline.value = isFormValid.value ? "preview-ready" : "configure";
    pipelineError.value = "";
    pactSubmissionMessage.value = "";
    coboPactId.value = "";
    createdPactId.value = "";
    approvalId.value = "";
    demoTxHash.value = "";
    executionStep.value = 0;
  }
  const preparationReady = computed(() => store.preparation?.ready ?? false);
  return {
    form,
    nlOpen,
    nlText,
    nlFilled,
    errors,
    pipeline,
    executionStep,
    demoTxHash,
    pipelineError,
    pactSubmissionMessage,
    coboPactId,
    approvalId,
    approvalRefreshing,
    agentSplit,
    intentSummary,
    previewLines,
    allowedActions,
    deniedActions,
    strategyTemplates: STRATEGY_TEMPLATES,
    selectedTemplateKey,
    preparationReady,
    availableBalanceLabel,
    preparationNetworkLabel,
    networkMismatch,
    fundingSourceLabel,
    isFormValid,
    stepIndex,
    executionSteps,
    validateForm,
    parseNlIntoForm,
    applyTemplate,
    clearNlFill,
    submitPact,
    refreshApprovalStatus,
    simulateFailure,
    resetToEdit,
    nlParsing
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "create-strategy",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "创建策略 · YieldAgent" });
    const {
      form,
      nlOpen,
      nlText,
      nlFilled,
      errors,
      pipeline,
      executionStep,
      demoTxHash,
      pipelineError,
      pactSubmissionMessage,
      coboPactId,
      approvalId,
      approvalRefreshing,
      intentSummary,
      previewLines,
      allowedActions,
      deniedActions,
      strategyTemplates,
      selectedTemplateKey,
      preparationReady,
      availableBalanceLabel,
      preparationNetworkLabel,
      networkMismatch,
      agentSplit,
      fundingSourceLabel,
      isFormValid,
      stepIndex,
      executionSteps,
      parseNlIntoForm,
      clearNlFill,
      submitPact,
      refreshApprovalStatus,
      simulateFailure,
      resetToEdit,
      nlParsing
    } = useCreateStrategy();
    const store = useAppStore();
    const pairingReady = computed(
      () => store.preparation?.agentWallet.pairing?.status === "paired"
    );
    const formDisabled = computed(
      () => ["submitting", "awaiting-approval", "executing", "success"].includes(pipeline.value) || !preparationReady.value
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_CreateStrategyStepIndicator = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_CreateStrategyForm = __nuxt_component_2;
      const _component_CreateStrategyPactPreview = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-7xl" }, _attrs))}><header class="mb-6 space-y-4 md:mb-8"><h1 class="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-[-0.03em] text-on-dark"> 创建策略 </h1><p class="max-w-2xl text-sm text-body"> 在 Agent 动用资金前，先定义 CAW Pact 边界。你可以从模板开始，再确认右侧允许 / 禁止动作。 </p>`);
      _push(ssrRenderComponent(_component_CreateStrategyStepIndicator, { "active-index": unref(stepIndex) }, null, _parent));
      _push(`</header>`);
      if (!unref(preparationReady)) {
        _push(`<section class="mb-8 rounded-lg border border-trading-down/40 bg-surface px-5 py-4" role="alert"><h2 class="text-sm font-semibold text-on-dark">需要先完成 Agent Wallet 设置</h2><p class="mt-2 text-sm text-body"> 创建 Pact 前，请连接 EOA，并在控制台创建 Agent Wallet 并注入测试网 USDC。 </p><div class="mt-4">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(DASHBOARD_HOME),
          class: "inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` 前往控制台 `);
            } else {
              return [
                createTextVNode(" 前往控制台 ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></section>`);
      } else {
        _push(`<section class="mb-8 rounded-lg border border-hairline bg-surface p-5" aria-label="Agent Wallet 状态"><div class="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start"><div><p class="font-mono text-xs text-muted-strong">资金已就绪</p><h2 class="mt-2 text-base font-semibold text-on-dark">Agent Wallet 已注入测试资金</h2><p class="mt-2 text-sm leading-6 text-body"> Pact maxSpend 不能超过 Agent Wallet 当前可用余额。超出部分将在提交时被拒绝。 </p></div><dl class="grid gap-4 border-t border-hairline pt-4 sm:grid-cols-3 sm:border-t-0 sm:pt-0 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><div><dt class="text-xs text-muted">资金来源</dt><dd class="mt-1 text-sm font-semibold text-on-dark">${ssrInterpolate(unref(fundingSourceLabel))}</dd></div><div><dt class="text-xs text-muted">可用余额</dt><dd class="mt-1 font-mono text-sm text-on-dark">${ssrInterpolate(unref(availableBalanceLabel))}</dd></div><div><dt class="text-xs text-muted">Pact 将限制</dt><dd class="mt-1 text-sm font-semibold text-on-dark">预算 + Recipe + 期限</dd></div></dl></div></section>`);
      }
      if (unref(preparationReady)) {
        _push(`<section class="mb-8 grid gap-3 md:grid-cols-3" aria-label="策略模板"><!--[-->`);
        ssrRenderList(unref(strategyTemplates), (template) => {
          _push(`<button type="button" class="${ssrRenderClass([unref(selectedTemplateKey) === template.key ? "border-primary" : "border-hairline", "rounded-lg border bg-surface p-4 text-left transition-colors hover:border-primary/70 hover:bg-surface-elevated"])}"${ssrRenderAttr("aria-pressed", unref(selectedTemplateKey) === template.key)}><span class="font-mono text-[0.65rem] text-primary">模板</span><p class="mt-2 text-sm font-semibold text-on-dark">${ssrInterpolate(template.title)}</p><p class="mt-1 text-xs leading-5 text-muted">${ssrInterpolate(template.description)}</p></button>`);
        });
        _push(`<!--]--></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">`);
      if (unref(preparationReady)) {
        _push(ssrRenderComponent(_component_CreateStrategyForm, {
          form: unref(form),
          errors: unref(errors),
          disabled: unref(formDisabled),
          "nl-open": unref(nlOpen),
          "nl-text": unref(nlText),
          "nl-filled": unref(nlFilled),
          "nl-parsing": unref(nlParsing),
          "available-balance-label": unref(availableBalanceLabel),
          "preparation-network-label": unref(preparationNetworkLabel),
          "network-mismatch": unref(networkMismatch),
          "agent-split": unref(agentSplit),
          "onUpdate:nlOpen": ($event) => nlOpen.value = $event,
          "onUpdate:nlText": ($event) => nlText.value = $event,
          onParseNl: ($event) => unref(parseNlIntoForm)(),
          onClearNl: ($event) => unref(clearNlFill)()
        }, null, _parent));
      } else {
        _push(`<section class="rounded-lg border border-hairline bg-surface px-5 py-6" aria-labelledby="strategy-form-locked-heading"><h2 id="strategy-form-locked-heading" class="text-base font-semibold text-on-dark"> 策略配置已锁定 </h2><p class="mt-2 text-sm leading-6 text-body"> 在控制台完成 Agent Wallet 设置后，可在此选择模板并填写 Pact 参数。右侧预览区可先查看当前流程说明。 </p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(DASHBOARD_HOME),
          class: "mt-4 inline-flex h-11 items-center justify-center rounded-md border border-hairline px-4 text-sm font-semibold text-on-dark no-underline hover:bg-surface-elevated"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` 前往控制台 `);
            } else {
              return [
                createTextVNode(" 前往控制台 ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</section>`);
      }
      _push(ssrRenderComponent(_component_CreateStrategyPactPreview, {
        lines: unref(previewLines),
        pipeline: unref(pipeline),
        "form-valid": unref(isFormValid),
        "preparation-ready": unref(preparationReady),
        "can-submit": unref(isFormValid) && unref(preparationReady),
        network: unref(form).network,
        submitting: unref(pipeline) === "submitting",
        "demo-tx-hash": unref(demoTxHash),
        "pipeline-error": unref(pipelineError),
        "pact-submission-message": unref(pactSubmissionMessage),
        "cobo-pact-id": unref(coboPactId),
        "approval-id": unref(approvalId),
        "approval-refreshing": unref(approvalRefreshing),
        "intent-text": unref(intentSummary),
        "max-spend": unref(form).maxSpend,
        "pairing-ready": unref(pairingReady),
        "allowed-actions": unref(allowedActions),
        "denied-actions": unref(deniedActions),
        "execution-step": unref(executionStep),
        "execution-steps": unref(executionSteps),
        onSubmit: ($event) => unref(submitPact)(),
        onReset: ($event) => unref(resetToEdit)(),
        onRefreshApproval: ($event) => unref(refreshApprovalStatus)(),
        onSimulateFail: ($event) => unref(simulateFailure)()
      }, null, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard/create-strategy.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=create-strategy-B2h8s3Ko.mjs.map
