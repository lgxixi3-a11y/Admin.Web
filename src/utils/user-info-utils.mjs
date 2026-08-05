function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeUserInfo(data) {
  const source = data && typeof data === 'object' ? data : {}

  return {
    userId: source.userId ?? null,
    userName: normalizeText(source.userName),
    nickName: normalizeText(source.nickName),
    avatar: normalizeText(source.avatar)
  }
}
