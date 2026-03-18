local RADIO_ITEM = 'radio'
local MAX_CHANNEL = 999
local SETTINGS_KVP = 'dopa_radio_settings'
local DEFAULT_ANIMATION_STYLE = 'classic'
local QUICK_SLOT_COUNT = 4
local QUICK_SLOT_FREE_COUNT = 2
local QUICK_SLOT_VERSION = 1

local DEFAULT_PROFILE = {
    showBadge = false,
    badgeIcon = 'crown',
    accent = '#FFD166',
    roleLabel = '',
    callsign = ''
}

local DEFAULT_QUICK_SLOTS = {
    { muted = false },
    { muted = false },
    { muted = false },
    { muted = false }
}

local VALID_BADGE_ICONS = {
    crown = true,
    star = true,
    shield = true,
    bolt = true,
    diamond = true,
    flame = true
}

local VALID_ACCENTS = {
    ['#FFD166'] = true,
    ['#F97316'] = true,
    ['#22C55E'] = true,
    ['#38BDF8'] = true,
    ['#E879F9'] = true,
    ['#FB7185'] = true,
    ['#A3E635'] = true,
    ['#F8FAFC'] = true
}

local ANIMATION_PRESETS = {
    classic = {
        dict = 'random@arrests',
        anim = 'generic_radio_enter',
        flag = 50,
        bone = 57005,
        pos = vec3(0.14, 0.01, -0.02),
        rot = vec3(110.0, 120.0, -15.0),
        useProp = true
    },
    listen = {
        dict = 'cellphone@',
        anim = 'cellphone_call_listen_base',
        flag = 49,
        bone = 57005,
        pos = vec3(0.14, 0.01, -0.02),
        rot = vec3(110.0, 120.0, -15.0),
        useProp = true
    },
    tactical = {
        dict = 'random@arrests',
        anim = 'generic_radio_chatter',
        flag = 49,
        bone = 57005,
        pos = vec3(0.13, 0.02, -0.01),
        rot = vec3(95.0, 120.0, -10.0),
        useProp = true
    }
}

local OPEN_RADIO_ANIMATION = {
    dict = 'cellphone@',
    anim = 'cellphone_text_read_base',
    flag = 49,
    bone = 57005,
    pos = vec3(0.14, 0.01, -0.02),
    rot = vec3(110.0, 120.0, -15.0),
    useProp = true
}

local state = {
    isOpen = false,
    hasRadio = false,
    voiceChannel = 0,
    pendingChannel = 0,
    currentChannel = 1,
    volume = 75,
    lastVolume = 75,
    manualMuted = false,
    members = {},
    prop = 0,
    isTalkingOnRadio = false,
    animationStyle = DEFAULT_ANIMATION_STYLE,
    quickSlots = {},
    profile = {
        showBadge = DEFAULT_PROFILE.showBadge,
        badgeIcon = DEFAULT_PROFILE.badgeIcon,
        accent = DEFAULT_PROFILE.accent,
        roleLabel = DEFAULT_PROFILE.roleLabel,
        callsign = DEFAULT_PROFILE.callsign
    },
}

local function isVoiceReady()
    return GetResourceState('pma-voice') == 'started'
end

local function setPmaRadioAnimationDisabled(shouldDisable)
    if not isVoiceReady() then
        return
    end

    exports['pma-voice']:setDisableRadioAnim(shouldDisable == true)
end

local function getServerId()
    return GetPlayerServerId(PlayerId())
end

local function notify(message, type)
    lib.notify({
        description = message,
        type = type or 'inform'
    })
end

local function sendUi(action, data)
    local payload = data or {}
    payload.action = action
    SendNUIMessage(payload)
end

local function sanitizeShortText(value, maxLength)
    if value == nil then
        return ''
    end

    local text = tostring(value)
    text = text:gsub('^%s+', ''):gsub('%s+$', '')

    if #text > maxLength then
        text = text:sub(1, maxLength)
    end

    return text
end

