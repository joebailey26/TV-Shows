<style lang="scss" scoped>
.confirm__overlay {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 40%);
  backdrop-filter: blur(5px);
  inset: 0
}
.confirm__dialog {
  padding: 1rem;
  text-align: center;
  background-color: #1C1C1C;
  border: 1px solid #333333;
  border-radius: .5rem
}
.confirm__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem
}
</style>

<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm__overlay" @click.self="cancel">
      <div class="confirm__dialog">
        <p>{{ message }}</p>
        <div class="confirm__actions">
          <button class="button" type="button" @click="confirm">
            Ok
          </button>
          <button class="button" type="button" @click="cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
const { visible, message, confirm, cancel } = useConfirm()
</script>
