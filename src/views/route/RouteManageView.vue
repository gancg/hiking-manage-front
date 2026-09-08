<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as routeApi from '@/api/route'
import type { CreateRouteParams, RouteDifficulty, RouteDto, UpdateRouteParams } from '@/types/route'

const difficultyOptions: Array<{ value: RouteDifficulty; label: string }> = [
  { value: 'easy', label: '简单' },
  { value: 'moderate', label: '中等' },
  { value: 'hard', label: '困难' },
  { value: 'expert', label: '专业' },
]

function difficultyLabel(value: RouteDifficulty) {
  return difficultyOptions.find((item) => item.value === value)?.label ?? value
}

const routeTypeOptions: Array<{ value: string; label: string }> = [
  { value: 'loop', label: '环线' },
  { value: 'out_and_back', label: '往返线' },
  { value: 'point_to_point', label: '穿越线' },
]

function routeTypeLabel(value: string) {
  return routeTypeOptions.find((item) => item.value === value)?.label ?? value
}

const seasonOptions = ['春', '夏', '秋', '冬']

const transportModeOptions: Array<{ value: string; label: string }> = [
  { value: 'self_drive', label: '自驾' },
  { value: 'group_tour', label: '报团' },
]

// 数组类字段以 JSON 文本形式与后端交互，页面内以 string[] 便于编辑
function parseJsonArray(text: string | undefined | null): string[] {
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
  } catch {
    return []
  }
}

function toJsonArray(list: string[]): string {
  return JSON.stringify(list ?? [])
}

