import { Rules } from '../collection-schema/Rules';
import { RulesEngine } from './RulesEngine';
import { subscriber } from '../Normalizer';
import { EntityTypes } from './types';

interface RulesEngineAPI {
    resp: CbServer.Resp;
    fetchRulesForEngine: () => Promise<Rules[]>;
    incomingDataTopics: string[];
    actionTopic: string;
}

const RULES_UPDATED_TOPIC = 'rules_collection_updated';

export function rulesEngineSS({ resp, incomingDataTopics, fetchRulesForEngine, actionTopic }: RulesEngineAPI): void {
    const engine = new RulesEngine(actionTopic);
    const messaging = ClearBlade.Messaging();

    fetchRulesForEngine().then(rules => {
        Promise.all(
            rules.map(ruleData => {
                const promise = engine
                    .addRule(ruleData)
                    .then(rule => rule.name)
                    .catch(e => {
                        log('Error adding rule: ' + JSON.stringify(e));
                    });
                Promise.runQueue();
                return promise;
            }),
        )
            .then(ruleNames => {
                log(`Successfully added rules: ${ruleNames.join(', ')}`);
                subscribeAndInitialize();
            })
            .catch(e => {
                log(e);
            });
        Promise.runQueue();
    });
    Promise.runQueue();

    function subscribeAndInitialize(): void {
        Promise.all(
            [...incomingDataTopics, RULES_UPDATED_TOPIC].map(topic => {
                subscriber(topic);
            }),
        )
            .then(() => {
                initializeWhileLoop();
            })
            .catch(e => {
                log(`Subscription error: ${JSON.stringify(e)}`);
            });
        Promise.runQueue();
    }

    function initializeWhileLoop(): void {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([...incomingDataTopics, RULES_UPDATED_TOPIC], handleIncomingMessage);
        }
    }

    function handleIncomingMessage(err: boolean, msg: string, topic: string): void {
        if (err) {
            resp.error('Error calling waitForMessage ' + JSON.stringify(msg));
        } else {
            if (topic === RULES_UPDATED_TOPIC) {
                handleRulesCollUpdate(msg);
            } else {
                let incomingData;
                try {
                    incomingData = {
                        ...JSON.parse(msg),
                        entityType: topic.includes('_assets') ? EntityTypes.ASSET : EntityTypes.AREA,
                    };
                } catch (e) {
                    resp.error('Invalid message structure: ' + JSON.stringify(e));
                }
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
                engine.deleteRule(parsedMessage.data.id);
                break;
            default:
                return;
        }
    }
}
