<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoutes } from '@/api/route'
import * as costApi from '@/api/traffic-profile'
import type { RouteDto } from '@/types/route'
import type { TrafficProfileDto, TrafficProfileParams } from '@/types/traffic-profile'

const routes = ref<RouteDto[]>([])
const routesLoading = ref(false)
const items = ref<TrafficProfileDto[]>([])
const loading = ref(false)
const filterRouteId = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const submitting = ref(false)
const detailLoading = ref(false)
const editId = ref<string | null>(null)
const readOnly = ref(false)
const updatedAt = ref('')
let listRequestId = 0

function createDefaultForm() {
  return {
    routeId: filterRouteId.value,
    baseOneWayMinutes: undefined as number | undefined,
    weekdayExtraMin: 0 as number | undefined,
    weekdayExtraMax: 0 as number | undefined,
    weekendExtraMin: 0 as number | undefined,
    weekendExtraMax: 0 as number | undefined,
    holidayExtraMin: 0 as number | undefined,
    holidayExtraMax: 0 as number | undefined,
    morningExtraMinutes: 0 as number | undefined,
    eveningExtraMinutes: 0 as number | undefined,
    commonBottlenecksJson: '[]',
    bestDepartureTime: '',
    suggestedReturnTime: '',
    confidence: 0.8 as number | undefined,
    sourceUrl: '',
  }
}
const form = ref(createDefaultForm())

// 路线接口为分页接口，逐页获取完整选项，提交时使用所选路线的字符串 ID
async function loadRouteOptions() {
  routesLoading.value = true
  try {
    const options: RouteDto[] = []
    let currentPage = 1
    while (true) {
      const result = await getRoutes({ pageNum: currentPage, pageSize: 100 })
      options.push(...result.records)
      if (result.pageNum * result.pageSize >= result.total) break
      currentPage = result.pageNum + 1
    }
    routes.value = options
  } catch {
    // 请求错误由统一拦截器提示
  } finally {
    routesLoading.value = false
  }
}

async function loadItems() {
  const requestId = ++listRequestId
  loading.value = true
  try {
    const result = await costApi.getTrafficProfiles({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      ...(filterRouteId.value ? { routeId: filterRouteId.value } : {}),
    })
    if (requestId !== listRequestId) return
    items.value = result.records
    total.value = result.total
    pageNum.value = result.pageNum
    pageSize.value = result.pageSize
    if (result.records.length === 0 && result.total > 0 && result.pageNum > 1) {
      pageNum.value = Math.ceil(result.total / result.pageSize)
      await loadItems()
    }
  } catch {
    // 请求错误由统一拦截器提示
  } finally {
    if (requestId === listRequestId) loading.value = false
  }
}

function openCreateDialog() {
  editId.value = null
  readOnly.value = false
  form.value = createDefaultForm()
  dialogVisible.value = true
  void loadRouteOptions()
}

async function openDetailDialog(id: string, viewOnly: boolean) {
  if (detailLoading.value) return
  detailLoading.value = true
  try {
    const detail = await costApi.getTrafficProfileDetail(id)
    editId.value = id
    readOnly.value = viewOnly
    form.value = {
      routeId: detail.routeId,
      baseOneWayMinutes: detail.baseOneWayMinutes,
      weekdayExtraMin: detail.weekdayExtraMin,
      weekdayExtraMax: detail.weekdayExtraMax,
      weekendExtraMin: detail.weekendExtraMin,
      weekendExtraMax: detail.weekendExtraMax,
      holidayExtraMin: detail.holidayExtraMin,
      holidayExtraMax: detail.holidayExtraMax,
      morningExtraMinutes: detail.morningExtraMinutes,
      eveningExtraMinutes: detail.eveningExtraMinutes,
      commonBottlenecksJson: detail.commonBottlenecksJson,
      bestDepartureTime: detail.bestDepartureTime === null ? '' : detail.bestDepartureTime,
      suggestedReturnTime: detail.suggestedReturnTime === null ? '' : detail.suggestedReturnTime,
      confidence: detail.confidence,
      sourceUrl: detail.sourceUrl,
    }
    updatedAt.value = detail.updatedAt
    dialogVisible.value = true
    void loadRouteOptions()
  } catch {
    // 请求错误由统一拦截器提示
  } finally {
    detailLoading.value = false
  }
}

