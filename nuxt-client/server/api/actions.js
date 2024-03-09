export default defineEventHandler(async (event) => {

  const data = await $fetch('http://localhost:8080/api/actions');
  return JSON.parse(data)
})
