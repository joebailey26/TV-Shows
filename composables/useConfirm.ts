import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
let resolver: ((value: boolean) => void) | null = null

export default function useConfirm () {
  const open = (msg: string) => {
    message.value = msg
    visible.value = true
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  const confirm = () => {
    visible.value = false
    resolver?.(true)
  }

  const cancel = () => {
    visible.value = false
    resolver?.(false)
  }

  return {
    visible,
    message,
    open,
    confirm,
    cancel
  }
}
