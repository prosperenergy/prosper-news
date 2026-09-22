import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const talk = JSON.parse(await fs.readFile(path.join(root, 'content/hannah-news-talk.json'), 'utf8'));
const output = path.join(root, 'outputs');
const sceneDir = path.join(output, 'hannah-scenes');
const mediaDir = path.join(root, 'source/user-media');
await Promise.all([fs.mkdir(sceneDir, { recursive: true }), fs.mkdir(mediaDir, { recursive: true })]);

const words = text => text.trim().split(/\s+/u).length;
const stamp = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const quote = text => String(text).split('\n').map(line => `> ${line}`).join('\n');
const bullet = list => list.map(line => `- ${line}`).join('\n');
const sourceMap = new Map(talk.sources.map(source => [source.id, source]));
const assetMap = new Map(talk.assets.map(asset => [asset.id, asset]));
assert.equal(talk.scenes.length, 15, 'Expected the complete 15-scene talk');
assert.equal(sourceMap.size, talk.sources.length, 'Source IDs must be unique');

let cursor = 0;
const scenes = talk.scenes.map((scene, index) => {
  assert.equal(scene.id, String(index + 1).padStart(2, '0'));
  assert.ok(scene.narration.trim() && scene.visual && scene.performance);
  for (const ref of scene.sourceRefs) assert.ok(sourceMap.has(ref), `Unknown source: ${ref}`);
  for (const ref of scene.optionalAssets ?? []) assert.ok(assetMap.has(ref), `Unknown asset: ${ref}`);
  assert.ok(!/\b(?:TODO|TBD|INSERT HERE)\b/.test(scene.narration), 'No narration placeholders');
  const wordCount = words(scene.narration);
  const speakingSeconds = Math.ceil(wordCount * 60 / talk.spokenWordsPerMinute);
  const end = cursor + speakingSeconds + talk.sceneTransitionSeconds + (scene.extraHoldSeconds ?? 0);
  const prepared = { ...scene, wordCount, speakingSeconds, start: cursor, end, file: `${scene.id}-${slug(scene.title)}.txt` };
  cursor = end;
  return prepared;
});
const totalWords = scenes.reduce((sum, scene) => sum + scene.wordCount, 0);
const sourceLinks = ids => ids.map(id => {
  const source = sourceMap.get(id);
  return `[${source.title}](${source.url})`;
}).join('; ');

const media = [];
for (const asset of talk.assets) {
  const original = await fs.readFile(asset.originalPath);
  const destination = path.join(mediaDir, path.basename(asset.originalPath));
  const sha256 = crypto.createHash('sha256').update(original).digest('hex');
  let existing;
  try { existing = await fs.readFile(destination); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existing) assert.equal(crypto.createHash('sha256').update(existing).digest('hex'), sha256, `Refusing to overwrite a different media file: ${destination}`);
  else await fs.copyFile(asset.originalPath, destination, fs.constants.COPYFILE_EXCL);
  const copied = await fs.readFile(destination);
  assert.equal(crypto.createHash('sha256').update(copied).digest('hex'), sha256);
  media.push({ ...asset, preservedCopy: destination, bytes: original.length, sha256 });
}

const index = [
  '| Scene | Approximate time | Topic |',
  '| --- | --- | --- |',
  ...scenes.map(scene => `| ${scene.id} | ${stamp(scene.start)}–${stamp(scene.end)} | ${scene.title} |`)
].join('\n');

const sceneBlocks = scenes.map(scene => {
  const assets = (scene.optionalAssets ?? []).map(id => assetMap.get(id).name);
  return `## Scene ${scene.id} · ${stamp(scene.start)}–${stamp(scene.end)} · ${scene.title}\n\n` +
    `**Hannah — spoken narration**\n\n${scene.narration}\n\n` +
    `**Performance:** ${scene.performance}\n\n` +
    `**Visuals:** ${scene.visual}\n\n` +
    `**On-screen text — not spoken**\n\n${bullet(scene.screen)}\n\n` +
    (assets.length ? `**Optional supplied assets:** ${assets.join('; ')}. See the production notes before using any MOV footage.\n\n` : '') +
    `**Producer sources:** ${scene.sourceRefs.length ? sourceLinks(scene.sourceRefs) : 'Original Prosper editorial/community positioning; no numerical claim.'}\n\n` +
    `**Scene purpose:** ${scene.retention}\n\n` +
    `**Narration input:** [${scene.file}](hannah-scenes/${scene.file}) · ${scene.wordCount} words.\n`;
}).join('\n---\n\n');

