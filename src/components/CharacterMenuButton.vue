<template>
  <q-btn flat class="q-pa-none character-button" :disable="disable">
    <!-- q-imgだとdisableのタイミングで点滅する -->
    <img class="q-pa-none q-ma-none" :src="selectedStyle[0].iconPath" />
    <q-menu
      class="character-menu"
      transition-show="none"
      transition-hide="none"
    >
      <q-list>
        <q-item
          v-for="(characterInfo, characterIndex) in characterInfos"
          :key="characterIndex"
          class="q-pa-none"
        >
          <q-btn-group flat class="col full-width">
            <q-btn
              flat
              no-caps
              v-close-popup
              class="col-grow"
              :class="
                selectedCharacterInfo.length !== 2 &&
                characterInfo.metas.speakerUuid ===
                  selectedCharacterInfo[0].metas.speakerUuid &&
                'selected-character-item'
              "
              @click="
                styleSelectAction([
                  getDefaultStyle(characterInfo.metas.speakerUuid).styleId,
                ])
              "
              @mouseover="reassignSubMenuOpen(-1)"
              @mouseleave="reassignSubMenuOpen.cancel()"
            >
              <q-avatar rounded size="2rem" class="q-mr-md">
                <q-img
                  no-spinner
                  no-transition
                  :ratio="1"
                  :src="
                    getDefaultStyle(characterInfo.metas.speakerUuid).iconPath
                  "
                />
              </q-avatar>
              <div>{{ characterInfo.metas.speakerName }}</div>
            </q-btn>

            <!-- スタイルが2つ以上あるものだけ、スタイル選択ボタンを表示する-->
            <template v-if="characterInfo.metas.styles.length >= 2">
              <q-separator vertical />

              <div
                class="flex items-center q-px-sm q-py-none cursor-pointer"
                :class="
                  subMenuOpenFlags[characterIndex] && 'opened-character-item'
                "
                @mouseover="reassignSubMenuOpen(characterIndex)"
                @mouseleave="reassignSubMenuOpen.cancel()"
              >
                <q-icon name="keyboard_arrow_right" color="grey-6" size="sm" />

                <q-menu
                  no-parent-event
                  anchor="top end"
                  self="top start"
                  transition-show="none"
                  transition-hide="none"
                  class="character-menu"
                  v-model="subMenuOpenFlags[characterIndex]"
                >
                  <q-list>
                    <q-item
                      v-for="(style, styleIndex) in characterInfo.metas.styles"
                      :key="styleIndex"
                      clickable
                      v-close-popup
                      active-class="selected-character-item"
                      :active="
                        selectedStyle.length === 1 &&
                        style.styleId === selectedStyle[0].styleId
                      "
                      @click="styleSelectAction([style.styleId])"
                    >
                      <q-avatar rounded size="2rem" class="q-mr-md">
                        <q-img
                          no-spinner
                          no-transition
                          :ratio="1"
                          :src="characterInfo.metas.styles[styleIndex].iconPath"
                        />
                      </q-avatar>
                      <q-item-section v-if="style.styleName"
                        >{{ characterInfo.metas.speakerName }} ({{
                          style.styleName
                        }})</q-item-section
                      >
                      <q-item-section v-else>{{
                        characterInfo.metas.speakerName
                      }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </div>
            </template>
          </q-btn-group>
        </q-item>
        <slot name="optionalItem" />
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts">
import { computed, defineComponent, ref, PropType } from "vue";
import { CharacterInfo } from "@/type/preload";
import { useStore } from "@/store";
import { debounce } from "quasar";

export default defineComponent({
  name: "CharacterMenuButton",
  props: {
    selectedStyleIds: {
      type: Object as PropType<number[]>,
      required: true,
    },
    styleSelectAction: {
      type: Function as PropType<
        (styleIds: number[], morphRate?: number) => void
      >,
      required: true,
    },
    disable: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const store = useStore();
    const characterInfos = computed(() => store.state.characterInfos);
    const selectedCharacterInfo = computed(() => {
      if (store.state.characterInfos !== undefined) {
        return props.selectedStyleIds.map((styleId) => {
          return store.state.characterInfos?.find((info) =>
            info.metas.styles.find((style) => style.styleId === styleId)
          ) as CharacterInfo;
        });
      }
      return undefined;
    });
    const selectedStyle = computed(() => {
      return selectedCharacterInfo.value?.map((info, i) => {
        return info.metas.styles.find(
          (style) => style.styleId === props.selectedStyleIds?.[i]
        );
      });
    });

    const subMenuOpenFlags = ref(
      [...Array(characterInfos.value?.length)].map(() => false)
    );

    const reassignSubMenuOpen = debounce((idx: number) => {
      if (subMenuOpenFlags.value[idx]) return;
      const arr = [...Array(characterInfos.value?.length)].map(() => false);
      arr[idx] = true;
      subMenuOpenFlags.value = arr;
    }, 100);

    const getDefaultStyle = (speakerUuid: string) => {
      const characterInfo = characterInfos.value?.find(
        (info) => info.metas.speakerUuid === speakerUuid
      );
      const defaultStyleId = store.state.defaultStyleIds.find(
        (x) => x.speakerUuid === speakerUuid
      )?.defaultStyleId;

      return characterInfo?.metas.styles.find(
        (style) => style.styleId === defaultStyleId
      );
    };

    return {
      characterInfos,
      selectedCharacterInfo,
      selectedStyle,
      subMenuOpenFlags,
      reassignSubMenuOpen,
      getDefaultStyle,
    };
  },
});
</script>

<style scoped lang="scss">
@use '@/styles/colors' as colors;

.character-button {
  border: solid 1px;
  border-color: colors.$primary-light;
  font-size: 0;
  height: fit-content;
  img {
    width: 2rem;
    height: 2rem;
    object-fit: scale-down;
  }
}

.character-menu {
  .q-item {
    color: colors.$display;
  }
  .q-btn-group {
    > .q-btn:first-child > :deep(.q-btn__content) {
      justify-content: flex-start;
    }
    > div:last-child:hover {
      background-color: rgba(colors.$primary-rgb, 0.1);
    }
  }

  .selected-character-item,
  .opened-character-item {
    background-color: rgba(colors.$primary-rgb, 0.2);
  }
}
</style>
