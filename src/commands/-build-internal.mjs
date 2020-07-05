import UI from 'console-ui';
import Funnel from 'broccoli-funnel'
import MergeTrees from 'broccoli-merge-trees';
import broccoli from 'broccoli';
import messages from 'broccoli/dist/messages.js';

import BuildStanza from '../build-stanza.mjs';
import BundleStanzaModules from '../bundle-stanza-modules.mjs';
import { packagePath } from '../util.mjs';

export async function runWatcher(builder, outputPath = null, onBuildSuccess = () => {}) {
  const ui = new UI();

  const watcher = new broccoli.Watcher(builder, builder.watchedSourceNodeWrappers, {
    saneOptions: {
      ignored: outputPath ? `${outputPath}/**` : null
    }
  });

  watcher.on('buildSuccess', () => {
    messages.default.onBuildSuccess(builder, ui);
    onBuildSuccess(watcher);
  });

  watcher.on('buildFailure', (e) => {
    ui.writeLine('build failure', 'ERROR');
    ui.writeError(e);
  });

  process.on('SIGINT',  () => watcher.quit());
  process.on('SIGTERM', () => watcher.quit());

  try {
    await watcher.start();
  } finally {
    await builder.cleanup();
  }

  process.exit(0); // perhaps LiveServer is still listening and needs to stop the process
}

export function composeTree(providerDir) {
  const buildTree  = new BuildStanza(providerDir);
  const bundleTree = new BundleStanzaModules(buildTree, {providerDir});

  const css = new Funnel(packagePath, {
    srcDir: 'src',
    files:  ['app.css'],

    getDestinationPath(fpath) {
      if (fpath === 'app.css') { return 'togostanza.css'; }

      return fpath;
    }
  });

  return new MergeTrees([
    buildTree,
    bundleTree,
    css
  ], {overwrite: true});
}