<script setup>
import '@jsfe/shoelace';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
const props = defineProps(['actionPath', 'schema', 'uiSchema']);
const dialog = ref(false)
const dialogContent = ref('');

const handleSubmit = async (e) => {
  const data = await $fetch('/api/action', {
    method: 'POST',
    body: {
      file: props.actionPath,
    }
  })
  dialog.value = true;
  dialogContent.value = data.result
}
const closeDialog = () => {
  dialog.value = false;
}

</script>
<template>
  <jsf-shoelace .schema="props.schema" .uiSchema="props.uiSchema ? props.uiSchema : {}" .submitCallback="handleSubmit"></jsf-shoelace>

  <sl-dialog label="Dialog" class="dialog-overview" :open="dialog" :onSlRequestClose="closeDialog">
    <pre>{{ dialogContent }}</pre>
  </sl-dialog>
</template>