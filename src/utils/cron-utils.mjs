// Cron 表达式工具：常用预设 + 基础合法性校验（Quartz 6/7 段格式）

export const CRON_PRESETS = [
  { label: '每分钟', value: '0 * * * * ?' },
  { label: '每5分钟', value: '0 */5 * * * ?' },
  { label: '每30分钟', value: '0 */30 * * * ?' },
  { label: '每小时', value: '0 0 * * * ?' },
  { label: '每天凌晨2点', value: '0 0 2 * * ?' },
  { label: '每周一凌晨1点', value: '0 0 1 ? * MON' },
  { label: '每月1号零点', value: '0 0 0 1 * ?' }
]

// 每段允许的字符
const FIELD_PATTERN = {
  second: /^(\*|\d{1,2}|\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}(,\d{1,2})*)$/,
  minute: /^(\*|\d{1,2}|\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}(,\d{1,2})*)$/,
  hour: /^(\*|\d{1,2}|\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}(,\d{1,2})*)$/,
  day: /^(\*|\?|\d{1,2}|\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}(,\d{1,2})*|L|LW)$/,
  month: /^(\*|\d{1,2}|\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}|[A-Z]{3})(,\d{1,2}|,[A-Z]{3})*$/,
  week: /^(\*|\?|\d{1,2}|\d{1,2}-\d{1,2}|[A-Z]{3}|[A-Z]{3}-[A-Z]{3})(,\d{1,2}|,[A-Z]{3})*$/,
  year: /^(\*|\d{4}|\d{4}-\d{4})(,\d{4})*$/
}

const FIELD_NAMES = ['秒', '分', '时', '日', '月', '周', '年']

/**
 * 校验 Cron 表达式（宽松：仅校验段数与基础字符，不校验 Quartz 完整语义）
 * @param {string} expr
 * @returns {{ ok: boolean, message: string }}
 */
export function validateCron(expr) {
  if (!expr || !String(expr).trim()) return { ok: false, message: 'Cron 表达式不能为空' }

  const parts = String(expr).trim().split(/\s+/)
  if (parts.length < 6 || parts.length > 7) {
    return { ok: false, message: 'Cron 表达式应为 6 段(秒 分 时 日 月 周)或 7 段(含年)' }
  }

  // 基础字符检查
  const names = ['second', 'minute', 'hour', 'day', 'month', 'week', 'year']
  for (let i = 0; i < parts.length; i++) {
    if (!FIELD_PATTERN[names[i]].test(parts[i])) {
      return { ok: false, message: `第 ${i + 1} 段(${FIELD_NAMES[i]})格式不正确: ${parts[i]}` }
    }
  }

  // 日与周互斥: 不能同时为 ?
  const day = parts[3]
  const week = parts[5]
  if (day === '?' && week === '?') {
    return { ok: false, message: '日与周不能同时为 ?' }
  }

  return { ok: true, message: '' }
}
