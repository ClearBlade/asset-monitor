import { Rules } from "../collection-schema/Rules";
import { RulesEngine } from "./RulesEngine";
import { subscriber } from "../Normalizer";

interface RulesEngineAPI {
    resp: CbServer.Resp;
    fetchRulesForEngine: () => Promise<Rules[]>;
    incomingDataTopics: string[];
    actionTopic: string;
}

export function rulesEngineSS({ resp, incomingDataTopics, fetchRulesForEngine, actionTopic }: RulesEngineAPI): void {
  const engine = new RulesEngine(actionTopic);
  const messaging = ClearBlade.Messaging();
  
  fetchRulesForEngine().then((rules) => {
    Promise.all(rules.map((ruleData) => {
      const promise = engine.addRule(ruleData)
          .then((rule) => rule.name)
          .catch((e) => {
              //@ts-ignore
              log('Error adding rule: ' + JSON.stringify(e));
          });
      Promise.runQueue();
      return promise;
    })).then((ruleNames) => {
        //@ts-ignore
        log(`Successfully added rules: ${ruleNames.join(', ')}`);
        subscribeAndInitialize();
    }).catch((e) => {
        //@ts-ignore
        log(e)
    })
    Promise.runQueue();
  })
  Promise.runQueue();

  function subscribeAndInitialize() {
    Promise.all(incomingDataTopics.map((topic) => {
      subscriber(topic);
    })).then(() => {
      initializeWhileLoop();
    }).catch((e) => {
      //@ts-ignore
      log(`Subscription error: ${JSON.stringify(e)}`)
    })
    Promise.runQueue();
  }

  function initializeWhileLoop() {
      while(true) {
          messaging.waitForMessage(incomingDataTopics, handleIncomingMessage);
      }
  }

  function handleIncomingMessage(err: boolean, msg: string, topic: string) {
    if (err) {
      resp.error('Error calling waitForMessage ' + JSON.stringify(msg));
    } else {
      const id = topic.split('/')[2];
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(msg);
      } catch(e) {
        resp.error('Invalid message structure: ' + JSON.stringify(e));
      }
      let fact = {
        incomingData: {
          id,
          ...parsedMessage
        }
      }
      engine.run(fact).then((successMsg) => {
        //@ts-ignore
        log(successMsg);
      }).catch((e) => {
        resp.error(e);
      });
      Promise.runQueue();
    }
  }
}

