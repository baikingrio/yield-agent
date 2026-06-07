<script setup lang="ts">
const allowed = [
  '在 Pact 预算内执行已批准的 Supply Recipe',
  '按约定分账规则结算收益',
  '在授权网络（Base / Arbitrum Sepolia）上操作',
]

const denied = [
  '支出超过 maxSpend 上限',
  '调用未列入白名单的协议或代币',
  'Pact 到期或终止后继续执行',
  '未经审批修改收益分账比例',
]

const auditRows = [
  {
    time: '06-04 09:14',
    action: 'Compound 存入 500 USDC',
    status: '成功',
    tone: 'up' as const,
  },
  {
    time: '06-03 21:08',
    action: 'Swap 500 USDC → unknown token',
    status: '已拒绝',
    tone: 'down' as const,
  },
]
</script>

<template>
  <section aria-labelledby="landing-control-heading">
    <h2 id="landing-control-heading" class="text-base font-semibold text-on-dark">
      权限与风控
    </h2>
    <p class="mt-2 max-w-[65ch] text-sm text-[var(--color-muted-strong)]">
      Pact 在链下由 Cobo Agentic Wallet 强制执行。允许与禁止动作在创建策略时即写入预览，执行阶段持续校验。
    </p>

    <div class="mt-8 grid gap-8 lg:grid-cols-2">
      <div class="space-y-6">
        <div>
          <h3 class="text-xs font-semibold text-trading-up">允许 Agent</h3>
          <ul class="mt-3 space-y-2.5" role="list">
            <li
              v-for="item in allowed"
              :key="item"
              class="flex gap-2.5 text-sm leading-6 text-body"
            >
              <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-trading-up" aria-hidden="true" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-xs font-semibold text-trading-down">不允许 Agent</h3>
          <ul class="mt-3 space-y-2.5" role="list">
            <li
              v-for="item in denied"
              :key="item"
              class="flex gap-2.5 text-sm leading-6 text-body"
            >
              <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-trading-down" aria-hidden="true" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="rounded-lg border border-hairline">
        <div class="border-b border-hairline px-5 py-3">
          <p class="text-sm font-medium text-on-dark">执行记录示例</p>
          <p class="mt-0.5 text-xs text-[var(--color-muted-strong)]">成功与拒绝均保留在同一审计流</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr class="border-b border-hairline text-xs text-[var(--color-muted-strong)]">
                <th class="px-5 py-2.5 font-medium" scope="col">时间</th>
                <th class="px-5 py-2.5 font-medium" scope="col">动作</th>
                <th class="px-5 py-2.5 font-medium" scope="col">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in auditRows"
                :key="row.action"
                class="border-b border-hairline last:border-0"
              >
                <td class="whitespace-nowrap px-5 py-3 font-mono text-xs text-[var(--color-muted-strong)]">
                  {{ row.time }}
                </td>
                <td class="px-5 py-3 text-body">{{ row.action }}</td>
                <td class="px-5 py-3">
                  <span :class="row.tone === 'up' ? 'text-trading-up' : 'text-trading-down'">
                    {{ row.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
