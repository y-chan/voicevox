<template>
  <q-dialog
    v-model="dictionaryManageDialogOpenedComputed"
    maximized
    transition-show="jump-up"
    transition-hide="jump-down"
    class="setting-dialog transparent-backdrop"
  >
    <q-layout container view="hHh Lpr fFf" class="bg-background">
      <q-page-container>
        <q-header class="q-pa-sm">
          <q-toolbar>
            <q-toolbar-title class="text-display"
              >読み方＆アクセント辞書</q-toolbar-title
            >
            <q-space />
            <!-- close button -->
            <q-btn
              round
              flat
              icon="close"
              color="display"
              :disable="wordEditing"
              @click="discardOrNotDialog(closeDialog)"
            />
          </q-toolbar>
        </q-header>
        <q-page class="row">
          <div v-if="loadingDictState" class="loading-dict">
            <div>
              <q-spinner color="primary" size="2.5rem" />
              <div class="q-mt-xs">
                <template v-if="loadingDictState === 'loading'"
                  >読み込み中・・・</template
                >
                <template v-if="loadingDictState === 'synchronizing'"
                  >同期中・・・</template
                >
              </div>
            </div>
          </div>
          <div class="col-4 word-list-col">
            <div
              v-if="wordEditing"
              class="word-list-disable-overlay"
              @click="discardOrNotDialog(cancel)"
            />
            <div class="word-list-header text-no-wrap">
              <div class="row word-list-title text-h5">単語一覧</div>
              <div class="row no-wrap">
                <q-btn
                  outline
                  text-color="warning"
                  class="text-no-wrap text-bold col-sm q-ma-sm"
                  :disable="uiLocked || !isDeletable"
                  @click="deleteWord"
                  >削除</q-btn
                >
                <q-btn
                  outline
                  text-color="display"
                  class="text-no-wrap text-bold col-sm q-ma-sm"
                  :disable="uiLocked || !selectedId"
                  @click="editWord"
                  >編集</q-btn
                >
                <q-btn
                  outline
                  text-color="display"
                  class="text-no-wrap text-bold col-sm q-ma-sm"
                  :disable="uiLocked"
                  @click="newWord"
                  >追加</q-btn
                >
              </div>
            </div>
            <q-list class="word-list">
              <q-item
                v-for="(value, key) in userDict"
                :key="key"
                v-ripple
                tag="label"
                clickable
                :active="selectedId === key"
                active-class="active-word"
                @click="selectWord(key)"
                @dblclick="editWord"
              >
                <q-item-section>
                  <q-item-label class="text-display">{{
                    value.surface
                  }}</q-item-label>
                  <q-item-label caption>{{ value.yomi }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- 右側のpane -->
          <div
            v-if="wordEditing"
            class="col-8 no-wrap text-no-wrap word-editor"
          >
            <div class="row q-pl-md q-mt-md">
              <div class="text-h6">単語</div>
              <q-input
                ref="surfaceInput"
                v-model="surface"
                class="word-input"
                dense
                :disable="uiLocked"
                @blur="setSurface(surface)"
                @keydown.enter="yomiFocus"
              />
            </div>
            <div class="row q-pl-md q-pt-sm">
              <div class="text-h6">読み</div>
              <q-input
                ref="yomiInput"
                v-model="yomi"
                class="word-input q-pb-none"
                dense
                :error="!isOnlyHiraOrKana"
                :disable="uiLocked"
                @blur="setYomi(yomi)"
                @keydown.enter="setYomiWhenEnter"
              >
                <template #error>
                  読みに使える文字はひらがなとカタカナのみです。
                </template>
              </q-input>
            </div>
            <div class="row q-pl-md q-mt-lg text-h6">アクセント調整</div>
            <div class="row q-pl-md desc-row">
              語尾のアクセントを考慮するため、「が」が自動で挿入されます。
            </div>
            <div class="row q-px-md" style="height: 130px">
              <div class="play-button">
                <q-btn
                  v-if="!nowPlaying && !nowGenerating"
                  fab
                  color="primary"
                  text-color="display-on-primary"
                  icon="play_arrow"
                  @click="play"
                />
                <q-btn
                  v-else
                  fab
                  color="primary"
                  text-color="display-on-primary"
                  icon="stop"
                  :disable="nowGenerating"
                  @click="stop"
                />
              </div>
              <div
                ref="accentPhraseTable"
                class="accent-phrase-table overflow-hidden-y"
              >
                <div v-if="accentPhrase" class="mora-table">
                  <audio-accent
                    :accent-phrase="accentPhrase"
                    :accent-phrase-index="0"
                    :ui-locked="uiLocked"
                    :on-change-accent="changeAccent"
                  />
                  <template
                    v-for="(mora, moraIndex) in accentPhrase.moras"
                    :key="moraIndex"
                  >
                    <div
                      class="text-cell"
                      :style="{
                        gridColumn: `${moraIndex * 2 + 1} / span 1`,
                      }"
                    >
                      {{ mora.text }}
                    </div>
                    <div
                      v-if="moraIndex < accentPhrase.moras.length - 1"
                      class="splitter-cell"
                      :style="{
                        gridColumn: `${moraIndex * 2 + 2} / span 1`,
                      }"
                    />
                  </template>
                </div>
              </div>
            </div>
            <div class="row q-pl-md q-pt-lg text-h6">単語優先度</div>
            <div class="row q-pl-md desc-row">
              単語を登録しても反映されない場合は優先度を高くしてください。
            </div>
            <div
              class="row q-px-md"
              :style="{
                justifyContent: 'center',
              }"
            >
              <q-slider
                v-model="wordPriority"
                snap
                dense
                color="primary"
                markers
                :min="0"
                :max="10"
                :step="1"
                :marker-labels="wordPriorityLabels"
                :style="{
                  width: '80%',
                }"
              />
            </div>
            <div class="row q-px-md save-delete-reset-buttons">
              <q-space />
              <q-btn
                v-show="!!selectedId"
                outline
                text-color="display"
                class="text-no-wrap text-bold q-mr-sm"
                :disable="uiLocked || !isWordChanged"
                @click="resetWord"
                >リセット</q-btn
              >
              <q-btn
                outline
                text-color="display"
                class="text-no-wrap text-bold q-mr-sm"
                :disable="uiLocked"
                @click="discardOrNotDialog(cancel)"
                >キャンセル</q-btn
              >
              <q-btn
                outline
                text-color="display"
                class="text-no-wrap text-bold q-mr-sm"
                :disable="uiLocked || !isWordChanged"
                @click="saveWord"
                >保存</q-btn
              >
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { QInput } from "quasar";
import AudioAccent from "@/components/Talk/AudioAccent.vue";
import { useStore } from "@/store";
import type { FetchAudioResult } from "@/store/type";
import { AccentPhrase, UserDictWord } from "@/openapi";
import {
  convertHiraToKana,
  convertLongVowel,
  createKanaRegex,
} from "@/store/utility";