local function sanitizeProfile(profile)
    profile = type(profile) == 'table' and profile or {}

    local badgeIcon = VALID_BADGE_ICONS[profile.badgeIcon] and profile.badgeIcon or DEFAULT_PROFILE.badgeIcon
    local accent = VALID_ACCENTS[profile.accent] and profile.accent or DEFAULT_PROFILE.accent

    return {
        showBadge = profile.showBadge == true,
        badgeIcon = badgeIcon,
        accent = accent,
        roleLabel = sanitizeShortText(profile.roleLabel, 14),
        callsign = sanitizeShortText(profile.callsign, 18)
    }
end

local function sanitizeAnimationStyle(animationStyle)
    animationStyle = tostring(animationStyle or '')

    if ANIMATION_PRESETS[animationStyle] then
        return animationStyle
    end

    return DEFAULT_ANIMATION_STYLE
end

local saveSettings

local function isLegacyDefaultQuickSlots(quickSlots)
    if type(quickSlots) ~= 'table' then
        return false
    end

    for i = 1, QUICK_SLOT_COUNT do
        local slot = quickSlots[i]
        if type(slot) ~= 'table' then
            return false
        end

        if math.floor(tonumber(slot.channel) or 0) ~= i then
            return false
        end

        if slot.muted == true then
            return false
        end
    end

    return true
end

local function sanitizeQuickSlots(quickSlots)
    local sanitized = {}

    for i = 1, QUICK_SLOT_COUNT do
        local slot = type(quickSlots) == 'table' and quickSlots[i] or nil
        local isVipSlot = i > QUICK_SLOT_FREE_COUNT
        local channel = tonumber(slot and slot.channel)

        if channel then
            channel = math.floor(channel)
        end

        if channel and (channel < 1 or channel > MAX_CHANNEL) then
            channel = nil
        end

        sanitized[i] = {
            muted = slot and slot.muted == true or false
        }

        if isVipSlot then
            sanitized[i].muted = false
        elseif channel then
            sanitized[i].channel = channel
        else
            sanitized[i].muted = false
        end
    end

    return sanitized
end

local function isQuickSlotMuted(channel)
    channel = tonumber(channel) or 0

    for i = 1, #state.quickSlots do
        local slot = state.quickSlots[i]
        if slot.channel == channel then
            return slot.muted == true
        end
    end

    return false
end

local function applyEffectiveVolume(syncUiState)
    local activeChannel = state.voiceChannel > 0 and state.voiceChannel or state.currentChannel
    local shouldMute = state.manualMuted or isQuickSlotMuted(activeChannel)
    local effectiveVolume = shouldMute and 0 or math.max(1, math.min(100, state.lastVolume))

    state.volume = effectiveVolume

    if isVoiceReady() then
        exports['pma-voice']:setRadioVolume(effectiveVolume)
    end

    saveSettings()

    if syncUiState then
        sendUi('setVolume', { volume = state.volume })
    end
end

saveSettings = function()
    SetResourceKvp(SETTINGS_KVP, json.encode({
        channel = state.currentChannel,
        volume = state.volume,
        lastVolume = state.lastVolume,
        manualMuted = state.manualMuted,
        animationStyle = state.animationStyle,
        quickSlotsVersion = QUICK_SLOT_VERSION,
        quickSlots = state.quickSlots,
        profile = state.profile
    }))
end

local function loadSettings()
    state.profile = sanitizeProfile(DEFAULT_PROFILE)
    state.animationStyle = DEFAULT_ANIMATION_STYLE
    state.quickSlots = sanitizeQuickSlots(DEFAULT_QUICK_SLOTS)
    state.manualMuted = false

    local raw = GetResourceKvpString(SETTINGS_KVP)
    if not raw then return end

    local ok, decoded = pcall(json.decode, raw)
    if not ok or type(decoded) ~= 'table' then return end

    state.currentChannel = math.max(1, math.min(MAX_CHANNEL, tonumber(decoded.channel) or state.currentChannel))
    state.volume = math.max(0, math.min(100, tonumber(decoded.volume) or state.volume))
    state.lastVolume = math.max(1, math.min(100, tonumber(decoded.lastVolume) or state.lastVolume))
    state.manualMuted = decoded.manualMuted == true
    state.animationStyle = sanitizeAnimationStyle(decoded.animationStyle)
    if decoded.quickSlotsVersion ~= QUICK_SLOT_VERSION then
        state.quickSlots = sanitizeQuickSlots(DEFAULT_QUICK_SLOTS)
    elseif isLegacyDefaultQuickSlots(decoded.quickSlots) then
        state.quickSlots = sanitizeQuickSlots(DEFAULT_QUICK_SLOTS)
    else
        state.quickSlots = sanitizeQuickSlots(decoded.quickSlots)
    end
    state.profile = sanitizeProfile(decoded.profile)
