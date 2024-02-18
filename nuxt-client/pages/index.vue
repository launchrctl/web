<script setup>
const actions = useState('actions')
</script>

<template>
  <div class="container">
    <h1 class="text-h4">Actions UI</h1>
    <p>
      All components (actions) by default show their arguments and options on the form as text elements. An additional UI
      configuration file may also appear.
    </p>
    <p>
      More information:
      https://github.com/json-schema-form-element/jsfe
      https://jsfe.js.org/Sink/AllFeatures

    </p>
    <p>
      The application was built using Nuxt:
      https://nuxt.com/

    </p>
    <p>
      Yaml files are searched using:
      https://content.nuxt.com/

    </p>
    <h2 class="text-h4">Components list</h2>
    <div class="grid">
      <template v-for="action in actions" :key="action">
        <sl-card>

          <strong>{{ action.title }}</strong><br />
          {{ action.description }}<br />

          <div slot="footer" class="card__actions">
            <sl-button variant="primary">Run action</sl-button>
            <sl-button :href="`/${action.id}`">Customize</sl-button>
          </div>
        </sl-card>
      </template>
    </div>
  </div>
</template>