const defaultDictPriority = 5;

const props =
  defineProps<{
    modelValue: boolean;
  }>();
const emit =
  defineEmits<{
    (e: "update:modelValue", v: boolean): void;
  }>();

const store = useStore();

const dictionaryManageDialogOpenedComputed = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
const uiLocked = ref(false); // ダイアログ内でstore.getters.UI_LOCKEDは常にtrueなので独自に管理
const nowGenerating = ref(false);
const nowPlaying = ref(false);

const loadingDictState = ref<null | "loading" | "synchronizing">("loading");
const userDict = ref<Record<string, UserDictWord>>({});

const createUILockAction = function <T>(action: Promise<T>) {
  uiLocked.value = true;
  return action.finally(() => {
    uiLocked.value = false;
  });
};

const loadingDictProcess = async () => {
  if (store.state.engineIds.length === 0)
    throw new Error(`assert engineId.length > 0`);

  loadingDictState.value = "loading";
  try {
    userDict.value = await createUILockAction(
      store.dispatch("LOAD_ALL_USER_DICT")
    );
  } catch {
    const result = await store.dispatch("SHOW_ALERT_DIALOG", {
      title: "辞書の取得に失敗しました",
      message: "エンジンの再起動をお試しください。",
    });
    if (result === "OK") {
      dictionaryManageDialogOpenedComputed.value = false;
    }
  }
  loadingDictState.value = "synchronizing";
  try {
    await createUILockAction(store.dispatch("SYNC_ALL_USER_DICT"));
  } catch {
    await store.dispatch("SHOW_ALERT_DIALOG", {
      title: "辞書の同期に失敗しました",
      message: "エンジンの再起動をお試しください。",
    });
  }
  loadingDictState.value = null;
};
watch(dictionaryManageDialogOpenedComputed, async (newValue) => {
  if (newValue) {
    await loadingDictProcess();
    toInitialState();
  }
});

