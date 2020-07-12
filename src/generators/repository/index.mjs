import Generator from 'yeoman-generator';
import dedent from 'dedent';
import pick from 'lodash.pick';

import MemoryStorage from '../memory-storage.mjs';
import { required } from '../validators.mjs';

export default class RepositoryGenerator extends Generator {
  async prompting() {
    const args    = pick(this.options, ['name', 'license', 'packageManager', 'skipGit', 'owner', 'repo']);
    const storage = new MemoryStorage(args);

    await this.prompt([
      {
        name:     'name',
        message:  'stanza repository name (used as a directory name):',
        validate: required
      },
      {
        name:    'license',
        default: 'MIT'
      },
      {
        name:    'packageManager',
        message: 'package manager:',
        type:    'list',
        choices: ['npm', 'yarn']
      },
      {
        name:     'owner',
        message:  'GitHub repository owner (https://github.com/OWNER/repo):',
        default:  await this.user.github.username(),
        validate: required,
        when:     !args.skipGit
      },
      {
        name:     'repo',
        message:  'GitHub repository name (https://github.com/owner/REPO):',
        default:  ({name}) => args.name || name,
        validate: required,
        when:     !args.skipGit
      }
    ], storage);

    this.params = storage.data;
  }

  writing() {
    const {name, packageManager} = this.params;

    const root   = this.destinationRoot(name);
    const runner = commandRunner(packageManager);

    this.writeDestinationJSON('package.json', packageJSON(this.params));

    this.renderTemplate('**/*', '.', Object.assign({}, this.params, {commandRunner: runner}), null, {
      processDestinationPath: (fullPath) => {
        const relativePath = fullPath.slice(root.length + 1);
        const dotted       = relativePath.replace(/(?<=^|\/)_/g, '.');

        return this.destinationPath(dotted);
      }
    });
  }

  install() {
    const {skipInstall, packageManager} = this.params;

    if (skipInstall) { return; }

    this.installDependencies({
      yarn:  packageManager === 'yarn',
      npm:   packageManager === 'npm',
      bower: false
    });
  }

  end() {
    this._setupGit();

    this.log();
    this.log(gettingStarted(this.params));
    this.log();
  }

  _setupGit() {
    const {skipGit, owner, repo, name} = this.params;

    if (skipGit) { return; }

    const root = this.destinationRoot();

    this.spawnCommandSync('git', ['-C', root, 'init']);
    this.spawnCommandSync('git', ['-C', root, 'remote', 'add', 'origin', `https://github.com/${owner}/${repo}.git`]);
    this.spawnCommandSync('git', ['-C', root, 'add', '--all']);
    this.spawnCommandSync('git', ['-C', root, 'commit', '--message', `Initialize new stanza repository: ${name}`]);
  }
};

function packageJSON({name, license, skipGit, owner, repo}) {
  return {
    name,
    version: '0.0.1',
    license,
    repository: skipGit ? '' : `${owner}/${repo}`,
    scripts: {
      start:        'togostanza serve --port $npm_package_config_port',
      build:        'togostanza build',
      'new-stanza': 'togostanza new-stanza'
    },
    config: {
      port: 8080
    },
    dependencies: {
      togostanza: 'togostanza/togostanza-js'
    },
    engines: {
      node: '>=12'
    },
    private: true
  };
}

function gettingStarted({name, packageManager}) {
  const runner = commandRunner(packageManager);

  return dedent`
    Getting Started
    ---------------

    Create a new stanza:

      $ cd ${name}
      $ ${runner} togostanza generate stanza

    Serve the repository locally:

      $ cd ${name}
      $ ${runner} togostanza serve

    Build stanzas for deployment:

      $ cd ${name}
      $ ${runner} togostanza build
  `;
}

function commandRunner(packageManager) {
  switch (packageManager) {
    case 'yarn':
      return 'yarn run';
    case 'npm':
      return 'npx';
    default:
      throw new Error(`unknown package manager: ${packageManager}`);
  }
}
