<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { changePassword } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { asyncRoutes, filterRoutesByPermission } from '@/router/asyncRoutes'
import { resetRouter } from '@/router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const menuItems = computed(() => filterRoutesByPermission(asyncRoutes, authStore.permissions))
const activeMenu = computed(() => route.path)

const passwordDialogVisible = ref(false)
const passwordSubmitting = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordRules: FormRules = {
  oldPassword: [{ required: true, whitespace: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, whitespace: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        callback(value === passwordForm.oldPassword ? new Error('新密码不能与旧密码相同') : undefined)
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        callback(value !== passwordForm.newPassword ? new Error('两次输入的新密码不一致') : undefined)
      },
      trigger: 'blur',
    },
  ],
}

function checkPasswordLogin() {
  if (authStore.isLoggedIn()) return true
  ElMessage.warning('请先登录后再修改密码')
  router.push('/login')
  return false
}

function resetPasswordForm() {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.clearValidate()
}

function openPasswordDialog() {
  if (!checkPasswordLogin()) return
  resetPasswordForm()
  passwordDialogVisible.value = true
}

async function submitPassword() {
  if (passwordSubmitting.value || !checkPasswordLogin()) return
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid || !checkPasswordLogin()) return
  passwordSubmitting.value = true
  try {
    await changePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
    passwordDialogVisible.value = false
    resetPasswordForm()
    ElMessage.success('密码修改成功')
  } catch {
    // 接口错误由统一请求拦截器提示，保留表单便于用户修正
  } finally {
    passwordSubmitting.value = false
  }
}

async function handleLogout() {
  await ElMessageBox.confirm('确认退出登录吗？', '提示', { type: 'warning' })
  await authStore.logout()
  resetRouter()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <el-container class="main-layout">
    <el-aside width="220px">
      <div class="logo">徒步 ChatBI 后台</div>
      <el-menu :default-active="activeMenu" router class="side-menu">
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="`/${item.path}`">
          <el-icon v-if="item.meta?.icon">
            <component :is="item.meta.icon" />
          </el-icon>
          <span>{{ item.meta?.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="main-header">
        <span>{{ authStore.user?.displayName }}</span>
        <div class="account-actions">
          <el-button link type="primary" @click="handleLogout">退出登录</el-button>
          <el-button v-if="authStore.token" link type="primary" @click="openPasswordDialog">修改密码</el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="min(460px, 90vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="!passwordSubmitting"
      :show-close="!passwordSubmitting"
      @closed="resetPasswordForm"
    >
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px" :disabled="passwordSubmitting" @submit.prevent="submitPassword">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password autocomplete="current-password" placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password autocomplete="new-password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password autocomplete="new-password" placeholder="请再次输入新密码" @keyup.enter="submitPassword" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="passwordSubmitting" @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordSubmitting" @click="submitPassword">确认修改</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<style scoped>
.main-layout {
  height: 100vh;
}
.logo {
  height: 56px;
  line-height: 56px;
  text-align: center;
  color: #fff;
  background: #1f2937;
  font-size: 16px;
  font-weight: 600;
}
.side-menu {
  height: calc(100% - 56px);
  border-right: none;
}
.main-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  border-bottom: 1px solid #ebeef5;
}
.account-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.account-actions .el-button + .el-button {
  margin-left: 0;
}
</style>
