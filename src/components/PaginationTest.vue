<script lang="ts" setup>
import { onMounted, reactive, ref, onUnmounted } from 'vue';
import DynamicPaginationContainer from './PaginationContainer.vue';

function fakeApi(
  limit: number,
  page: number,
  appendResults: boolean = true
): Promise<{ count: number; items: Array<any> }> {
  const pageCalledText = 'calling page ' + page + ', limit ' + limit;
  if (appendResults) pageCalled.value.push(pageCalledText);
  return new Promise((resolve) => {
    let array = Array.from({ length: results.value }, (_, index) => ({
      id: index + 1,
      name: makeid(5),
    }));
    setTimeout(() => {
      resolve({
        count: results.value,
        items: array.slice((page - 1) * limit, limit * page),
      });
    }, Math.floor(Math.random() * (1000 - 300 + 1) + 300));
  });
}
const pageCalled = ref<Array<string>>([]);
function makeid(length: number) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

interface DynamicPaginationOptions {
  apiPageLimit?: number;
  scrollTimeoutMs?: number;
  itemLimitForScreen?: number;
  bottomPixelOffset?: number;
  apiFunction: (limit: number, page: number) => Promise<any>;
}

interface DynamicPaginationApiData<T> {
  records: Array<T>;
  count: number;
}

class DynamicPagination<T> {
  private observer: IntersectionObserver | null = null;
  private containerRef: Element | null = null;
  private itemRefs: Array<Element> = [];

  private apiData: DynamicPaginationApiData<T> = {
    records: [],
    count: 0,
  };
  public isLoading: boolean = false;

  private pagesCalledFromAPI: Set<number> = new Set();
  private currentlyViewedIndexes: Set<number> = new Set();

  // timer for scroll
  private scrollTimer: null | number = null;

  // constants
  private API_PAGE_LIMIT = 50;
  private SCROLL_TIMEOUT_MS = 400;
  private ITEM_LIMIT_FOR_SCREEN = 200;
  private BOTTOM_PIXEL_OFFSET = 1000;

  private setOptions(options: DynamicPaginationOptions) {
    if (options.apiPageLimit) this.API_PAGE_LIMIT = options.apiPageLimit;
    if (options.scrollTimeoutMs)
      this.SCROLL_TIMEOUT_MS = options.scrollTimeoutMs;
    if (options.itemLimitForScreen)
      this.ITEM_LIMIT_FOR_SCREEN = options.itemLimitForScreen;
    if (options.bottomPixelOffset)
      this.BOTTOM_PIXEL_OFFSET = options.bottomPixelOffset;
  }

  public async init(options?: DynamicPaginationOptions) {
    if (options) this.setOptions(options);
    if (this.data.length === 0) {
      await this.makeFirstCall();
    }
    this.observer = new IntersectionObserver(this.onIntersection.bind(this), {
      root: this.containerRef,
      threshold: 0.2,
    });
    // runs the scroll function to call any records not available on first load
    this.scrollFunction();
  }

  public destory() {
    this.observer?.disconnect();
    this.containerRef?.removeEventListener(
      'scroll',
      this.scrollFunction.bind(this)
    );
    this.itemRefs.splice(0);
  }

  private async makeFirstCall() {
    const PAGE = 1;
    this.isLoading = true;
    const resp = await fakeApi(this.API_PAGE_LIMIT, PAGE);
    this.pagesCalledFromAPI.add(PAGE);
    this.apiData.count = resp.count;
    if (resp.count > this.ITEM_LIMIT_FOR_SCREEN) {
      this.apiData.records = new Array(this.ITEM_LIMIT_FOR_SCREEN).fill(
        undefined
      );
    } else {
      this.apiData.records = new Array(resp.count).fill(undefined);
    }
    this.apiData.records.splice(0, resp.items.length, ...resp.items);
    this.isLoading = false;
    return Promise.resolve('success');
  }

  private scrollFunction() {
    if (this.scrollTimer !== null) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(async () => {
      // todo make callback for options here
      await this.fetchRecords();
    }, this.SCROLL_TIMEOUT_MS);

    // checks if bottom
    if (
      this.isScrollBottom(
        this.containerRef as HTMLDivElement,
        this.BOTTOM_PIXEL_OFFSET
      )
    ) {
      if (
        this.apiData.records.length + this.ITEM_LIMIT_FOR_SCREEN >
        this.apiData.count
      ) {
        this.appendBlankData(this.apiData.count - this.apiData.records.length);
      } else this.appendBlankData(this.ITEM_LIMIT_FOR_SCREEN);
    }
  }

  private appendBlankData(dataAmount: number) {
    this.apiData.records.push(...new Array(dataAmount).fill(undefined));
  }

  private isScrollBottom(
    scrollableElement: HTMLDivElement,
    offSetHeight: number
  ) {
    return (
      scrollableElement.scrollTop >=
      scrollableElement.scrollHeight -
        scrollableElement.offsetHeight -
        offSetHeight
    );
  }

  public async fetchRecords() {
    const min = Math.min(...this.currentlyViewedIndexes);
    const max = Math.max(...this.currentlyViewedIndexes);

    const minPageNeeded = Math.floor(min / this.API_PAGE_LIMIT + 1);
    const maxPageNeeded = Math.floor(max / this.API_PAGE_LIMIT + 1);
    const pagesNeedingToBeCalled: Array<number> = [];

    if (isFinite(minPageNeeded)) pagesNeedingToBeCalled.push(minPageNeeded);
    if (isFinite(maxPageNeeded)) pagesNeedingToBeCalled.push(maxPageNeeded);

    // Add numbers in between minPageNeeded and maxPageNeeded to the array
    for (let i = minPageNeeded + 1; i < maxPageNeeded; i++) {
      pagesNeedingToBeCalled.push(i);
    }

    this.isLoading = true;
    pagesNeedingToBeCalled.forEach(async (pageNumber) => {
      if (!this.pagesCalledFromAPI.has(pageNumber)) {
        this.pagesCalledFromAPI.add(pageNumber);
        const resp = await fakeApi(this.API_PAGE_LIMIT, pageNumber);
        this.apiData.records.splice(
          (pageNumber - 1) * this.API_PAGE_LIMIT,
          this.API_PAGE_LIMIT,
          ...resp.items
        );
      }
    });
    this.isLoading = false;
    return Promise.resolve('success');
  }

