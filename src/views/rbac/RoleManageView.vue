<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as rbacApi from '@/api/rbac'
import { buildTreeByParentId, flattenTreeNodeIds } from '@/utils/rbac-tree'
import type { PermissionDto, RoleDto, RbacStatus } from '@/types/rbac'

type TreePermission = PermissionDto & {
  children?: TreePermission[]
}

const roles = ref<RoleDto[]>([])
const permissions = ref<PermissionDto[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const treeRef = ref<any>(null)
const allPermissionsChecked = ref(false)
const allPermissionsIndeterminate = ref(false)

const form = ref({
  code: '',
  name: '',
  description: '',
  status: 'active' as RbacStatus,
  permissionIds: [] as number[],
})

const permissionTree = computed(() => buildTreeByParentId<PermissionDto>(permissions.value) as TreePermission[])
const allPermissionIds = computed(() => flattenTreeNodeIds(permissionTree.value))

function loadPermissionTree() {
  return rbacApi.getAllPermissions().then((result) => {
    permissions.value = result
    return result
  })
}

async function loadRoles() {
  loading.value = true
  try {
    roles.value = await rbacApi.getRoles()
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    code: '',
    name: '',
    description: '',
    status: 'active',
    permissionIds: [],
  }
  editId.value = null
}

function openCreateDialog() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
  nextTick(() => {
    setCheckedPermissions([])
  })
}

async function openEditDialog(id: number) {
  isEdit.value = true
  editId.value = id
  try {
    const detail = await rbacApi.getRoleDetail(id)
    form.value = {
      code: detail.code,
      name: detail.name,
      description: detail.description ?? '',
      status: detail.status,
      permissionIds: detail.permissionIds ?? [],
    }
    dialogVisible.value = true
    await nextTick()
    setCheckedPermissions(detail.permissionIds)
  } catch {
    dialogVisible.value = false
  }
}

function getSelectedPermissionIds() {
  const checked = treeRef.value?.getCheckedKeys(false) ?? []
  const halfChecked = treeRef.value?.getHalfCheckedKeys() ?? []
  return Array.from(new Set([...checked, ...halfChecked]))
}

function setCheckedPermissions(ids: number[]) {
  treeRef.value?.setCheckedKeys(ids)
  syncSelectAllState()
}

function syncSelectAllState() {
  const selectedCount = getSelectedPermissionIds().length
  const totalCount = allPermissionIds.value.length

  allPermissionsChecked.value = totalCount > 0 && selectedCount === totalCount
  allPermissionsIndeterminate.value = selectedCount > 0 && selectedCount < totalCount
}

function handleToggleAllPermissions(checked: boolean | string | number) {
  const shouldCheckAll = Boolean(checked)
  setCheckedPermissions(shouldCheckAll ? allPermissionIds.value : [])
}

async function handleSubmit() {
  if (!form.value.code || !form.value.name) {
    ElMessage.warning('请填写角色编码和名称')
    return
  }

  submitting.value = true
  try {
    const payload = {
      code: form.value.code,
      name: form.value.name,
      description: form.value.description,
      status: form.value.status,
      permissionIds: getSelectedPermissionIds(),
    }

    if (isEdit.value && editId.value !== null) {
      await rbacApi.updateRole(editId.value, payload)
      ElMessage.success('角色已更新')
    } else {
      await rbacApi.createRole(payload)
      ElMessage.success('角色已创建')
    }

    dialogVisible.value = false
    resetForm()
    await loadRoles()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  await rbacApi.deleteRole(id)
  ElMessage.success('删除成功')
  await loadRoles()
}

onMounted(async () => {
  await loadPermissionTree()
  await loadRoles()
})
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button v-permission="'rbac:role:create'" type="primary" @click="openCreateDialog">
        新建角色
      </el-button>
    </div>

    <el-table v-loading="loading" :data="roles" border>
      <el-table-column prop="code" label="编码" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="status" label="状态" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button v-permission="'rbac:role:update'" type="primary" size="small" @click="openEditDialog(row.id)">
            编辑
          </el-button>
          <el-popconfirm title="确认删除该角色？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button v-permission="'rbac:role:delete'" type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新建角色'" width="640px">
      <el-form label-width="90px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-radio-group v-model="form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权限">
          <el-checkbox
            :model-value="allPermissionsChecked"
            :indeterminate="allPermissionsIndeterminate"
            @change="handleToggleAllPermissions"
          >
            全选
          </el-checkbox>
          <el-tree
            ref="treeRef"
            :data="permissionTree"
            show-checkbox
            node-key="id"
            default-expand-all
            :props="{ children: 'children', label: 'name' }"
            @check="syncSelectAllState"
          />
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

:deep(.el-form-item__content) {
  gap: 8px;
}
</style>