end

local function updateHasRadio()
    state.hasRadio = (exports.ox_inventory:Search('count', RADIO_ITEM) or 0) > 0
    return state.hasRadio
end

local function mapMembers(members)
    local playerServerId = getServerId()
    local mapped = {}

    for i = 1, #members do
        local member = members[i]
        local isSelf = member.id == playerServerId
        local profile = sanitizeProfile(member)

        mapped[i] = {
            id = member.id,
            name = member.name,
            talking = member.talking == true,
            isSelf = isSelf,
            showBadge = profile.showBadge,
            badgeIcon = profile.badgeIcon,
            accent = profile.accent,
            roleLabel = profile.roleLabel,
            callsign = profile.callsign
        }
    end

    table.sort(mapped, function(a, b)
        if a.isSelf ~= b.isSelf then
            return a.isSelf
        end

        if a.talking ~= b.talking then
            return a.talking
        end

        return (a.name or '') < (b.name or '')
    end)

    return mapped
end

local function refreshUiState()
    sendUi('setChannel', { channel = state.currentChannel })
    sendUi('setVolume', { volume = state.volume })
    sendUi('setRadioState', { onRadio = state.voiceChannel > 0 })
    sendUi('setAnimationStyle', { animationStyle = state.animationStyle })
    sendUi('setQuickSlots', { quickSlots = state.quickSlots })
    sendUi('setProfile', { profile = state.profile })
    sendUi('updateMembers', { members = state.members })

    if state.voiceChannel > 0 then
        sendUi('showUsersOverlay')
    else
        sendUi('hideUsersOverlay')
    end
end

local function setVolume(volume, syncUiState)
    volume = math.floor(tonumber(volume) or state.lastVolume)
    volume = math.max(0, math.min(100, volume))

    if volume > 0 then
        state.lastVolume = volume
        state.manualMuted = false
    else
        state.manualMuted = true
    end

    applyEffectiveVolume(syncUiState)
end

local function requestMembers(channel)
    channel = tonumber(channel) or state.voiceChannel

    if channel and channel > 0 then
        TriggerServerEvent('dopa_radio_script:server:requestMembers', channel)
    end
end

local function syncProfile()
    TriggerServerEvent('dopa_radio_script:server:updateProfile', state.profile)
end

local function stopRadioAnimation()
    local ped = PlayerPedId()

    for _, preset in pairs(ANIMATION_PRESETS) do
        StopAnimTask(ped, preset.dict, preset.anim, 1.0)
    end

    StopAnimTask(ped, OPEN_RADIO_ANIMATION.dict, OPEN_RADIO_ANIMATION.anim, 1.0)

    if state.prop ~= 0 and DoesEntityExist(state.prop) then
        DeleteEntity(state.prop)
    end

    state.prop = 0
end

local function startRadioAnimation(preset)
    local ped = PlayerPedId()
    preset = preset or ANIMATION_PRESETS[state.animationStyle] or ANIMATION_PRESETS[DEFAULT_ANIMATION_STYLE]

    if IsEntityDead(ped) then return end

    stopRadioAnimation()

    lib.requestAnimDict(preset.dict)
    TaskPlayAnim(ped, preset.dict, preset.anim, 2.0, 2.0, -1, preset.flag, 0, false, false, false)

    if preset.useProp == false then
        return
    end

    state.prop = CreateObject(`prop_cs_hand_radio`, 0.0, 0.0, 0.0, true, true, false)
    AttachEntityToEntity(
        state.prop,
        ped,
        GetPedBoneIndex(ped, preset.bone),
        preset.pos.x,
        preset.pos.y,
        preset.pos.z,
        preset.rot.x,
        preset.rot.y,
        preset.rot.z,
        true,
        false,
        false,
        false,
        2,
        true
    )
