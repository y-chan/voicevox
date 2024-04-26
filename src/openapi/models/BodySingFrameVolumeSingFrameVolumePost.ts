/* tslint:disable */
/* eslint-disable */
/**
 * VOICEVOX Engine
 * VOICEVOXの音声合成エンジンです。
 *
 * The version of the OpenAPI document: latest
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { FrameAudioQuery } from './FrameAudioQuery';
import {
    FrameAudioQueryFromJSON,
    FrameAudioQueryFromJSONTyped,
    FrameAudioQueryToJSON,
} from './FrameAudioQuery';
import type { Score } from './Score';
import {
    ScoreFromJSON,
    ScoreFromJSONTyped,
    ScoreToJSON,
} from './Score';

/**
 * 
 * @export
 * @interface BodySingFrameVolumeSingFrameVolumePost
 */
export interface BodySingFrameVolumeSingFrameVolumePost {
    /**
     * 
     * @type {Score}
     * @memberof BodySingFrameVolumeSingFrameVolumePost
     */
    score: Score;
    /**
     * 
     * @type {FrameAudioQuery}
     * @memberof BodySingFrameVolumeSingFrameVolumePost
     */
    frameAudioQuery: FrameAudioQuery;
}

/**
 * Check if a given object implements the BodySingFrameVolumeSingFrameVolumePost interface.
 */
export function instanceOfBodySingFrameVolumeSingFrameVolumePost(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "score" in value;
    isInstance = isInstance && "frameAudioQuery" in value;

    return isInstance;
}

export function BodySingFrameVolumeSingFrameVolumePostFromJSON(json: any): BodySingFrameVolumeSingFrameVolumePost {
    return BodySingFrameVolumeSingFrameVolumePostFromJSONTyped(json, false);
}

export function BodySingFrameVolumeSingFrameVolumePostFromJSONTyped(json: any, ignoreDiscriminator: boolean): BodySingFrameVolumeSingFrameVolumePost {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'score': ScoreFromJSON(json['score']),
        'frameAudioQuery': FrameAudioQueryFromJSON(json['frame_audio_query']),
    };
}

export function BodySingFrameVolumeSingFrameVolumePostToJSON(value?: BodySingFrameVolumeSingFrameVolumePost | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'score': ScoreToJSON(value.score),
        'frame_audio_query': FrameAudioQueryToJSON(value.frameAudioQuery),
    };
}