async function handleSubmit() {
  if (submitting.value || readOnly.value) return
  if (!form.value.routeId || !form.value.sourceUrl.trim()) {
    ElMessage.warning('请选择所属路线，并填写来源链接')
    return
  }
  const baseOneWayMinutes = form.value.baseOneWayMinutes
  if (baseOneWayMinutes == null || !Number.isInteger(baseOneWayMinutes) || baseOneWayMinutes < 0) {
    ElMessage.warning('基础单程耗时必须为非负整数（分钟）')
    return
  }
  const weekdayExtraMin = form.value.weekdayExtraMin
  if (weekdayExtraMin == null || !Number.isInteger(weekdayExtraMin) || weekdayExtraMin < 0) {
    ElMessage.warning('工作日额外下限必须为非负整数（分钟）')
    return
  }
  const weekdayExtraMax = form.value.weekdayExtraMax
  if (weekdayExtraMax == null || !Number.isInteger(weekdayExtraMax) || weekdayExtraMax < 0) {
    ElMessage.warning('工作日额外上限必须为非负整数（分钟）')
    return
  }
  const weekendExtraMin = form.value.weekendExtraMin
  if (weekendExtraMin == null || !Number.isInteger(weekendExtraMin) || weekendExtraMin < 0) {
    ElMessage.warning('周末额外下限必须为非负整数（分钟）')
    return
  }
  const weekendExtraMax = form.value.weekendExtraMax
  if (weekendExtraMax == null || !Number.isInteger(weekendExtraMax) || weekendExtraMax < 0) {
    ElMessage.warning('周末额外上限必须为非负整数（分钟）')
    return
  }
  const holidayExtraMin = form.value.holidayExtraMin
  if (holidayExtraMin == null || !Number.isInteger(holidayExtraMin) || holidayExtraMin < 0) {
    ElMessage.warning('节假日额外下限必须为非负整数（分钟）')
    return
  }
  const holidayExtraMax = form.value.holidayExtraMax
  if (holidayExtraMax == null || !Number.isInteger(holidayExtraMax) || holidayExtraMax < 0) {
    ElMessage.warning('节假日额外上限必须为非负整数（分钟）')
    return
  }
  const morningExtraMinutes = form.value.morningExtraMinutes
  if (morningExtraMinutes == null || !Number.isInteger(morningExtraMinutes) || morningExtraMinutes < 0) {
    ElMessage.warning('早间额外耗时必须为非负整数（分钟）')
    return
  }
  const eveningExtraMinutes = form.value.eveningExtraMinutes
  if (eveningExtraMinutes == null || !Number.isInteger(eveningExtraMinutes) || eveningExtraMinutes < 0) {
    ElMessage.warning('晚间额外耗时必须为非负整数（分钟）')
    return
  }
  if (weekdayExtraMax < weekdayExtraMin || weekendExtraMax < weekendExtraMin || holidayExtraMax < holidayExtraMin) {
    ElMessage.warning('各时段额外耗时上限不能小于对应下限')
    return
  }
  const confidence = form.value.confidence
  if (confidence == null || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    ElMessage.warning('置信度必须在 0～1 之间')
    return
  }
  try {
    if (!Array.isArray(JSON.parse(form.value.commonBottlenecksJson))) {
      ElMessage.warning('常见拥堵点必须为 JSON 数组文本')
      return
    }
  } catch {
    ElMessage.warning('常见拥堵点不是合法的 JSON 数组文本')
    return
  }
  // 全量更新仅提交业务字段，路线 ID 由接口路径确定
  const payload: TrafficProfileParams = {
    baseOneWayMinutes,
    weekdayExtraMin,
    weekdayExtraMax,
    weekendExtraMin,
    weekendExtraMax,
    holidayExtraMin,
    holidayExtraMax,
    morningExtraMinutes,
    eveningExtraMinutes,
    commonBottlenecksJson: form.value.commonBottlenecksJson.trim(),
    bestDepartureTime: form.value.bestDepartureTime.trim() || null,
    suggestedReturnTime: form.value.suggestedReturnTime.trim() || null,
    sourceUrl: form.value.sourceUrl.trim(),
    confidence,
  }
  submitting.value = true
  try {
    if (editId.value === null) {
      await costApi.createTrafficProfile({ routeId: form.value.routeId, ...payload })
      ElMessage.success('交通画像已新增')
    } else {
      await costApi.updateTrafficProfile(editId.value, payload)
      ElMessage.success('交通画像已更新')
    }
    dialogVisible.value = false
    await loadItems()
  } catch {
    // 保留表单内容，请求错误由统一拦截器提示
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await costApi.deleteTrafficProfile(id)
    ElMessage.success('删除成功')
    await loadItems()
  } catch {
    // 请求错误由统一拦截器提示
  }
}

function handleFilterChange() {
  pageNum.value = 1
  void loadItems()
}

function handlePageChange(value: number) {
  pageNum.value = value
  void loadItems()
}

function handleSizeChange(value: number) {
  pageSize.value = value
  pageNum.value = 1
  void loadItems()
}

onMounted(() => {
  void loadRouteOptions()
  void loadItems()
})
</script>

