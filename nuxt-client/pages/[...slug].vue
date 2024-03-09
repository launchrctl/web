<script setup>
const route = useRoute()
const { data, pending, error, refresh } = await useFetch(`/api/action`, {
  query: { action: route.params.slug }
})
const argumentsSchema = computed(() => {
  return {
    type: 'object',
    properties: data.value.jsonschema.properties.arguments.properties ?? {}
  }
});

const optionsSchema = computed(() => {
  return {
    type: 'object',
    properties: data.value.jsonschema.properties.options.properties ?? {}
  }
});

</script>
<template>
  <div class="container" v-if="!pending">

    <div class="content-doc">

      <sl-details summary="Action source">
        <pre><code>{{ data.jsonschema }}</code></pre>
      </sl-details>
      <sl-details summary="UI Schema source">
        <!-- <pre><code>{{ action.schema }}</code></pre> -->
      </sl-details>

      <template v-if="argumentsSchema">
        <h2 class="text-h5">Arguments</h2>
        <ActionForm :schema="argumentsSchema"
          :uiSchema={}
          />
          <!-- :uiSchema="action.schema.uiSchema"  -->
      </template>

      <template v-if="optionsSchema">
        <h2 class="text-h5">Options</h2>
        <ActionForm :schema="optionsSchema"
          :uiSchema={}
          />
          <!-- :uiSchema="action.schema.uiSchema"  -->
      </template>
    </div>


  </div>
</template>

<style>
.content-doc {
  display: grid;
  gap: 24px;
}
</style>