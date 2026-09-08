<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoutes } from '@/api/route'
import * as costApi from '@/api/route-cost-item'
import type { RouteDto } from '@/types/route'
import type { BillingUnit, CostType, RouteCostItemDto, RouteCostItemParams } from '@/types/route-cost-item'

const billingLabels: Record<BillingUnit, string> = { person: '每人', vehicle: '每车', group: '每组' }
const costLabels: Record<CostType, string> = {
  ticket: '门票', shuttle: '接驳', waste: '垃圾处理', parking: '停车', other: '其他',
}
const routes = ref<RouteDto[]>([])
const routesLoading = ref(false)
const items = ref<RouteCostItemDto[]>([])
const loading = ref(false)
const filterRouteId = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const submitting = ref(false)
const detailLoading = ref(false)
const editId = ref<number | null>(null)
const readOnly = ref(false)
const updatedAt = ref('')
let listRequestId = 0

function createDefaultForm() {
  return {
    routeId: filterRouteId.value,
    name: '',
    billingUnit: 'person' as BillingUnit,
    costType: 'ticket' as CostType,
    minCny: undefined as number | undefined,
    maxCny: undefined as number | undefined,
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
    const result = await costApi.getRouteCostItems({
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

async function openDetailDialog(id: number, viewOnly: boolean) {
  detailLoading.value = true
  try {
    const detail = await costApi.getRouteCostItemDetail(id)
    editId.value = id
    readOnly.value = viewOnly
    form.value = {
      routeId: detail.routeId,
      name: detail.name,
      billingUnit: detail.billingUnit,
      costType: detail.costType,
      minCny: detail.minCny,
      maxCny: detail.maxCny,
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
  if (submitting.value) return
  const { minCny, maxCny } = form.value
  if (!form.value.routeId || !form.value.name.trim() || !form.value.sourceUrl.trim()) {
    ElMessage.warning('请选择所属路线，并填写费用名称和来源链接')
    return
  }
  if (minCny == null || maxCny == null || !Number.isFinite(minCny) || !Number.isFinite(maxCny)
    || minCny < 0 || maxCny < minCny) {
    ElMessage.warning('请填写有效费用区间，且满足 0 ≤ 下限 ≤ 上限')
    return
  }
  const payload: RouteCostItemParams = {
    ...form.value, name: form.value.name.trim(), sourceUrl: form.value.sourceUrl.trim(), minCny, maxCny,
  }
  submitting.value = true
  try {
    if (editId.value === null) {
      await costApi.createRouteCostItem(payload)
      ElMessage.success('路线花费已新增')
    } else {
      await costApi.updateRouteCostItem(editId.value, payload)
      ElMessage.success('路线花费已更新')
    }
    dialogVisible.value = false
    await loadItems()
  } catch {
    // 保留表单内容，请求错误由统一拦截器提示
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await costApi.deleteRouteCostItem(id)
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
      <el-button v-permission="'route:create'" type="primary" @click="openCreateDialog">新增路线花费</el-button>
    </div>

    <el-table v-loading="loading" :data="items" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="所属路线" min-width="200">
        <template #default="{ row }">
          <div>{{ routes.find((route) => route.id === row.routeId)?.name }}</div>
          <div>{{ row.routeId }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="费用名称" min-width="140" />
      <el-table-column label="费用类型" width="110">
        <template #default="{ row }">{{ costLabels[row.costType as CostType] }}</template>
      </el-table-column>
      <el-table-column label="计费单位" width="100">
        <template #default="{ row }">{{ billingLabels[row.billingUnit as BillingUnit] }}</template>
      </el-table-column>
      <el-table-column prop="minCny" label="下限（元）" width="110" />
      <el-table-column prop="maxCny" label="上限（元）" width="110" />
      <el-table-column prop="sourceUrl" label="来源链接" min-width="180" show-overflow-tooltip />
      <el-table-column prop="updatedAt" label="更新时间（UTC）" width="200" />
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :disabled="detailLoading" @click="openDetailDialog(row.id, true)">详情</el-button>
          <el-button v-permission="'route:update'" size="small" type="primary" :disabled="detailLoading" @click="openDetailDialog(row.id, false)">编辑</el-button>
          <el-popconfirm title="确认删除该路线花费？" @confirm="handleDelete(row.id)">
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

    <el-dialog v-model="dialogVisible" :title="readOnly ? '路线花费详情' : editId === null ? '新增路线花费' : '编辑路线花费'"
      width="640px" :close-on-click-modal="!submitting" :close-on-press-escape="!submitting" :show-close="!submitting">
      <el-form label-width="120px" label-position="left" :disabled="readOnly || submitting">
        <el-form-item label="所属路线" required>
          <el-select v-model="form.routeId" filterable :loading="routesLoading" placeholder="请选择所属路线" style="width: 100%">
            <el-option v-for="route in routes" :key="route.id" :label="`${route.name}（${route.id}）`" :value="route.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="费用名称" required><el-input v-model="form.name" placeholder="请输入费用名称" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="费用类型" required>
              <el-select v-model="form.costType" style="width: 100%">
                <el-option v-for="(label, value) in costLabels" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计费单位" required>
              <el-select v-model="form.billingUnit" style="width: 100%">
                <el-option v-for="(label, value) in billingLabels" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="费用下限（元）" required>
              <el-input-number v-model="form.minCny" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="费用上限（元）" required>
              <el-input-number v-model="form.maxCny" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="来源链接" required><el-input v-model="form.sourceUrl" placeholder="请输入来源链接" /></el-form-item>
        <el-form-item v-if="readOnly" label="更新时间（UTC）">{{ updatedAt }}</el-form-item>
      </el-form>
      <el-alert title="费用明细变更不会自动更新路线总费用区间。" type="info" :closable="false" />
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
