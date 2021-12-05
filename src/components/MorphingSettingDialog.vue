<template>
  <q-dialog ref="dialogRef">
    <q-card style="min-width: 350px" class="q-px-sm">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">モーフィング設定</div>
      </q-card-section>
      <q-card-section class="q-pa-md q-pb-sm" horizontal>
        <character-menu-button
          :selected-style-ids="sourceSelectedStyleId"
          :style-select-action="changeSourceSelectedStyleId"
        />
        <q-slider
          v-model="resultMorphRate"
          :min="0.0"
          :max="1.0"
          :step="0.01"
          label-always
          class="q-mx-md"
        />
        <character-menu-button
          :selected-style-ids="targetSelectedStyleId"
          :style-select-action="changeTargetSelectedStyleId"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat @click="onDialogCancel" label="キャンセル" />
        <q-btn flat @click="dialogOk" label="OK" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import CharacterMenuButton from "@/components/CharacterMenuButton.vue";

export type DialogResult = {
  styleIds: number[];
  morphRate: number;
};

export default defineComponent({
  name: "MorphingSettingDialog",
  components: { CharacterMenuButton },
  emits: {
    ...useDialogPluginComponent.emits,
  },
  props: {
    styleIds: {
      type: Array as PropType<number[]>,
      required: true,
    },
    morphRate: {
      type: Number,
      required: false,
      default: 0.5,
    },
  },
  setup(props) {
    const { dialogRef, onDialogCancel, onDialogOK } =
      useDialogPluginComponent();

    const sourceSelectedStyleId = ref([props.styleIds[0]]);
    const targetSelectedStyleId = ref([
      props.styleIds.length == 2 ? props.styleIds[1] : 1,
    ]);
    const changeSourceSelectedStyleId = (styleIds: number[]) => {
      sourceSelectedStyleId.value = styleIds;
    };
    const changeTargetSelectedStyleId = (styleIds: number[]) => {
      targetSelectedStyleId.value = styleIds;
    };
    const resultMorphRate = ref(props.morphRate);
    console.log(props.styleIds, resultMorphRate);

    const dialogOk = () =>
      onDialogOK({
        styleIds: [
          sourceSelectedStyleId.value[0],
          targetSelectedStyleId.value[0],
        ],
        morphRate: resultMorphRate.value,
      } as DialogResult);

    return {
      dialogRef,
      dialogOk,
      onDialogCancel,
      sourceSelectedStyleId,
      targetSelectedStyleId,
      changeSourceSelectedStyleId,
      changeTargetSelectedStyleId,
      resultMorphRate,
    };
  },
});
</script>
