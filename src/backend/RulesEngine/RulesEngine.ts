import '../../static/promise-polyfill';
import 'core-js/features/map';
import { Engine, Event, TopLevelCondition, Almanac, RuleResult, Rule } from 'json-rules-engine';
import { StateParams, TimeFrame, AreaParams, EntityTypes, RuleParams } from './types';
import { parseAndConvertConditions } from './convert-rule';
import { doesTimeframeMatchRule } from './timeframe';
import { processEvent, processSuccessfulEvents } from './events';
// import { ProcessDurationIfExists } from './duration';
import { Rules } from '../collection-schema/Rules';
import { Entities } from './async';
import { WithParsedCustomData, FactData, collectAndBuildFact, processRule } from './utils';
import { CollectionName } from '../global-config';
import { processDuration } from './duration';

interface IncomingFact {
    incomingData: WithParsedCustomData;
}

export class RulesEngine {
    engine: Engine;
    rules: { [id: string]: Rule }; // track rules here since there is not getRule method needed for edit/delete
    actionTopic: string;
    constructor(actionTopic: string) {
        Number.parseFloat = parseFloat;
        this.rules = {};
        this.actionTopic = actionTopic;
        this.engine = new Engine([], {
            allowUndefinedFacts: true,
        })
            .addFact('state', (params, almanac) => handleStateCondition(params as StateParams, almanac))
            .addFact('area', (params, almanac) => handleAreaCondition(params as AreaParams, almanac))
            .on('success', (event, almanac, ruleResult) =>
                handleRuleSuccess(event, almanac, ruleResult, this.actionTopic),
            );
    }

    async addRule(ruleData: Rules): Promise<Rule> {
        if (!!ruleData.id && !!ruleData.conditions) {
            const promise = this.convertRule(ruleData).then(rule => {
                this.rules[rule.name] = rule;
                this.engine.addRule(rule);
                //@ts-ignore
                log('RULE ADDED: ' + JSON.stringify(this.rules));
                return rule;
            });
            Promise.runQueue();
            return promise;
        } else {
            return new Promise((res, rej) =>
                rej(`Tried to add rule, but it does not have a valid id or is missing conditions`),
            );
        }
    }

    editRule(ruleData: Rules): void {
        if (this.rules[ruleData.id]) {
            this.deleteRule(ruleData.id);
            this.addRule(ruleData);
            //@ts-ignore
            log('RULE EDITED: ' + JSON.stringify(this.rules));
        } else {
            this.addRule(ruleData);
        }
    }

    deleteRule(id: string): void {
        if (this.rules[id]) {
            this.engine.removeRule(this.rules[id]);
            delete this.rules[id];
            //@ts-ignore
            log('RULE DELETED: ' + JSON.stringify(this.rules));
        }
    }

    async convertRule(ruleData: Rules): Promise<Rule> {
        const { label, event_type_id, priority, severity, id, timeframe, action_ids, conditions } = ruleData;

        const parsedConditions = JSON.parse(conditions || '{}');
        const parsedTimeframe = timeframe ? JSON.parse(timeframe) : timeframe;
        const parsedActionIDs = action_ids ? JSON.parse(action_ids) : action_ids;

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

    async run(fact: IncomingFact): Promise<string> {
        const promise = this.engine
            .run(fact)
            .then(results => `ENGINE FINISHED! Successful Rules: ${results.events.map(e => e.type).join(', ')}`)
            .catch(e => `ENGINE ERROR: ${JSON.stringify(e)}`);
        Promise.runQueue();
        return promise;
    }
}

function handleRuleSuccess(event: Event, almanac: Almanac, ruleResult: RuleResult, actionTopic: string): void {
    // @ts-ignore json-rule-engine types does not include factMap
    const incomingData = almanac.factMap.get('incomingData').value;
    const timeframe = (event.params as Record<string, string | TimeFrame>).timeframe;
    const processedRule = processRule(incomingData.id, ruleResult.conditions, {
        conditionIds: [],
        hasDuration: false,
        hasSuccessfulResult: false,
    });
    const entities: Entities = processedRule.conditionIds.reduce((acc: object, trigger: string) => {
        // @ts-ignore json-rule-engine types does not include factMap
        acc[trigger] = almanac.factMap.get(trigger).value.data;
        return acc;
    }, {});
    // @ts-ignore
    log('Processing rule for successful event: ' + JSON.stringify(ruleResult));
    if (processedRule.hasDuration) {
        processDuration(
            ruleResult.conditions,
            timeframe as TimeFrame,
            event.params as RuleParams,
            entities,
            actionTopic,
            incomingData,
        );
    } else if (doesTimeframeMatchRule(incomingData.timestamp, timeframe as TimeFrame)) {
        processSuccessfulEvents(ruleResult.conditions, event.params as RuleParams, entities, actionTopic, incomingData);
    }
}

function handleAreaCondition(params: AreaParams, almanac: Almanac): Promise<FactData> {
    const promise = almanac.factValue<WithParsedCustomData>('incomingData').then(incomingData => {
        const incomingIsAsset = incomingData.entityType === EntityTypes.ASSET;
        const isIncoming = incomingIsAsset ? incomingData.id === params.id : incomingData.id === params.id2;
        const isDifferentType = incomingIsAsset
            ? incomingData.type !== params.type
            : incomingData.type !== params.type2;
        if (isIncoming || isDifferentType) {
            const promise = almanac.factValue<FactData>(params.id).then(data => {
                return (
                    data ||
                    collectAndBuildFact(almanac, params.id, params.type, CollectionName.ASSETS, incomingData).then(
                        builtFact => {
                            return builtFact;
                        },
                    )
                );
            });
            Promise.runQueue();
            return promise;
        }
    });
    Promise.runQueue();
    return promise as Promise<FactData>;
}

function handleStateCondition(params: StateParams, almanac: Almanac): Promise<FactData> {
    const promise = almanac.factValue<WithParsedCustomData>('incomingData').then(incomingData => {
        const isIncoming = params.id === incomingData.id;
        const isDifferentType = params.type !== incomingData.type;
        if (isIncoming || isDifferentType) {
            const promise = almanac.factValue<FactData>(params.id).then(data => {
                return (
                    data ||
                    // custom data has not been fetched for asset
                    collectAndBuildFact(almanac, params.id, params.type, params.collection, incomingData)
                );
            });
            Promise.runQueue();
            return promise;
        }
    });
    Promise.runQueue();
    return promise as Promise<FactData>;
}