  public async reset() {
    this.apiData.records.splice(0);
    this.pagesCalledFromAPI.clear();
    this.currentlyViewedIndexes.clear();
    if (this.containerRef) this.containerRef.scrollTop = 0;
    this.destory();
    this.init();
  }

  private onIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      let index = this.itemRefs.indexOf(entry.target);
      if (entry.isIntersecting) {
        this.currentlyViewedIndexes.add(index);
      } else {
        this.currentlyViewedIndexes.delete(index);
      }
    });
  }

  public get data() {
    return this.apiData.records;
  }

  public setItemRef(element: Element, index: number) {
    if (element) {
      this.itemRefs[index] = element;
      this.observer?.observe(element);
    } else {
      const itemRef = this.itemRefs[index] as Element;
      if (itemRef) {
        this.observer?.unobserve(itemRef);
        this.itemRefs.splice(index, 1);
      }
    }
  }

  public setContainerRef(element: Element) {
    this.containerRef = element;
    element.addEventListener('scroll', this.scrollFunction.bind(this));
  }
}

function useDynamicPagination<T>(options?: DynamicPaginationOptions) {
  const dynamicPagination = reactive<DynamicPagination<T>>(
    new DynamicPagination<T>()
  );
  onMounted(() => {
    dynamicPagination.init(options);
  });

  onUnmounted(() => {
    dynamicPagination.destory();
  });
  return dynamicPagination;
}

const results = ref(3000);
const dynamicPagination = useDynamicPagination<any>({
  apiFunction: fakeApi,
});
</script>

<template>
  <div style="display: flex;flex-direction: row; gap: 100px; height: 100vh; width: 100vw;">
    <DynamicPaginationContainer
      :data="dynamicPagination.data"
      :itemSetter="(el: Element, index: number) => dynamicPagination.setItemRef(el, index)"
      :containerSetter="(el: Element) => dynamicPagination.setContainerRef(el)"
      style="max-width: 400px"
    >
      <template #item="{ item, index }">
        <div class="item-container">{{ item.name }}</div>
      </template>
      <template #loadingItem="{ containerClass, index }">
        <div class="item-container" :class="containerClass"></div>
      </template>
    </DynamicPaginationContainer>

    <!-- ignore this -->
    <div
      style="
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
        align-items: flex-end;
        flex-direction: column;
      "
    >
      <div>Indexes</div>
      <div>{{ dynamicPagination.currentlyViewedIndexes }}</div>
      <div>Total Count: {{ dynamicPagination.apiData.count }}</div>
      <button @click="dynamicPagination.reset()">Reset</button>
      <div>Pages Called</div>
      <div v-for="page in pageCalled">{{ page }}</div>
    </div>
    <div style="display: flex">
      <div>
        <div>Loaded Elements</div>
        <div class="test-shower">
          <template v-for="(result, i) in results">
            <div
              v-if="dynamicPagination.data[i] !== undefined"
              style="background-color: green"
              class="shower"
            ></div>
            <div
              v-else-if="
                dynamicPagination.data[i] === undefined &&
                dynamicPagination.data.length > i
              "
              style="background-color: rgb(99, 6, 6)"
              class="shower"
            ></div>
            <div
              v-else
              style="background-color: rgb(67, 0, 0)"
              class="shower"
            ></div>
          </template>
        </div>
      </div>
      <div>
        <div style="height: 18px"></div>
        <div class="test-shower" style="width: 20px">
          <template v-for="(result, i) in results">
            <div
              v-if="dynamicPagination.currentlyViewedIndexes.has(i)"
              style="background-color: rgb(1, 203, 230)"
              class="shower"
            ></div>
            <div
              v-else
              style="background-color: rgb(21, 21, 21)"
              class="shower"
            ></div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
li {
  width: 100%;
  min-height: 40px;
  background-color: #3b3b3b;
  color: white;
}

.old-way {
  display: flex;
  flex-grow: 1;
  max-width: 400px;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  min-height: min-content;
  padding-top: 10px !important;
  padding: 0;
  margin: 0;
  list-style: none;
}

.item-container {
  display: flex;
  box-sizing: border-box;
  margin-left: 10px;
  margin-right: 10px;
  align-items: center;
  padding: 10px;
  flex-grow: 1;
  background-color: rgb(42, 42, 42);
  transition: all;
  min-height: 45px;
  border-radius: 5px;
  &:hover {
    background-color: rgb(55, 55, 55);
  }
}

.test-shower {
  display: flex;
  flex-direction: column;
  width: 200px;
  height: 97%;
  margin-top: 10px;
}

.shower {
  flex-grow: 1;
}

.skeleton {
  display: flex;
  animation: skeleton-loading 1s linear infinite alternate;
  border-radius: 4px;
}

.skeleton-dark {
  display: flex;
  animation: skeleton-loading-dark 1s linear infinite alternate;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-color: hsl(0, 0%, 18%);
  }
  100% {
    background-color: hsl(0, 0%, 12%);
  }
}

@keyframes skeleton-loading-dark {
  0% {
    background-color: hsl(0, 0%, 10%);
  }
  100% {
    background-color: hsl(0, 0%, 6%);
  }
}
</style>