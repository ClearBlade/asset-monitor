import "./promise-polyfill"
import "core-js/features/map"
import { Engine } from 'json-rules-engine'

class RulesEngine {
  engine: Engine
  constructor() {
    Number.parseFloat = parseFloat;
    this.engine = new Engine();
  }

  addRule(rule) {
    this.engine.addRule(rule);
  }

  addFact(factName, func) {
    this.engine.addFact(factName, func);
  }

  run(facts) {
    let resp = "";
    this.engine.run(facts)
      .then(results => {
        resp = results
      }, (err) => {
        resp = err.message
      });
    Promise.runQueue();
    return resp;
  }
}

// @ts-ignore
global.RulesEngine = RulesEngine
