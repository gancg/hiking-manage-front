<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as rbacApi from '@/api/rbac'
import type { PermissionDto, RbacStatus } from '@/types/rbac'

const permissions = ref<PermissionDto[]>([])
const allPermissions = ref<PermissionDto[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const form = ref({
  code: '',
  name: '',
  resourceType: '',
  resource: '',
  action: '',
  parentId: null as number | null,
  status: 'active' as RbacStatus,
})

const parentOptions = computed(() =>
  allPermissions.value
    .filter((item) => item.id !== editId.value)
    .map((item) => ({
      value: item.id,
      label: `${item.code} - ${item.name}`,
    })),
)

function resetForm() {
  form.value = {
    code: '',
    name: '',
    resourceType: '',
    resource: '',
    action: '',
    parentId: null,
    status: 'active',
  }
  editId.value = null
}

async function loadPermissions(currentPage = pageNum.value, currentPageSize = pageSize.value) {
  loading.value = true
  try {
    const result = await rbacApi.getPermissions({ pageNum: currentPage, pageSize: currentPageSize })
    permissions.value = result.records
    total.value = result.total
    pageNum.value = result.pageNum
    pageSize.value = result.pageSize

    if (permissions.value.length === 0 && total.value > 0 && pageNum.value > 1) {
      pageNum.value -= 1
      await loadPermissions(pageNum.value, pageSize.value)
    }
  } finally {
    loading.value = false
  }
}

async function loadAllPermissions() {
  allPermissions.value = await rbacApi.getAllPermissions()
}

function openCreateDialog() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

async function openEditDialog(id: number) {
  isEdit.value = true
  editId.value = id
  try {
    const detail = await rbacApi.getPermissionDetail(id)
    form.value = {
      code: detail.code,
      name: detail.name,
      resourceType: detail.resourceType,
      resource: detail.resource,
      action: detail.action,
      parentId: detail.parentId,
      status: detail.status,
    }
    dialogVisible.value = true
  } catch {
    dialogVisible.value = false
  }
}

async function handleSubmit() {
  if (!form.value.code || !form.value.name || !form.value.resourceType || !form.value.resource || !form.value.action) {
    ElMessage.warning('请填写完整权限信息')
    return
  }

  submitting.value = true
  try {
    const payload = {
      code: form.value.code,
      name: form.value.name,
      resourceType: form.value.resourceType,
      resource: form.value.resource,
      action: form.value.action,
      parentId: form.value.parentId,
      status: form.value.status,
    }

    if (isEdit.value && editId.value !== null) {
      await rbacApi.updatePermission(editId.value, payload)
      ElMessage.success('权限已更新')
    } else {
      await rbacApi.createPermission(payload)
      ElMessage.success('权限已创建')
    }

    dialogVisible.value = false
    resetForm()
    await Promise.all([loadPermissions(), loadAllPermissions()])
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  await rbacApi.deletePermission(id)
  ElMessage.success('删除成功')
  await Promise.all([loadPermissions(), loadAllPermissions()])
}

function handleCurrentChange(value: number) {
  pageNum.value = value
  loadPermissions()
}

function handleSizeChange(value: number) {
  pageSize.value = value
  pageNum.value = 1
  loadPermissions(1, value)
}

onMounted(async () => {
  await Promise.all([loadPermissions(), loadAllPermissions()])
})
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button v-permission="'rbac:permission:create'" type="primary" @click="openCreateDialog">
        新建权限
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="permissions"
      border
    >
      <el-table-column prop="code" label="编码" width="180" />
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="resource" label="资源" />
      <el-table-column prop="action" label="动作" width="120" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button
            v-permission="'rbac:permission:update'"
            type="primary"
            size="small"
            @click="openEditDialog(row.id)"
          >
            编辑
          </el-button>
          <el-popconfirm title="确认删除该权限？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button
                v-permission="'rbac:permission:delete'"
                type="danger"
                size="small"
              >
                删除
              </el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑权限' : '新建权限'" width="560px">
      <el-form label-width="100px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="资源类型" required>
          <el-input v-model="form.resourceType" />
        </el-form-item>
        <el-form-item label="资源" required>
          <el-input v-model="form.resource" />
        </el-form-item>
        <el-form-item label="动作" required>
          <el-input v-model="form.action" />
        </el-form-item>
        <el-form-item label="父级权限">
          <el-select v-model="form.parentId" clearable placeholder="请选择父级权限">
            <el-option v-for="item in parentOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" required>
          <el-radio-group v-model="form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
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