end

local function startOpenRadioAnimation()
    startRadioAnimation(OPEN_RADIO_ANIMATION)
end

local function startTalkRadioAnimation()
    startRadioAnimation(ANIMATION_PRESETS[state.animationStyle] or ANIMATION_PRESETS[DEFAULT_ANIMATION_STYLE])
end

local function refreshRadioAnimation()
    if state.isTalkingOnRadio then
        startTalkRadioAnimation()
        return
    end

    if state.isOpen then
        startOpenRadioAnimation()
        return
    end

    stopRadioAnimation()
end

local function setAnimationStyle(animationStyle, syncUiState)
    state.animationStyle = sanitizeAnimationStyle(animationStyle)
    saveSettings()

    if state.isTalkingOnRadio then
        startTalkRadioAnimation()
    end

    if syncUiState then
        sendUi('setAnimationStyle', { animationStyle = state.animationStyle })
    end
end

local function setSelfTalkingState(isTalking)
    isTalking = isTalking == true

    if state.isTalkingOnRadio == isTalking then
        return
    end

    state.isTalkingOnRadio = isTalking
    refreshRadioAnimation()
end

local function closeRadio(syncUiCallback)
    if not state.isOpen then return end

    state.isOpen = false
    SetNuiFocus(false, false)
    refreshRadioAnimation()

    if syncUiCallback then
        sendUi('close')
    end
end

local function leaveRadio(showNotification)
    local oldChannel = state.voiceChannel
    state.pendingChannel = 0
    setSelfTalkingState(false)

    if state.voiceChannel > 0 and isVoiceReady() then
        ExecuteCommand('-radiotalk')
        exports['pma-voice']:setRadioChannel(0)
        exports['pma-voice']:setVoiceProperty('radioEnabled', false)
    end

    state.voiceChannel = 0
    state.members = {}

    refreshUiState()
    saveSettings()

    if showNotification and oldChannel > 0 then
        notify(('Saliste de la frecuencia %s.'):format(oldChannel))
    end
end

local function joinRadio(channel)
    channel = math.floor(tonumber(channel) or 0)

    if channel < 1 or channel > MAX_CHANNEL then
        notify(('La frecuencia debe estar entre 1 y %s.'):format(MAX_CHANNEL), 'error')
        refreshUiState()
        return
    end

    if not updateHasRadio() then
        notify('Necesitas tener una radio en el inventario.', 'error')
        refreshUiState()
        return
    end

    if not isVoiceReady() then
        notify('pma-voice no esta iniciado todavia.', 'error')
        refreshUiState()
        return
    end

    state.currentChannel = channel
    state.voiceChannel = channel
    state.pendingChannel = channel
    state.members = {}

    exports['pma-voice']:setVoiceProperty('radioEnabled', true)
    exports['pma-voice']:setRadioChannel(channel)
    applyEffectiveVolume(false)

    saveSettings()
    refreshUiState()
    syncProfile()
end

local function saveQuickSlots(quickSlots, syncUiState)
    state.quickSlots = sanitizeQuickSlots(quickSlots)

    if state.voiceChannel > 0 or state.currentChannel > 0 then
        applyEffectiveVolume(syncUiState)
    else
        saveSettings()
    end

    if syncUiState then
        sendUi('setQuickSlots', { quickSlots = state.quickSlots })
    end
end

local function canOpenRadio()
    if not updateHasRadio() then
        notify('Necesitas tener una radio en el inventario.', 'error')
        return false
    end

    local ped = PlayerPedId()
    if IsEntityDead(ped) or LocalPlayer.state.isDead then
        notify('No puedes usar la radio en este estado.', 'error')
        return false
    end

    return true
