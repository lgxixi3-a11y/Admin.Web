export function filterIconNames(iconNames, keyword, initialLimit = 200) {
  const names = [...iconNames].sort()
  const normalizedKeyword = keyword.trim().toLowerCase()
  return normalizedKeyword
    ? names.filter(name => name.toLowerCase().includes(normalizedKeyword))
    : names.slice(0, initialLimit)
}
