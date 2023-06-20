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
import {
    SpeakerStyle,
    SpeakerStyleFromJSON,
    SpeakerStyleFromJSONTyped,
    SpeakerStyleToJSON,
    SpeakerSupportedFeatures,
    SpeakerSupportedFeaturesFromJSON,
    SpeakerSupportedFeaturesFromJSONTyped,
    SpeakerSupportedFeaturesToJSON,
} from './';

/**
 * スピーカー情報
 * @export
 * @interface Speaker
 */
export interface Speaker {
    /**
     * 
     * @type {SpeakerSupportedFeatures}
     * @memberof Speaker
     */
    supportedFeatures?: SpeakerSupportedFeatures | null;
    /**
     * 
     * @type {string}
     * @memberof Speaker
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof Speaker
     */
    speakerUuid: string;
    /**
     * 
     * @type {Array<SpeakerStyle>}
     * @memberof Speaker
     */
    styles: Array<SpeakerStyle>;
    /**
     * 
     * @type {string}
     * @memberof Speaker
     */
    version?: string;
}

export function SpeakerFromJSON(json: any): Speaker {
    return SpeakerFromJSONTyped(json, false);
}

export function SpeakerFromJSONTyped(json: any, ignoreDiscriminator: boolean): Speaker {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'supportedFeatures': !exists(json, 'supported_features') ? undefined : SpeakerSupportedFeaturesFromJSON(json['supported_features']),
        'name': json['name'],
        'speakerUuid': json['speaker_uuid'],
        'styles': ((json['styles'] as Array<any>).map(SpeakerStyleFromJSON)),
        'version': !exists(json, 'version') ? undefined : json['version'],
    };
}

export function SpeakerToJSON(value?: Speaker | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'supported_features': SpeakerSupportedFeaturesToJSON(value.supportedFeatures),
        'name': value.name,
        'speaker_uuid': value.speakerUuid,
        'styles': ((value.styles as Array<any>).map(SpeakerStyleToJSON)),
        'version': value.version,
    };
}

