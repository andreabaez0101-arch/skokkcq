const PROFILE_DEFAULTS = {
  showBadge: false,
  badgeIcon: 'crown',
  accent: '#FFD166',
  roleLabel: '',
  callsign: ''
};

const BADGE_ICONS = {
  crown: '<path d="M4 18 5.5 7l6.5 4 6.5-4L20 18Z"/><path d="M6 18h12"/><circle cx="6" cy="6" r="1.5"/><circle cx="12" cy="8" r="1.5"/><circle cx="18" cy="6" r="1.5"/>',
  star: '<path d="M12 2.8 14.8 8.4 21 9.3l-4.5 4.4 1 6.2L12 17l-5.5 2.9 1-6.2L3 9.3l6.2-.9Z"/>',
  shield: '<path d="M12 3l7 3v5c0 4.9-2.9 8.8-7 10-4.1-1.2-7-5.1-7-10V6Z"/><path d="M12 7v9"/>',
  bolt: '<path d="M13 2 6 13h4l-1 9 7-11h-4z"/>',
  diamond: '<path d="M12 3 4 10l8 11 8-11-8-7Z"/><path d="M8 7h8"/>',
  flame: '<path d="M12 2s4 3.5 4 7.2A4 4 0 0 1 12 13a3 3 0 0 0-3 3 4.5 4.5 0 0 0 9 0c0-5.8-6-14-6-14Z"/><path d="M10.4 14.5a2.3 2.3 0 1 0 3.2 3.2"/>'
};

const BADGE_OPTIONS = [
  { id: 'crown', label: 'Corona' },
  { id: 'star', label: 'Estrella' },
  { id: 'shield', label: 'Escudo' },
  { id: 'bolt', label: 'Rayo' },
  { id: 'diamond', label: 'Diamante' },
  { id: 'flame', label: 'Fuego' }
];

const COLOR_OPTIONS = ['#FFD166', '#F97316', '#22C55E', '#38BDF8', '#E879F9', '#FB7185', '#A3E635', '#F8FAFC'];
const ANIMATION_OPTIONS = [
  {
    id: 'classic',
    label: 'Original',
    description: 'La animacion por defecto cuando hablas por radio.'
  },
  {
    id: 'listen',
    label: 'Escucha',
    description: 'Lleva la radio mas arriba, como si estuvieras oyendo mejor.'
  },
  {
    id: 'tactical',
    label: 'Tactica',
    description: 'Agarre de hombro con estilo de radio policial.'
  }
];
const SCREEN_INDEX = { main: 0, users: 1, settings: 2 };
const QUICK_SLOT_FREE_COUNT = 2;
const QUICK_SLOT_DEFAULTS = Array.from({ length: 4 }, () => ({ channel: null, muted: false }));

