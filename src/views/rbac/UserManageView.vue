<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as rbacApi from '@/api/rbac'
import type {
  RbacUserDetailDto,
  RbacUserDto,
  RoleDto,
  UserStatus,
} from '@/types/rbac'

const users = ref<RbacUserDto[]>([])
const roles = ref<RoleDto[]>([])
const loading = ref(false)

const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const form = ref({
  username: '',
  password: '',
  displayName: '',
  email: '',
  mobile: '',
  roleIds: [] as number[],
})

async function loadUsers() {
  loading.value = true
  try {
    users.value = await rbacApi.getUsers()
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  roles.value = await rbacApi.getRoles()
}

function resetForm() {
  form.value = {
    username: '',
    password: '',
    displayName: '',
    email: '',
    mobile: '',
    roleIds: [],
  }
  editId.value = null
}

function openCreateDialog() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

async function openEditDialog(user: RbacUserDto) {
  isEdit.value = true
  editId.value = user.id
  try {
    const detail = (await rbacApi.getUserDetail(user.id)) as RbacUserDetailDto
    const roleIds = Array.isArray(detail.roleIds)
      ? detail.roleIds
      : roles.value
          .filter((role) => Array.isArray(detail.roleCodes) && detail.roleCodes.includes(role.code))
          .map((role) => role.id)

    form.value = {
      username: detail.username,
      password: '',
      displayName: detail.displayName,
      email: detail.email ?? '',
      mobile: detail.mobile ?? '',
      roleIds,
    }
    dialogVisible.value = true
  } catch {
    dialogVisible.value = false
  }
}

async function handleCreate() {
  if (!form.value.username || !form.value.displayName) {
    ElMessage.warning('请填写用户名和显示名')
    return
  }
  if (form.value.roleIds.length === 0) {
    ElMessage.warning('请至少选择一个角色')
    return
  }

  submitting.value = true
  try {
    if (isEdit.value && editId.value !== null) {
      await rbacApi.updateUser(editId.value, {
        displayName: form.value.displayName,
        email: form.value.email,
        mobile: form.value.mobile,
        roleIds: form.value.roleIds,
      })
      ElMessage.success('用户已更新')
    } else {
      await rbacApi.createUser({
        username: form.value.username,
        password: form.value.password,
        displayName: form.value.displayName,
        email: form.value.email,
        mobile: form.value.mobile,
        roleIds: form.value.roleIds,
      })
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    resetForm()
    await loadUsers()
  } finally {
    submitting.value = false
  }
}

async function handleStatusChange(row: RbacUserDto, value: UserStatus) {
  const nextStatus = value
  const previousStatus = row.status
  try {
    await rbacApi.updateUserStatus(row.id, nextStatus)
    row.status = nextStatus
    ElMessage.success('状态已更新')
  } catch {
    row.status = previousStatus
  }
}

async function handleDelete(id: number) {
  await rbacApi.deleteUser(id)
  ElMessage.success('删除成功')
  await loadUsers()
}

async function handleResetPassword(id: number) {
  await rbacApi.resetUserPassword(id)
  ElMessage.success('密码已重置为默认密码')
}

onMounted(async () => {
  await loadRoles()
  await loadUsers()
})
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button v-permission="'rbac:user:create'" type="primary" @click="openCreateDialog">
        新建用户
      </el-button>
    </div>

    <el-table v-loading="loading" :data="users" border>
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="displayName" label="显示名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="mobile" label="手机号" />
      <el-table-column label="角色">
        <template #default="{ row }">
          {{ Array.isArray(row.roleCodes) ? row.roleCodes.join(', ') : '' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <div class="status-switch">
            <el-switch
              v-permission="'rbac:user:update'"
              :model-value="row.status"
              active-value="active"
              inactive-value="disabled"
              style="--el-switch-on-color: #409eff; --el-switch-off-color: #c0c4cc"
              @change="(val: UserStatus) => handleStatusChange(row, val)"
            />
            <span :class="['status-text', row.status]">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button v-permission="'rbac:user:update'" type="primary" size="small" @click="openEditDialog(row)">
            编辑
          </el-button>
          <el-popconfirm title="确认重置该用户密码？" @confirm="handleResetPassword(row.id)">
            <template #reference>
              <el-button v-permission="'rbac:user:reset-password'" type="warning" size="small">重置密码</el-button>
            </template>
          </el-popconfirm>
          <el-popconfirm title="确认删除该用户？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button v-permission="'rbac:user:delete'" type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新建用户'" width="500px">
      <el-form label-width="90px">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="留空则使用默认密码" />
        </el-form-item>
        <el-form-item label="显示名" required>
          <el-input v-model="form.displayName" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.mobile" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.roleIds" multiple placeholder="请选择角色">
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.status-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 14px;
  line-height: 1;
}

.status-text.active {
  color: #409eff;
}

.status-text.disabled {
  color: #909399;
}
</style>