<template>
  <div>
    <div class="toolbar">
      <el-select v-model="filterRouteId" filterable clearable :loading="routesLoading" placeholder="筛选所属路线" class="route-filter" @change="handleFilterChange">
        <el-option v-for="route in routes" :key="route.id" :label="`${route.name}（${route.id}）`" :value="route.id" />
      </el-select>
      <el-button :disabled="loading" @click="loadItems">刷新</el-button>
      <el-button v-permission="'route:create'" type="primary" :disabled="detailLoading" @click="openCreateDialog">新增交通画像</el-button>
    </div>

    <el-table v-loading="loading" :data="items" border>
      <el-table-column label="所属路线" min-width="200">
        <template #default="{ row }">
          <div>{{ routes.find((route) => route.id === row.routeId)?.name }}</div>
          <div>{{ row.routeId }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="baseOneWayMinutes" label="基础单程（分）" width="140" />
      <el-table-column label="工作日额外（分）" width="150">
        <template #default="{ row }">{{ row.weekdayExtraMin }} ～ {{ row.weekdayExtraMax }}</template>
      </el-table-column>
      <el-table-column label="周末额外（分）" width="140">
        <template #default="{ row }">{{ row.weekendExtraMin }} ～ {{ row.weekendExtraMax }}</template>
      </el-table-column>
      <el-table-column label="节假日额外（分）" width="150">
        <template #default="{ row }">{{ row.holidayExtraMin }} ～ {{ row.holidayExtraMax }}</template>
      </el-table-column>
      <el-table-column prop="morningExtraMinutes" label="早间额外（分）" width="140" />
      <el-table-column prop="eveningExtraMinutes" label="晚间额外（分）" width="140" />
      <el-table-column prop="bestDepartureTime" label="最佳出发时间" width="140" />
      <el-table-column prop="suggestedReturnTime" label="建议返程时间" width="140" />
      <el-table-column prop="confidence" label="置信度" width="90" />
      <el-table-column prop="sourceUrl" label="来源链接" min-width="180" show-overflow-tooltip />
      <el-table-column prop="updatedAt" label="更新时间（UTC）" width="200" />
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :disabled="detailLoading" @click="openDetailDialog(row.routeId, true)">详情</el-button>
          <el-button v-permission="'route:update'" size="small" type="primary" :disabled="detailLoading" @click="openDetailDialog(row.routeId, false)">编辑</el-button>
          <el-popconfirm title="确认删除该交通画像？" @confirm="handleDelete(row.routeId)">
            <template #reference>
              <el-button v-permission="'route:delete'" size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination :current-page="pageNum" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="total"
        layout="total, sizes, prev, pager, next, jumper" @current-change="handlePageChange" @size-change="handleSizeChange" />
    </div>

    <el-dialog v-model="dialogVisible" :title="readOnly ? '交通画像详情' : editId === null ? '新增交通画像' : '编辑交通画像'"
      width="800px" :close-on-click-modal="!submitting" :close-on-press-escape="!submitting" :show-close="!submitting">
      <el-form label-width="160px" label-position="left" :disabled="readOnly || submitting">
        <el-form-item label="所属路线" required>
          <el-select v-model="form.routeId" :disabled="editId !== null" filterable :loading="routesLoading" placeholder="请选择所属路线" style="width: 100%">
            <el-option v-for="route in routes" :key="route.id" :label="`${route.name}（${route.id}）`" :value="route.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="基础单程耗时（分）" required>
          <el-input-number v-model="form.baseOneWayMinutes" :min="0" :precision="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="工作日额外下限（分）">
              <el-input-number v-model="form.weekdayExtraMin" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作日额外上限（分）">
              <el-input-number v-model="form.weekdayExtraMax" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周末额外下限（分）">
              <el-input-number v-model="form.weekendExtraMin" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周末额外上限（分）">
              <el-input-number v-model="form.weekendExtraMax" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="节假日额外下限（分）">
              <el-input-number v-model="form.holidayExtraMin" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="节假日额外上限（分）">
              <el-input-number v-model="form.holidayExtraMax" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="早间额外耗时（分）">
              <el-input-number v-model="form.morningExtraMinutes" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="晚间额外耗时（分）">
              <el-input-number v-model="form.eveningExtraMinutes" :min="0" :precision="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最佳出发时间"><el-input v-model="form.bestDepartureTime" placeholder="例如 07:00" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="建议返程时间"><el-input v-model="form.suggestedReturnTime" placeholder="例如 16:00" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="常见拥堵点" required>
          <el-input v-model="form.commonBottlenecksJson" type="textarea" :rows="3" placeholder='请输入 JSON 数组，例如：["入口路段"]' />
        </el-form-item>
        <el-form-item label="置信度" required>
          <el-input-number v-model="form.confidence" :min="0" :max="1" :step="0.05" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="来源链接" required><el-input v-model="form.sourceUrl" placeholder="请输入来源链接" /></el-form-item>
        <el-form-item v-if="readOnly" label="更新时间（UTC）">{{ updatedAt }}</el-form-item>
      </el-form>
      <el-alert title="每条路线最多一条交通画像，创建后不能修改所属路线。" type="info" :closable="false" />
      <template #footer>
        <el-button :disabled="submitting" @click="dialogVisible = false">{{ readOnly ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!readOnly" type="primary" :loading="submitting" :disabled="routesLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.route-filter {
  width: 320px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