end

local function openRadio()
    if not canOpenRadio() then return end

    -- If the player is transmitting, stop PTT when opening the UI to avoid "stuck talking".
    if state.isTalkingOnRadio then
        setSelfTalkingState(false)

        if state.voiceChannel > 0 and isVoiceReady() then
            ExecuteCommand('-radiotalk')
        end
    end

    state.isOpen = true
    SetNuiFocus(true, true)
    refreshRadioAnimation()

    sendUi('open', {
        channel = state.currentChannel,
        volume = state.volume,
        members = state.members,
        onRadio = state.voiceChannel > 0,
        animationStyle = state.animationStyle,
        quickSlots = state.quickSlots,
        profile = state.profile
    })

    if state.voiceChannel > 0 then
        requestMembers(state.voiceChannel)
    end
end

local function toggleRadio()
    if state.isOpen then
        closeRadio(true)
        return
    end

    openRadio()
end

local function updateMemberTalking(memberId, isTalking)
    for i = 1, #state.members do
        if state.members[i].id == memberId then
            state.members[i].talking = isTalking
            sendUi('memberTalking', {
                memberId = memberId,
                talking = isTalking
            })
            return
        end
    end
end

local function initializeState()
    loadSettings()
    updateHasRadio()
    setPmaRadioAnimationDisabled(true)

    if isVoiceReady() then
        local volume = exports['pma-voice']:getRadioVolume()
        if volume then
            state.volume = math.floor(volume)
            if state.volume > 0 then
                state.lastVolume = state.volume
            end
        else
            exports['pma-voice']:setRadioVolume(state.volume)
        end
    end

    syncProfile()

    local currentRadioChannel = tonumber(LocalPlayer.state.radioChannel) or 0
    state.voiceChannel = currentRadioChannel
    if currentRadioChannel > 0 then
        state.currentChannel = currentRadioChannel
        applyEffectiveVolume(false)
        requestMembers(currentRadioChannel)
    else
        state.members = {}
    end

    refreshUiState()
end

function useRadio(_, _, _)
    toggleRadio()
end

exports('useRadio', useRadio)
exports('toggleRadio', function()
    toggleRadio()
end)

RegisterNetEvent('dopa_radio_script:client:open', function()
    openRadio()
end)

RegisterNetEvent('dopa_radio_script:client:toggle', function()
    toggleRadio()
end)

RegisterNetEvent('dopa_radio_script:client:updateMembers', function(channel, members)
    channel = tonumber(channel) or 0

    if channel ~= state.voiceChannel then return end

    state.members = mapMembers(members or {})
    sendUi('updateMembers', { members = state.members })

    if state.voiceChannel > 0 then
        sendUi('showUsersOverlay')
    else
        sendUi('hideUsersOverlay')
    end
end)

RegisterNUICallback('radioClose', function(_, cb)
    closeRadio(false)
    cb('ok')
end)

RegisterNUICallback('radioSetChannel', function(data, cb)
    joinRadio(data.channel)
    cb('ok')
end)

RegisterNUICallback('radioSetVolume', function(data, cb)
    setVolume(data.volume, false)
    cb('ok')
end)

RegisterNUICallback('radioSetAnimation', function(data, cb)
    setAnimationStyle(data.animationStyle, false)
    cb('ok')
end)

RegisterNUICallback('radioSaveQuickSlots', function(data, cb)
    saveQuickSlots(data.quickSlots, true)
    cb('ok')
end)

RegisterNUICallback('radioDisconnect', function(_, cb)
    leaveRadio(true)
    cb('ok')
end)

RegisterNUICallback('radioSaveProfile', function(data, cb)
    state.profile = sanitizeProfile(data.profile)
    saveSettings()
    refreshUiState()
    syncProfile()

    if state.voiceChannel > 0 then
        requestMembers(state.voiceChannel)
    end

    cb('ok')
end)

