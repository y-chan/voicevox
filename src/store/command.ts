import { toRaw } from "vue";
import { enablePatches, enableMapSet, Immer } from "immer";
// immerの内部関数であるgetPlugin("Patches").applyPatches_はexportされていないので
// ビルド前のsrcからソースコードを読み込んで使う必要がある
import { enablePatches as enablePatchesImpl } from "immer/src/plugins/patches";
import { enableMapSet as enableMapSetImpl } from "immer/src/plugins/mapset";
import { getPlugin } from "immer/src/utils/plugins";

import { Command, CommandStoreState, CommandStoreTypes, State } from "./type";
import {
  createPartialStore,
  Mutation,
  MutationsBase,
  MutationTree,
} from "@/store/vuex";

// ビルド後のモジュールとビルド前のモジュールは別のスコープで変数を持っているので
// enable * も両方叩く必要がある。
enablePatches();
enableMapSet();
enablePatchesImpl();
enableMapSetImpl();
// immerのPatchをmutableに適応する内部関数
const applyPatchesImpl = getPlugin("Patches").applyPatches_;

const immer = new Immer();
immer.setAutoFreeze(false);

export type PayloadRecipe<S, P> = (draft: S, payload: P) => void;
export type PayloadRecipeTree<S, M> = {
  [K in keyof M]: PayloadRecipe<S, M[K]>;
};

/**
 * レシピをプロパティに持つオブジェクトから操作を記録するMutationをプロパティにもつオブジェクトを返す関数
 * @param payloadRecipeTree - レシピをプロパティに持つオブジェクト
 * @returns Mutationを持つオブジェクト(MutationTree)
 */
export const createCommandMutationTree = <S, M extends MutationsBase>(
  payloadRecipeTree: PayloadRecipeTree<S, M>,
  isSongCommand: boolean
): MutationTree<S, M> =>
  Object.fromEntries(
    Object.entries(payloadRecipeTree).map(([key, val]) => [
      key,
      createCommandMutation(val, isSongCommand),
    ])
  ) as MutationTree<S, M>;

/**
 * 与えられたレシピから操作を記録し実行後にStateに追加するMutationを返す。
 * @param payloadRecipe - 操作を記録するレシピ
 * @returns レシピと同じPayloadの型を持つMutation.
 */
export const createCommandMutation =
  <S extends State, M extends MutationsBase, K extends keyof M>(
    payloadRecipe: PayloadRecipe<S, M[K]>,
    isSongCommand: boolean
  ): Mutation<S, M, K> =>
  (state: S, payload: M[K]): void => {
    const command = recordPatches(payloadRecipe)(state, payload);
    applyPatchesImpl(state, command.redoPatches);
    if (isSongCommand) {
      state.undoSongCommands.push(command);
      state.redoSongCommands.splice(0);
    } else {
      state.undoCommands.push(command);
      state.redoCommands.splice(0);
    }
  };

/**
 * @param recipe - 操作を記録したいレシピ関数
 * @returns Function - レシピの操作を与えられたstateとpayloadを用いて記録したコマンドを返す関数。
 */
const recordPatches =
  <S, P>(recipe: PayloadRecipe<S, P>) =>
  (state: S, payload: P): Command => {
    const [, doPatches, undoPatches] = immer.produceWithPatches(
      toRaw(state) as S,
      (draft: S) => recipe(draft, payload)
    );
    return {
      unixMillisec: new Date().getTime(),
      redoPatches: doPatches,
      undoPatches: undoPatches,
    };
  };

export const commandStoreState: CommandStoreState = {
  undoCommands: [],
  redoCommands: [],
  undoSongCommands: [],
  redoSongCommands: [],
};

export const commandStore = createPartialStore<CommandStoreTypes>({
  CAN_UNDO: {
    getter(state) {
      return state.undoCommands.length > 0;
    },
  },

  CAN_REDO: {
    getter(state) {
      return state.redoCommands.length > 0;
    },
  },

  UNDO: {
    mutation(state) {
      const command = state.undoCommands.pop();
      if (command != null) {
        state.redoCommands.push(command);
        applyPatchesImpl(state, command.undoPatches);
      }
    },
    action({ commit }) {
      commit("UNDO");
    },
  },

  REDO: {
    mutation(state) {
      const command = state.redoCommands.pop();
      if (command != null) {
        state.undoCommands.push(command);
        applyPatchesImpl(state, command.redoPatches);
      }
    },
    action({ commit }) {
      commit("REDO");
    },
  },

  CAN_SONG_UNDO: {
    getter(state) {
      return state.undoSongCommands.length > 0;
    },
  },

  CAN_SONG_REDO: {
    getter(state) {
      return state.redoSongCommands.length > 0;
    },
  },

  SONG_UNDO: {
    mutation(state) {
      const command = state.undoSongCommands.pop();
      if (command != null) {
        state.redoSongCommands.push(command);
        applyPatchesImpl(state, command.undoPatches);
      }
    },
    action({ commit, dispatch }) {
      commit("SONG_UNDO");
      dispatch("RENDER");
    },
  },

  SONG_REDO: {
    mutation(state) {
      const command = state.redoSongCommands.pop();
      if (command != null) {
        state.undoSongCommands.push(command);
        applyPatchesImpl(state, command.redoPatches);
      }
    },
    action({ commit, dispatch }) {
      commit("SONG_REDO");
      dispatch("RENDER");
    },
  },

  LAST_COMMAND_UNIX_MILLISEC: {
    getter(state) {
      let lastCommandTime: number | null = null;
      let lastSongCommandTime: number | null = null;
      if (state.undoCommands.length !== 0) {
        lastCommandTime =
          state.undoCommands[state.undoCommands.length - 1].unixMillisec;
      }
      if (state.undoSongCommands.length !== 0) {
        lastSongCommandTime =
          state.undoSongCommands[state.undoSongCommands.length - 1]
            .unixMillisec;
      }
      if (lastCommandTime != null && lastSongCommandTime != null) {
        return Math.max(lastCommandTime, lastSongCommandTime);
      } else if (lastCommandTime != null) {
        return lastCommandTime;
      } else if (lastSongCommandTime != null) {
        return lastSongCommandTime;
      }
      return null;
    },
  },

  CLEAR_COMMANDS: {
    mutation(state) {
      state.redoCommands.splice(0);
      state.undoCommands.splice(0);
    },
  },
});
