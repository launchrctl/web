<script>
import { defineComponent } from 'vue'
import 'swagger-ui/dist/swagger-ui.css'
import SwaggerUI from 'swagger-ui'
import SwaggerUIStandalonePreset from 'swagger-ui/dist/swagger-ui-standalone-preset'


export default defineComponent({
  props: ['spec', 'url'],
  mounted() {
    const options = {
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUI.presets.apis,
        SwaggerUIStandalonePreset,
      ],
      layout: 'StandaloneLayout',
    }
    if (this.url) {
      options.url = this.url
    }

    if (this.spec) {
      options.spec = this.spec
    }

    SwaggerUI(options)
  }
});
</script>

<template>
  <div id="swagger-ui"></div>
</template>
