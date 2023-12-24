<script lang="ts" setup>
import BarLoader from '../components/common/loader/bar-loader/bar-loader.vue';

interface Props {
  data: Array<any>;
  itemSetter: (item: Element, index: number) => void;
  containerSetter: (container: Element) => void;
}

const props = defineProps<Props>();
</script>

<template>
  <ul
    class="dynamic-pagination-scroll-container"
    :ref="(el) => containerSetter(el as Element)"
  >
    <li
      v-for="(item, index) in data"
      :ref="(el) => itemSetter(el as Element, index)"
    >
      <template v-if="item !== undefined">
        <slot name="item" :item="item" :index="index"></slot>
      </template>
      <template v-else>
        <slot
          name="loadingItem"
          containerClass="skeleton"
          :index="index"
        ></slot>
      </template>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.dynamic-pagination-scroll-container {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  min-height: min-content;
  padding-top: 10px !important;
  padding: 0;
  margin: 0;
  list-style: none;
}

.skeleton {
  display: flex;
  animation: skeleton-loading 1s linear infinite alternate !important;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-color: hsl(0, 0%, 18%) !important;
  }
  100% {
    background-color: hsl(0, 0%, 12%) !important;
  }
}
</style>