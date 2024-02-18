<script setup>
import "@shoelace-style/shoelace"
import "@shoelace-style/shoelace/dist/themes/light.css"
import "~/assets/styles.css"
import burger from "~/assets/burger.svg"

const drawerIsOpen = ref(false)

const actions = useState('actions')
await callOnce(async () => {
  actions.value = await $fetch('/api/actions')
})

const { afterEach } = useRouter()

afterEach(() => {
  drawerIsOpen.value = false
})
</script>
<template>
  <NuxtLayout>
    <sl-drawer placement="start" class="drawer-placement-start" :open="drawerIsOpen"
      :onSlAfterHide="() => (drawerIsOpen = false)">
      <sl-menu>
        <sl-menu-label>Actions</sl-menu-label>
        <sl-menu-item v-for="link of actions" @click="navigateTo(`/${link.id}`)">
          <div>{{ link?.title }}</div>
          <sub>{{ link?.id }}</sub>
        </sl-menu-item>
      </sl-menu>

      <div slot="footer">
        <sl-menu>
          <sl-menu-label>API Specs</sl-menu-label>
          <sl-menu-item @click="navigateTo('/openapi')">Open Api</sl-menu-item>
        </sl-menu>
      </div>
    </sl-drawer>

    <header class="header">
      <sl-button class="main-menu" size="large" @click="drawerIsOpen = true" circle>
        <sl-icon :src="burger"></sl-icon>
      </sl-button>
    </header>

    <NuxtPage></NuxtPage>
  </NuxtLayout>
</template>