const master = `# ${talk.title}\n\n` +
  `${talk.subtitle}\n\n` +
  `A full scene-by-scene talk for **Hannah**, based on [the published Prosper News article](${talk.sourceArticle}).\n\n` +
  `**Ready-to-use script:** ${scenes.length} scenes · ${totalWords.toLocaleString('en-US')} spoken words · approximately **${stamp(cursor)}** at ${talk.spokenWordsPerMinute} words per minute, including short transitions and the final-card hold. Actual delivery may vary.\n\n` +
  `**Status:** ${talk.production.status}\n\n` +
  `**Viewpoint:** ${talk.production.editorial}\n\n` +
  `Research cutoff: ${talk.researchCutoff}. Refresh dated industry figures before a later production. The dates stay visible on their source cards.\n\n` +
  `## How to use this\n\n` +
  `Paste only the spoken narration into the avatar tool. Performance directions, visual instructions, source links and captions are production notes, not dialogue. The [clean teleprompter](HANNAH-TELEPROMPTER.txt) contains the complete narration without directions; the [scene folder](hannah-scenes/) separates it into 15 inputs.\n\n` +
  `The optional cartoon cutaways are not required for the talk to work. They play under Hannah's voice and are not approved final edits. The supplied community graphic anchors the ending.\n\n` +
  `## Scene map\n\n${index}\n\n` +
  `## Full script\n\n${sceneBlocks}\n\n` +
  `## Three opening options\n\nScene 01 uses the first option. The alternatives replace its opening; do not append all three.\n\n` +
  talk.hooks.map(hook => `### ${hook.type}\n\n${quote(hook.text)}\n`).join('\n') +
  `\n## Retention map\n\n` +
  bullet(scenes.map(scene => `${stamp(scene.start)} · Scene ${scene.id}: ${scene.retention}`)) +
  `\n\n## Sources and claim boundaries\n\n` +
  talk.sources.map(source => `### ${source.id}\n\n[${source.title}](${source.url}) · ${source.date}.\n\n${source.supports}\n`).join('\n') +
  `\n## Production handoff\n\nSee [production notes](HANNAH-PRODUCTION-NOTES.md) for avatar identity, pronunciation, brand direction, supplied-clip restrictions and pre-publication checks. This is a script package, not a rendered or published video.\n`;

const production = `# Hannah · Prosper News · Production notes\n\n` +
  `**${talk.production.status}**\n\n` +
  Object.entries(talk.production).filter(([key, value]) => typeof value === 'string' && key !== 'status')
    .map(([key, value]) => `## ${key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}\n\n${value}\n`).join('\n') +
  `\n## Pronunciation\n\n${bullet(talk.production.pronunciation)}\n\n` +
  `## Factual boundaries\n\n${bullet(talk.production.factualBoundaries)}\n\n` +
  `## Supplied asset plan\n\nThe source files were preserved as byte-identical local copies. No original was edited, moved or deleted. Hashes and original paths are in [the asset manifest](HANNAH-ASSET-MANIFEST.json). The ZIP contains scripts and notes, not the large media files.\n\n` +
  media.map(asset => `### ${asset.name}\n\n` +
    `[Preserved original](${asset.preservedCopy})${asset.seconds ? ` · ${asset.seconds.toFixed(2)} seconds · ${asset.width} × ${asset.height} · ${asset.audioTracks} audio track` : ''}.\n\n` +
    `**Suggested use:** ${asset.use}\n\n**What was reviewed:** ${asset.review}\n\n**Before use:** ${asset.restrictions}\n`).join('\n') +
  `\n## Production checklist\n\n${talk.production.nextProductionSteps.map(item => `- [ ] ${item}`).join('\n')}\n\n` +
  `## Verification of this package\n\nThe build checks that all 15 scenes are present, all source and asset references resolve, no narration placeholder remains, the narration-only files match the master source, and the preserved media hashes match the uploaded originals. Timing is estimated, not measured from generated speech.\n`;

const csvCell = value => `"${String(value).replace(/"/g, '""')}"`;
const csv = [
  ['scene', 'start_estimate', 'end_estimate', 'title', 'spoken_words', 'narration_file', 'visual_direction', 'on_screen_text', 'source_ids', 'optional_assets'],
  ...scenes.map(scene => [scene.id, stamp(scene.start), stamp(scene.end), scene.title, scene.wordCount, `hannah-scenes/${scene.file}`, scene.visual, scene.screen.join(' | '), scene.sourceRefs.join(' | '), (scene.optionalAssets ?? []).join(' | ')])
].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';

await Promise.all([
  fs.writeFile(path.join(output, 'HANNAH-PROSPER-NEWS-FULL-SCRIPT.md'), master),
  fs.writeFile(path.join(output, 'HANNAH-TELEPROMPTER.txt'), scenes.map(scene => scene.narration.trim()).join('\n\n\n') + '\n'),
  fs.writeFile(path.join(output, 'HANNAH-PRODUCTION-NOTES.md'), production),
  fs.writeFile(path.join(output, 'HANNAH-SCENE-PLAN.csv'), csv),
  fs.writeFile(path.join(output, 'HANNAH-ASSET-MANIFEST.json'), JSON.stringify(media, null, 2) + '\n'),
  ...scenes.map(scene => fs.writeFile(path.join(sceneDir, scene.file), scene.narration.trim() + '\n'))
]);
for (const scene of scenes) assert.equal((await fs.readFile(path.join(sceneDir, scene.file), 'utf8')).trim(), scene.narration.trim());
const verification = { status: 'passed', sceneCount: scenes.length, spokenWords: totalWords, targetWordsPerMinute: talk.spokenWordsPerMinute, estimatedRuntimeSeconds: cursor, estimatedRuntime: stamp(cursor), sourceCount: talk.sources.length, preservedAssetCount: media.length, narrationOnlyFilesExact: true, originalMediaHashesMatch: true, generatedAt: new Date().toISOString(), narrationTimeline: scenes.map(({ id, title, start, end, wordCount }) => ({ id, title, start, end, wordCount })) };
await fs.writeFile(path.join(output, 'HANNAH-PACKAGE-VERIFICATION.json'), JSON.stringify(verification, null, 2) + '\n');
console.log(JSON.stringify(verification, null, 2));
