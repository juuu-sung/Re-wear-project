const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const babel = require(path.join(root, 'node_modules/@babel/core'));
function load(relative, deps = {}, flow = false) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const code = flow ? babel.transformSync(source, {
    configFile: false, babelrc: false,
    plugins: [require.resolve(path.join(root, 'node_modules/@babel/plugin-transform-flow-strip-types'))],
  }).code.replace("export default FormData;", "module.exports = FormData;") : ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports: {}};
  vm.runInNewContext(code, {module, exports: module.exports, require(id) {
    assert.ok(id in deps, `Unexpected dependency: ${id}`); return deps[id];
  }, Blob, TextEncoder, Uint8Array});
  return module.exports;
}
const RNFormData = load('node_modules/react-native/Libraries/Network/FormData.js', {}, true);
const {installFormDataPatch} = load('node_modules/expo/src/winter/FormData.ts');
const FormData = installFormDataPatch(RNFormData);
const blobUtils = load('node_modules/expo/src/utils/blobUtils.ts');
const {convertFormDataAsync} = load('node_modules/expo/src/winter/fetch/convertFormData.ts', {'../../utils/blobUtils': blobUtils});
// Only the native filesystem is substituted; use installed Expo/RN multipart code.
class File {
  constructor(uri) { this.uri = uri; }
  get name() { return this.uri.split('/').pop(); }
  get type() { return this.name.endsWith('.mov') ? 'video/quicktime' : 'image/jpeg'; }
  async bytes() { return Uint8Array.from([0, 255, 216, 128, 10, 13, 255, 217]); }
}
(async () => {
  const old = new FormData();
  old.append('image', {uri:'file:///photo.jpg', name:'photo.jpg', type:'image/jpeg'});
  await assert.rejects(convertFormDataAsync(old), /Unsupported FormDataPart implementation/);
  const cases = [
    ['app/(tabs)/closet/add.js', {image:'file:///photo.jpg'}, 'image'],
    ['app/(tabs)/closet/detail.js', {imageUri:'file:///edited.jpg'}, 'image'],
    ['app/scan.js', {manipResult:{uri:'file:///scan.jpg'}}, 'file'],
    ['app/community/write.js', {compressed:{uri:'file:///community.jpg'}}, 'file'],
    ['app/chat/[room_id].jsx', {uploadUri:'file:///chat.jpg',pendingMedia:[{thumbnail:'file:///thumb.jpg'}]}, 'file'],
    ['app/chat/[room_id].jsx', {uploadUri:'file:///video.mov',pendingMedia:[{thumbnail:'file:///thumb.jpg'}]}, 'file'],
  ];
  let passed = 0;
  for (const [filename, variables, field] of cases) {
    const source = fs.readFileSync(path.join(root, filename),'utf8');
    const appends = source.match(/\w+\.append\("(?:image|file)", new File\([^;]+;/g);
    assert.ok(appends?.length, filename);
    assert.doesNotMatch(source, /"Content-Type": "multipart\/form-data"/);
    for (const statement of appends) {
      const data = new FormData();
      data.append('name','회색 스웨터');
      data.append('category','auto');
      vm.runInNewContext(statement, {...variables, File, form:data, formData:data, thumbnailForm:data});
      const {body,boundary} = await convertFormDataAsync(data);
      const parsed = await new Response(body, {headers:{'Content-Type':`multipart/form-data; boundary=${boundary}`}}).formData();
      assert.equal(parsed.get('name'),'회색 스웨터');
      assert.equal(parsed.get('category'),'auto');
      const sent = data.get(field);
      const received = parsed.get(field);
      assert.equal(received.name,sent.name);
      assert.equal(received.type,sent.type);
      assert.deepEqual(new Uint8Array(await received.arrayBuffer()),await sent.bytes());
      passed++;
    }
  }
  console.log(`PASS: reproduced old error; ${passed} current upload cases preserve filename, MIME, binary bytes and Korean fields.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
