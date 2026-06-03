<script setup lang="ts">
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
import type { YieldRange, YieldSeries } from '../../../shared/types/demo'

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

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

const chartData = computed(() => {
  const points = props.series?.points ?? []
  return {
    labels: points.map((p) => p.date.slice(5)),
    datasets: [
      {
        label: '累计收益 (USDC)',
        data: points.map((p) => p.cumulativeUsdc),
        borderColor: '#0ecb81',
        backgroundColor: 'rgba(14, 203, 129, 0.08)',
        fill: true,
        tension: 0.25,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  }
})

const chartOptions = computed(() => ({
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
      grid: { color: '#2b3139' },
      ticks: { color: '#707a8a', maxTicksLimit: 7 },
    },
    y: {
      grid: { color: '#2b3139' },
      ticks: { color: '#707a8a' },
    },
  },
}))

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

    <p v-else-if="!series?.points.length" class="mt-6 py-8 text-center text-sm text-muted">
      暂无收益数据
    </p>

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
