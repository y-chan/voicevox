<template>
  <q-header class="q-py-sm">
    <q-toolbar>
      <template v-for="button in headerButtons" :key="button.text">
        <q-space v-if="button.text === null" />
        <q-btn
          v-else
          unelevated
          color="toolbar-button"
          text-color="toolbar-button-display"
          class="text-no-wrap text-bold q-mr-sm"
          :disable="button.disable.value"
          @click="button.click"
          >{{ button.text }}</q-btn
        >
      </template>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { computed, ComputedRef } from "vue";
import {
  generateAndConnectAndSaveAudioWithDialog,
  multiGenerateAndSaveAudioWithDialog,
  generateAndSaveOneAudioWithDialog,
} from "@/components/Dialog/Dialog";
import { useStore } from "@/store";
import { setHotkeyFunctions } from "@/store/setting";
import {
  HotkeyActionType,
  HotkeyReturnType,
  ToolbarButtonTagType,
} from "@/type/preload";
import { getToolbarButtonName } from "@/store/utility";
import { handlePossiblyNotMorphableError } from "@/store/audioGenerate";

type ButtonContent = {
  text: string;
  click(): void;
  disable: ComputedRef<boolean>;
};

type SpacerContent = {
  text: null;
};

const store = useStore();

const uiLocked = computed(() => store.getters.UI_LOCKED);
const canUndo = computed(() => store.getters.CAN_UNDO);
const canRedo = computed(() => store.getters.CAN_REDO);
const activeAudioKey = computed(() => store.getters.ACTIVE_AUDIO_KEY);
const nowPlayingContinuously = computed(
  () => store.state.nowPlayingContinuously
);

const undoRedoHotkeyMap = new Map<HotkeyActionType, () => HotkeyReturnType>([
  // undo
  [
    "元に戻す",
    () => {
      if (!uiLocked.value && canUndo.value) {
        undo();
      }
      return false;
    },
  ],
  // redo
  [
    "やり直す",
    () => {
      if (!uiLocked.value && canRedo.value) {
        redo();
      }
      return false;
    },
  ],
]);
setHotkeyFunctions(undoRedoHotkeyMap);

const hotkeyMap = new Map<HotkeyActionType, () => HotkeyReturnType>([
  // play/stop continuously
  [
    "連続再生/停止",
    () => {
      if (!uiLocked.value) {
        if (nowPlayingContinuously.value) {
          stop();
        } else {
          playContinuously();
        }
      }
    },
  ],
]);

setHotkeyFunctions(hotkeyMap);

const undo = () => {
  store.dispatch("UNDO");
};
const redo = () => {
  store.dispatch("REDO");
};
const playContinuously = async () => {
  try {
    await store.dispatch("PLAY_CONTINUOUSLY_AUDIO");
  } catch (e) {
    const msg = handlePossiblyNotMorphableError(e);
    store.dispatch("SHOW_ALERT_DIALOG", {
      title: "再生に失敗しました",
      message: msg ?? "エンジンの再起動をお試しください。",
    });
  }
};
const stop = () => {
  store.dispatch("STOP_AUDIO");
};
const generateAndSaveSelectedAudio = async () => {
  if (activeAudioKey.value == undefined)
    throw new Error("activeAudioKey is undefined");

  const selectedAudioKeys = store.getters.SELECTED_AUDIO_KEYS;
  if (
    store.state.experimentalSetting.enableMultiSelect &&
    selectedAudioKeys.length > 1
  ) {
    await multiGenerateAndSaveAudioWithDialog({
      audioKeys: selectedAudioKeys,
      dispatch: store.dispatch,
      disableNotifyOnGenerate: store.state.confirmedTips.notifyOnGenerate,
    });
  } else {
    await generateAndSaveOneAudioWithDialog({
      audioKey: activeAudioKey.value,
      disableNotifyOnGenerate: store.state.confirmedTips.notifyOnGenerate,
      dispatch: store.dispatch,
    });
  }
};
const generateAndSaveAllAudio = async () => {
  await multiGenerateAndSaveAudioWithDialog({
    audioKeys: store.state.audioKeys,
    dispatch: store.dispatch,
    disableNotifyOnGenerate: store.state.confirmedTips.notifyOnGenerate,
  });
};
const generateAndConnectAndSaveAudio = async () => {
  await generateAndConnectAndSaveAudioWithDialog({
    dispatch: store.dispatch,
    disableNotifyOnGenerate: store.state.confirmedTips.notifyOnGenerate,
  });
};
const saveProject = async () => {
  await store.dispatch("SAVE_PROJECT_FILE", { overwrite: true });
};
const importTextFile = () => {
  store.dispatch("COMMAND_IMPORT_FROM_FILE", {});
};

const usableButtons: Record<
  ToolbarButtonTagType,
  Omit<ButtonContent, "text"> | null
> = {
  PLAY_CONTINUOUSLY: {
    click: playContinuously,
    disable: uiLocked,
  },
  STOP: {
    click: stop,
    disable: computed(() => !store.getters.NOW_PLAYING),
  },
  EXPORT_AUDIO_SELECTED: {
    click: generateAndSaveSelectedAudio,
    disable: computed(() => !activeAudioKey.value || uiLocked.value),
  },
  EXPORT_AUDIO_ALL: {
    click: generateAndSaveAllAudio,
    disable: uiLocked,
  },
  EXPORT_AUDIO_CONNECT_ALL: {
    click: generateAndConnectAndSaveAudio,
    disable: uiLocked,
  },
  SAVE_PROJECT: {
    click: saveProject,
    disable: uiLocked,
  },
  UNDO: {
    click: undo,
    disable: computed(() => !canUndo.value || uiLocked.value),
  },
  REDO: {
    click: redo,
    disable: computed(() => !canRedo.value || uiLocked.value),
  },
  IMPORT_TEXT: {
    click: importTextFile,
    disable: uiLocked,
  },
  EMPTY: null,
};

const headerButtons = computed(() =>
  store.state.toolbarSetting.map<ButtonContent | SpacerContent>((tag) => {
    const buttonContent = usableButtons[tag];
    if (buttonContent) {
      return {
        ...buttonContent,
        text: getToolbarButtonName(tag),
      };
    } else {
      return {
        text: null,
      };
    }
  })
);
</script>
