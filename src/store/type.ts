import { StoreOptions, ActionTree, MutationTree } from "vuex";
import { Operation } from "rfc6902";
import { AudioQuery } from "@/openapi";
import {
  createCommandMutationTree,
  PayloadRecipeTree,
  PayloadMutationTree,
  CommandGetters,
  CommandMutations,
  CommandActions,
} from "./command";
import { CharacterInfo, SavingSetting } from "@/type/preload";
import {
  AudioActions,
  AudioCommandActions,
  AudioCommandMutations,
  AudioGetters,
  AudioMutations,
} from "@/store/audio";
import {
  SettingActions,
  SettingGetters,
  SettingMutations,
} from "@/store/setting";
import { UiActions, UiGetters, UiMutations } from "@/store/ui";
import {
  ProjectActions,
  ProjectGetters,
  ProjectMutations,
} from "@/store/project";
import { IndexActions, IndexGetters, IndexMutations } from "@/store/index";

export type State = {
  engineState: EngineState;
  characterInfos?: CharacterInfo[];
  audioItems: Record<string, AudioItem>;
  audioKeys: string[];
  audioStates: Record<string, AudioState>;
  _activeAudioKey?: string;
  uiLockCount: number;
  audioDetailPaneOffset?: number;
  audioInfoPaneOffset?: number;
  nowPlayingContinuously: boolean;
  undoCommands: Command[];
  redoCommands: Command[];
  useGpu: boolean;
  isHelpDialogOpen: boolean;
  isSettingDialogOpen: boolean;
  isMaximized: boolean;
  projectFilePath?: string;
  savingSetting: SavingSetting;
  isPinned: boolean;
};

export type AudioItem = {
  text: string;
  characterIndex?: number;
  query?: AudioQuery;
};

export type AudioState = {
  nowPlaying: boolean;
  nowGenerating: boolean;
};

export type Command = {
  undoOperations: Operation[];
  redoOperations: Operation[];
};

export type EngineState = "STARTING" | "FAILED_STARTING" | "ERROR" | "READY";
export type SaveResult =
  | "SUCCESS"
  | "WRITE_ERROR"
  | "ENGINE_ERROR"
  | "CANCELED";
export type SaveResultObject = { result: SaveResult; path: string | undefined };

export type AllGetters = AudioGetters &
  AudioCommandActions &
  CommandGetters &
  IndexGetters &
  ProjectGetters &
  SettingGetters &
  UiGetters;

export type AllMutations = AudioMutations &
  AudioCommandMutations &
  CommandMutations &
  IndexMutations &
  ProjectMutations &
  SettingMutations &
  UiMutations;

export type AllActions = AudioActions &
  AudioCommandActions &
  CommandActions &
  IndexActions &
  ProjectActions &
  SettingActions &
  UiActions;

export const typeAsStoreOptions = <Arg extends StoreOptions<State>>(
  arg: Arg
): Arg => arg;
export const typeAsMutationTree = <Arg extends MutationTree<State>>(
  arg: Arg
): Arg => arg;
export const typeAsActionTree = <Arg extends ActionTree<State, State>>(
  arg: Arg
): Arg => arg;

export const commandMutationsCreator = <Arg extends PayloadRecipeTree<State>>(
  arg: Arg
): PayloadMutationTree<State> => createCommandMutationTree<State, Arg>(arg);
