export default defineEventHandler(async (event) => {
  const { action } = getQuery(event)
  const data = await $fetch(`http://localhost:8080/api/actions/${action}`);
  return JSON.parse(data)
})
