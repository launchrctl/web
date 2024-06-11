export const sentenceCase = (a: string) => {
  const b = a.replaceAll(/[_-]/g, ' ')
  return b.charAt(0).toUpperCase() + b.slice(1)
}
