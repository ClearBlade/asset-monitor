import '../../static/promise-polyfill';
import 'core-js/features/map';
import { Engine, Event, TopLevelCondition, Almanac, RuleResult, Rule } from 'json-rules-engine';
import { StateParams, RuleParams } from './types';
import { parseAndConvertConditions } from './convert-rule';
import { processSuccessfulEvents } from './events';
import { Rules } from '../collection-schema/Rules';
import { CbCollectionLib } from '../collection-lib';
import { Areas } from '../collection-schema/Areas';
import { Asset } from '../collection-schema/Assets';
import { processRule, aggregateFactMap } from './utils';
import { processDurations } from './duration';

interface WithParsedCustomData extends Asset {
    custom_data: Record<string, object>;
}

interface IncomingFact {
    incomingData: WithParsedCustomData;
}

interface FactData {
    data: WithParsedCustomData;
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
            .on('success', (event, almanac, ruleResult) =>
                handleRuleSuccess(event, almanac, ruleResult, this.actionTopic),
            )
            .on('failure', (event, almanac, ruleResult) =>
                handleRuleFailure(event, almanac, ruleResult, this.actionTopic),
            );
    }

    async addRule(ruleData: Rules): Promise<Rule> {
        if (!!ruleData.id && !!ruleData.conditions) {
            const promise = this.convertRule(ruleData).then(rule => {
                this.rules[rule.name] = rule;
                this.engine.addRule(rule);
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
            log('RULE EDITED: ' + JSON.stringify(this.rules));
        } else {
            this.addRule(ruleData);
        }
    }

    deleteRule(id: string): void {
        if (this.rules[id]) {
            this.engine.removeRule(this.rules[id]);
            delete this.rules[id];
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

function handleRuleFailure(event: Event, almanac: Almanac, ruleResult: RuleResult, actionTopic: string): void {
    log('failed rule ' + JSON.stringify(ruleResult));
}

function handleRuleSuccess(event: Event, almanac: Almanac, ruleResult: RuleResult, actionTopic: string): void {
    log('Processing rule for successful event: ' + JSON.stringify(ruleResult));
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore json-rule-engine types does not include factMap
    const incomingData = almanac.factMap.get('incomingData').value;
    const processedResults = processRule([ruleResult.conditions], 'all');
    const entities = aggregateFactMap(almanac, processedResults.combinations);
    if (processedResults.hasDuration) {
        processDurations(
            processedResults.conditionIds,
            ruleResult.conditions,
            event.params as RuleParams,
            entities,
            actionTopic,
            incomingData,
        );
    } else {
        const validCombinations = processedResults.conditionIds.filter(combo => {
            return combo.length === processedResults.numValidCombination;
        });
        processSuccessfulEvents(validCombinations, event.params as RuleParams, entities, actionTopic, incomingData);
    }
}

function buildFact(entityData: Asset | Areas, incomingData: WithParsedCustomData): WithParsedCustomData {
    let withParsedCustomData: WithParsedCustomData = {
        // parse custom_data
        ...entityData,
        custom_data: JSON.parse((entityData.custom_data as string) || '{}'),
    };
    if (entityData.id === incomingData.id) {
        // if this one is the same as asset that triggered engine
        withParsedCustomData = {
            ...withParsedCustomData,
            ...incomingData,
            custom_data: {
                ...withParsedCustomData.custom_data,
                ...incomingData.custom_data,
            },
        };
    }
    return withParsedCustomData;
}

function collectAndBuildFact(
    almanac: Almanac,
    data: FactData,
    params: StateParams,
    incomingData: WithParsedCustomData,
): Promise<FactData> {
    return new Promise(res => {
        if (data) {
            res(data);
        }
        // custom data has not been fetched for asset
        const collection = CbCollectionLib(params.collection);
        const query = ClearBlade.Query({ collectionName: params.collection });
        if (params.type) {
            query.equalTo('type', params.type);
        } else {
            query.equalTo('id', params.id);
        }
        const promise = collection
            .cbFetchPromise({ query })
            .then((data: CbServer.CollectionFetchData<Asset | Areas>) => {
                let initialData; // the fact who started all this mess
                for (let i = 0; i < data.DATA.length; i++) {
                    const entityData = data.DATA[i];
                    const fact = buildFact(entityData, incomingData);
                    if (params.id === entityData.id) {
                        // if this one is the same as asset that triggered fact
                        initialData = { ...fact };
                    }
                    almanac.addRuntimeFact(entityData.id as string, { data: fact }); // add fact for id
                }
                res({ data: initialData } as FactData); // resolve the initial fact's value
            });
        Promise.runQueue();
        return promise;
    });
}

function handleStateCondition(params: StateParams, almanac: Almanac): Promise<FactData> {
    const promise = almanac.factValue<WithParsedCustomData>('incomingData').then(incomingData => {
        const isIncoming = params.id === incomingData.id;
        const isDifferentType = params.type !== incomingData.type;
        if (isIncoming || isDifferentType) {
            const promise = almanac.factValue<FactData>(params.id).then(data => {
                return collectAndBuildFact(almanac, data, params, incomingData).then(builtFact => {
                    return builtFact;
                });
            });
            Promise.runQueue();
            return promise;
        }
    });
    Promise.runQueue();
    return promise as Promise<FactData>;
}