const wordEditing = ref(false);

const surfaceInput = ref<QInput>();
const yomiInput = ref<QInput>();
const yomiFocus = (event?: KeyboardEvent) => {
  if (event && event.isComposing) return;
  yomiInput.value?.focus();
};
const setYomiWhenEnter = (event?: KeyboardEvent) => {
  if (event && event.isComposing) return;
  setYomi(yomi.value);
};

const selectedId = ref("");
const surface = ref("");
const yomi = ref("");

const voiceComputed = computed(() => {
  const userOrderedCharacterInfos =
    store.getters.USER_ORDERED_CHARACTER_INFOS("talk");
  if (userOrderedCharacterInfos == undefined)
    throw new Error("assert USER_ORDERED_CHARACTER_INFOS");
  if (store.state.engineIds.length === 0)
    throw new Error("assert engineId.length > 0");
  const characterInfo = userOrderedCharacterInfos[0].metas;
  const speakerId = characterInfo.speakerUuid;
  const { engineId, styleId } = characterInfo.styles[0];
  return { engineId, speakerId, styleId };
});

const kanaRegex = createKanaRegex();
const isOnlyHiraOrKana = ref(true);
const accentPhrase = ref<AccentPhrase | undefined>();
const accentPhraseTable = ref<HTMLElement>();

const convertHankakuToZenkaku = (text: string) => {
  // " "などの目に見えない文字をまとめて全角スペース(0x3000)に置き換える
  text = text.replace(/\p{Z}/gu, () => String.fromCharCode(0x3000));

  // "!"から"~"までの範囲の文字(数字やアルファベット)を全角に置き換える
  return text.replace(/[\u0021-\u007e]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
  });
};
const setSurface = (text: string) => {
  // surfaceを全角化する
  // 入力は半角でも問題ないが、登録時に全角に変換され、isWordChangedの判断がおかしくなることがあるので、
  // 入力後に自動で変換するようにする
  surface.value = convertHankakuToZenkaku(text);
};
const setYomi = async (text: string, changeWord?: boolean) => {
  const { engineId, styleId } = voiceComputed.value;

  // テキスト長が0の時にエラー表示にならないように、テキスト長を考慮する
  isOnlyHiraOrKana.value = !text.length || kanaRegex.test(text);
  // 読みが変更されていない場合は、アクセントフレーズに変更を加えない
  // ただし、読みが同じで違う単語が存在する場合が考えられるので、changeWordフラグを考慮する
  // 「ガ」が自動挿入されるので、それを考慮してsliceしている
  if (
    text ==
      accentPhrase.value?.moras
        .map((v) => v.text)
        .join("")
        .slice(0, -1) &&
    !changeWord
  ) {
    return;
  }
  if (isOnlyHiraOrKana.value && text.length) {
    text = convertHiraToKana(text);
    text = convertLongVowel(text);
    accentPhrase.value = (
      await createUILockAction(
        store.dispatch("FETCH_ACCENT_PHRASES", {
          text: text + "ガ'",
          engineId,
          styleId,
          isKana: true,
        })
      )
    )[0];
    if (selectedId.value && userDict.value[selectedId.value].yomi === text) {
      accentPhrase.value.accent = computeDisplayAccent();
    }
  } else {
    accentPhrase.value = undefined;
  }
  yomi.value = text;
};

const changeAccent = async (_: number, accent: number) => {
  const { engineId, styleId } = voiceComputed.value;

  if (accentPhrase.value) {
    accentPhrase.value.accent = accent;
    accentPhrase.value = (
      await createUILockAction(
        store.dispatch("FETCH_MORA_DATA", {
          accentPhrases: [accentPhrase.value],
          engineId,
          styleId,
        })
      )
    )[0];
  }
};

