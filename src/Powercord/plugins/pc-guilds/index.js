const { resolve } = require('path');
const Plugin = require('powercord/Plugin');
const { inject, uninject } = require('powercord/injector');
const { ContextMenu: { Button } } = require('powercord/components');
const { createElement, getOwnerInstance } = require('powercord/util');
const { React, ReactDOM, getModuleByDisplayName } = require('powercord/webpack');

const Guilds = require('./components/Guilds.jsx');
const CreateFolder = require('./components/CreateFolder.jsx');

module.exports = class GuildFolders extends Plugin {
  start () {
    this.loadCSS(resolve(__dirname, 'style.scss'));
    this._patchGuilds();
    // this._patchAddGuild();
    this._patchContextMenu();

    // Ensure new guild component is immediately displayed
    getOwnerInstance(document.querySelector('.pc-guilds')).forceUpdate();
  }

  unload () {
    this.unloadCSS();
    uninject('pc-guilds');
    uninject('pc-guilds-add');
    uninject('pc-guilds-add-mount');
    uninject('pc-guilds-add-update');
    uninject('pc-guilds-context');
  }

  _patchGuilds () {
    const _this = this;

    const DGuilds = getModuleByDisplayName('Guilds');
    inject('pc-guilds', DGuilds.prototype, 'render', function (_, res) { // eslint-disable-line func-names
      const child = res.props.children[1].props.children;
      const guildsIndex = child.indexOf(child.find(c => Array.isArray(c)));
      child[guildsIndex] = React.createElement(Guilds, Object.assign({}, this.props, {
        setRef: (key, e) => this.guildRefs[key] = e,
        settings: _this.settings
      }));
      return res;
    });
  }

  _patchAddGuild () {
    const AddGuild = getModuleByDisplayName('AddGuildModal');

    // eslint-disable-next-line func-names
    inject('pc-guilds-add', AddGuild.prototype, 'render', (_, res) => {
      res.props.className += ' pc-createGuildDialog';
      return res;
    });

    inject('pc-guilds-add-mount', AddGuild.prototype, 'componentDidMount', () => {
      const actions = document.querySelector('.pc-createGuildDialog header + .pc-actions');

      if (actions) {
        const element = createElement('div', { id: 'powercord-create-folder' });
        ReactDOM.render(React.createElement(CreateFolder), element);
        actions.parentElement.appendChild(element);
      }
    });

    inject('pc-guilds-add-update', AddGuild.prototype, 'componentDidUpdate', () => {
      const actions = document.querySelector('.pc-createGuildDialog header + .pc-actions');
      if (actions && !document.querySelector('#powercord-create-folder')) {
        const element = createElement('div', { id: 'powercord-create-folder' });
        ReactDOM.render(React.createElement(CreateFolder), element);
        actions.parentElement.appendChild(element);
      }
    });
  }

  _patchContextMenu () {
    const GuildContextMenu = getModuleByDisplayName('GuildContextMenu');

    inject('pc-guilds-context', GuildContextMenu.prototype, 'render', function (_, res) { // eslint-disable-line func-names
      if (this.props.isPowercord) {
        res.props.children.push(
          React.createElement(Button, {
            name: this.props.hidden ? 'Show' : 'Hide',
            seperate: true,
            onClick: () => this.props.onHide()
          })
        );
      }
      return res;
    });
  }
};
