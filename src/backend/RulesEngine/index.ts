import { Rules } from '../collection-schema/Rules';
import { subscriber } from '../Normalizer';
import { tryParse } from '../Util';
import { DurationEngine, DURATION_TOPIC } from './DurationEngine';
import { processEvent } from './events';
import { RulesEngine } from './RulesEngine';
import { EntityTypes, TimeFrame } from './types';

type RulesWithExternalInfo = Rules & { is_external: boolean };

interface RulesEngineAPI {
    resp: CbServer.Resp;
    fetchRulesForEngine: () => Promise<RulesWithExternalInfo[]>;
    incomingDataTopics: string[];
    actionTopic: string;
}

const RULES_ENTITY_UPDATED_TOPIC = 'rules_entity_updated';
const RULES_UPDATED_TOPIC = 'rules_collection_updated';
const RULES_SHARED_GROUP = 'rules_shared_topic';

export function rulesEngineSS({ resp, incomingDataTopics, fetchRulesForEngine, actionTopic }: RulesEngineAPI): void {
    const engine = new RulesEngine(actionTopic);
    const durationEngine = DurationEngine.getInstance();
    const messaging = ClearBlade.Messaging();
    const sharedTopics = [...incomingDataTopics, DURATION_TOPIC].map(t => `$share/${RULES_SHARED_GROUP}/${t}`);
    let externalRules: RulesWithExternalInfo[] = [];

    function fetchAndConvertRules(): Promise<(string | void)[]> {
        const promise = fetchRulesForEngine().then(rules => {
            externalRules = rules.filter(r => r.is_external);
            return Promise.all(
                rules
                    .filter(r => !r.is_external)
                    .map(ruleData => {
                        const promise = engine
                            .addRule(ruleData)
                            .then(rule => rule.name)
                            .catch(e => {
                                log('Error adding rule: ' + JSON.stringify(e));
                            });
                        Promise.runQueue();
                        return promise;
                    }),
            );
        });
        Promise.runQueue();
        return promise;
    }

    function subscribeAndInitialize(): void {
        Promise.all(
            [...sharedTopics, RULES_UPDATED_TOPIC, RULES_ENTITY_UPDATED_TOPIC].map(topic => {
                subscriber(topic);
            }),
        )
            .then(() => {
                initializeWhileLoop();
            })
            .catch(e => {
                log(`Subscription error: ${e.message} ${e.stack}`);
            });
        Promise.runQueue();
    }

    function initializeWhileLoop(): void {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage(
                [...sharedTopics, RULES_UPDATED_TOPIC, RULES_ENTITY_UPDATED_TOPIC],
                handleIncomingMessage,
            );
        }
    }

    function handleIncomingMessage(err: boolean, msg: string, topic: string): void {
        if (err) {
            resp.error('Error calling waitForMessage ' + JSON.stringify(msg));
        } else if (topic) {
            if (topic === RULES_UPDATED_TOPIC) {
                handleRulesCollUpdate(msg);
            } else if (topic === RULES_ENTITY_UPDATED_TOPIC) {
                engine.clearRules();
                fetchAndConvertRules();
            } else if (topic === `$share/${RULES_SHARED_GROUP}/${DURATION_TOPIC}`) {
                durationEngine.timerExecuted(err, msg);
            } else {
                let incomingData;
                try {
                    incomingData = {
                        ...JSON.parse(msg),
                        entityType: topic.includes('_asset') ? EntityTypes.ASSET : EntityTypes.AREA,
                    };
                } catch (e) {
                    resp.error('Invalid message structure: ' + JSON.stringify(e));
                }
                if (incomingData.is_external_rule_type) {
                    const ruleId = incomingData.rule_id;
                    const found = externalRules.filter(r => r.id === ruleId)[0]; // I would use .find but requires a polyfill
                    if (found) {
                        processEvent(
                            {
                                eventTypeID: found.event_type_id as string,
                                actionIDs: tryParse(found.action_ids, []) as string[],
                                priority: found.priority as number,
                                severity: found.severity as number,
                                timeframe: tryParse(found.timeframe, {}) as TimeFrame,
                                ruleID: ruleId,
                                closesIds: tryParse(found.closes_ids, []) as string[],
                            },
                            { [incomingData.id]: incomingData },
                            actionTopic,
                            incomingData,
                        );
                    } else {
                        // todo: publish/log error/warning that we couldn't find a matching id
                    }
                } else {
                    const fact = { incomingData };
                    engine
                        .run(fact)
                        .then(successMsg => {
                            log(successMsg);
                        })
                        .catch(e => {
                            resp.error(e);
                        });
                    Promise.runQueue();
                }
            }
        }
    }

    function handleRulesCollUpdate(msg: string): void {
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(msg);
        } catch (e) {
            resp.error('Invalid message structure for update rules collection: ' + JSON.stringify(e));
        }
        switch (parsedMessage.type) {
            case 'CREATE':
                engine.addRule(parsedMessage.data);
                break;
            case 'UPDATE':
                engine.editRule(parsedMessage.data);
                break;
            case 'DELETE':
                for (let i = 0; i < parsedMessage.data.length; i++) {
                    engine.deleteRule(parsedMessage.data[i]);
                }
                break;
            default:
                return;
        }
    }

    fetchAndConvertRules()
        .then(ruleNames => {
            log(`Engine started and uccessfully added rules: ${ruleNames.join(', ')}`);
            subscribeAndInitialize();
        })
        .catch(e => {
            log(e);
        });
}
