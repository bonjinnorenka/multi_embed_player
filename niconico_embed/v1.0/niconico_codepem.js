class NicovideoPlayer {
    static playerId = 0;
    static origin = 'https://embed.nicovideo.jp';
  
    constructor(containerSelector, watchId) {
      this.playerId = (++NicovideoPlayer.playerId).toString();
      this.container = document.querySelector(containerSelector);
      this.watchId = watchId;
      this.state = {
        isRepeat: false
      };
  
      this.messageListener();
      this.render();
    }
  
    render() {
      const wrapper = document.createElement('div');
      wrapper.classList.add(`c-nicovideoPlayer--${this.playerId}`);
  
      this.player = this.renderPlayer();
      this.controls = this.renderControls();
  
      wrapper.appendChild(this.player);
      wrapper.appendChild(this.controls);
  
      this.container.appendChild(wrapper);
    }
  
    renderInfoTable(videoInfo) {
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      table.classList.add('c-infoTable');
  
      Object.entries(videoInfo).forEach(([key, value]) => {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        const td = document.createElement('td');
  
        th.innerText = key.toString();
        td.innerHTML = value.toString();
  
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
      });
  
      table.appendChild(tbody);
      this.player.parentElement.appendChild(table);
    }
  
    renderPlayer() {
      const player = document.createElement('iframe');
      const source = new URL(`${NicovideoPlayer.origin}/watch/${this.watchId}`);
      const params = {
        jsapi: 1,
        playerId: this.playerId
      };
  
      Object.entries(params).forEach(([key, value]) =>
        source.searchParams.append(key, value)
      );
  
      player.width = 480;
      player.height = 259;
      player.src = source;
      player.frameBorder = 0;
      player.allowFullscreen = true;
      player.classList.add('c-player');
  
      return player;
    }
  
    renderControls() {
      const controls = document.createElement('div');
      controls.classList.add('c-controls');
  
      const playElem = this.createActionHandler({
        inputType: 'button',
        labelText: '再生',
        className: 'playButton',
        onClick: () => this.postMessage({
          eventName: this.state.playerStatus === 2 ? 'pause' : 'play'
        })
      });
  
      const repeatElem = this.createActionHandler({
        inputType: 'checkbox',
        labelText: 'リピート',
        className: 'repeatToggle',
        onChange: (e) => {
          this.state = Object.assign({}, this.state, {
            isRepeat: e.target.checked
          });
        }
      });
  
      const muteElem = this.createActionHandler({
        inputType: 'checkbox',
        labelText: 'ミュート',
        className: 'muteToggle',
        attributes: {
          disabled: true
        },
        onChange: (e) => this.postMessage({
          eventName: 'mute',
          data: {
            mute: e.target.checked
          }
        })
      });
  
      const seekElem = this.createActionHandler({
        inputType: 'range',
        labelText: 'シーク',
        className: 'seekRange',
        attributes: {
          value: 0,
          disabled: true
        },
        onChange: (e) => this.postMessage({
          eventName: 'seek',
          data: {
            time: e.target.valueAsNumber
          }
        })
      });
  
      const volumeElem = this.createActionHandler({
        inputType: 'range',
        labelText: '音量',
        className: 'volumeRange',
        attributes: {
          value: 0,
          max: 1,
          step: 0.01,
          disabled: true
        },
        onChange: (e) => this.postMessage({
          eventName: 'volumeChange',
          data: {
            volume: e.target.valueAsNumber
          }
        })
      });
  
      controls.appendChild(playElem);
      controls.appendChild(muteElem);
      controls.appendChild(repeatElem);
      controls.appendChild(seekElem);
      controls.appendChild(volumeElem);
  
      return controls;
    }
  
    createActionHandler(options) {
      const label = document.createElement('label');
      const input = document.createElement('input');
  
      input.classList.add(`c-${options.className}`);
      input.type = options.inputType;
  
      if (options.hasOwnProperty('attributes')) {
        Object.entries(options.attributes).forEach(([key, value]) => input[key] = value);
      }
      if (options.hasOwnProperty('onClick')) {
        input.onclick = options.onClick;
      }
      if (options.hasOwnProperty('onChange')) {
        input.onchange = options.onChange;
      }
      if (options.hasOwnProperty('labelText')) {
        switch (options.inputType) {
          case 'button':
            input.value = options.labelText;
            break;
  
          default: {
            const span = document.createElement('span');
            span.innerText = options.labelText;
            label.appendChild(span);
          }
        }
      }
  
      label.appendChild(input);
  
      return label;
    }
  
    messageListener() {
      window.addEventListener('message', (e) => {
        if (e.origin === NicovideoPlayer.origin && e.data.playerId === this.playerId) {
          const { data } = e.data;
  
          switch (e.data.eventName) {
            case 'playerMetadataChange': {
              this.playerMetadataChange(data);
              break;
            }
  
            case 'playerStatusChange': {
              this.playerStatusChange(data);
              break;
            }
  
            case 'loadComplete': {
              this.renderInfoTable(data.videoInfo);
              break;
            }
  
            default:
              console.log(e.data);
          }
  
          this.state = Object.assign({}, this.state, data);
        }
      });
    }
  
    playerMetadataChange(data) {
      const seek = this.controls.querySelector('.c-seekRange');
      const mute = this.controls.querySelector('.c-muteToggle');
      const volume = this.controls.querySelector('.c-volumeRange');
  
      mute.disabled = false;
      volume.disabled = false;
  
      // 動画の長さを更新
      if (data.duration !== undefined && data.duration !== seek.max) {
        seek.max = data.duration;
        seek.disabled = false;
      }
  
      // 再生時間の更新
      if (data.currentTime !== undefined && data.currentTime !== seek.time) {
        seek.value = data.currentTime;
        this.seekProgress(seek, data);
      }
  
      // ミュートの更新
      if (data.muted !== mute.checked) {
        mute.checked = data.muted;
      }
  
      // 音量の更新
      if (data.volume !== volume.valueAsNumber) {
        volume.value = data.volume;
      }
  
      // バッファの更新
      if (this.state.maximumBuffered !== data.maximumBuffered) {
        this.seekProgress(seek, data);
      }
    }
  
    playerStatusChange(data) {
      switch (data.playerStatus) {
        case 1: // 読み込み開始
        case 2: // 再生開始
          this.playButtonChange(false);
          break;
  
        case 3: // 一時停止
        case 4: // 再生終了
          if (data.playerStatus === 4 && this.state.isRepeat) {
            this.postMessage({
              eventName: 'seek',
              data: {
                time: 0
              }
            });
          } else {
            this.playButtonChange(true);
          }
          break;
      }
    }
  
    playButtonChange(isPaused) {
      const playButton = this.controls.querySelector('.c-playButton');
  
      if (isPaused) {
        playButton.value = '再生';
      } else {
        playButton.value = '停止';
      }
    }
  
    seekProgress(seek, data) {
      const timeRate = Math.floor(1000 / (data.duration / data.currentTime)) / 10;
      const bufferRate = Math.floor(1000 / (data.duration / data.maximumBuffered)) / 10;
  
      seek.style.background = `linear-gradient(to right, #38f ${timeRate}%, #ccc ${timeRate}%, #ccc ${bufferRate}%,  #555 ${bufferRate}%)`;
    }
  
    postMessage(request) {
      const message = Object.assign({
        sourceConnectorType: 1,
        playerId: this.playerId
      }, request);
  
      this.player.contentWindow.postMessage(message, NicovideoPlayer.origin);
    }
  }
  
  new NicovideoPlayer('body', 'sm30699861');
  