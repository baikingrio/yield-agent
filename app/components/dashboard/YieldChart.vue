<script setup lang="ts">
import { DASHBOARD_PACTS } from '#shared/constants/dashboard-routes'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { YieldRange, YieldSeries } from '../../../shared/types/app'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const props = defineProps<{
  series: YieldSeries | null
  loading?: boolean
  range: YieldRange
}>()

const emit = defineEmits<{
  'update:range': [YieldRange]
}>()

const reducedMotion = ref(false)
const { resolved: themeResolved } = useTheme()

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

function chartPalette() {
  const tradingUp = readThemeColor('--color-trading-up', '#0ecb81')
  const hairline = readThemeColor('--color-hairline', '#2b3139')
  const muted = readThemeColor('--color-muted', '#707a8a')
  const r = parseInt(tradingUp.slice(1, 3), 16)
  const g = parseInt(tradingUp.slice(3, 5), 16)
  const b = parseInt(tradingUp.slice(5, 7), 16)
  return {
    tradingUp,
    hairline,
    muted,
    fill: `rgba(${r}, ${g}, ${b}, 0.08)`,
  }
}

const chartData = computed(() => {
  themeResolved.value
  const palette = chartPalette()
  const points = props.series?.points ?? []
  return {
    labels: points.map((p) => p.date.slice(5)),
    datasets: [
      {
        label: '累计收益 (USDC)',
        data: points.map((p) => p.cumulativeUsdc),
        borderColor: palette.tradingUp,
        backgroundColor: palette.fill,
        fill: true,
        tension: 0.25,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  }
})

const chartOptions = computed(() => {
  themeResolved.value
  const palette = chartPalette()
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: reducedMotion.value ? false : { duration: 0 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) =>
            `累计 ${ctx.parsed.y.toLocaleString('zh-CN')} USDC`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: palette.hairline },
        ticks: { color: palette.muted, maxTicksLimit: 7 },
      },
      y: {
        grid: { color: palette.hairline },
        ticks: { color: palette.muted },
      },
    },
  }
})

const hasData = computed(() => {
  const pts = props.series?.points ?? []
  return pts.length > 0 && pts.some((p) => p.cumulativeUsdc !== 0)
})

const srRows = computed(() => (props.series?.points ?? []).slice(-3))
</script>

<template>
  <section aria-labelledby="yield-chart-heading" class="rounded-lg border border-hairline bg-surface px-5 py-4">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 id="yield-chart-heading" class="text-base font-semibold text-on-dark">累计收益</h2>
        <p v-if="series" class="mt-1 font-mono text-xs text-muted">
          区间合计 {{ series.totalUsdc.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) }} USDC
        </p>
      </div>
      <div
        class="inline-flex rounded-md border border-hairline p-0.5"
        role="group"
        aria-label="时间范围"
      >
        <button
          type="button"
          class="rounded-sm px-3 py-1 text-xs font-medium transition-colors"
          :class="range === '7d' ? 'bg-surface-elevated text-on-dark' : 'text-muted hover:text-body'"
          @click="emit('update:range', '7d')"
        >
          7 日
        </button>
        <button
          type="button"
          class="rounded-sm px-3 py-1 text-xs font-medium transition-colors"
          :class="range === '30d' ? 'bg-surface-elevated text-on-dark' : 'text-muted hover:text-body'"
          @click="emit('update:range', '30d')"
        >
          30 日
        </button>
      </div>
    </div>

    <div v-if="loading && !series" class="mt-4 h-48 animate-pulse rounded bg-surface-elevated" />

    <div v-else-if="!hasData" class="mt-4 rounded-md border border-hairline bg-canvas px-4 py-5">
      <p class="text-sm text-body">收益同步尚未开启。</p>
      <p class="mt-2 text-sm text-[var(--color-muted-strong)]">
        可在
        <NuxtLink :to="DASHBOARD_PACTS" class="text-primary no-underline hover:underline">Pact 管理</NuxtLink>
        查看链上仓位与赎回状态。
      </p>
    </div>

    <ClientOnly v-else>
      <div class="relative mt-4 h-48 w-full md:h-56">
        <Line :data="chartData" :options="chartOptions" />
      </div>
      <table class="sr-only">
        <caption>最近收益数据点</caption>
        <thead>
          <tr>
            <th scope="col">日期</th>
            <th scope="col">累计 USDC</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in srRows" :key="row.date">
            <td>{{ row.date }}</td>
            <td>{{ row.cumulativeUsdc }}</td>
          </tr>
        </tbody>
      </table>
    </ClientOnly>
  </section>
</template>