const Radio = {
  isOpen: false,
  isTalking: false,
  isMuted: false,
  onRadio: false,
  activeScreen: 'main',
  currentChannel: 1,
  volume: 75,
  previousVolume: 75,
  quickSlots: QUICK_SLOT_DEFAULTS.map((slot) => ({ ...slot })),
  members: [],
  profile: { ...PROFILE_DEFAULTS },
  animationStyle: 'classic',
  channelNames: {
    1: 'Canal Principal',
    2: 'Policia',
    3: 'EMS',
    4: 'Mecanicos',
    5: 'Taxi',
    6: 'Privado'
  },

  init() {
    this.container = document.getElementById('radio-container');
    this.usersOverlay = document.getElementById('users-list-overlay');
    this.screenTrack = document.getElementById('screen-track');
    this.backBtn = document.getElementById('back-btn');
    this.headerKicker = document.getElementById('header-kicker');
    this.headerTitle = document.getElementById('header-title');
    this.membersBtn = document.getElementById('members-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.channelDisplay = document.getElementById('channel-number');
    this.channelNameDisplay = document.getElementById('channel-name');
    this.channelInput = document.getElementById('channel-input');
    this.channelStatus = document.getElementById('channel-status');
    this.statusText = document.getElementById('status-text');
    this.volumeSlider = document.getElementById('volume-slider');
    this.volumeValue = document.getElementById('volume-value');
    this.volumeFill = document.getElementById('volume-fill');
    this.quickList = document.getElementById('quick-list');
    this.muteBtn = document.getElementById('mute-btn');
    this.muteIcon = document.getElementById('mute-icon');
    this.muteText = document.getElementById('mute-text');
    this.connectionBtn = document.getElementById('connection-btn');
    this.connectionIcon = document.getElementById('connection-icon');
    this.connectionText = document.getElementById('connection-text');
    this.usersFrequency = document.getElementById('users-frequency');
    this.usersCount = document.getElementById('users-count');
    this.usersTalkingCount = document.getElementById('users-talking-count');
    this.usersSelfCard = document.getElementById('users-self-card');
    this.membersPanelList = document.getElementById('members-panel-list');
    this.profilePreviewCard = document.getElementById('profile-preview-card');
    this.badgeToggleBtn = document.getElementById('badge-toggle-btn');
    this.roleLabelInput = document.getElementById('role-label-input');
    this.callsignInput = document.getElementById('callsign-input');
    this.animationGrid = document.getElementById('animation-grid');
    this.iconGrid = document.getElementById('icon-grid');
    this.colorGrid = document.getElementById('color-grid');
    this.multiSlotConfig = document.getElementById('multi-slot-config');

    this.buildOptionGrids();
    this.bindSettingsInputs();
    this.setupKeyboardShortcuts();
    this.applyVolume(this.volume, false);
    this.applyQuickSlots(this.quickSlots, false);
    this.applyProfile(PROFILE_DEFAULTS, false);
    this.setScreen('main', false);
    this.updateDisplay();
  },

  sanitizeText(value, maxLength) {
    if (value === undefined || value === null) {
      return '';
    }

    return String(value).trim().slice(0, maxLength);
  },

  sanitizeProfile(profile = {}) {
    return {
      showBadge: profile.showBadge === true,
      badgeIcon: BADGE_ICONS[profile.badgeIcon] ? profile.badgeIcon : PROFILE_DEFAULTS.badgeIcon,
      accent: COLOR_OPTIONS.includes(profile.accent) ? profile.accent : PROFILE_DEFAULTS.accent,
      roleLabel: this.sanitizeText(profile.roleLabel, 14),
      callsign: this.sanitizeText(profile.callsign, 18)
    };
  },

  sanitizeAnimationStyle(animationStyle) {
    return ANIMATION_OPTIONS.some((option) => option.id === animationStyle) ? animationStyle : 'classic';
  },

  sanitizeQuickSlots(quickSlots = []) {
    return QUICK_SLOT_DEFAULTS.map((fallback, index) => {
      const rawSlot = Array.isArray(quickSlots) ? (quickSlots[index] || {}) : {};
      const isVipSlot = this.isVipSlot(index);
      let channel = parseInt(rawSlot.channel, 10);

      if (!Number.isInteger(channel) || channel < 1 || channel > 999) {
        channel = fallback.channel;
      }

      return {
        channel: isVipSlot ? null : channel,
        muted: isVipSlot ? false : (channel ? rawSlot.muted === true : false)
      };
    });
  },

  isVipSlot(slotIndex) {
    return slotIndex >= QUICK_SLOT_FREE_COUNT;
  },

  hasQuickSlotChannel(slot) {
    return Number.isInteger(slot?.channel) && slot.channel >= 1 && slot.channel <= 999;
  },

  buildOptionGrids() {
    this.animationGrid.innerHTML = ANIMATION_OPTIONS.map((option) => `
      <button type="button" class="animation-option" data-animation="${option.id}">
        <div class="animation-option-head">
          <span class="animation-option-name">${option.label}</span>
          <span class="animation-chip">${option.id === 'classic' ? 'Default' : 'Preset'}</span>
        </div>
        <span class="animation-option-copy">${option.description}</span>
      </button>
    `).join('');

    this.iconGrid.innerHTML = BADGE_OPTIONS.map((option) => `
      <button type="button" class="icon-option" data-icon="${option.id}">
        ${this.renderBadgeIcon(option.id, '#FFFFFF', 'icon-option-svg')}
        <span>${option.label}</span>
      </button>
    `).join('');

    this.colorGrid.innerHTML = COLOR_OPTIONS.map((color) => `
      <button type="button" class="color-option" data-color="${color}" style="--swatch:${color}">
        <span></span>
      </button>
    `).join('');

    this.iconGrid.querySelectorAll('[data-icon]').forEach((button) => {
      button.addEventListener('click', () => {
        this.profile.badgeIcon = button.dataset.icon;
        this.saveProfile();
      });
    });

    this.colorGrid.querySelectorAll('[data-color]').forEach((button) => {
      button.addEventListener('click', () => {
        this.profile.accent = button.dataset.color;
        this.saveProfile();
      });
    });

    this.animationGrid.querySelectorAll('[data-animation]').forEach((button) => {
      button.addEventListener('click', () => {
        this.applyAnimationStyle(button.dataset.animation, true);
      });
    });
  },

  bindSettingsInputs() {
    this.badgeToggleBtn.addEventListener('click', () => {
      this.profile.showBadge = !this.profile.showBadge;
      this.saveProfile();
    });

    this.roleLabelInput.addEventListener('input', (event) => {
      this.profile.roleLabel = event.target.value.slice(0, 14);
      this.renderSettings();
    });

    this.callsignInput.addEventListener('input', (event) => {
      this.profile.callsign = event.target.value.slice(0, 18);
      this.renderSettings();
    });

    [this.roleLabelInput, this.callsignInput].forEach((input) => {
      input.addEventListener('change', () => this.saveProfile());
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          input.blur();
        }
      });
    });
  },

  open(data = {}) {
    this.isTalking = false;

    if (typeof data.channel === 'number') {
      this.applyChannel(data.channel, false);
    }

    if (typeof data.volume === 'number') {
      this.applyVolume(data.volume, false);
    }

    if (typeof data.onRadio === 'boolean') {
      this.setRadioState(data.onRadio);
    }

    if (Array.isArray(data.members)) {
      this.members = data.members;
    }

    if (data.profile) {
      this.applyProfile(data.profile, false);
    }

    if (data.animationStyle) {
      this.applyAnimationStyle(data.animationStyle, false);
    }

    if (Array.isArray(data.quickSlots)) {
      this.applyQuickSlots(data.quickSlots, false);
    }

    this.setScreen('main', false);
    this.renderUsersOverlay();
    this.renderUsersScreen();
    this.renderSettings();

    this.container.classList.remove('hidden');
    this.isOpen = true;
    this.updateDisplay();
  },

  close(sync = true) {
    if (this.isTalking) {
      this.isTalking = false;
      this.sendNUI('radioEndTalk');
    }

    this.container.classList.add('hidden');
    this.isOpen = false;
    this.setScreen('main', false);

    if (sync) {
      this.sendNUI('radioClose');
    }
  },

  setScreen(screen, animate = true) {
    this.activeScreen = SCREEN_INDEX[screen] !== undefined ? screen : 'main';
    const offset = SCREEN_INDEX[this.activeScreen] * -100;

    if (!animate) {
      this.screenTrack.classList.add('no-animate');
      requestAnimationFrame(() => {
        this.screenTrack.style.transform = `translateX(${offset}%)`;
        requestAnimationFrame(() => this.screenTrack.classList.remove('no-animate'));
      });
    } else {
      this.screenTrack.style.transform = `translateX(${offset}%)`;
    }

    this.backBtn.classList.toggle('hidden', this.activeScreen === 'main');
    this.membersBtn.classList.toggle('hidden', this.activeScreen !== 'main');
    this.settingsBtn.classList.toggle('hidden', this.activeScreen !== 'main');

    if (this.activeScreen === 'users') {
      this.headerKicker.textContent = 'Frecuencia';
      this.headerTitle.textContent = 'Usuarios';
      this.renderUsersScreen();
      return;
    }

    if (this.activeScreen === 'settings') {
      this.headerKicker.textContent = 'Perfil publico';
      this.headerTitle.textContent = 'Configuracion';
      this.renderSettings();
      return;
    }

    this.headerKicker.textContent = 'Comunicaciones';
    this.headerTitle.textContent = 'dopa - radio script';
  },

  goBack() {
    this.setScreen('main');
  },

  showMembers() {
    this.setScreen('users');
  },

  showSettings() {
    this.setScreen('settings');
  },

  changeChannel(direction) {
    let newChannel = this.currentChannel + direction;
    if (newChannel < 1) newChannel = 999;
    if (newChannel > 999) newChannel = 1;
    this.setChannel(newChannel);
  },

  setChannel(channel) {
    this.onRadio = true;
    this.applyChannel(channel, true);
  },

  applyChannel(channel, sync = true) {
    this.currentChannel = parseInt(channel, 10) || 1;
    this.updateDisplay();

    if (sync) {
      this.sendNUI('radioSetChannel', { channel: this.currentChannel });
    }
  },

  handleChannelInput(event) {
    if (event.key === 'Enter') {
      const value = parseInt(this.channelInput.value, 10);
      if (value >= 1 && value <= 999) {
        this.setChannel(value);
        this.channelInput.value = '';
        this.channelInput.blur();
      }
    }
  },

  quickChannel(slotIndex) {
    if (this.isVipSlot(slotIndex)) return;
    const slot = this.quickSlots[slotIndex];
    if (!slot || !this.hasQuickSlotChannel(slot)) return;

    this.setChannel(slot.channel);
  },

  fillQuickSlot(slotIndex) {
    if (this.isVipSlot(slotIndex)) return;
    if (!this.quickSlots[slotIndex]) return;

    this.quickSlots[slotIndex] = {
      channel: this.currentChannel,
      muted: false
    };

    this.applyQuickSlots(this.quickSlots, true);
  },

  clearQuickSlot(slotIndex) {
    if (this.isVipSlot(slotIndex)) return;
    if (!this.quickSlots[slotIndex]) return;

    this.quickSlots[slotIndex] = {
      channel: null,
      muted: false
    };

    this.applyQuickSlots(this.quickSlots, true);
  },

  updateDisplay() {
    const channelStr = String(this.currentChannel).padStart(3, '0');
    this.channelDisplay.textContent = channelStr;
    this.channelNameDisplay.textContent = this.channelNames[this.currentChannel] || `Canal ${this.currentChannel}`;
    this.channelStatus.classList.toggle('disconnected', !this.onRadio);
    this.statusText.textContent = this.onRadio ? 'Conectado' : 'Desconectado';
    this.updateConnectionButton();
    this.renderQuickSlots();
    this.renderUsersScreen();
    this.renderSettings();
  },

  updateConnectionButton() {
    if (this.onRadio) {
      this.connectionBtn.classList.add('danger');
      this.connectionBtn.classList.remove('connect');
      this.connectionIcon.innerHTML = '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>';
      this.connectionText.textContent = 'Desconectar';
      return;
    }

    this.connectionBtn.classList.remove('danger');
    this.connectionBtn.classList.add('connect');
    this.connectionIcon.innerHTML = '<path d="M2 8.82a15.91 15.91 0 0 1 20 0"/><path d="M5 12.86a10.94 10.94 0 0 1 14 0"/><path d="M8.5 16.43a5.97 5.97 0 0 1 7 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>';
    this.connectionText.textContent = 'Conectar';
  },

  renderQuickSlots() {
    this.quickList.innerHTML = this.quickSlots.map((slot, index) => {
      const isVipSlot = this.isVipSlot(index);
      const hasChannel = this.hasQuickSlotChannel(slot);
      const isActive = hasChannel && slot.channel === this.currentChannel;
      const mutedLabel = slot.muted ? 'Silenciado' : 'Activo';

      if (isVipSlot) {
        return `
          <div class="quick-slot vip" style="--slot-index:${index}">
            <div class="quick-slot-head">
              <span class="quick-slot-kicker">Slot ${index + 1}</span>
              <span class="vip-chip">VIP</span>
            </div>
            <div class="quick-slot-main quick-slot-static">
              <span class="quick-slot-empty vip-title">Bloqueado</span>
              <span class="quick-slot-vip-copy">Disponible con acceso VIP de radio.</span>
            </div>
            <div class="quick-slot-actions quick-slot-actions-single">
              <button type="button" class="quick-slot-vip-btn" disabled>
                VIP
              </button>
            </div>
          </div>
        `;
      }

      if (!hasChannel) {
        return `
          <div class="quick-slot empty" style="--slot-index:${index}">
            <div class="quick-slot-main quick-slot-static">
              <span class="quick-slot-kicker">Slot ${index + 1}</span>
              <span class="quick-slot-empty">Sin frecuencia</span>
            </div>
            <div class="quick-slot-actions quick-slot-actions-single">
              <button type="button" class="quick-slot-add" data-slot-add="${index}">
                Agregar frecuencia
              </button>
            </div>
          </div>
        `;
      }

      return `
        <div class="quick-slot${isActive ? ' active' : ''}${slot.muted ? ' muted' : ''}" style="--slot-index:${index}">
          <button type="button" class="quick-slot-main" data-slot-switch="${index}">
            <span class="quick-slot-kicker">Slot ${index + 1}</span>
            <span class="quick-slot-value">${String(slot.channel).padStart(3, '0')}</span>
          </button>
          <div class="quick-slot-actions">
            <button type="button" class="quick-slot-toggle" data-slot-mute="${index}">
              <span>${mutedLabel}</span>
            </button>
            <button type="button" class="quick-slot-delete" data-slot-delete="${index}">
              Eliminar
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.quickList.querySelectorAll('[data-slot-switch]').forEach((button) => {
      button.addEventListener('click', () => {
        this.quickChannel(Number(button.dataset.slotSwitch));
      });
    });

    this.quickList.querySelectorAll('[data-slot-mute]').forEach((button) => {
      button.addEventListener('click', () => {
        this.toggleQuickSlotMute(Number(button.dataset.slotMute));
      });
    });

    this.quickList.querySelectorAll('[data-slot-add]').forEach((button) => {
      button.addEventListener('click', () => {
        this.fillQuickSlot(Number(button.dataset.slotAdd));
      });
    });

    this.quickList.querySelectorAll('[data-slot-delete]').forEach((button) => {
      button.addEventListener('click', () => {
        this.clearQuickSlot(Number(button.dataset.slotDelete));
      });
    });
  },

  setVolume(value) {
    this.applyVolume(value, true);
  },

  applyVolume(value, sync = true) {
    this.volume = Math.max(0, Math.min(100, parseInt(value, 10) || 0));

    if (this.volume > 0) {
      this.previousVolume = this.volume;
    }

    this.isMuted = this.volume === 0;
    this.volumeSlider.value = this.volume;
    this.volumeValue.textContent = `${this.volume}%`;
    this.volumeFill.style.width = `${this.volume}%`;
    this.updateMuteButton();
    this.renderSettings();

    if (sync) {
      this.sendNUI('radioSetVolume', { volume: this.volume });
    }
  },

  startTalk() {
    if (!this.onRadio || this.isTalking) return;

    this.isTalking = true;
    this.sendNUI('radioStartTalk');
  },

  endTalk() {
    if (!this.isTalking) return;

    this.isTalking = false;
    this.sendNUI('radioEndTalk');
  },

  toggleMute() {
    if (this.isMuted) {
      this.applyVolume(this.previousVolume || 75, true);
      return;
    }

    this.previousVolume = this.volume > 0 ? this.volume : (this.previousVolume || 75);
    this.applyVolume(0, true);
  },

  updateMuteButton() {
    if (this.isMuted) {
      this.muteBtn.classList.add('muted');
      this.muteIcon.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
      this.muteText.textContent = 'Silenciado';
      return;
    }

    this.muteBtn.classList.remove('muted');
    this.muteIcon.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
    this.muteText.textContent = 'Silenciar';
  },

  handleConnectionAction() {
    if (this.onRadio) {
      this.disconnect();
      return;
    }

    this.setChannel(this.currentChannel);
  },

  disconnect() {
    this.onRadio = false;
    this.members = [];
    this.renderUsersOverlay();
    this.updateDisplay();
    this.sendNUI('radioDisconnect');
  },

  applyQuickSlots(quickSlots, sync = true) {
    this.quickSlots = this.sanitizeQuickSlots(quickSlots);
    this.renderQuickSlots();
    this.renderSettings();

    if (sync) {
      this.sendNUI('radioSaveQuickSlots', { quickSlots: this.quickSlots });
    }
  },

  toggleQuickSlotMute(slotIndex) {
    if (this.isVipSlot(slotIndex)) return;
    if (!this.quickSlots[slotIndex] || !this.hasQuickSlotChannel(this.quickSlots[slotIndex])) return;

    this.quickSlots[slotIndex].muted = !this.quickSlots[slotIndex].muted;
    this.applyQuickSlots(this.quickSlots, true);
  },

  setQuickSlotChannel(slotIndex, channel) {
    if (this.isVipSlot(slotIndex)) return;
    if (!this.quickSlots[slotIndex]) return;

    const rawValue = String(channel ?? '').trim();

    if (!rawValue) {
      this.clearQuickSlot(slotIndex);
      return;
    }

    const parsedChannel = parseInt(rawValue, 10);
    if (!Number.isInteger(parsedChannel) || parsedChannel < 1 || parsedChannel > 999) {
      this.renderSettings();
      return;
    }

    this.quickSlots[slotIndex].channel = parsedChannel;
    this.applyQuickSlots(this.quickSlots, true);
  },

  applyAnimationStyle(animationStyle, sync = true) {
    this.animationStyle = this.sanitizeAnimationStyle(animationStyle);
    this.renderSettings();

    if (sync) {
      this.sendNUI('radioSetAnimation', { animationStyle: this.animationStyle });
    }
  },

  applyProfile(profile, sync = true) {
    this.profile = this.sanitizeProfile(profile);
    if (document.activeElement !== this.roleLabelInput) {
      this.roleLabelInput.value = this.profile.roleLabel;
    }

    if (document.activeElement !== this.callsignInput) {
      this.callsignInput.value = this.profile.callsign;
    }
    this.renderSettings();

    if (sync) {
      this.sendNUI('radioSaveProfile', { profile: this.profile });
    }
  },

  saveProfile() {
    this.applyProfile(this.profile, true);
  },

  renderBadgeIcon(icon, color, extraClass = '') {
    const paths = BADGE_ICONS[icon] || BADGE_ICONS.crown;
    return `<svg class="badge-icon ${extraClass}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" style="color:${color}">${paths}</svg>`;
  },

  memberAccent(member) {
    return member.accent || '#FFD166';
  },

  hasPublicIdentity(member) {
    return Boolean(member && (member.callsign || member.roleLabel));
  },

  memberMetaText(member) {
    if (member.callsign && member.roleLabel) {
      return 'Identidad publica activa';
    }

    if (member.callsign) {
      return 'Callsign publico';
    }

    if (member.roleLabel) {
      return 'Etiqueta publica activa';
    }

    return member.isSelf ? 'Perfil discreto' : 'Miembro del canal';
  },

  memberDisplayName(member) {
    if (member.callsign) {
      return member.callsign;
    }

    if (member.roleLabel) {
      return member.roleLabel;
    }

    return member.name;
  },

  renderRoleChip(member, extraClass = '') {
    if (!member.roleLabel || !member.callsign) {
      return '';
    }

    return `<span class="identity-role ${extraClass}" style="--identity-accent:${this.memberAccent(member)}">${member.roleLabel}</span>`;
  },

  renderUsersOverlay() {
    this.usersOverlay.innerHTML = '';

    if (!this.onRadio || !this.members.length) {
      this.usersOverlay.classList.add('hidden');
      return;
    }

    this.usersOverlay.classList.remove('hidden');

    this.members.forEach((member) => {
      const item = document.createElement('div');
      item.className = `user-item${member.talking ? ' talking' : ''}`;

      let html = '';
      if (member.showBadge) {
        html += this.renderBadgeIcon(member.badgeIcon, this.memberAccent(member), 'overlay-icon');
      }

      const nameColor = member.showBadge ? this.memberAccent(member) : 'rgba(255, 255, 255, 0.88)';
      html += `<span class="user-name" style="color:${nameColor};">${this.memberDisplayName(member)}</span>`;
      html += this.renderRoleChip(member, 'overlay-role');
      html += `<div class="audio-indicator${member.talking ? '' : ' hidden'}"><span></span><span></span><span></span></div>`;

      item.innerHTML = html;
      this.usersOverlay.appendChild(item);
    });
  },

  renderUsersScreen() {
    const talkers = this.members.filter((member) => member.talking).length;
    const me = this.members.find((member) => member.isSelf) || {
      name: 'Tu personaje',
      callsign: this.profile.callsign,
      roleLabel: this.profile.roleLabel,
      badgeIcon: this.profile.badgeIcon,
      accent: this.profile.accent,
      showBadge: this.profile.showBadge,
      talking: this.isTalking,
      isSelf: true
    };

    this.usersFrequency.textContent = String(this.currentChannel).padStart(3, '0');
    this.usersCount.textContent = String(this.members.length);
    this.usersTalkingCount.textContent = String(talkers);

    this.usersSelfCard.innerHTML = `
      <div class="self-card-head">
        <div class="self-card-icon" style="--accent:${this.profile.accent}">
          ${this.profile.showBadge ? this.renderBadgeIcon(this.profile.badgeIcon, this.profile.accent, 'self-icon') : ''}
        </div>
        <div class="self-card-copy">
          <span class="self-card-kicker">Tu identidad</span>
          <div class="identity-heading">
            <strong>${this.memberDisplayName(me) || 'Tu personaje'}</strong>
            ${this.renderRoleChip(me, 'self-role-chip')}
          </div>
          <span>${this.memberMetaText(me)}</span>
        </div>
      </div>
      <div class="self-card-chip" style="--accent:${this.profile.accent}">
        ${this.onRadio ? 'Listo para transmitir' : 'Fuera de frecuencia'}
      </div>
    `;

    if (!this.onRadio) {
      this.membersPanelList.innerHTML = '<div class="empty-panel-state">Conecta tu radio para ver al roster en tiempo real.</div>';
      return;
    }

    if (!this.members.length) {
      this.membersPanelList.innerHTML = '<div class="empty-panel-state">Todavia no hay datos visibles en esta frecuencia.</div>';
      return;
    }

    this.membersPanelList.innerHTML = this.members.map((member) => `
      <article class="member-card${member.talking ? ' talking' : ''}" style="--member-accent:${this.memberAccent(member)}">
        <div class="member-card-main">
          <div class="member-card-icon">
            ${member.showBadge ? this.renderBadgeIcon(member.badgeIcon, this.memberAccent(member), 'member-card-svg') : '<span class="member-card-fallback"></span>'}
          </div>
          <div class="member-card-copy">
            <div class="member-card-heading">
              <div class="member-card-name">${this.memberDisplayName(member)}</div>
              ${this.renderRoleChip(member, 'member-role-chip')}
            </div>
            <div class="member-card-meta">${this.memberMetaText(member)}</div>
          </div>
        </div>
        <div class="member-card-side">
          <span class="member-card-state">${member.isSelf ? 'Tu' : (member.talking ? 'Hablando' : 'Escuchando')}</span>
        </div>
      </article>
    `).join('');
  },

  renderSettings() {
    this.badgeToggleBtn.classList.toggle('active', this.profile.showBadge);
    this.badgeToggleBtn.textContent = this.profile.showBadge ? 'Activo' : 'Oculto';

    this.profilePreviewCard.innerHTML = `
      <div class="preview-card" style="--preview-accent:${this.profile.accent}">
        <div class="preview-icon-wrap">
          ${this.profile.showBadge ? this.renderBadgeIcon(this.profile.badgeIcon, this.profile.accent, 'preview-icon') : '<div class="preview-icon-placeholder"></div>'}
        </div>
        <div class="preview-copy">
          <span class="preview-kicker">${this.profile.showBadge ? 'Visible en la frecuencia' : 'Perfil discreto'}</span>
          <strong>${this.profile.roleLabel || 'Sin etiqueta'}</strong>
          <span>${this.profile.callsign || 'Sin callsign'} / ${this.onRadio ? 'En linea' : 'Fuera de linea'}</span>
        </div>
      </div>
    `;

    this.roleLabelInput.value = this.profile.roleLabel;
    this.callsignInput.value = this.profile.callsign;
    this.iconGrid.querySelectorAll('[data-icon]').forEach((button) => {
      button.classList.toggle('active', button.dataset.icon === this.profile.badgeIcon);
    });
    this.colorGrid.querySelectorAll('[data-color]').forEach((button) => {
      button.classList.toggle('active', button.dataset.color === this.profile.accent);
    });
    this.animationGrid.querySelectorAll('[data-animation]').forEach((button) => {
      button.classList.toggle('active', button.dataset.animation === this.animationStyle);
    });

    if (!this.multiSlotConfig) {
      return;
    }

    this.multiSlotConfig.innerHTML = this.quickSlots.map((slot, index) => {
      const isVipSlot = this.isVipSlot(index);
      const hasChannel = this.hasQuickSlotChannel(slot);
      const rowState = hasChannel && slot.channel === this.currentChannel ? ' active' : '';
      const metaText = hasChannel
        ? `${slot.muted ? 'Entrara silenciado' : 'Entrara con audio'} - Slot personal`
        : 'Sin frecuencia guardada';

      if (isVipSlot) {
        return `
      <div class="multi-slot-row vip" style="--slot-index:${index}">
        <div class="multi-slot-copy">
          <div class="multi-slot-title-row">
            <span class="multi-slot-name">Slot ${index + 1}</span>
            <span class="vip-chip">VIP</span>
          </div>
          <span class="multi-slot-meta">Slot premium bloqueado. Se habilita con acceso VIP de radio.</span>
        </div>
        <input
          class="multi-slot-input vip"
          type="text"
          value="VIP"
          disabled
        >
        <div class="multi-slot-actions">
          <button type="button" class="multi-slot-fill vip" disabled>
            Solo VIP
          </button>
          <button type="button" class="multi-slot-toggle" disabled>
            Bloqueado
          </button>
          <button type="button" class="multi-slot-remove" disabled>
            VIP
          </button>
        </div>
      </div>
    `;
      }

      return `
      <div class="multi-slot-row${rowState}${hasChannel ? '' : ' empty'}" style="--slot-index:${index}">
        <div class="multi-slot-copy">
          <span class="multi-slot-name">Slot ${index + 1}</span>
          <span class="multi-slot-meta">${metaText}</span>
        </div>
        <input
          class="multi-slot-input"
          type="number"
          min="1"
          max="999"
          value="${hasChannel ? slot.channel : ''}"
          placeholder="Vacio"
          data-slot-input="${index}"
        >
        <div class="multi-slot-actions">
          <button type="button" class="multi-slot-fill${hasChannel ? '' : ' empty'}" data-slot-fill="${index}">
            ${hasChannel ? 'Guardar actual' : 'Agregar actual'}
          </button>
          <button type="button" class="multi-slot-toggle${slot.muted ? ' active' : ''}" data-slot-toggle="${index}" ${hasChannel ? '' : 'disabled'}>
            ${hasChannel ? (slot.muted ? 'Muteado' : 'Audio') : 'Sin audio'}
          </button>
          <button type="button" class="multi-slot-remove" data-slot-remove="${index}" ${hasChannel ? '' : 'disabled'}>
            Eliminar
          </button>
        </div>
      </div>
    `;
    }).join('');

    this.multiSlotConfig.querySelectorAll('[data-slot-input]').forEach((input) => {
      input.addEventListener('change', () => {
        this.setQuickSlotChannel(Number(input.dataset.slotInput), input.value);
      });

      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          input.blur();
        }
      });
    });

    this.multiSlotConfig.querySelectorAll('[data-slot-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        this.toggleQuickSlotMute(Number(button.dataset.slotToggle));
      });
    });

    this.multiSlotConfig.querySelectorAll('[data-slot-fill]').forEach((button) => {
      button.addEventListener('click', () => {
        this.fillQuickSlot(Number(button.dataset.slotFill));
      });
    });

    this.multiSlotConfig.querySelectorAll('[data-slot-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        this.clearQuickSlot(Number(button.dataset.slotRemove));
      });
    });
  },

  setMemberTalking(memberId, isTalking) {
    const member = this.members.find((item) => item.id === memberId);
    if (!member) return;

    member.talking = isTalking;
    this.renderUsersOverlay();
    this.renderUsersScreen();
  },

  setRadioState(onRadio) {
    this.onRadio = onRadio === true;

    if (!this.onRadio) {
      this.isTalking = false;
      this.usersOverlay.classList.add('hidden');
    }

    this.updateDisplay();
  },

  isTypingTarget(element) {
    if (!element) {
      return false;
    }

    const tagName = element.tagName;
    return element.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA';
  },

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      const isTyping = this.isTypingTarget(document.activeElement);

      if ((event.key === 'n' || event.key === 'N') && !isTyping) {
        if (!this.isTalking) {
          this.startTalk();
        }
      }

      if (event.key === 'Escape' && this.isOpen) {
        if (this.activeScreen !== 'main') {
          this.goBack();
          return;
        }

        this.close();
      }

      if (this.isOpen && this.activeScreen === 'main' && !isTyping) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          this.changeChannel(1);
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          this.changeChannel(-1);
        }
      }
    });

    document.addEventListener('keyup', (event) => {
      if ((event.key === 'n' || event.key === 'N') && this.isTalking) {
        this.endTalk();
      }
    });
  },

  sendNUI(event, data = {}) {
    if (typeof GetParentResourceName !== 'function') return;

    fetch(`https://${GetParentResourceName()}/${event}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  }
};

window.addEventListener('message', (event) => {
  const data = event.data;

  switch (data.action) {
    case 'open':
      Radio.open(data);
      break;
    case 'close':
      Radio.close(false);
      break;
    case 'setChannel':
      Radio.applyChannel(data.channel, false);
      break;
    case 'setVolume':
      Radio.applyVolume(data.volume, false);
      break;
    case 'setRadioState':
      Radio.setRadioState(data.onRadio);
      break;
    case 'setProfile':
      Radio.applyProfile(data.profile, false);
      break;
    case 'setAnimationStyle':
      Radio.applyAnimationStyle(data.animationStyle, false);
      break;
    case 'setQuickSlots':
      Radio.applyQuickSlots(data.quickSlots || QUICK_SLOT_DEFAULTS, false);
      break;
    case 'updateMembers':
      Radio.members = data.members || [];
      Radio.renderUsersOverlay();
      Radio.renderUsersScreen();
      break;
    case 'memberTalking':
      Radio.setMemberTalking(data.memberId, data.talking);
      break;
    case 'showUsersOverlay':
      if (Radio.onRadio && Radio.members.length) {
        Radio.usersOverlay.classList.remove('hidden');
      }
      break;
    case 'hideUsersOverlay':
      Radio.usersOverlay.classList.add('hidden');
      break;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  Radio.init();
});