RegisterNUICallback('radioStartTalk', function(_, cb)
    if state.voiceChannel > 0 and isVoiceReady() then
        setSelfTalkingState(true)
        ExecuteCommand('+radiotalk')
    end

    cb('ok')
end)

RegisterNUICallback('radioEndTalk', function(_, cb)
    setSelfTalkingState(false)

    if state.voiceChannel > 0 and isVoiceReady() then
        ExecuteCommand('-radiotalk')
    end

    cb('ok')
end)

RegisterNetEvent('pma-voice:syncRadioData', function()
    if state.pendingChannel > 0 then
        state.voiceChannel = state.pendingChannel
        state.currentChannel = state.pendingChannel
        state.pendingChannel = 0
    end

    if state.voiceChannel > 0 then
        applyEffectiveVolume(false)
        SetTimeout(100, function()
            requestMembers(state.voiceChannel)
        end)
    end
end)

RegisterNetEvent('pma-voice:addPlayerToRadio', function()
    if state.voiceChannel > 0 then
        SetTimeout(100, function()
            requestMembers(state.voiceChannel)
        end)
    end
end)

RegisterNetEvent('pma-voice:removePlayerFromRadio', function(playerId)
    if playerId == getServerId() then
        if state.pendingChannel > 0 then
            return
        end

        setSelfTalkingState(false)
        state.voiceChannel = 0
        state.members = {}
        refreshUiState()
        return
    end

    if state.voiceChannel > 0 then
        SetTimeout(100, function()
            requestMembers(state.voiceChannel)
        end)
    end
end)

RegisterNetEvent('pma-voice:radioActive', function(isTalking)
    setSelfTalkingState(isTalking == true)
    updateMemberTalking(getServerId(), isTalking == true)
end)

RegisterNetEvent('pma-voice:setTalkingOnRadio', function(playerId, isTalking)
    if playerId == getServerId() then
        setSelfTalkingState(isTalking == true)
    end

    updateMemberTalking(playerId, isTalking == true)
end)

RegisterNetEvent('pma-voice:clSetPlayerRadio', function(channel)
    channel = tonumber(channel) or 0
    state.pendingChannel = 0
    state.voiceChannel = channel

    if channel > 0 then
        state.currentChannel = channel
        applyEffectiveVolume(false)
        refreshUiState()
        SetTimeout(100, function()
            requestMembers(channel)
        end)
    else
        setSelfTalkingState(false)
        state.members = {}
        refreshUiState()
    end
end)

RegisterNetEvent('pma-voice:radioChangeRejected', function()
    state.pendingChannel = 0
    setSelfTalkingState(false)
    state.voiceChannel = 0
    state.members = {}
    refreshUiState()
    notify('No tienes permiso para entrar a esa frecuencia.', 'error')
end)

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    initializeState()
end)

RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
    closeRadio(true)
    leaveRadio(false)
end)

RegisterNetEvent('QBCore:Player:SetPlayerData', function()
    updateHasRadio()
end)

AddEventHandler('ox_inventory:updateInventory', function()
    local hadRadio = state.hasRadio
    local hasRadio = updateHasRadio()

    if hadRadio and not hasRadio then
        closeRadio(true)
        leaveRadio(false)
        notify('Tu radio ya no esta en el inventario.', 'error')
    end
end)

AddEventHandler('onResourceStart', function(resourceName)
    if resourceName == 'pma-voice' then
        setPmaRadioAnimationDisabled(true)
        return
    end

    if resourceName ~= GetCurrentResourceName() then return end

    setPmaRadioAnimationDisabled(true)

    if LocalPlayer.state.isLoggedIn then
        initializeState()
    else
        loadSettings()
    end
end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName ~= GetCurrentResourceName() then return end

    closeRadio(false)
    stopRadioAnimation()
    setPmaRadioAnimationDisabled(false)

    if isVoiceReady() and state.voiceChannel > 0 then
        ExecuteCommand('-radiotalk')
        exports['pma-voice']:setRadioChannel(0)
        exports['pma-voice']:setVoiceProperty('radioEnabled', false)
    end
end)
