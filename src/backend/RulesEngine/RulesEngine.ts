import '@clearblade/promise-polyfill';
import 'core-js/features/map';
import { Engine, Event, TopLevelCondition, Almanac, RuleResult, Rule } from 'json-rules-engine';
import { StateParams, RuleParams, ProcessedCondition, WithParsedCustomData } from './types';
import { parseAndConvertConditions } from './convert-rule';
import { processSuccessfulEvent } from './events';
import { Rules } from '../collection-schema/Rules';
import { processRule, aggregateFactMap, filterProcessedRule, collectAndBuildFact } from './utils';
import { DurationEngine } from './DurationEngine';

interface IncomingFact {
    incomingData: WithParsedCustomData;
}

interface FactData {
    data: WithParsedCustomData;
}

export class RulesEngine {
    engine: Engine;
    durationEngine: DurationEngine;
    rules: { [id: string]: Rule }; // track rules here since there is not getRule method needed for edit/delete
    actionTopic: string;
    constructor(actionTopic: string) {
        Number.parseFloat = parseFloat;
        this.rules = {};
        this.actionTopic = actionTopic;
        this.durationEngine = DurationEngine.getInstance();
        this.engine = new Engine([], {
            allowUndefinedFacts: true,
        })
            .addFact('entity', (params, almanac) => handleEntityFact(params as StateParams, almanac))
            .on('success', (event, almanac, ruleResult) =>
                this.handleRuleFinished(event, almanac, ruleResult, this.actionTopic),
            )
            .on('failure', (event, almanac, ruleResult) =>
                this.handleRuleFinished(event, almanac, ruleResult, this.actionTopic),
            );
        this.engine.addOperator('outside', handleOutsideOperator);
        this.engine.addOperator('inside', handleInsideOperator);
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
        if (this.rules[ruleData.id as string]) {
            this.deleteRule(ruleData.id as string);
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

    clearRules(): void {
        const rules = Object.keys(this.rules);
        for (let i = 0; i < rules.length; i++) {
            this.deleteRule(rules[i]);
        }
    }

    async convertRule(ruleData: Rules): Promise<Rule> {
        const {
            label,
            event_type_id,
            priority,
            severity,
            id,
            timeframe,
            action_ids,
            conditions,
            closes_ids,
        } = ruleData;

        const parsedConditions = JSON.parse(conditions || '{}');
        const parsedTimeframe = timeframe ? JSON.parse(timeframe) : timeframe;
        const parsedActionIDs = action_ids ? JSON.parse(action_ids) : action_ids;

        const promise = parseAndConvertConditions(parsedConditions).then(convertedConditions => {
            return new Rule({
                name: id as string,
                conditions: convertedConditions as TopLevelCondition,
                event: {
                    type: label as string,
                    params: {
                        eventTypeID: event_type_id,
                        actionIDs: parsedActionIDs,
                        priority,
                        severity,
                        timeframe: parsedTimeframe,
                        ruleID: id,
                        ruleName: label,
                        ruleType: Object.keys(convertedConditions as TopLevelCondition)[0],
                        closesIds: JSON.parse(closes_ids || '[]'),
                    },
                },
            });
        });
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

    handleRuleFinished(event: Event, almanac: Almanac, ruleResult: RuleResult, actionTopic: string): void {
        log('Processing rule for event: ' + JSON.stringify(ruleResult));
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore json-rule-engine types does not include factMap
        const incomingData = almanac.factMap.get('incomingData').value;
        const processedResults = processRule([ruleResult.conditions]);
        const filteredResults = filterProcessedRule(processedResults as Array<ProcessedCondition[]>, incomingData.id);

        if ((event.params as RuleParams).ruleType === 'any' && filteredResults.trues.length) {
            filteredResults.pendingDurations = []; // get rid of these since we don't need to process them because it's an 'or'
            const ruleId = (event.params as RuleParams).ruleID;
            this.durationEngine.clearTimersForRule(ruleId);
        }

        const entities = aggregateFactMap(filteredResults, almanac);

        if (filteredResults.trues.length) {
            processSuccessfulEvent(
                filteredResults.trues,
                event.params as RuleParams,
                entities,
                actionTopic,
                incomingData,
            );
        }
        if (filteredResults.pendingDurations.length) {
            this.durationEngine.processDurations(
                filteredResults.pendingDurations as Array<ProcessedCondition[]>,
                event.params as RuleParams,
                entities,
                actionTopic,
                incomingData,
            );
        }
    }
}

function handleInsideOperator(asset: FactData, area: FactData): boolean {
    if (asset && area) {
        const parsedPoly = JSON.parse((area.data.polygon as string) || '[]');
        const hasCoords = (asset.data.latitude as number) && (asset.data.longitude as number);
        if (hasCoords && parsedPoly.length >= 3) {
            const geoObj = new geo('polar');
            const point = geoObj.Point(asset.data.latitude as number, asset.data.longitude as number);
            const poly = geoObj.Polygon(
                parsedPoly.map((p: { lat: number; long: number }) => geoObj.Point(p.lat, p.long)),
            );
            return geoObj.Within(poly, point);
        }
    }
    return false;
}

function handleOutsideOperator(asset: FactData, area: FactData): boolean {
    if (asset && area) {
        const parsedPoly = JSON.parse((area.data.polygon as string) || '[]');
        const hasCoords = (asset.data.latitude as number) && (asset.data.longitude as number);
        if (hasCoords && parsedPoly.length >= 3) {
            const geoObj = new geo('polar');
            const point = geoObj.Point(asset.data.latitude as number, asset.data.longitude as number);
            const poly = geoObj.Polygon(
                parsedPoly.map((p: { lat: number; long: number }) => geoObj.Point(p.lat, p.long)),
            );
            return !geoObj.Within(poly, point);
        }
    }
    return false;
}

function handleEntityFact(params: StateParams, almanac: Almanac): Promise<FactData> {
    const promise = almanac.factValue<WithParsedCustomData>('incomingData').then(incomingData => {
        const isIncoming = params.id === incomingData.id;
        const isDifferentType = params.type !== incomingData.type;
        if (isIncoming || isDifferentType) {
            const promise = almanac.factValue<FactData>(params.id).then(data => {
                return data || collectAndBuildFact(almanac, params.id, params.type, params.collection, incomingData);
            });
            Promise.runQueue();
            return promise;
        }
    });
    Promise.runQueue();
    return promise as Promise<FactData>;
}