const routes = ref<RouteDto[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const readOnly = ref(false)
const detailLoading = ref(false)
const updatedAt = ref('')
const editId = ref<string | null>(null)

function createDefaultForm() {
  return {
    id: '',
    name: '',
    startLocation: '',
    endLocation: '',
    latitude: null as number | null,
    longitude: null as number | null,
    distanceKm: null as number | null,
    ascentM: null as number | null,
    highestAltitudeM: null as number | null,
    hikingMinutes: null as number | null,
    difficulty: 'moderate' as RouteDifficulty,
    durationDays: 1,
    routeType: '',
    bestSeasons: [] as string[],
    scenery: [] as string[],
    risks: [] as string[],
    transportModes: [] as string[],
    costMinCny: null as number | null,
    costMaxCny: null as number | null,
    parking: '',
    supplies: '',
    signal: '',
    camping: '',
    sourceUrl: '',
    sourceName: '',
    collectedAt: '',
    confidence: 0.8,
    reviewed: false,
    hasToilet: false,
    hasSupplyShop: false,
    isTraverse: false,
    traverseTransferMinutes: 0,
    groupTourSearchTerms: [] as string[],
  }
}

const form = ref(createDefaultForm())

function resetForm() {
  form.value = createDefaultForm()
  editId.value = null
}

async function loadRoutes(currentPage = pageNum.value, currentPageSize = pageSize.value) {
  loading.value = true
  try {
    const result = await routeApi.getRoutes({ pageNum: currentPage, pageSize: currentPageSize })
    routes.value = result.records
    total.value = result.total
    pageNum.value = result.pageNum
    pageSize.value = result.pageSize

    if (routes.value.length === 0 && total.value > 0 && pageNum.value > 1) {
      pageNum.value -= 1
      await loadRoutes(pageNum.value, pageSize.value)
    }
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  readOnly.value = false
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 详情与编辑共用数据加载及字段转换逻辑，详情模式禁用表单
async function openEditDialog(id: string, viewOnly = false) {
  if (detailLoading.value) return
  detailLoading.value = true
  readOnly.value = viewOnly
  isEdit.value = true
  editId.value = id
  try {
    const detail = await routeApi.getRouteDetail(id)
    updatedAt.value = detail.updatedAt
    form.value = {
      id: detail.id,
      name: detail.name,
      startLocation: detail.startLocation,
      endLocation: detail.endLocation,
      latitude: detail.latitude,
      longitude: detail.longitude,
      distanceKm: detail.distanceKm,
      ascentM: detail.ascentM,
      highestAltitudeM: detail.highestAltitudeM,
      hikingMinutes: detail.hikingMinutes,
      difficulty: detail.difficulty,
      durationDays: detail.durationDays,
      routeType: detail.routeType,
      bestSeasons: parseJsonArray(detail.bestSeasonsJson),
      scenery: parseJsonArray(detail.sceneryJson),
      risks: parseJsonArray(detail.risksJson),
      transportModes: parseJsonArray(detail.transportModesJson),
      costMinCny: detail.costMinCny,
      costMaxCny: detail.costMaxCny,
      parking: detail.parking ?? '',
      supplies: detail.supplies ?? '',
      signal: detail.signal ?? '',
      camping: detail.camping ?? '',
      sourceUrl: detail.sourceUrl,
      sourceName: detail.sourceName,
      collectedAt: detail.collectedAt,
      confidence: detail.confidence,
      reviewed: detail.reviewed === 1,
      hasToilet: detail.hasToilet === 1,
      hasSupplyShop: detail.hasSupplyShop === 1,
      isTraverse: detail.isTraverse === 1,
      traverseTransferMinutes: detail.traverseTransferMinutes ?? 0,
      groupTourSearchTerms: parseJsonArray(detail.groupTourSearchTermsJson),
    }
    dialogVisible.value = true
  } catch {
    dialogVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

function buildPayload(): UpdateRouteParams {
  return {
    name: form.value.name,
    startLocation: form.value.startLocation,
    endLocation: form.value.endLocation,
    latitude: form.value.latitude,
    longitude: form.value.longitude,
    distanceKm: form.value.distanceKm ?? 0,
    ascentM: form.value.ascentM ?? 0,
    highestAltitudeM: form.value.highestAltitudeM ?? 0,
    hikingMinutes: form.value.hikingMinutes ?? 0,
    difficulty: form.value.difficulty,
    durationDays: form.value.durationDays ?? 1,
    routeType: form.value.routeType,
    bestSeasonsJson: toJsonArray(form.value.bestSeasons),
    sceneryJson: toJsonArray(form.value.scenery),
    risksJson: toJsonArray(form.value.risks),
    transportModesJson: toJsonArray(form.value.transportModes),
    costMinCny: form.value.costMinCny ?? 0,
    costMaxCny: form.value.costMaxCny ?? 0,
    parking: form.value.parking || null,
    supplies: form.value.supplies || null,
    signal: form.value.signal || null,
    camping: form.value.camping || null,
    sourceUrl: form.value.sourceUrl,
    sourceName: form.value.sourceName,
    collectedAt: form.value.collectedAt,
    confidence: form.value.confidence ?? 0,
    reviewed: form.value.reviewed ? 1 : 0,
    hasToilet: form.value.hasToilet ? 1 : 0,
    hasSupplyShop: form.value.hasSupplyShop ? 1 : 0,
    isTraverse: form.value.isTraverse ? 1 : 0,
    traverseTransferMinutes: form.value.traverseTransferMinutes ?? 0,
    groupTourSearchTermsJson: toJsonArray(form.value.groupTourSearchTerms),
  }
}

function validateForm() {
  if (!isEdit.value && !form.value.id) {
    ElMessage.warning('请填写路线 ID')
    return false
  }
  if (!form.value.name || !form.value.startLocation || !form.value.endLocation) {
    ElMessage.warning('请填写路线名称、起点和终点')
    return false
  }
  if (!form.value.distanceKm || !form.value.hikingMinutes || !form.value.durationDays) {
    ElMessage.warning('请填写距离、徒步耗时和天数')
    return false
  }
  if (!form.value.routeType) {
    ElMessage.warning('请填写路线类型')
    return false
  }
  if (form.value.bestSeasons.length === 0) {
    ElMessage.warning('请至少选择一个适宜季节')
    return false
  }
  if (form.value.transportModes.length === 0) {
    ElMessage.warning('请至少选择一种交通方式')
    return false
  }
  if (!form.value.sourceUrl || !form.value.sourceName || !form.value.collectedAt) {
    ElMessage.warning('请填写来源链接、来源名称和采集时间')
    return false
  }
  if (form.value.costMinCny === null || form.value.costMaxCny === null) {
    ElMessage.warning('请填写费用区间')
    return false
  }
  if (form.value.costMaxCny < form.value.costMinCny) {
    ElMessage.warning('费用上限不能小于下限')
    return false
  }
  return true
}

async function handleSubmit() {
  if (readOnly.value) return
  if (!validateForm()) return

  submitting.value = true
  try {
    if (isEdit.value && editId.value !== null) {
      await routeApi.updateRoute(editId.value, buildPayload())
      ElMessage.success('路线已更新')
    } else {
      const payload: CreateRouteParams = { id: form.value.id, ...buildPayload() }
      await routeApi.createRoute(payload)
      ElMessage.success('路线已创建')
    }

    dialogVisible.value = false
    resetForm()
    await loadRoutes()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: string) {
  await routeApi.deleteRoute(id)
  ElMessage.success('删除成功')
  await loadRoutes()
}

function handleCurrentChange(value: number) {
  pageNum.value = value
  loadRoutes()
}

function handleSizeChange(value: number) {
  pageSize.value = value
  pageNum.value = 1
  loadRoutes(1, value)
}

const dialogTitle = computed(() => (readOnly.value ? '路线详情' : isEdit.value ? '编辑路线' : '新建路线'))

onMounted(() => {
  loadRoutes()
})
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button v-permission="'route:create'" type="primary" :disabled="detailLoading" @click="openCreateDialog">
        新建路线
      </el-button>
    </div>

    <el-table v-loading="loading" :data="routes" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column prop="startLocation" label="起点" width="120" />
      <el-table-column prop="endLocation" label="终点" width="120" />
      <el-table-column label="难度" width="100">
        <template #default="{ row }">{{ difficultyLabel(row.difficulty) }}</template>
      </el-table-column>
      <el-table-column prop="distanceKm" label="距离(km)" width="100" />
      <el-table-column prop="durationDays" label="天数" width="80" />
      <el-table-column label="类型" width="120">
        <template #default="{ row }">{{ routeTypeLabel(row.routeType) }}</template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="180" />
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :disabled="detailLoading" @click="openEditDialog(row.id, true)">
            详情
          </el-button>
          <el-button v-permission="'route:update'" type="primary" size="small" :disabled="detailLoading" @click="openEditDialog(row.id)">
            编辑
          </el-button>
          <el-popconfirm title="确认删除该路线？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button v-permission="'route:delete'" type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        :current-page="pageNum"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
      <el-form label-width="110px" :disabled="readOnly">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="路线 ID" required>
              <el-input v-model="form.id" :disabled="isEdit" placeholder="不含路径分隔符的唯一编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称" required>
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="起点" required>
              <el-input v-model="form.startLocation" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="终点" required>
              <el-input v-model="form.endLocation" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度">
              <el-input-number v-model="form.latitude" :min="-90" :max="90" :step="0.0001" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经度">
              <el-input-number v-model="form.longitude" :min="-180" :max="180" :step="0.0001" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">路线数据</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="距离(km)" required>
              <el-input-number v-model="form.distanceKm" :min="0.01" :step="0.1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="爬升(m)" required>
              <el-input-number v-model="form.ascentM" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高海拔(m)" required>
              <el-input-number v-model="form.highestAltitudeM" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="徒步耗时(分)" required>
              <el-input-number v-model="form.hikingMinutes" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="天数" required>
              <el-input-number v-model="form.durationDays" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度" required>
              <el-select v-model="form.difficulty" style="width: 100%">
                <el-option v-for="item in difficultyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="路线类型" required>
              <el-select v-model="form.routeType" filterable allow-create default-first-option style="width: 100%" placeholder="请选择或输入路线类型">
                <el-option v-for="item in routeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="适宜季节" required>
              <el-select v-model="form.bestSeasons" multiple style="width: 100%" placeholder="请至少选择一个季节">
                <el-option v-for="item in seasonOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="景观">
              <el-select v-model="form.scenery" multiple filterable allow-create default-first-option style="width: 100%" placeholder="输入后回车添加" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风险">
              <el-select v-model="form.risks" multiple filterable allow-create default-first-option style="width: 100%" placeholder="输入后回车添加" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交通方式" required>
              <el-select v-model="form.transportModes" multiple style="width: 100%" placeholder="请至少选择一种交通方式">
                <el-option v-for="item in transportModeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">费用与配套</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="费用下限(元)" required>
              <el-input-number v-model="form.costMinCny" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="费用上限(元)" required>
              <el-input-number v-model="form.costMaxCny" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="停车说明">
              <el-input v-model="form.parking" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="补给说明">
              <el-input v-model="form.supplies" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信号说明">
              <el-input v-model="form.signal" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="露营说明">
              <el-input v-model="form.camping" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="有厕所">
              <el-switch v-model="form.hasToilet" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="有补给店">
              <el-switch v-model="form.hasSupplyShop" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="是否穿越">
              <el-switch v-model="form.isTraverse" />
            </el-form-item>
          </el-col>
          <el-col v-show="form.isTraverse" :span="8">
            <el-form-item label="接驳时长(分)">
              <el-input-number
                v-model="form.traverseTransferMinutes"
                :min="0"
                :max="1440"
                :step="10"
                :precision="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="20">
            <el-form-item label="跟团搜索词">
              <el-select v-model="form.groupTourSearchTerms" multiple filterable allow-create default-first-option style="width: 100%" placeholder="输入后回车添加" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">来源与审核</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="来源链接" required>
              <el-input v-model="form.sourceUrl" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源名称" required>
              <el-input v-model="form.sourceName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采集时间" required>
              <el-date-picker
                v-model="form.collectedAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="置信度" required>
              <el-input-number v-model="form.confidence" :min="0" :max="1" :step="0.05" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="已审核">
              <el-switch v-model="form.reviewed" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="readOnly" label="更新时间（UTC）">{{ updatedAt }}</el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ readOnly ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!readOnly" type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