const play = async () => {
  if (!accentPhrase.value) return;

  nowGenerating.value = true;
  const audioItem = await store.dispatch("GENERATE_AUDIO_ITEM", {
    text: yomi.value,
    voice: voiceComputed.value,
  });

  if (audioItem.query == undefined)
    throw new Error(`assert audioItem.query !== undefined`);

  audioItem.query.accentPhrases = [accentPhrase.value];

  let fetchAudioResult: FetchAudioResult;
  try {
    fetchAudioResult = await store.dispatch("FETCH_AUDIO_FROM_AUDIO_ITEM", {
      audioItem,
    });
  } catch (e) {
    window.electron.logError(e);
    nowGenerating.value = false;
    store.dispatch("SHOW_ALERT_DIALOG", {
      title: "生成に失敗しました",
      message: "エンジンの再起動をお試しください。",
    });
    return;
  }

  const { blob } = fetchAudioResult;
  nowGenerating.value = false;
  nowPlaying.value = true;
  await store.dispatch("PLAY_AUDIO_BLOB", { audioBlob: blob });
  nowPlaying.value = false;
};
const stop = () => {
  store.dispatch("STOP_AUDIO");
};

// accent phraseにあるaccentと実際に登録するアクセントには差が生まれる
// アクセントが自動追加される「ガ」に指定されている場合、
// 実際に登録するaccentの値は0となるので、そうなるように処理する
const computeRegisteredAccent = () => {
  if (!accentPhrase.value) throw new Error();
  let accent = accentPhrase.value.accent;
  accent = accent === accentPhrase.value.moras.length ? 0 : accent;
  return accent;
};
// computeの逆
// 辞書から得たaccentが0の場合に、自動で追加される「ガ」の位置にアクセントを表示させるように処理する
const computeDisplayAccent = () => {
  if (!accentPhrase.value || !selectedId.value) throw new Error();
  let accent = userDict.value[selectedId.value].accentType;
  accent = accent === 0 ? accentPhrase.value.moras.length : accent;
  return accent;
};

const wordPriority = ref(defaultDictPriority);
const wordPriorityLabels = {
  0: "最低",
  3: "低",
  5: "標準",
  7: "高",
  10: "最高",
};

// 操作（ステートの移動）
const isWordChanged = computed(() => {
  if (selectedId.value === "") {
    return surface.value && yomi.value && accentPhrase.value;
  }
  // 一旦代入することで、userDictそのものが更新された時もcomputedするようにする
  const dict = userDict.value;
  const dictData = dict[selectedId.value];
  return (
    dictData &&
    (dictData.surface !== surface.value ||
      dictData.yomi !== yomi.value ||
      dictData.accentType !== computeRegisteredAccent() ||
      dictData.priority !== wordPriority.value)
  );
});
const saveWord = async () => {
  if (!accentPhrase.value) throw new Error(`accentPhrase === undefined`);
  const accent = computeRegisteredAccent();
  if (selectedId.value) {
    try {
      await store.dispatch("REWRITE_WORD", {
        wordUuid: selectedId.value,
        surface: surface.value,
        pronunciation: yomi.value,
        accentType: accent,
        priority: wordPriority.value,
      });
    } catch {
      store.dispatch("SHOW_ALERT_DIALOG", {
        title: "単語の更新に失敗しました",
        message: "エンジンの再起動をお試しください。",
      });
      return;
    }
  } else {
    try {
      await createUILockAction(
        store.dispatch("ADD_WORD", {
          surface: surface.value,
          pronunciation: yomi.value,
          accentType: accent,
          priority: wordPriority.value,
        })
      );
    } catch {
      store.dispatch("SHOW_ALERT_DIALOG", {
        title: "単語の登録に失敗しました",
        message: "エンジンの再起動をお試しください。",
      });
      return;
    }
  }
  await loadingDictProcess();
  toInitialState();
};
const isDeletable = computed(() => !!selectedId.value);
const deleteWord = async () => {
  const result = await store.dispatch("SHOW_WARNING_DIALOG", {
    title: "登録された単語を削除しますか？",
    message: "削除された単語は復旧できません。",
    actionName: "削除",
  });
  if (result === "OK") {
    try {
      await createUILockAction(
        store.dispatch("DELETE_WORD", {
          wordUuid: selectedId.value,
        })
      );
    } catch {
      store.dispatch("SHOW_ALERT_DIALOG", {
        title: "単語の削除に失敗しました",
        message: "エンジンの再起動をお試しください。",
      });
      return;
    }
    await loadingDictProcess();
    toInitialState();
  }
};
const resetWord = async () => {
  const result = await store.dispatch("SHOW_WARNING_DIALOG", {
    title: "単語の変更をリセットしますか？",
    message: "単語の変更は破棄されてリセットされます。",
    actionName: "リセット",
  });
  if (result === "OK") {
    toWordEditingState();
  }
};
const discardOrNotDialog = async (okCallback: () => void) => {
  if (isWordChanged.value) {
    const result = await store.dispatch("SHOW_WARNING_DIALOG", {
      title: "単語の追加・変更を破棄しますか？",
      message:
        "このまま続行すると、単語の追加・変更は破棄されてリセットされます。",
      actionName: "続行",
    });
    if (result === "OK") {
      okCallback();
    }
  } else {
    okCallback();
  }
};
const newWord = () => {
  selectedId.value = "";
  surface.value = "";
  setYomi("");
  wordPriority.value = defaultDictPriority;
  editWord();
};
const editWord = () => {
  toWordEditingState();
};
const selectWord = (id: string) => {
  selectedId.value = id;
  surface.value = userDict.value[id].surface;
  setYomi(userDict.value[id].yomi, true);
  wordPriority.value = userDict.value[id].priority;
  toWordSelectedState();
};
const cancel = () => {
  toInitialState();
};
const closeDialog = () => {
  toDialogClosedState();
};

