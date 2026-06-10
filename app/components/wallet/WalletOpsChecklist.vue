<template>
  <div class="rounded-md border border-hairline bg-canvas px-4 py-3 text-xs text-body">
    <p class="font-semibold text-on-dark">运维检查清单</p>
    <ol class="mt-2 list-decimal space-y-1.5 pl-4">
      <li>Vercel 已设置 <code>AGENT_WALLET_API_KEY</code>（与 Hermes <code>caw wallet current --show-api-key</code> 相同）</li>
      <li><code>AGENT_WALLET_MAIN_NODE_ID</code> 与 Hermes <code>caw node status</code> 的节点 ID 一致</li>
      <li>Hermes 主机已运行 <code>caw node start</code></li>
      <li>若钱包长期 <code>preparing</code>：重置后优先「导入已 onboard 钱包」</li>
    </ol>
    <NuxtLink
      to="/dashboard/settings"
      class="mt-3 inline-flex text-xs font-medium text-primary no-underline hover:text-primary-active"
    >
      打开设置页部署自检 →
    </NuxtLink>
  </div>
</template>
