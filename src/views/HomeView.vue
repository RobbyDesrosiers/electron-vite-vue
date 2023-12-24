<script setup lang="ts">
import PaginationTest from '../components/PaginationTest.vue'
import { onMounted } from 'vue'
import {useCounterStore} from '../stores/counter'
const store = useCounterStore()
onMounted(async () => {
  const apiKey: string = import.meta.env.VITE_API_KEY
  console.log(apiKey)
  if (apiKey === undefined) {
    throw new Error('API key is undefined')
  }
  await fetch(
    `https://api.keygen.sh/v1/accounts/${
      import.meta.env.VITE_KEYGEN_ACCOUNT_KEY
    }/licenses/actions/validate-key`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        meta: {
          key: import.meta.env.VITE_API_KEY,
        },
      }),
    },
  )
    .then(response => response.json())
    .then(json => console.log(json))
})
</script>

<template>
  <button @click="store.increment">{{ store.count }}</button>
  <PaginationTest></PaginationTest>
</template>

<style scoped></style>
