// Dependency-free renderer smoke test; used because static HTML should stay easy to deploy.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').replace(/initialize\(\);\s*$/, '');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/atlas.json'), 'utf8'));
const sandbox = {
  window: { HJ_ATLAS_CONFIG: {repository:'', giscus:{}} },
  location: {hash:'#map'}, document: {}, console, setTimeout,
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
vm.runInContext(`atlas=${JSON.stringify(data)}; for(const branch of atlas.branches){branchIndex.set(branch.id,branch);for(const topic of branch.topics){topic.branchId=branch.id;allTopics.push(topic);topicIndex.set(topic.id,topic)}} for(const p of atlas.references)referenceIndex.set(p.id,p)`, sandbox);
const map = vm.runInContext('renderMap()',sandbox);
assert.equal((map.match(/class="branch-card"/g)||[]).length,7);
assert.equal((map.match(/class="leaf-link"/g)||[]).length,29);
assert.ok(map.includes('Mean Field Games'));
const topic = vm.runInContext("renderTopic(topicIndex.get('discount-classical'))",sandbox);
assert.ok(topic.includes('Convergence of the solutions'));
assert.ok(topic.includes('discussion-placeholder'));
const questions = vm.runInContext('renderQuestions()',sandbox);
assert.ok(questions.includes('question-tile'));
assert.ok(vm.runInContext('renderCommunity()',sandbox).includes('OPEN CONTRIBUTIONS'));
console.log('OK: map, topic, questions, community render');