// ステートの移動
// 初期状態
const toInitialState = () => {
  wordEditing.value = false;
  selectedId.value = "";
  surface.value = "";
  setYomi("");
  wordPriority.value = defaultDictPriority;
};
// 単語が選択されているだけの状態
const toWordSelectedState = () => {
  wordEditing.value = false;
};
// 単語が編集されている状態
const toWordEditingState = () => {
  wordEditing.value = true;
  surfaceInput.value?.focus();
};
// ダイアログが閉じている状態
const toDialogClosedState = () => {
  dictionaryManageDialogOpenedComputed.value = false;
};
</script>

<style lang="scss" scoped>
@use '@/styles/colors' as colors;
@use '@/styles/variables' as vars;

.word-list-col {
  border-right: solid 1px colors.$surface;
  position: relative; // オーバーレイのため
  overflow-x: hidden;
}

.word-list-header {
  margin: 1rem;

  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  .word-list-title {
    flex-grow: 1;
  }
}

.word-list {
  // menubar-height + header-height + window-border-width +
  // 82(title & buttons) + 30(margin 15x2)
  height: calc(
    100vh - #{vars.$menubar-height + vars.$header-height +
      vars.$window-border-width + 82px + 30px}
  );
  width: 100%;
  overflow-y: auto;
}

.active-word {
  background: rgba(colors.$primary-rgb, 0.4);
}

.loading-dict {
  background-color: rgba(colors.$display-rgb, 0.15);
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  text-align: center;
  align-items: center;
  justify-content: center;

  > div {
    color: colors.$display;
    background: colors.$background;
    border-radius: 6px;
    padding: 14px;
  }
}

.word-list-disable-overlay {
  background-color: rgba($color: #000000, $alpha: 0.4);
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 10;
}

.word-editor {
  display: flex;
  flex-flow: column;
  height: calc(
    100vh - #{vars.$menubar-height + vars.$header-height +
      vars.$window-border-width}
  ) !important;
  overflow: auto;
}

.word-input {
  padding-left: 10px;
  width: calc(66vw - 80px);

  :deep(.q-field__control) {
    height: 2rem;
  }

  :deep(.q-placeholder) {
    padding: 0;
    font-size: 20px;
  }

  :deep(.q-field__after) {
    height: 2rem;
  }
}

.desc-row {
  color: rgba(colors.$display-rgb, 0.5);
  font-size: 12px;
}

.play-button {
  margin: auto 0;
  padding-right: 16px;
}

.accent-phrase-table {
  flex-grow: 1;
  align-self: stretch;

  display: flex;
  height: 130px;
  overflow-x: scroll;
  width: calc(66vw - 140px);

  .mora-table {
    display: inline-grid;
    align-self: stretch;
    grid-template-rows: 1fr 60px 30px;

    .text-cell {
      padding: 0;
      min-width: 20px;
      max-width: 20px;
      grid-row-start: 3;
      text-align: center;
      white-space: nowrap;
      color: colors.$display;
      position: relative;
    }

    .splitter-cell {
      min-width: 20px;
      max-width: 20px;
      grid-row: 3 / span 1;
      z-index: vars.$detail-view-splitter-cell-z-index;
    }
  }
}

.save-delete-reset-buttons {
  padding: 20px;

  display: flex;
  flex: 1;
  align-items: flex-end;
}
</style>
