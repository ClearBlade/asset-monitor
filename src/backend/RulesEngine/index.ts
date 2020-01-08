import '../../static/promise-polyfill';
import 'core-js/features/map';
import { Engine, Event, RuleProperties, TopLevelCondition, Almanac, AllConditions, AnyConditions, NestedCondition, ConditionProperties, RuleResult, Rule } from 'json-rules-engine';
import { StateParams } from './types';
import { parseAndConvertConditions } from './convert-rule';
import { doesTimeframeMatchRule } from './timeframe';
import { processEvent, Entities } from './events';
// import { ProcessDurationIfExists } from './duration';
import { Rules } from '../collection-schema/Rules';
import { CbCollectionLib } from '../collection-lib';
import { Areas } from '../collection-schema/Areas';
import { Asset } from '../collection-schema/Assets';
import { thisExpression } from '@babel/types';

export class RulesEngine {
    engine: Engine;
    rules: {[id: string]: Rule}; // track rules here since there is not getRule method needed for edit/delete
    constructor() {
        Number.parseFloat = parseFloat;
        const options = {
            allowUndefinedFacts: true,
        };
        this.engine = new Engine([], options)
            .addFact('state', function(params, almanac) {
                handleStateCondition(params as StateParams, almanac);
            })
            .on('success', function(event, almanac, ruleResult) {
                handleRuleSuccess(event, almanac, ruleResult)
            })
        this.rules = {};
    }

    addRule(ruleData: Rules): void {
        this.convertRule(ruleData).then((rule) => {
            this.rules[rule.name] = rule;
            this.engine.addRule(rule);
        })
    }

    editRule(id: string, ruleData: Rules): void {
        this.deleteRule(id);
        this.addRule(ruleData);
    }

    deleteRule(id: string): void {
        delete this.rules[id];
        this.engine.removeRule(this.rules[id])
    }

    async convertRule(ruleData: Rules): Promise<Rule> {
        const { label, event_type_id, priority, severity, id, timeframe, action_ids, conditions } = ruleData;
        
        const parsedConditions = JSON.parse(conditions || '{}');
        const parsedTimeframe = !!timeframe ? JSON.parse(timeframe) : timeframe;
        const parsedActionIDs = !!action_ids ? JSON.parse(action_ids) : action_ids;

        const promise = parseAndConvertConditions(id, parsedConditions).then(
            (convertedConditions: TopLevelCondition) => {
                return new Rule({
                    name: id,
                    conditions: convertedConditions,
                    event: {
                        type: label,
                        params: {
                            eventTypeID: event_type_id,
                            actionIDs: parsedActionIDs,
                            priority,
                            severity,
                            timeframe: parsedTimeframe,
                            ruleID: id,
                            ruleName: label,
                        },
                    },
                });
            },
        );
        Promise.runQueue();
        return promise;
    }

    async run(facts: Record<string, string | number | boolean>): Promise<string> {
        const promise = this.engine.run(facts).then(() => 'ENGINE SUCCESSFULLY COMPLETED').catch((e) => `ENGINE ERROR: ${JSON.stringify(e)}`)
        Promise.runQueue();
        return promise;
    }
}

function handleRuleSuccess(event: Event, almanac: Almanac, ruleResult: RuleResult) {
    // @ts-ignore json-rule-engine types does not include factMap
    const timestamp = almanac.factMap.get('incomingData').timestamp;
    const timeframe = (event.params as Record<string, any>).timeframe;
    if (doesTimeframeMatchRule(timestamp, timeframe)) {
        const triggers = getTriggerIds(ruleResult.conditions.hasOwnProperty('all') ? (ruleResult.conditions as AllConditions).all : (ruleResult.conditions as AnyConditions).any, []);
        const entities: Entities = triggers.reduce((acc: object, trigger: string) => {
            // @ts-ignore json-rule-engine types does not include factMap
            acc[trigger] = almanac.factMap.get(trigger);
            return acc;
        }, {})
        processEvent(event, entities);
    }
}

function handleStateCondition(params: StateParams, almanac: Almanac) {
    const promise = almanac.factValue('incomingData').then((incomingData: any) => {
        const promise = almanac.factValue(params.id).then((customData) => customData).catch(() => {
            return new Promise((res) => { // custom data has not been fetched for asset
                const collection = CbCollectionLib(params.collection);
                const query = ClearBlade.Query({ collectionName: params.collection });
                if (!!params.type) {
                    query.equalTo('type', params.type);
                } else {
                    query.equalTo('id', params.id);
                }
                const promise = collection.cbFetchPromise({ query }).then((data: CbServer.CollectionFetchData<Asset | Areas>) => {
                    let initialData; // the fact who started all this mess
                    for (let i = 0; i < data.DATA.length; i++) {
                        const entityData = data.DATA[i];
                        let withParsedCustomData = { // parse custom_data
                            ...entityData,
                            custom_data: JSON.parse(entityData.custom_data as string || '{}')
                        }
                        if (entityData.id === incomingData.id) { // if this one is the same as asset that triggered engine
                            withParsedCustomData = {
                                ...withParsedCustomData,
                                ...incomingData,
                                custom_data: {
                                    ...withParsedCustomData.custom_data,
                                    ...incomingData.custom_data
                                }
                            }
                        }
                        if (params.id === entityData.id) { // if this one is the same as asset that triggered fact
                            initialData = {...withParsedCustomData};
                        }
                        almanac.addRuntimeFact(entityData.id as string, withParsedCustomData); // add fact for id
                    } 
                    res(initialData); // resolve the initial fact's value
                })
                Promise.runQueue();
                return promise;
            })
        })
        Promise.runQueue();
        return promise;
    })
    Promise.runQueue();
    return promise;
}

function getTriggerIds(conditions: NestedCondition[], ids: string[]) {
    for ( let i = 0; i < conditions.length; i++) {
        const firstKey = Object.keys(conditions[i])[0];
        if (firstKey === 'all' || firstKey === 'any') {
            getTriggerIds(conditions[i][firstKey as keyof TopLevelCondition], ids)
        // @ts-ignore json-rule-engine types does not include result
        } else if (!!conditions[i].result){
            ids.push(((conditions[i] as ConditionProperties).params as Record<string, any>).id)
        }
    }
    return ids;
}


