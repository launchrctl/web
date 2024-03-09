<script setup>
import spec from '../docs/openapi/openapi.yaml';
</script>

<template>
  <SwaggerUI :spec="spec"/>
</template>