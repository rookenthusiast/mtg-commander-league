<template>
  <UModal
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    :title="title"
    :ui="{
      overlay: 'fixed inset-0 bg-shadowmoor-purple-950/80 backdrop-blur-sm',
      content: 'bg-gradient-to-br from-shadowmoor-purple-900/95 via-twilight-blue-900/95 to-shadowmoor-purple-900/95 backdrop-blur-md ring-2 ring-lorwyn-gold-500/30 shadow-2xl shadow-shadowmoor-purple-900/50',
      header: 'border-b border-twilight-blue-700/30',
      title: 'text-2xl font-black bg-gradient-to-r from-lorwyn-gold-400 to-lorwyn-gold-600 bg-clip-text text-transparent',
      footer: 'flex justify-end gap-3 border-t border-twilight-blue-700/30 bg-shadowmoor-purple-900/50 backdrop-blur-sm'
    }"
  >
    <template #body>
      <div class="modal-body">
        <!-- Warning Icon -->
        <div class="warning-icon-container">
          <div class="warning-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-12 h-12">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>

        <!-- Content -->
        <div class="modal-content">
          <p class="modal-message">{{ message }}</p>
          <div class="warning-message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
            </svg>
            <span>This action cannot be undone.</span>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        variant="outline"
        @click="$emit('cancel')"
        :disabled="isLoading"
        class="cancel-button"
      >
        Cancel
      </UButton>
      <UButton
        @click="$emit('confirm')"
        :loading="isLoading"
        class="delete-button"
      >
        {{ confirmText }}
      </UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  confirmText: 'Delete',
  isLoading: false
})

defineEmits<{
  'update:isOpen': [value: boolean]
  'confirm': []
  'cancel': []
}>()
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* Modal Body */
.modal-body {
  @apply space-y-6 p-2;
}

/* Warning Icon Container */
.warning-icon-container {
  @apply flex justify-center mb-4;
}

.warning-icon {
  @apply w-20 h-20 rounded-full flex items-center justify-center;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.3) 100%);
  border: 2px solid rgba(239, 68, 68, 0.5);
  box-shadow:
    0 0 30px rgba(239, 68, 68, 0.3),
    0 0 60px rgba(220, 38, 38, 0.2);
  color: #fca5a5; /* red-300 */
  animation: pulse-warning 2s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* Modal Content */
.modal-content {
  @apply space-y-4 text-center;
}

.modal-message {
  @apply text-base md:text-lg text-twilight-blue-200 leading-relaxed;
}

.warning-message {
  @apply flex items-center justify-center gap-2 px-4 py-3 rounded-lg;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5; /* red-300 */
  font-weight: 600;
  font-size: 0.875rem;
}

/* Buttons */
.cancel-button {
  @apply border-2 border-twilight-blue-600 text-white hover:bg-twilight-blue-800 hover:border-twilight-blue-500 font-semibold transition-all duration-200;
}

.delete-button {
  @apply font-bold text-white shadow-lg transition-all duration-200;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  box-shadow:
    0 4px 14px rgba(220, 38, 38, 0.4),
    0 0 20px rgba(220, 38, 38, 0.2);
}

.delete-button:hover {
  background: linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%);
  box-shadow:
    0 6px 20px rgba(220, 38, 38, 0.5),
    0 0 30px rgba(220, 38, 38, 0.3);
  transform: translateY(-1px);
}

.delete-button:active {
  transform: translateY(0);
}
</style>
