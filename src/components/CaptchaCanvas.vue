<template>
  <canvas
    ref="canvasRef"
    :width="width"
    :height="height"
    class="captcha-canvas"
    title="点击刷新"
    @click="refresh"
  />
</template>

<script setup>
/* global defineProps, defineExpose */
import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  width: { type: Number, default: 120 },
  height: { type: Number, default: 40 },
  length: { type: Number, default: 4 }
})

const canvasRef = ref()
const captchaLength = computed(() => Math.min(6, Math.max(4, Math.round(props.length))))
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
const FONTS = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New']
let code = ''

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChar() {
  return CHARS[randomInt(0, CHARS.length - 1)]
}

function randomFont() {
  return FONTS[randomInt(0, FONTS.length - 1)]
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, props.width, props.height)

  ctx.fillStyle = `hsl(${randomInt(0, 360)}, 50%, ${randomInt(88, 96)}%)`
  ctx.fillRect(0, 0, props.width, props.height)

  for (let i = 0; i < randomInt(3, 5); i += 1) {
    ctx.strokeStyle = `rgba(${randomInt(0, 255)}, ${randomInt(0, 255)}, ${randomInt(0, 255)}, 0.5)`
    ctx.beginPath()
    ctx.moveTo(randomInt(0, props.width), randomInt(0, props.height))
    ctx.lineTo(randomInt(0, props.width), randomInt(0, props.height))
    ctx.stroke()
  }

  const chars = Array.from({ length: captchaLength.value }, randomChar)
  code = chars.join('')
  const step = props.width / (captchaLength.value + 1)

  chars.forEach((char, index) => {
    ctx.save()
    ctx.font = `bold ${randomInt(22, 30)}px ${randomFont()}`
    ctx.fillStyle = `rgb(${randomInt(0, 120)}, ${randomInt(0, 120)}, ${randomInt(0, 120)})`
    ctx.translate(step * (index + 1), randomInt(24, props.height - 8))
    ctx.rotate((randomInt(-25, 25) * Math.PI) / 180)
    ctx.fillText(char, 0, 0)
    ctx.restore()
  })

  for (let i = 0; i < randomInt(40, 80); i += 1) {
    ctx.fillStyle = `rgba(${randomInt(0, 255)}, ${randomInt(0, 255)}, ${randomInt(0, 255)}, 0.6)`
    ctx.beginPath()
    ctx.arc(randomInt(0, props.width), randomInt(0, props.height), Math.random() + 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function refresh() {
  draw()
}

function validate(input) {
  return typeof input === 'string' && input.trim().toUpperCase() === code.toUpperCase()
}

defineExpose({ refresh, validate })

onMounted(draw)
</script>

<style scoped>
.captcha-canvas {
  cursor: pointer;
  border-radius: 6px;
  display: block;
  vertical-align: middle;
}
</style>
